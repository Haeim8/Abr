import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import Subscription from '@/models/subscriptions';
import User from '@/models/users';

/**
 * Récupère tous les abonnements de l'utilisateur connecté ou filtrés par clientId
 * @route GET /api/subscriptions
 */
export async function GET(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // Extraire les paramètres de la requête
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Filtre de base
    let filter = {};
    
    // Si un clientId est spécifié et que l'utilisateur est admin ou le client lui-même
    if (clientId) {
      if (session.user.role === 'admin' || session.user.id === clientId) {
        filter.clientId = clientId;
      } else {
        return NextResponse.json(
          { error: 'Vous n\'êtes pas autorisé à accéder à ces abonnements' },
          { status: 403 }
        );
      }
    } else {
      // Si aucun clientId n'est spécifié, retourner les abonnements de l'utilisateur connecté
      filter.clientId = session.user.id;
    }
    
    // Récupérer les abonnements
    const subscriptions = await Subscription.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ subscriptions }, { status: 200 });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnements:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des abonnements' },
      { status: 500 }
    );
  }
}

/**
 * Crée un nouvel abonnement pour l'utilisateur connecté
 * @route POST /api/subscriptions
 */
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

    // Vérifier que l'utilisateur est un client
    if (session.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Seuls les clients peuvent souscrire à un abonnement' },
        { status: 403 }
      );
    }

    // Extraire les données de la requête
    const body = await request.json();
    const { 
      plan,
      amount,
      paymentMethod,
      projectId = null,
      autoRenew = true
    } = body;

    // Validation des données
    if (!plan || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Le plan, le montant et la méthode de paiement sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que le plan est valide
    const validPlans = ['basic', 'standard', 'premium'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    await connectToDatabase();

    // Vérifier si l'utilisateur existe
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Calculer la date de fin de l'abonnement (par défaut, 1 an après)
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Calculer la date du prochain paiement (par défaut, 1 mois après)
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    // Créer le nouvel abonnement
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
      status: 'active',
      savedAmount: amount // Le premier paiement est compté comme épargne
    });

    // Ajouter la première transaction
    newSubscription.transactions.push({
      date: new Date(),
      amount,
      type: 'payment',
      description: `Premier paiement - Abonnement ${plan}`
    });

    // Sauvegarder l'abonnement
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
    console.error('Erreur lors de la création de l\'abonnement:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de l\'abonnement' },
      { status: 500 }
    );
  }
}