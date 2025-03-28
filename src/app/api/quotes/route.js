// src/app/api/quotes/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
import { Quote } from '@/models/projects';

export async function GET(request) {
  try {
    // Extraire les paramètres de requête
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const professionalId = searchParams.get('professionalId');
    const projectId = searchParams.get('projectId');
    
    console.log('Requête GET /api/quotes avec paramètres:', { clientId, professionalId, projectId });
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // S'assurer que le modèle Quote est disponible
    let QuoteModel = Quote;
    
    // Si Quote n'est pas disponible, essayer de le récupérer depuis mongoose
    if (!QuoteModel) {
      console.log('Modèle Quote non disponible via import, tentative de récupération depuis mongoose');
      QuoteModel = mongoose.models.Quote;
      
      if (!QuoteModel) {
        console.error('Modèle Quote non trouvé dans mongoose');
        return NextResponse.json(
          { error: 'Erreur interne: modèle Quote non disponible' },
          { status: 500 }
        );
      }
    }
    
    // Construire les critères de recherche
    let query = {};
    
    if (clientId) {
      query.client = clientId;
    }
    
    if (professionalId) {
      query.professional = professionalId;
    }
    
    if (projectId) {
      query.project = projectId;
    }
    
    console.log('Recherche de devis avec critères:', query);
    
    // Pour le debug, récupérer tous les devis (si aucun n'est trouvé)
    let quotes = await QuoteModel.find(query).lean();
    
    if (quotes.length === 0 && Object.keys(query).length > 0) {
      console.log('Aucun devis trouvé avec les critères spécifiés, tentative de récupération de tous les devis');
      const allQuotes = await QuoteModel.find({}).lean();
      console.log(`Total de devis dans la base: ${allQuotes.length}`);
      
      // Retourner une liste vide mais sans erreur
      return NextResponse.json({ quotes: [] });
    }
    
    console.log(`${quotes.length} devis trouvés`);
    
    // Transformer les données pour le client
    const transformedQuotes = quotes.map(quote => ({
      _id: quote._id.toString(),
      offerTitle: quote.title || 'Offre sans titre',
      offerID: quote.project?.toString() || null,
      professionalName: 'Professionnel', // À remplir avec les données appropriées
      professionalId: quote.professional?.toString() || null,
      price: quote.totalPrice,
      status: quote.status,
      description: quote.description,
      message: quote.description, // Pour compatibilité avec votre frontend
      estimatedDuration: `${quote.labor?.hours || 0} heures`,
      createdAt: quote.createdAt
    }));
    
    return NextResponse.json({ quotes: transformedQuotes });
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devis: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('Requête POST /api/quotes avec body:', body);
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Créer un nouveau devis
    const newQuote = new Quote({
      project: body.project,
      professional: body.professional,
      client: body.client,
      title: body.title || 'Nouveau devis',
      description: body.description || '',
      totalPrice: body.totalPrice,
      materialCosts: body.materialCosts || 0,
      laborCosts: body.laborCosts || 0,
      taxRate: body.taxRate || 20,
      validUntil: body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      status: body.status || 'sent',
      rooms: body.rooms || [],
      materials: body.materials || [],
      labor: body.labor || { hours: 0, rate: 0, total: 0 }
    });
    
    await newQuote.save();
    console.log('Devis créé avec ID:', newQuote._id);
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Devis créé avec succès',
        quoteId: newQuote._id.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du devis: ' + error.message },
      { status: 500 }
    );
  }
}