// src/app/api/projects/showcase/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Project } from '@/models/projects';

export async function GET(request) {
  try {
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer les projets terminés avec photos
    const projects = await Project.find({ 
      status: 'completed',
      'photos.0': { $exists: true } // Au moins une photo
    })
    .sort({ updatedAt: -1 }) // Les plus récents d'abord
    .limit(6) // Limiter à 6 projets
    .populate('professional', 'name')
    .populate('client', 'name')
    .lean();
    
    // Transformer les données pour le client
    const transformedProjects = projects.map(project => ({
      _id: project._id.toString(),
      title: project.title,
      description: project.description,
      category: project.category,
      photos: project.photos,
      estimatedCost: project.estimatedCost,
      finalCost: project.finalCost,
      professional: project.professional ? {
        id: project.professional._id.toString(),
        name: project.professional.name
      } : null,
    }));
    
    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error('Erreur lors de la récupération des projets vitrines:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    );
  }
}