// src/app/api/services/available/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Liste des services disponibles sur la plateforme
const AVAILABLE_SERVICES = [
  { 
    id: 'painting', 
    name: 'Peinture', 
    description: 'Travaux de peinture intérieure et extérieure',
    restrictions: 'Disponible dans tous les forfaits' 
  },
  { 
    id: 'plumbing', 
    name: 'Plomberie', 
    description: 'Réparations et installations de plomberie',
    restrictions: 'Forfait Confort et supérieur' 
  },
  { 
    id: 'electricity', 
    name: 'Électricité', 
    description: 'Travaux électriques et dépannage',
    restrictions: 'Forfait Confort et supérieur' 
  },
  { 
    id: 'carpentry', 
    name: 'Menuiserie', 
    description: 'Travaux de menuiserie et petites réparations',
    restrictions: 'Forfait Confort et supérieur' 
  },
  { 
    id: 'gardening', 
    name: 'Jardinage', 
    description: 'Entretien de jardin et espaces verts',
    restrictions: 'Disponible dans tous les forfaits' 
  },
  { 
    id: 'cleaning', 
    name: 'Nettoyage', 
    description: 'Nettoyage et entretien de l\'habitat',
    restrictions: 'Disponible dans tous les forfaits' 
  },
  { 
    id: 'locksmith', 
    name: 'Serrurerie', 
    description: 'Dépannage et installation de serrures',
    restrictions: 'Forfait Premium et Excellence uniquement' 
  },
  { 
    id: 'emergency_plumbing', 
    name: 'Plomberie d\'urgence', 
    description: 'Intervention rapide pour problèmes de plomberie',
    restrictions: 'Forfait Excellence uniquement' 
  }
];

export async function GET(request) {
  try {
    // Vérifier l'authentification (optionnel pour cette route)
    const session = await getServerSession(authOptions);
    
    // Retourner tous les services disponibles
    return NextResponse.json(
      { services: AVAILABLE_SERVICES },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des services' },
      { status: 500 }
    );
  }
}