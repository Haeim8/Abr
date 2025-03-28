// src/app/api/offers/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Project, Quote } from '@/models/projects';

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer l'offre avec son ID
    const offer = await Project.findById(id)
      .populate('client', 'name email phone')
      .lean();
    
    if (!offer) {
      return NextResponse.json(
        { error: 'Offre non trouvée' },
        { status: 404 }
      );
    }
    
    // Récupérer les devis associés à cette offre
    const quotes = await Quote.find({ project: id })
      .populate('professional', 'name email')
      .lean();
    
    // Transformer les données pour le client
    const transformedOffer = {
      _id: offer._id.toString(),
      title: offer.title,
      description: offer.description,
      status: offer.status,
      category: offer.category,
      location: offer.location,
      budget: offer.budget,
      createdAt: offer.createdAt,
      client: offer.client ? {
        id: offer.client._id.toString(),
        name: offer.client.name,
        email: offer.client.email,
        phone: offer.client.phone
      } : null,
      rooms: offer.rooms || [],
      quotes: quotes.map(quote => ({
        _id: quote._id.toString(),
        totalPrice: quote.totalPrice,
        description: quote.description,
        status: quote.status,
        createdAt: quote.createdAt,
        professional: quote.professional ? {
          id: quote.professional._id.toString(),
          name: quote.professional.name
        } : null
      }))
    };
    
    return NextResponse.json({ offer: transformedOffer });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'offre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des détails de l\'offre' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Vérifier si l'offre existe
    const existingOffer = await Project.findById(id);
    if (!existingOffer) {
      return NextResponse.json(
        { error: 'Offre non trouvée' },
        { status: 404 }
      );
    }
    
    // Mettre à jour l'offre
    const updatedOffer = await Project.findByIdAndUpdate(
      id,
      { 
        $set: {
          title: body.title,
          description: body.description,
          status: body.status,
          category: body.category,
          location: body.location,
          budget: body.budget,
          rooms: body.rooms,
          photos: body.photos,
          updatedAt: Date.now()
        }
      },
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Offre mise à jour avec succès',
      offer: {
        _id: updatedOffer._id.toString(),
        title: updatedOffer.title,
        status: updatedOffer.status
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'offre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'offre' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Vérifier si l'offre existe
    const existingOffer = await Project.findById(id);
    if (!existingOffer) {
      return NextResponse.json(
        { error: 'Offre non trouvée' },
        { status: 404 }
      );
    }
    
    // Supprimer l'offre
    await Project.findByIdAndDelete(id);
    
    // Supprimer également les devis associés
    await Quote.deleteMany({ project: id });
    
    return NextResponse.json({
      success: true,
      message: 'Offre et devis associés supprimés avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'offre' },
      { status: 500 }
    );
  }
}