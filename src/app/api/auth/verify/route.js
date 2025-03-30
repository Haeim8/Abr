// src/app/api/auth/verify/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier l'authentification
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Récupérer les données du formulaire
    const formData = await request.formData();
    const userId = formData.get('userId') || session.user.id;
    
    // Vérifier que l'utilisateur peut modifier ce profil
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Préparer les données professionnelles
    user.professional = user.professional || {};
    user.professional.verificationDocuments = user.professional.verificationDocuments || {};
    
    // Stocker les compétences
    const skills = formData.get('skills');
    if (skills) {
      user.professional.specialties = JSON.parse(skills);
    }
    
    // Stocker le taux horaire
    const hourlyRate = formData.get('hourlyRate');
    if (hourlyRate) {
      user.professional.hourlyRate = parseFloat(hourlyRate);
    }
    
    // Stocker les disponibilités
    const availability = formData.get('availability');
    if (availability) {
      user.professional.availability = JSON.parse(availability);
    }
    
    // Stocker la description
    const description = formData.get('description');
    if (description) {
      user.professional.description = description;
    }
    
    // Enregistrer les documents (en pratique, il faudrait les télécharger vers un service de stockage)
    // et stocker les URL résultantes
    const idDocument = formData.get('idDocument');
    const bankInfo = formData.get('bankInfo');
    
    if (idDocument) {
      // Simuler le stockage d'un document
      user.professional.verificationDocuments.idDocument = 'url_exemple_id_document';
    }
    
    if (bankInfo) {
      // Simuler le stockage d'un document
      user.professional.verificationDocuments.bankInfo = 'url_exemple_bank_info';
    }
    
    // Enregistrer l'heure de téléchargement
    user.professional.verificationDocuments.uploadedAt = new Date();
    
    // Marquer comme non vérifié (à vérifier par un admin)
    user.professional.verified = false;
    
    // Sauvegarder les modifications
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Documents soumis avec succès pour vérification'
    });
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification: ' + error.message },
      { status: 500 }
    );
  }
}