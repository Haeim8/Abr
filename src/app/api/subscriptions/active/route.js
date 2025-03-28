// src/app/api/subscriptions/active/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import Subscription from '@/models/subscriptions';

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

    // Récupérer le userId depuis les paramètres de requête
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Vérifier que l'utilisateur a le droit d'accéder à cette ressource
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à accéder à cette ressource' },
        { status: 403 }
      );
    }

    // Connexion à la base de données
    await connectToDatabase();

    // Rechercher l'abonnement actif
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active'
    }).lean();

    // Si aucun abonnement actif n'est trouvé
    if (!subscription) {
      return NextResponse.json(
        { subscription: null },
        { status: 200 }
      );
    }

    // Retourner l'abonnement
    return NextResponse.json(
      { subscription },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération de l\'abonnement' },
      { status: 500 }
    );
  }
}