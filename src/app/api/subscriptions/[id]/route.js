import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import Subscription from '@/models/subscriptions';

/**
 * Récupère un abonnement spécifique
 * @route GET /api/subscriptions/[id]
 */
export async function GET(request, { params }) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    const subscriptionId = params.id;
    
    // Vérifier si on tente d'accéder à 'active' ou 'current' via le mauvais endpoint
    if (subscriptionId === 'active' || subscriptionId === 'current') {
      return NextResponse.json(
        { error: 'Endpoint incorrect. Utilisez /api/subscriptions?mode=active au lieu de /api/subscriptions/active' },
        { status: 400 }
      );
    }
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer l'abonnement
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier que l'utilisateur est autorisé à accéder à cet abonnement
    if (subscription.clientId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à accéder à cet abonnement' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ subscription }, { status: 200 });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération de l\'abonnement' },
      { status: 500 }
    );
  }
}

/**
 * Met à jour un abonnement spécifique
 * @route PUT /api/subscriptions/[id]
 */
export async function PUT(request, { params }) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    const subscriptionId = params.id;
    
    // Vérifier si on tente d'accéder à 'active' ou 'current' via le mauvais endpoint
    if (subscriptionId === 'active' || subscriptionId === 'current') {
      return NextResponse.json(
        { error: 'Endpoint incorrect' },
        { status: 400 }
      );
    }
    
    // Extraire les données de la requête
    const body = await request.json();
    const { 
      amount,
      autoRenew,
      status,
      projectId
    } = body;
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer l'abonnement
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier que l'utilisateur est autorisé à modifier cet abonnement
    if (subscription.clientId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à modifier cet abonnement' },
        { status: 403 }
      );
    }
    
    // Mettre à jour l'abonnement
    if (amount !== undefined) subscription.amount = amount;
    if (autoRenew !== undefined) subscription.autoRenew = autoRenew;
    if (projectId !== undefined) subscription.projectId = projectId;
    
    // Seuls les admins peuvent changer le statut
    if (status !== undefined && session.user.role === 'admin') {
      subscription.status = status;
    }
    
    // Sauvegarder les modifications
    await subscription.save();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Abonnement mis à jour avec succès', 
        subscription 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour de l\'abonnement' },
      { status: 500 }
    );
  }
}

/**
 * Supprime un abonnement spécifique
 * @route DELETE /api/subscriptions/[id]
 */
export async function DELETE(request, { params }) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    const subscriptionId = params.id;
    
    // Vérifier si on tente d'accéder à 'active' ou 'current' via le mauvais endpoint
    if (subscriptionId === 'active' || subscriptionId === 'current') {
      return NextResponse.json(
        { error: 'Endpoint incorrect' },
        { status: 400 }
      );
    }
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer l'abonnement
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Abonnement non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier que l'utilisateur est autorisé à supprimer cet abonnement
    if (subscription.clientId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à supprimer cet abonnement' },
        { status: 403 }
      );
    }
    
    // Marquer l'abonnement comme annulé plutôt que de le supprimer complètement
    subscription.status = 'cancelled';
    await subscription.save();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Abonnement annulé avec succès' 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'annulation de l\'abonnement' },
      { status: 500 }
    );
  }
}