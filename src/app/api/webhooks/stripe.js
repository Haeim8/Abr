import { buffer } from 'micro';
import Stripe from 'stripe';
import dbConnect from "@/lib/dbConnect";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import Plan from "@/models/Plan";
import Service from "@/models/Service";
import { sendNotificationEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Erreur webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  await dbConnect();
  
  // Gestion des événements Stripe
  switch (event.type) {
    // Création d'un abonnement réussie
    case 'checkout.session.completed':
      const session = event.data.object;
      
      if (session.mode === 'subscription' && session.payment_status === 'paid') {
        try {
          const { userId, planId } = session.metadata;
          
          const plan = await Plan.findById(planId);
          if (!plan) {
            throw new Error('Plan non trouvé');
          }
          
          // Calculer la prochaine date de facturation
          const today = new Date();
          const nextBillingDate = new Date(today.setMonth(today.getMonth() + 1));
          
          // Récupérer tous les services associés au plan
          const services = await Service.find({
            _id: { $in: plan.services }
          });
          
          // Préparer les quotas de services pour l'utilisateur
          const serviceUsage = services.map(service => {
            // Ici, il faudrait adapter la logique pour déterminer la limite en fonction du plan
            // Par exemple, en utilisant un mapping ou une autre structure de données
            let limit = 0;
            
            // Exemple simple: le Premium a 2x plus de quota que l'Essentiel
            switch(plan.name) {
              case 'Essentiel':
                limit = service.baseLimit || 1;
                break;
              case 'Confort':
                limit = service.baseLimit * 2 || 2;
                break;
              case 'Premium':
                limit = service.baseLimit * 3 || 3;
                break;
              case 'Excellence':
                limit = service.baseLimit * 5 || 5;
                break;
              default:
                limit = 1;
            }
            
            return {
              serviceId: service._id,
              used: 0,
              limit,
              unit: service.unit,
              resetDate: nextBillingDate
            };
          });
          
          // Créer l'abonnement dans la base de données
          const subscription = new Subscription({
            userId,
            planId,
            status: 'active',
            startDate: new Date(),
            nextBillingDate,
            paymentMethod: session.customer,
            serviceUsage
          });
          
          await subscription.save();
          
          // Notifier l'utilisateur
          const user = await User.findById(userId);
          if (user) {
            await sendNotificationEmail(
              user.email,
              'Votre abonnement a été activé',
              `Félicitations ! Votre abonnement ${plan.name} est maintenant actif.`
            );
          }
        } catch (error) {
          console.error("Erreur lors de la création de l'abonnement:", error);
        }
      }
      break;
      
    // Paiement récurrent échoué
    case 'invoice.payment_failed':
      const invoice = event.data.object;
      
      try {
        // Récupérer l'abonnement Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        // Trouver l'abonnement correspondant dans notre base de données
        const subscription = await Subscription.findOne({
          paymentMethod: stripeSubscription.customer,
        }).populate('userId planId');
        
        if (subscription) {
          // Mettre à jour le statut de l'abonnement
          subscription.status = 'suspended';
          await subscription.save();
          
          // Notifier l'utilisateur
          await sendNotificationEmail(
            subscription.userId.email,
            'Problème de paiement détecté',
            `Nous avons rencontré un problème avec votre paiement pour l'abonnement ${subscription.planId.name}. Veuillez mettre à jour vos informations de paiement pour continuer à bénéficier de nos services.`
          );
        }
      } catch (error) {
        console.error("Erreur lors du traitement du paiement échoué:", error);
      }
      break;
      
    // Paiement récurrent réussi
    case 'invoice.paid':
      const paidInvoice = event.data.object;
      
      try {
        // Récupérer l'abonnement Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(paidInvoice.subscription);
        
        // Trouver l'abonnement correspondant dans notre base de données
        const subscription = await Subscription.findOne({
          paymentMethod: stripeSubscription.customer,
        });
        
        if (subscription) {
          // Calculer la prochaine date de facturation
          const nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);
          
          // Réinitialiser les quotas et mettre à jour la date de facturation
          subscription.nextBillingDate = nextBillingDate;
          subscription.status = 'active';
          
          // Réinitialiser l'utilisation des services
          subscription.serviceUsage.forEach(service => {
            service.used = 0;
            service.resetDate = nextBillingDate;
          });
          
          await subscription.save();
        }
      } catch (error) {
        console.error("Erreur lors du traitement du paiement réussi:", error);
      }
      break;
  }
  
  return res.status(200).json({ received: true });
}