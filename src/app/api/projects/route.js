// src/app/api/projects/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Project, Quote } from '@/models/projects';

export async function GET(request) {
  try {
    // Extraire les paramètres de requête
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const professionalId = searchParams.get('professionalId');
    const status = searchParams.get('status');
    
    console.log('Requête GET /api/projects avec paramètres:', { clientId, professionalId, status });
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Construire les critères de recherche
    let query = {};
    
    if (clientId) {
      query.client = clientId;
    }
    
    if (professionalId) {
      query.professional = professionalId;
    }
    
    if (status) {
      query.status = status;
    }
    
    console.log('Recherche de projets avec critères:', query);
    
    // Récupérer les projets
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .populate('client', 'name email')
      .populate('professional', 'name email')
      .lean();
    
    console.log(`${projects.length} projets trouvés`);
    
    // Pour chaque projet, récupérer le nombre de devis
    const projectsWithQuoteCount = await Promise.all(
      projects.map(async (project) => {
        const quoteCount = await Quote.countDocuments({ project: project._id });
        
        return {
          _id: project._id.toString(),
          title: project.title,
          description: project.description,
          status: project.status,
          category: project.category,
          budget: project.budget,
          location: project.location,
          client: project.client ? {
            id: project.client._id.toString(),
            name: project.client.name,
            email: project.client.email
          } : null,
          professional: project.professional ? {
            id: project.professional._id.toString(),
            name: project.professional.name,
            email: project.professional.email
          } : null,
          quotesCount: quoteCount,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        };
      })
    );
    
    return NextResponse.json({ projects: projectsWithQuoteCount });
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('Requête POST /api/projects avec body:', body);
    
    // Valider les données requises
    if (!body.title || !body.description || !body.client || !body.category) {
      return NextResponse.json(
        { error: 'Les champs title, description, client et category sont requis' },
        { status: 400 }
      );
    }
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Créer un nouveau projet
    const newProject = new Project({
      title: body.title,
      description: body.description,
      client: body.client,
      professional: body.professional,
      status: body.status || 'draft',
      category: body.category,
      location: body.location || {},
      budget: body.budget,
      estimatedCost: body.estimatedCost,
      finalCost: body.finalCost,
      startDate: body.startDate,
      endDate: body.endDate,
      rooms: body.rooms || [],
      photos: body.photos || []
    });
    
    await newProject.save();
    console.log('Projet créé avec ID:', newProject._id);
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Projet créé avec succès',
        projectId: newProject._id.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du projet: ' + error.message },
      { status: 500 }
    );
  }
}