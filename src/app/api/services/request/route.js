import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';
import Subscription from '@/models/subscriptions';
import Project from '@/models/projects';
import subscriptionService from '@/lib/subscriptionService';

/**
 * Gestionnaire de demande de service
 * POST /api/services/request
 */
export async function POST(request) {
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
    
    // Récupérer les données de la requête
    const { serviceId, quantity = 1, notes = '', address = null } = await request.json();
    
    if (!serviceId) {
      return NextResponse.json(
        { error: 'Identifiant de service requis' },
        { status: 400 }
      );
    }
    
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
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé' },
        { status: 400 }
      );
    }
    
    // Vérifier si l'utilisateur peut utiliser ce service
    const checkResult = subscription.canUseService(serviceId, quantity);
    
    if (!checkResult.canUse) {
      return NextResponse.json(
        { 
          error: 'Service non disponible', 
          reason: checkResult.reason,
          message: checkResult.message 
        },
        { status: 400 }
      );
    }
    
    // Utiliser le service (mettre à jour l'abonnement)
    const useResult = await subscription.useService(serviceId, quantity);
    
    if (!useResult.success) {
      return NextResponse.json(
        { 
          error: 'Erreur lors de l\'utilisation du service', 
          message: useResult.error.message 
        },
        { status: 400 }
      );
    }
    
    // Créer un nouveau projet/demande de service
    const project = await Project.create({
      client: user._id,
      title: `Demande de ${subscriptionService.getServiceName(serviceId)}`,
      description: notes || `Demande de service via l'abonnement ${subscription.planId}`,
      status: 'pending',
      serviceType: serviceId,
      quantity,
      address: address || user.address,
      subscription: subscription._id,
      createdAt: new Date()
    });
    
    // Récupérer les statistiques mises à jour de l'abonnement
    const subscriptionStats = subscription.getStats();
    const services = subscriptionService.getSubscriptionServices({
      planId: subscription.planId,
      startDate: subscription.startDate,
      servicesUsed: subscription.servicesUsed
    });
    
    // Retourner les données mises à jour
    return NextResponse.json({
      success: true,
      message: 'Demande de service enregistrée avec succès',
      project: {
        id: project._id,
        title: project.title,
        status: project.status,
        serviceType: project.serviceType,
        createdAt: project.createdAt
      },
      subscription: {
        ...subscriptionStats,
        services
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la demande de service:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur', message: error.message },
      { status: 500 }
    );
  }
}