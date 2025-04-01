// src/app/api/admin/transactions/recent/route.js
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
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    await connectToDatabase();
    
    // Définir le modèle Transaction s'il n'existe pas
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({
      type: String, // 'subscription', 'service', 'commission', 'payout'
      amount: Number,
      status: String, // 'pending', 'completed', 'failed', 'refunded'
      clientId: mongoose.Schema.Types.ObjectId,
      providerId: mongoose.Schema.Types.ObjectId, // Professionnel ou travailleur
      projectId: mongoose.Schema.Types.ObjectId,
      description: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      paymentMethod: String,
      commissionAmount: Number,
      commissionRate: Number
    }));
    
    // Récupérer les transactions récentes
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('clientId', 'name email')
      .populate('providerId', 'name email role')
      .lean();
    
    // Si aucune transaction n'existe, retourner un tableau vide
    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ transactions: [] });
    }
    
    // Transformer les données pour le client
    const formattedTransactions = transactions.map(t => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      status: t.status,
      date: t.createdAt.toLocaleDateString(),
      client: t.clientId ? {
        id: t.clientId._id.toString(),
        name: t.clientId.name,
        email: t.clientId.email
      } : null,
      provider: t.providerId ? {
        id: t.providerId._id.toString(),
        name: t.providerId.name,
        email: t.providerId.email,
        role: t.providerId.role
      } : null,
      description: t.description,
      commissionAmount: t.commissionAmount || 0
    }));
    
    return NextResponse.json({ transactions: formattedTransactions });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des transactions' },
      { status: 500 }
    );
  }
}