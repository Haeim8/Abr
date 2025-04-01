import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import Subscription from '@/models/subscriptions';
import subscriptionService from '@/lib/subscriptionService';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, serviceId, quantity = 1 } = body;

    await connectToDatabase();

    // Vérifier si l'abonnement existe
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de l'abonnement
    if (subscription.clientId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à utiliser cet abonnement' },
        { status: 403 }
      );
    }

    // Vérifier si l'utilisateur peut utiliser ce service
    const checkResult = subscriptionService.canUseService(subscription, serviceId, quantity);
    
    if (!checkResult.canUse) {
      return NextResponse.json(
        { 
          error: 'Impossible d\'utiliser ce service',
          reason: checkResult.reason,
          message: checkResult.message
        },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisation du service
    const updatedSubscription = subscriptionService.useService(subscription, serviceId, quantity);
    
    // Sauvegarder dans la base de données
    subscription.tasksUsedThisMonth = updatedSubscription.tasksUsedThisMonth;
    subscription.servicesUsed = updatedSubscription.servicesUsed;
    await subscription.save();

    return NextResponse.json({
      success: true,
      message: 'Service utilisé avec succès',
      remainingTasks: subscription.getStats().remainingTasks
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID d\'abonnement requis' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de l'abonnement
    if (subscription.clientId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à accéder à cet abonnement' },
        { status: 403 }
      );
    }

    // Calculer les services disponibles
    const stats = subscription.getStats();
    const services = subscriptionService.getSubscriptionServices({
      planId: subscription.plan,
      startDate: subscription.startDate,
      servicesUsed: subscription.servicesUsed
    });

    return NextResponse.json({
      stats,
      services,
      servicesUsed: subscription.servicesUsed
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}