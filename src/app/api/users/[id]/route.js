// src/app/api/users/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';

export async function GET(request, { params }) {
  try {
    // Récupérer l'ID de l'utilisateur depuis les paramètres de l'URL
    const { id } = params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur a le droit d'accéder à cette ressource
    if (id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à accéder à cette ressource' },
        { status: 403 }
      );
    }
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Rechercher l'utilisateur
    const user = await User.findById(id).select({
      password: 0 // Exclure le mot de passe
    }).lean();
    
    // Si l'utilisateur n'existe pas
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Transformer l'ID en chaîne
    const userWithStringId = {
      ...user,
      _id: user._id.toString()
    };
    
    // Retourner l'utilisateur
    return NextResponse.json(userWithStringId, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération de l\'utilisateur' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Récupérer l'ID de l'utilisateur depuis les paramètres de l'URL
    const { id } = params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur a le droit de modifier cette ressource
    if (id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à modifier cette ressource' },
        { status: 403 }
      );
    }
    
    // Récupérer les données de la requête
    const data = await request.json();
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Rechercher l'utilisateur
    const user = await User.findById(id);
    
    // Si l'utilisateur n'existe pas
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Champs autorisés à être modifiés
    const allowedFields = ['name', 'phone', 'address', 'postalCode', 'city', 'housing'];
    
    // Mettre à jour les champs autorisés
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    }
    
    // Sauvegarder les modifications
    await user.save();
    
    // Retourner l'utilisateur mis à jour
    return NextResponse.json(
      { message: 'Profil mis à jour avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    );
  }
}