// src/app/api/admin/dashboard/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Fonction utilitaire pour vérifier que l'utilisateur est admin
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

export async function GET(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer les modèles nécessaires
    const User = mongoose.models.User;
    const Subscription = mongoose.models.Subscription;
    const Transaction = mongoose.models.Transaction;
    const Project = mongoose.models.Project;
    const Dispute = mongoose.models.Dispute;
    
    // Pour éviter les erreurs si les modèles n'existent pas encore
    if (!User || !Subscription || !Transaction || !Project || !Dispute) {
      return NextResponse.json({
        totalUsers: 0,
        totalProfessionals: 0,
        verifiedProfessionals: 0,
        pendingVerifications: 0,
        activeSubscriptions: 0,
        pendingPayments: 0,
        recentProjects: 0,
        monthlyRevenue: 0,
        openDisputes: 0
      });
    }
    
    // Calcul des statistiques
    const totalUsers = await User.countDocuments();
    const totalProfessionals = await User.countDocuments({ role: 'professional' });
    const verifiedProfessionals = await User.countDocuments({ 
      role: 'professional', 
      'professional.verified': true 
    });
    const pendingVerifications = await User.countDocuments({ 
      role: 'professional', 
      'professional.verified': false,
      'professional.documents': { $exists: true, $ne: [] }
    });
    
    const activeSubscriptions = await Subscription.countDocuments({ 
      active: true 
    });
    
    // Calcul du revenu mensuel - somme des transactions du mois en cours
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          type: 'income',
          status: 'completed',
          createdAt: {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]).then(result => (result.length > 0 ? result[0].total : 0));
    
    const pendingPayments = await Transaction.countDocuments({
      type: 'expense',
      status: 'pending'
    });
    
    const recentProjects = await Project.countDocuments({
      createdAt: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      }
    });
    
    const openDisputes = await Dispute.countDocuments({ status: 'open' });
    
    // Retourner les statistiques
    return NextResponse.json({
      totalUsers,
      totalProfessionals,
      verifiedProfessionals,
      pendingVerifications,
      activeSubscriptions,
      pendingPayments,
      recentProjects,
      monthlyRevenue,
      openDisputes
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Erreur serveur interne' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}