// src/app/api/admin/professionals/[id]/verify/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export async function PUT(request, { params }) {
  try {
    const id = params.id;
    const body = await request.json();
    const verified = body.verified;
    
    console.log(`Requête PUT /api/admin/professionals/${id}/verify avec verified:`, verified);
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer le modèle User
    const User = mongoose.models.User;
    
    // Vérifier si le professionnel existe
    const professional = await User.findOne({
      _id: id,
      role: 'professional'
    });
    
    if (!professional) {
      console.log(`Professionnel avec ID ${id} non trouvé`);
      return NextResponse.json(
        { error: 'Professionnel non trouvé' },
        { status: 404 }
      );
    }
    
    // Mettre à jour le statut de vérification
    professional.professional = professional.professional || {};
    professional.professional.verified = verified;
    professional.professional.verifiedAt = verified ? new Date() : null;
    
    await professional.save();
    
    console.log(`Professionnel ${id} marqué comme ${verified ? 'vérifié' : 'non vérifié'}`);
    
    return NextResponse.json({
      success: true,
      message: `Professionnel ${verified ? 'vérifié' : 'non vérifié'} avec succès`,
      professional: {
        _id: professional._id.toString(),
        name: professional.name,
        verified: professional.professional.verified
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du professionnel:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du professionnel: ' + error.message },
      { status: 500 }
    );
  }
}