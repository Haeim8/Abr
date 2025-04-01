import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// GET: Obtenir les documents pour vérification
export async function GET(request, { params }) {
  try {
    // Vérifier que l'utilisateur est admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const { id } = params;
    
    await connectToDatabase();
    
    const User = mongoose.models.User;
    const professional = await User.findById(id).select('professional').lean();
    
    if (!professional) {
      return NextResponse.json({ error: 'Professionnel non trouvé' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      professional: {
        ...professional,
        _id: professional._id.toString()
      } 
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT: Approuver ou rejeter un professionnel
export async function PUT(request, { params }) {
  try {
    // Vérifier que l'utilisateur est admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const { id } = params;
    const { verified, rejectionReason } = await request.json();
    
    await connectToDatabase();
    
    const User = mongoose.models.User;
    const professional = await User.findById(id);
    
    if (!professional) {
      return NextResponse.json({ error: 'Professionnel non trouvé' }, { status: 404 });
    }
    
    // Mettre à jour le statut de vérification
    professional.professional = {
      ...professional.professional,
      verified: verified === true,
      verifiedAt: verified === true ? new Date() : undefined,
      rejectionReason: !verified ? rejectionReason : undefined
    };
    
    await professional.save();
    
    // Envoyer une notification au professionnel (à implémenter plus tard)
    
    return NextResponse.json({ 
      success: true,
      message: verified ? 'Professionnel vérifié avec succès' : 'Professionnel rejeté',
      professional: {
        id: professional._id.toString(),
        verified: professional.professional.verified
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}