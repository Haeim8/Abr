// src/app/api/admin/projects/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Vérifier que l'utilisateur est admin
async function verifyAdmin(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    return new NextResponse(
      JSON.stringify({ error: 'Non autorisé' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return null; // Aucune erreur, l'utilisateur est admin
}

export async function GET(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    await connectToDatabase();
    
    // Récupérer le modèle Project
    const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({
      title: String,
      description: String,
      client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      casualWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: String, // 'pending', 'in_progress', 'completed', 'canceled'
      serviceType: String,
      address: {
        street: String,
        city: String,
        postalCode: String,
        country: String
      },
      housingType: String, // 'apartment', 'house', etc.
      area: Number, // in square meters
      subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
      quote: {
        amount: Number,
        acceptedAt: Date,
        validUntil: Date
      },
      photos: [{
        type: String, // 'before', 'after'
        url: String,
        uploadedAt: Date,
        description: String
      }],
      startDate: Date,
      completionDate: Date,
      rating: Number,
      feedback: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));
    
    // Construire la requête
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    // Récupérer les projets
    const projects = await Project.find(query)
      .populate('client', 'name email')
      .populate('professional', 'name email company')
      .populate('casualWorker', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Transformer les résultats pour le client
    const formattedProjects = projects.map(project => ({
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      status: project.status,
      serviceType: project.serviceType,
      client: project.client ? {
        id: project.client._id.toString(),
        name: project.client.name,
        email: project.client.email
      } : null,
      provider: project.professional ? {
        id: project.professional._id.toString(),
        name: project.professional.name,
        email: project.professional.email,
        company: project.professional.company
      } : (project.casualWorker ? {
        id: project.casualWorker._id.toString(),
        name: project.casualWorker.name,
        email: project.casualWorker.email,
        type: 'casual'
      } : null),
      address: project.address,
      housingType: project.housingType,
      area: project.area,
      quote: project.quote,
      photosCount: project.photos ? project.photos.length : 0,
      createdAt: project.createdAt.toISOString(),
      startDate: project.startDate ? project.startDate.toISOString() : null,
      completionDate: project.completionDate ? project.completionDate.toISOString() : null,
      rating: project.rating
    }));
    
    return NextResponse.json({ projects: formattedProjects });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    );
  }
}