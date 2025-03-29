import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';

/**
 * Récupère les statistiques d'un professionnel
 * @route GET /api/professionals/[id]/statistics
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    // Connexion à la base de données (commentée pour simuler)
    // await connectToDatabase();

    // Simuler la récupération des statistiques
    // Dans un environnement réel, on interrogerait la base de données
    const statistics = {
      totalProjects: 86,
      completedProjects: 75,
      ongoingProjects: 11,
      cancellationRate: 0.02,
      averageRating: 4.8,
      reviewCount: 42,
      responseRate: 0.95,
      responseTime: "2h",
      monthlyStats: [
        { month: "Jan", projects: 8, income: 4500 },
        { month: "Feb", projects: 7, income: 4200 },
        { month: "Mar", projects: 9, income: 5100 },
        { month: "Apr", projects: 6, income: 3900 },
        { month: "May", projects: 8, income: 4700 },
        { month: "Jun", projects: 7, income: 4300 }
      ],
      topServices: [
        { name: "Plomberie", count: 30 },
        { name: "Électricité", count: 25 },
        { name: "Rénovation", count: 20 }
      ]
    };

    return NextResponse.json({ statistics }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}