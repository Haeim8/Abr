// src/app/api/professionals/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log(`Requête GET /api/professionals/${id}`);
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer le modèle User (cette approche est nécessaire car l'import peut varier dans votre code)
    const User = mongoose.models.User;
    
    if (!User) {
      console.error('Modèle User non trouvé');
      return NextResponse.json(
        { error: 'Erreur interne: modèle User non disponible' },
        { status: 500 }
      );
    }
    
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`ID non valide: ${id}`);
      return NextResponse.json(
        { error: 'ID de professionnel invalide' },
        { status: 400 }
      );
    }
    
    // Récupérer le professionnel avec son ID
    const professional = await User.findOne({
      _id: id,
      role: 'professional'
    }).lean();
    
    if (!professional) {
      console.log(`Professionnel avec ID ${id} non trouvé`);
      // Si l'utilisateur existe mais n'est pas un professionnel, essayons de le récupérer
      const user = await User.findById(id).lean();
      if (user) {
        console.log(`Utilisateur trouvé mais il n'est pas un professionnel (rôle: ${user.role})`);
        return NextResponse.json(
          { error: `L'utilisateur existe mais n'est pas un professionnel (rôle: ${user.role})` },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Professionnel non trouvé' },
        { status: 404 }
      );
    }
    
    console.log(`Professionnel trouvé: ${professional.name}`);
    
    // Transformer les données pour le client (sans le mot de passe)
    const { password, ...professionalData } = professional;
    
    return NextResponse.json({
      professional: {
        ...professionalData,
        _id: professionalData._id.toString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du professionnel:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des détails du professionnel: ' + error.message },
      { status: 500 }
    );
  }
}