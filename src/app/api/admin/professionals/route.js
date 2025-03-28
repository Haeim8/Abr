// src/app/api/admin/professionals/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    
    console.log('Requête GET /api/admin/professionals avec status:', status);
    
    // Connexion à la base de données
    await connectToDatabase();
    
    // Récupérer le modèle User
    const User = mongoose.models.User;
    
    // Construire la requête en fonction du statut
    let query = { role: 'professional' };
    
    if (status === 'pending') {
      query['professional.verified'] = { $ne: true };
    } else if (status === 'verified') {
      query['professional.verified'] = true;
    }
    
    console.log('Requête MongoDB:', JSON.stringify(query));
    
    // Récupérer les professionnels
    const professionals = await User.find(query).lean();
    
    console.log(`${professionals.length} professionnels trouvés`);
    
    // Transformer les données pour le client (sans les mots de passe)
    const transformedProfessionals = professionals.map(pro => {
      const { password, ...proData } = pro;
      return {
        ...proData,
        _id: proData._id.toString()
      };
    });
    
    return NextResponse.json({ professionals: transformedProfessionals });
  } catch (error) {
    console.error('Erreur lors de la récupération des professionnels:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des professionnels: ' + error.message },
      { status: 500 }
    );
  }
}