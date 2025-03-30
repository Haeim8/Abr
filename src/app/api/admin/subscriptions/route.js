// src/app/api/admin/subscriptions/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Vérifier que l'utilisateur est admin
async function verifyAdmin(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return new NextResponse(
      JSON.stringify({ error: 'Non autorisé' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return null; // Aucune erreur, l'utilisateur est admin
}

// GET: Récupérer tous les forfaits d'abonnement
export async function GET(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    await connectToDatabase();
    
    // Récupérer les modèles SubscriptionPlan et Service
    const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', new mongoose.Schema({
      name: String,
      description: String,
      price: Number,
      services: [{
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
        quantity: Number,
        unit: String // 'month', 'trimester', 'year', etc.
      }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));
    
    const Service = mongoose.models.Service || mongoose.model('Service', new mongoose.Schema({
      name: String,
      description: String,
      category: String, // 'cleaning', 'gardening', 'plumbing', etc.
      defaultUnit: String, // 'hour', 'sqm', 'visit', etc.
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));
    
    // Obtenir tous les forfaits avec les services inclus
    const plans = await SubscriptionPlan.find({})
      .populate('services.serviceId')
      .lean();
    
    // Obtenir le nombre d'abonnés actifs par forfait
    const Subscription = mongoose.models.Subscription;
    
    // Si le modèle Subscription existe, calculer le nombre d'abonnés par forfait
    if (Subscription) {
      for (let plan of plans) {
        plan.activeSubscribers = await Subscription.countDocuments({
          planId: plan._id,
          active: true
        });
      }
    } else {
      // Sinon, utiliser des valeurs fictives pour les tests
      for (let plan of plans) {
        plan.activeSubscribers = Math.floor(Math.random() * 100) + 10;
      }
    }
    
    // Si aucun forfait n'existe, créer des forfaits par défaut avec services
    if (plans.length === 0) {
      // Créer d'abord les services de base s'ils n'existent pas
      const services = await Service.find({});
      
      if (services.length === 0) {
        const defaultServices = [
          {
            name: 'Ménage',
            description: 'Nettoyage intérieur (salon, chambre, cuisine)',
            category: 'cleaning',
            defaultUnit: 'visit'
          },
          {
            name: 'Jardinage',
            description: 'Tonte de pelouse et entretien basique',
            category: 'gardening',
            defaultUnit: 'visit'
          },
          {
            name: 'Plomberie',
            description: 'Réparations simples et dépannage',
            category: 'plumbing',
            defaultUnit: 'visit'
          },
          {
            name: 'Électricité',
            description: 'Réparations et installations simples',
            category: 'electricity',
            defaultUnit: 'visit'
          },
          {
            name: 'Peinture',
            description: 'Travaux de peinture intérieure',
            category: 'painting',
            defaultUnit: 'sqm'
          },
          {
            name: 'Montage de meubles',
            description: 'Assemblage et installation de meubles',
            category: 'assembly',
            defaultUnit: 'hour'
          }
        ];
        
        const createdServices = await Service.insertMany(defaultServices);
        
        // Créer les forfaits par défaut
        const defaultPlans = [
          {
            name: 'Essentiel',
            description: 'Forfait de base pour les petits travaux occasionnels',
            price: 19.99,
            services: [
              { serviceId: createdServices[0]._id, quantity: 1, unit: 'month' }, // Ménage 1x/mois
              { serviceId: createdServices[2]._id, quantity: 1, unit: 'trimester' }, // Plomberie 1x/trimestre
              { serviceId: createdServices[5]._id, quantity: 2, unit: 'month' } // Montage 2x/mois
            ]
          },
          {
            name: 'Confort',
            description: 'Idéal pour l\'entretien régulier du domicile',
            price: 49.99,
            services: [
              { serviceId: createdServices[0]._id, quantity: 2, unit: 'month' }, // Ménage 2x/mois
              { serviceId: createdServices[1]._id, quantity: 1, unit: 'month' }, // Jardinage 1x/mois
              { serviceId: createdServices[2]._id, quantity: 1, unit: 'month' }, // Plomberie 1x/mois
              { serviceId: createdServices[3]._id, quantity: 1, unit: 'trimester' }, // Électricité 1x/trimestre

             { serviceId: createdServices[5]._id, quantity: 3, unit: 'month' } // Montage 3x/mois
            ]
          },
          {
            name: 'Premium',
            description: 'Entretien complet et rénovations légères',
            price: 79.99,
            services: [
              { serviceId: createdServices[0]._id, quantity: 4, unit: 'month' }, // Ménage 4x/mois
              { serviceId: createdServices[1]._id, quantity: 2, unit: 'month' }, // Jardinage 2x/mois
              { serviceId: createdServices[2]._id, quantity: 2, unit: 'month' }, // Plomberie 2x/mois
              { serviceId: createdServices[3]._id, quantity: 1, unit: 'month' }, // Électricité 1x/mois
              { serviceId: createdServices[4]._id, quantity: 10, unit: 'month' }, // Peinture 10m²/mois
              { serviceId: createdServices[5]._id, quantity: 5, unit: 'month' } // Montage 5x/mois
            ]
          },
          {
            name: 'Excellence',
            description: 'Solution complète pour l\'entretien et les rénovations',
            price: 129.99,
            services: [
              { serviceId: createdServices[0]._id, quantity: -1, unit: 'month' }, // Ménage illimité
              { serviceId: createdServices[1]._id, quantity: 4, unit: 'month' }, // Jardinage 4x/mois
              { serviceId: createdServices[2]._id, quantity: -1, unit: 'month' }, // Plomberie illimité
              { serviceId: createdServices[3]._id, quantity: 2, unit: 'month' }, // Électricité 2x/mois
              { serviceId: createdServices[4]._id, quantity: 15, unit: 'month' }, // Peinture 15m²/mois
              { serviceId: createdServices[5]._id, quantity: -1, unit: 'month' } // Montage illimité
            ]
          }
        ];
        
        const createdPlans = await SubscriptionPlan.insertMany(defaultPlans);
        
        // Ajouter les nombres d'abonnés fictifs
        for (let plan of createdPlans) {
          plan.activeSubscribers = Math.floor(Math.random() * 100) + 10;
          plan.servicesCount = plan.services.length;
        }
        
        return NextResponse.json(createdPlans);
      }
    }
    
    // Transformer les résultats pour le frontend
    const transformedPlans = plans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      description: plan.description,
      price: plan.price,
      activeSubscribers: plan.activeSubscribers || 0,
      servicesCount: plan.services ? plan.services.length : 0
    }));
    
    return NextResponse.json(transformedPlans);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des forfaits:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des forfaits d\'abonnement' },
      { status: 500 }
    );
  }
}
  
// POST: Créer un nouveau forfait d'abonnement
export async function POST(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    const data = await request.json();
    
    // Validation des données
    if (!data.name || !data.price || !Array.isArray(data.services)) {
      return NextResponse.json(
        { error: 'Données incomplètes ou invalides' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Récupérer le modèle SubscriptionPlan
    const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', new mongoose.Schema({
      name: String,
      description: String,
      price: Number,
      services: [{
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
        quantity: Number,
        unit: String
      }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));
    
    // Créer le nouveau forfait
    const newPlan = new SubscriptionPlan({
      name: data.name,
      description: data.description || '',
      price: data.price,
      services: data.services,
      updatedAt: new Date()
    });
    
    await newPlan.save();
    
    return NextResponse.json({
      success: true,
      message: 'Forfait créé avec succès',
      plan: {
        id: newPlan._id.toString(),
        name: newPlan.name,
        description: newPlan.description,
        price: newPlan.price
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du forfait:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du forfait' },
      { status: 500 }
    );
  }
}
  
// PUT: Mettre à jour un forfait d'abonnement existant
export async function PUT(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    const data = await request.json();
    
    // Validation des données
    if (!data.id || (!data.name && !data.price && !data.services)) {
      return NextResponse.json(
        { error: 'Données incomplètes ou invalides' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Récupérer le modèle SubscriptionPlan
    const SubscriptionPlan = mongoose.models.SubscriptionPlan;
    if (!SubscriptionPlan) {
      return NextResponse.json(
        { error: 'Modèle non trouvé' },
        { status: 500 }
      );
    }
    
    // Rechercher et mettre à jour le forfait
    const plan = await SubscriptionPlan.findById(data.id);
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Forfait non trouvé' },
        { status: 404 }
      );
    }
    
    // Mettre à jour les champs
    if (data.name) plan.name = data.name;
    if (data.description !== undefined) plan.description = data.description;
    if (data.price !== undefined) plan.price = data.price;
    if (data.services) plan.services = data.services;
    
    plan.updatedAt = new Date();
    
    await plan.save();
    
    return NextResponse.json({
      success: true,
      message: 'Forfait mis à jour avec succès',
      plan: {
        id: plan._id.toString(),
        name: plan.name,
        description: plan.description,
        price: plan.price
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du forfait:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du forfait' },
      { status: 500 }
    );
  }
}
  
// DELETE: Supprimer un forfait d'abonnement
export async function DELETE(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de forfait manquant' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Récupérer le modèle SubscriptionPlan
    const SubscriptionPlan = mongoose.models.SubscriptionPlan;
    if (!SubscriptionPlan) {
      return NextResponse.json(
        { error: 'Modèle non trouvé' },
        { status: 500 }
      );
    }
    
    // Vérifier si le forfait est utilisé par des abonnements actifs
    const Subscription = mongoose.models.Subscription;
    if (Subscription) {
      const activeSubscriptions = await Subscription.countDocuments({
        planId: id,
        active: true
      });
      
      if (activeSubscriptions > 0) {
        return NextResponse.json(
          { error: 'Ce forfait est utilisé par des abonnements actifs et ne peut pas être supprimé' },
          { status: 400 }
        );
      }
    }
    
    // Supprimer le forfait
    const result = await SubscriptionPlan.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Forfait non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Forfait supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du forfait:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du forfait' },
      { status: 500 }
    );
  }
}