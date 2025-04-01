import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// POST: Ajouter des photos à un projet
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const { projectId, photoType, photoUrl, description } = await request.json();
    
    if (!projectId || !photoType || !photoUrl) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const Project = mongoose.models.Project;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }
    
    // Vérifier que l'utilisateur est le professionnel assigné ou le client du projet
    if (project.professional?.toString() !== session.user.id && 
        project.client?.toString() !== session.user.id && 
        session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    // Ajouter la photo
    const newPhoto = {
      type: photoType, // 'before' ou 'after'
      url: photoUrl,
      description: description || '',
      uploadedBy: session.user.id,
      uploadedAt: new Date()
    };
    
    if (!project.photos) {
      project.photos = [];
    }
    
    project.photos.push(newPhoto);
    
    // Si c'est une photo 'after', mettre à jour le statut du projet si nécessaire
    if (photoType === 'after' && project.status === 'in_progress') {
      project.status = 'pending_approval';
    }
    
    await project.save();
    
    return NextResponse.json({
      success: true,
      message: 'Photo ajoutée avec succès',
      photo: newPhoto
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET: Récupérer les photos d'un projet
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'ID de projet manquant' }, { status: 400 });
    }
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const Project = mongoose.models.Project;
    const project = await Project.findById(projectId).lean();
    
    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }
    
    // Vérifier que l'utilisateur est autorisé
    if (project.professional?.toString() !== session.user.id && 
        project.client?.toString() !== session.user.id && 
        session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    return NextResponse.json({
      photos: project.photos || []
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: Supprimer une photo
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const photoId = searchParams.get('photoId');
    
    if (!projectId || !photoId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const Project = mongoose.models.Project;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }
    
    // Vérifier que l'utilisateur est autorisé
    if (project.professional?.toString() !== session.user.id && 
        session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    // Supprimer la photo
    if (!project.photos) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 });
    }
    
    const photoIndex = project.photos.findIndex(p => p._id.toString() === photoId);
    
    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 });
    }
    
    project.photos.splice(photoIndex, 1);
    await project.save();
    
    return NextResponse.json({
      success: true,
      message: 'Photo supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}