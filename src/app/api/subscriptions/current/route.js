import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';
import Subscription from '@/models/subscriptions';
import subscriptionService from '@/lib/subscriptionService';

/**
 * Gestionnaire pour récupérer l'abonnement actuel de l'utilisateur
 * GET /api/subscriptions/current
 */
export async function GET(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer l'utilisateur
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer l'abonnement actif de l'utilisateur
    const subscription = await Subscription.findActiveByUser(user._id);
    
    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        message: 'Aucun abonnement actif trouvé'
      });
    }
    
    // Récupérer les statistiques de l'abonnement
    const subscriptionStats = subscription.getStats();
    
    // Récupérer la liste des services avec leur disponibilité
    const services = subscriptionService.getSubscriptionServices({
      planId: subscription.planId,
      startDate: subscription.startDate,
      servicesUsed: subscription.servicesUsed
    });
    
    // Retourner les informations d'abonnement
    return NextResponse.json({
      ...subscriptionStats,
      services,
      _id: subscription._id,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      remainingCommitmentMonths: subscription.remainingCommitmentMonths
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur', message: error.message },
      { status: 500 }
    );
  }
}