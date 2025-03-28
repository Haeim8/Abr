import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';

/**
 * API pour calculer un devis automatique basé sur la surface et les tarifs des professionnels
 * @route POST /api/quotes/auto
 */
export async function POST(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // Extraire les données de la requête
    const body = await request.json();
    const { 
      surfaceArea,
      workType,
      location,
      propertyType,
      specialRequirements = ''
    } = body;

    // Validation des données
    if (!surfaceArea || !workType) {
      return NextResponse.json(
        { error: 'La surface et le type de travaux sont requis' },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    await connectToDatabase();

    // Récupérer tous les professionnels ayant des tarifs définis pour ce type de travaux
    // et dont ce type de travaux fait partie de leurs spécialités
    const professionals = await User.find({
      role: 'professional',
      'professional.verified': true,
      'professional.specialties': workType,
      [`professional.squareMeterRates.${workType}`]: { $exists: true, $gt: 0 }
    }).select('name email phone professional').limit(10);

    if (professionals.length === 0) {
      return NextResponse.json(
        { error: 'Aucun professionnel disponible pour ce type de travaux' },
        { status: 404 }
      );
    }

    // Calculer les devis pour chaque professionnel
    const quotes = professionals.map(professional => {
      const squareMeterRate = professional.professional.squareMeterRates[workType] || 0;
      const hourlyRate = professional.professional.hourlyRate || 0;
      
      // Calcul du prix basé sur la surface
      let price = squareMeterRate * surfaceArea;
      
      // Ajout de la composante horaire (estimé en fonction de la surface)
      // Par exemple, 1 heure par 10m² (cette formule peut être ajustée)
      const estimatedHours = Math.ceil(surfaceArea / 10);
      price += hourlyRate * estimatedHours;
      
      // Estimation de la durée des travaux (en jours)
      // Cette formule est simplifiée et peut être ajustée
      const estimatedDuration = Math.ceil(surfaceArea / 20); // 20m² par jour en moyenne
      
      return {
        professionalId: professional._id,
        professionalName: professional.name,
        companyName: professional.professional.companyName,
        email: professional.email,
        phone: professional.phone,
        price: Math.round(price * 100) / 100, // Arrondi à 2 décimales
        squareMeterRate,
        hourlyRate,
        estimatedDuration: `${estimatedDuration} jour${estimatedDuration > 1 ? 's' : ''}`,
        estimatedHours,
        verified: professional.professional.verified
      };
    });

    // Trier les devis par prix croissant
    quotes.sort((a, b) => a.price - b.price);

    // Retourner les devis automatiques
    return NextResponse.json({
      success: true,
      quotes,
      input: {
        surfaceArea,
        workType,
        location,
        propertyType,
        specialRequirements
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erreur lors du calcul du devis automatique:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du calcul du devis automatique' },
      { status: 500 }
    );
  }
}