import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';
import Subscription from '@/models/subscriptions';
import subscriptionService from '@/lib/subscriptionService';
import stripe from '@/lib/stripe';

// GET: Récupérer les abonnements
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // Extraire les paramètres
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const clientId = searchParams.get('clientId') || session.user.id;
    
    // Vérifier les autorisations
    if (clientId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à accéder à ces abonnements' },
        { status: 403 }
      );
    }
    
    await connectToDatabase();
    
    // Mode 'active' - Retourne uniquement l'abonnement actif
    if (mode === 'active') {
      const subscription = await Subscription.findActiveByUser(clientId);
      
      return NextResponse.json(
        { subscription: subscription || null },
        { status: 200 }
      );
    }
    
    // Mode 'current' - Retourne l'abonnement actif avec les statistiques
    if (mode === 'current') {
      const subscription = await Subscription.findActiveByUser(clientId);
      
      if (!subscription) {
        return NextResponse.json({
          hasSubscription: false,
          message: 'Aucun abonnement actif trouvé'
        });
      }
      
      const subscriptionStats = subscription.getStats();
      
      const services = subscriptionService.getSubscriptionServices({
        planId: subscription.plan,
        startDate: subscription.startDate,
        servicesUsed: subscription.servicesUsed
      });
      
      return NextResponse.json({
        ...subscriptionStats,
        services,
        _id: subscription._id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew
      });
    }
    
    // Mode par défaut - Liste tous les abonnements
    let filter = { clientId };
    
    const subscriptions = await Subscription.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ subscriptions }, { status: 200 });
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// POST: Créer un abonnement
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Seuls les clients peuvent souscrire' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      plan,
      amount,
      paymentMethod,
      useStripe = false,
      projectId = null,
      autoRenew = true
    } = body;

    // Validation
    if (!plan || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // Vérifier que le plan est valide
    const validPlans = ['forfait1', 'forfait2', 'forfait3', 'forfait4'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Vérifier si l'utilisateur existe
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const existingSubscription = await Subscription.findActiveByUser(session.user.id);
    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif' },
        { status: 400 }
      );
    }

    // Mode avec Stripe
    if (useStripe) {
      // Créer un client Stripe s'il n'existe pas
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || user.email,
        });
        
        await User.findByIdAndUpdate(session.user.id, {
          stripeCustomerId: customer.id
        });
        
        user.stripeCustomerId = customer.id;
      }
      
      // Créer une session de paiement Stripe
      const stripeSession = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: getPlanName(plan),
                description: getPlanDescription(plan),
              },
              unit_amount: Math.round(amount * 100),
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXTAUTH_URL}/dashboard/client?subscription=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/abonnements?cancelled=true`,
        metadata: {
          userId: session.user.id,
          planId: plan,
        },
      });
      
      return NextResponse.json({ 
        success: true,
        checkoutUrl: stripeSession.url 
      });
    }
    
    // Mode sans Stripe (paiement manuel)
    // Calculer la date de fin et du prochain paiement
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    // Créer l'abonnement
    const newSubscription = new Subscription({
      clientId: session.user.id,
      plan,
      amount,
      paymentMethod,
      projectId,
      autoRenew,
      startDate: new Date(),
      endDate,
      lastPaymentDate: new Date(),
      nextPaymentDate,
      status: 'active'
    });

    // Ajouter la première transaction
    newSubscription.transactions.push({
      date: new Date(),
      amount,
      type: 'payment',
      description: `Premier paiement - ${getPlanName(plan)}`
    });

    await newSubscription.save();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Abonnement créé avec succès', 
        subscription: newSubscription 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires
function getPlanName(plan) {
  const names = {
    'forfait1': 'Forfait Essentiel',
    'forfait2': 'Forfait Confort',
    'forfait3': 'Forfait Premium',
    'forfait4': 'Forfait Excellence'
  };
  return names[plan] || 'Forfait';
}

function getPlanDescription(plan) {
  const descriptions = {
    'forfait1': '1 tâche cumulable par mois',
    'forfait2': '3 tâches cumulables par mois',
    'forfait3': '3 tâches cumulables avec dépannage serrurier',
    'forfait4': '3 tâches cumulables avec dépannage serrurier et plomberie'
  };
  return descriptions[plan] || 'Forfait standard';
}