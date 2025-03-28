// src/app/api/users/onboarding/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';
import Subscription from '@/models/subscriptions';

export async function POST(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // Extraire les données de la requête
    const data = await request.json();
    const { 
      userId,
      housingType,
      roomCount,
      apartmentArea,
      hasGarden,
      gardenArea,
      houseRoomCount,
      houseArea,
      subscriptionPlan,
      priorities 
    } = data;

    // Vérifier que l'utilisateur a le bon ID
    if (session.user.id !== userId && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à modifier ce profil' },
        { status: 403 }
      );
    }

    // Connexion à la base de données
    await connectToDatabase();

    // Mettre à jour le profil utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Stocker les informations du logement
    user.housing = {
      type: housingType,
      ...(housingType === 'apartment' ? {
        roomCount,
        area: apartmentArea
      } : {
        roomCount: houseRoomCount,
        area: houseArea,
        hasGarden,
        gardenArea: hasGarden ? gardenArea : 0
      })
    };

    // Stocker les priorités de travaux
    user.workPriorities = priorities;

    // Sauvegarder les changements
    await user.save();

    // Créer un abonnement si un plan a été sélectionné
    if (subscriptionPlan && subscriptionPlan !== 'none') {
      // Vérifier si un abonnement existe déjà
      let subscription = await Subscription.findOne({ userId: userId, status: 'active' });
      
      if (subscription) {
        // Mettre à jour l'abonnement existant
        subscription.plan = subscriptionPlan;
        subscription.updatedAt = new Date();
      } else {
        // Créer un nouvel abonnement
        subscription = new Subscription({
          userId: userId,
          plan: subscriptionPlan,
          status: 'active',
          startDate: new Date(),
          amount: getSubscriptionAmount(subscriptionPlan),
          tasksUsed: 0,
          maxTasks: getMaxTasks(subscriptionPlan),
          paymentStatus: 'pending' // Sera mis à jour après intégration avec Stripe
        });
      }
      
      await subscription.save();
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Profil mis à jour avec succès'
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires
function getSubscriptionAmount(plan) {
  const prices = {
    'forfait1': 39,
    'forfait2': 99,
    'forfait3': 139,
    'forfait4': 189
  };
  return prices[plan] || 0;
}

function getMaxTasks(plan) {
  const tasks = {
    'forfait1': 1,
    'forfait2': 3,
    'forfait3': 3,
    'forfait4': 3
  };
  return tasks[plan] || 0;
}