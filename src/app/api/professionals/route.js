// src/app/api/professionals/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';

export async function GET(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // Récupérer les paramètres de recherche
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const city = searchParams.get('city');
    const search = searchParams.get('search');

    // Connexion à la base de données
    await connectToDatabase();

    // Construire la requête
    let query = { role: 'professional' };
    
    // Filtrer par spécialité si spécifiée
    if (specialty) {
      query['professional.specialties'] = specialty;
    }
    
    // Filtrer par ville si spécifiée
    if (city) {
      query.city = new RegExp(city, 'i');
    }
    
    // Recherche globale si spécifiée
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { 'professional.companyName': new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { 'professional.specialties': new RegExp(search, 'i') }
      ];
    }

    // Trouver les professionnels correspondants
    const professionals = await User.find(query).select({
      _id: 1,
      name: 1,
      email: 1,
      phone: 1,
      city: 1,
      professional: 1
    }).lean();

    // Transformer les données pour l'API
    const formattedProfessionals = professionals.map(pro => ({
      id: pro._id.toString(),
      name: pro.professional?.companyName || pro.name,
      email: pro.email,
      phone: pro.phone,
      city: pro.city,
      specialties: pro.professional?.specialties || [],
      hourlyRate: pro.professional?.hourlyRate || 0,
      rating: pro.professional?.rating || 0,
      verified: pro.professional?.verified || false,
      // Calcul de distance fictif pour le moment
      distance: Math.floor(Math.random() * 20) + 1
    }));

    return NextResponse.json(
      { professionals: formattedProfessionals },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des professionnels:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des professionnels' },
      { status: 500 }
    );
  }
}