// src/app/api/admin/rates/route.js
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

// GET: Récupérer tous les tarifs
export async function GET(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    await connectToDatabase();
    
    // Récupérer le modèle Rate (tarifs)
    const Rate = mongoose.models.Rate || mongoose.model('Rate', new mongoose.Schema({
      category: String,
      type: String, // 'hourly' ou 'sqm' (square meter)
      amount: Number,
      updatedAt: Date
    }));
    
    // Obtenir tous les tarifs
    const rates = await Rate.find({}).lean();
    
    // Si aucun tarif n'existe, retourner des tarifs par défaut
    if (rates.length === 0) {
      const defaultRates = [
        // Taux horaires
        { category: 'casual', type: 'hourly', amount: 25.00, updatedAt: new Date() },
        { category: 'electrician', type: 'hourly', amount: 45.00, updatedAt: new Date() },
        { category: 'plumber', type: 'hourly', amount: 42.00, updatedAt: new Date() },
        { category: 'painter', type: 'hourly', amount: 35.00, updatedAt: new Date() },
        { category: 'gardener', type: 'hourly', amount: 28.00, updatedAt: new Date() },
        
        // Taux au m²
        { category: 'painting', type: 'sqm', amount: 12.50, updatedAt: new Date() },
        { category: 'tiling', type: 'sqm', amount: 35.00, updatedAt: new Date() },
        { category: 'lawn', type: 'sqm', amount: 1.50, updatedAt: new Date() },
        { category: 'cleaning', type: 'sqm', amount: 4.50, updatedAt: new Date() },
        
        // Commissions
        { category: 'pro_commission', type: 'percentage', amount: 15.00, updatedAt: new Date() },
        { category: 'casual_commission', type: 'percentage', amount: 25.00, updatedAt: new Date() }
      ];
      
      // Enregistrer les tarifs par défaut dans la base de données
      await Rate.insertMany(defaultRates);
      
      return NextResponse.json(defaultRates);
    }
    
    return NextResponse.json(rates);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des tarifs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tarifs' },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour les tarifs
export async function PUT(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    const data = await request.json();
    await connectToDatabase();
    
    // Récupérer le modèle Rate
    const Rate = mongoose.models.Rate || mongoose.model('Rate', new mongoose.Schema({
      category: String,
      type: String,
      amount: Number,
      updatedAt: Date
    }));
    
    // Mise à jour des tarifs en masse
    const updatePromises = data.map(async (rate) => {
      return Rate.findOneAndUpdate(
        { category: rate.category, type: rate.type },
        { ...rate, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    });
    
    const updatedRates = await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: 'Tarifs mis à jour avec succès',
      rates: updatedRates
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des tarifs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des tarifs' },
      { status: 500 }
    );
  }
}