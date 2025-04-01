// src/app/api/admin/disputes/route.js
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
    
    // Définir le modèle Dispute s'il n'existe pas
    const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', new mongoose.Schema({
      project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Professionnel ou travailleur occasionnel
      title: String,
      description: String,
      status: { type: String, default: 'open' }, // 'open', 'in_progress', 'resolved', 'closed'
      type: String, // 'quality', 'delay', 'payment', 'behavior', 'other'
      evidence: [{
        type: String, // 'photo', 'document', 'message'
        url: String,
        description: String,
        uploadedAt: Date
      }],
      resolution: {
        type: String, // 'refund', 'partial_refund', 'rework', 'compensation', 'no_action'
        amount: Number, // Si applicable
        description: String,
        resolvedAt: Date,
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Admin qui a résolu
      },
      messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        sentAt: { type: Date, default: Date.now }
      }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));
    
    // Construire la requête
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    // Récupérer les litiges
    const disputes = await Dispute.find(query)
      .populate('project', 'title')
      .populate('client', 'name email')
      .populate('provider', 'name email company')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Transformer les résultats pour le client
    const formattedDisputes = disputes.map(dispute => ({
      id: dispute._id.toString(),
      projectId: dispute.project ? dispute.project._id.toString() : null,
      projectTitle: dispute.project ? dispute.project.title : 'Projet inconnu',
      client: dispute.client ? {
        id: dispute.client._id.toString(),
        name: dispute.client.name,
        email: dispute.client.email
      } : null,
      provider: dispute.provider ? {
        id: dispute.provider._id.toString(),
        name: dispute.provider.name,
        email: dispute.provider.email,
        company: dispute.provider.company
      } : null,
      title: dispute.title,
      description: dispute.description,
      status: dispute.status,
      type: dispute.type,
      evidenceCount: dispute.evidence ? dispute.evidence.length : 0,
      resolution: dispute.resolution,
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString()
    }));
    
    return NextResponse.json({ disputes: formattedDisputes });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des litiges:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des litiges' },
      { status: 500 }
    );
  }
}

// Mettre à jour le statut d'un litige ou ajouter une résolution
export async function PUT(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    const data = await request.json();
    
    if (!data.disputeId) {
      return NextResponse.json(
        { error: 'ID de litige requis' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const Dispute = mongoose.models.Dispute;
    const session = await getServerSession(authOptions);
    
    // Trouver le litige
    const dispute = await Dispute.findById(data.disputeId);
    
    if (!dispute) {
      return NextResponse.json(
        { error: 'Litige non trouvé' },
        { status: 404 }
      );
    }
    
    // Mettre à jour le statut
    if (data.status) {
      dispute.status = data.status;
    }
    
    // Ajouter une résolution
    if (data.resolution) {
      dispute.resolution = {
        ...data.resolution,
        resolvedAt: new Date(),
        resolvedBy: session.user.id
      };
      
      // Si une résolution est ajoutée, marquer le litige comme résolu
      if (dispute.status === 'open' || dispute.status === 'in_progress') {
        dispute.status = 'resolved';
      }
    }
    
    // Ajouter un message
    if (data.message) {
      dispute.messages.push({
        sender: session.user.id,
        content: data.message,
        sentAt: new Date()
      });
    }
    
    dispute.updatedAt = new Date();
    await dispute.save();
    
    return NextResponse.json({
      success: true,
      message: 'Litige mis à jour avec succès',
      dispute: {
        id: dispute._id.toString(),
        status: dispute.status,
        resolution: dispute.resolution
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du litige:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du litige' },
      { status: 500 }
    );
  }
}