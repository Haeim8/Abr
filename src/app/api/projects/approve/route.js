import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const { projectId, approved, feedback } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'ID de projet manquant' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const Project = mongoose.models.Project;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }
    
    // Vérifier que l'utilisateur est le client du projet
    if (project.client?.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    // Vérifier que le projet est dans un état permettant l'approbation
    if (project.status !== 'pending_approval') {
      return NextResponse.json({ 
        error: 'Le projet n\'est pas en attente d\'approbation' 
      }, { status: 400 });
    }
    
    // Mettre à jour le statut du projet
    project.status = approved ? 'completed' : 'revision_required';
    project.feedback = feedback || '';
    project.completedAt = approved ? new Date() : undefined;
    
    await project.save();
    
    // Si approuvé, traiter le paiement au professionnel (à implémenter avec Stripe)
    if (approved) {
      // Libérer le paiement - cette partie serait implémentée avec l'API Payments
    }
    
    return NextResponse.json({
      success: true,
      message: approved ? 'Travail approuvé avec succès' : 'Révisions demandées',
      status: project.status
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}