// src/app/api/offers/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Project } from '@/models/projects';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const professionalId = searchParams.get('professionalId');
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Construire les critères de recherche
    let query = {};
    
    if (clientId) {
      query.client = clientId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (professionalId) {
      query.professional = professionalId;
    }
    
    // Récupérer les offres (projets)
    const offers = await Project.find(query)
      .sort({ createdAt: -1 })
      .populate('client', 'name email')
      .lean();
    
    // Transformer les données pour le client
    const transformedOffers = offers.map(offer => ({
      _id: offer._id.toString(),
      title: offer.title,
      description: offer.description,
      status: offer.status,
      category: offer.category,
      location: `${offer.location.city}, ${offer.location.postalCode}`,
      budget: offer.budget,
      createdAt: offer.createdAt,
      client: offer.client ? {
        id: offer.client._id.toString(),
        name: offer.client.name,
        email: offer.client.email
      } : null,
      quotesCount: 0, // À implémenter: compter les devis associés
    }));
    
    return NextResponse.json({ offers: transformedOffers });
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des offres' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Valider les données requises
    if (!body.title || !body.description || !body.client || !body.category) {
      return NextResponse.json(
        { error: 'Les champs title, description, client et category sont requis' },
        { status: 400 }
      );
    }
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Créer une nouvelle offre (projet)
    const newOffer = new Project({
      title: body.title,
      description: body.description,
      client: body.client,
      category: body.category,
      status: body.status || 'draft',
      location: body.location || {},
      budget: body.budget,
      rooms: body.rooms || [],
      photos: body.photos || []
    });
    
    await newOffer.save();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Offre créée avec succès',
        offerId: newOffer._id.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de l\'offre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'offre' },
      { status: 500 }
    );
  }
}