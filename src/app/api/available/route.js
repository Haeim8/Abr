// src/app/api/jobs/available/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    console.log("GET /api/jobs/available - Début");
    
    // Vérifier l'authentification (optionnel)
    const session = await getServerSession(authOptions);
    
    // Extraire les paramètres de recherche
    const searchParams = new URL(request.url).searchParams;
    const location = searchParams.get('location');
    const service = searchParams.get('service');
    
    console.log("Recherche de professionnels - Paramètres:", { location, service });
    
    try {
      // Connexion à la base de données
      await connectToDatabase();
      
      // Récupérer le modèle User
      const User = mongoose.models.User;
      
      if (!User) {
        console.error('Modèle User non trouvé');
        // Mode fallback pour le développement
        return NextResponse.json({
          professionals: generateMockProfessionals(location, service)
        });
      }
      
      // Construire le filtre
      let filter = { role: 'professional', 'professional.isActive': true };
      
      if (location) {
        filter['address.city'] = { $regex: location, $options: 'i' };
      }
      
      if (service) {
        filter['professional.services'] = { $elemMatch: { 
          name: { $regex: service, $options: 'i' }
        }};
      }
      
      // Recherche dans la base de données
      const professionals = await User.find(filter)
        .select('name professional.services professional.rating professional.workPhotos address')
        .limit(20)
        .lean();
      
      // Transformer les données pour le client
      const formattedProfessionals = professionals.map(pro => ({
        id: pro._id.toString(),
        name: pro.name,
        services: pro.professional?.services || [],
        rating: pro.professional?.rating || 0,
        location: pro.address?.city || 'Non spécifiée',
        photo: pro.professional?.workPhotos?.[0] || null
      }));
      
      return NextResponse.json({ professionals: formattedProfessionals });
      
    } catch (dbError) {
      console.error("Erreur de base de données:", dbError);
      // Pour éviter le plantage complet en mode développement
      return NextResponse.json({
        professionals: generateMockProfessionals(location, service),
        _debug: 'Données simulées suite à une erreur de base de données'
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de la recherche de professionnels:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la recherche de professionnels' },
      { status: 500 }
    );
  }
}

// Fonction pour générer des professionnels fictifs en mode développement
function generateMockProfessionals(location, service) {
  const services = ['Plomberie', 'Électricité', 'Jardinage', 'Peinture', 'Menuiserie'];
  const cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille'];
  
  // Utiliser le service demandé ou choisir aléatoirement
  const targetService = service || services[Math.floor(Math.random() * services.length)];
  const targetLocation = location || cities[Math.floor(Math.random() * cities.length)];
  
  return Array.from({ length: 5 }, (_, i) => ({
    id: `mock_${i+1}`,
    name: `Pro ${i+1} ${targetService}`,
    services: [{ name: targetService, hourlyRate: 35 + i * 5 }],
    rating: 4 + Math.random(),
    location: targetLocation,
    photo: null
  }));
}