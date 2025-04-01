// src/app/api/admin/users/route.js
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
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    
    await connectToDatabase();
    
    // Récupérer le modèle User
    const User = mongoose.models.User;
    
    if (!User) {
      return NextResponse.json(
        { error: 'Modèle utilisateur non trouvé' },
        { status: 500 }
      );
    }
    
    // Construire la requête
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (status === 'active') {
      query.active = true;
    } else if (status === 'inactive') {
      query.active = false;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculer le nombre total pour la pagination
    const total = await User.countDocuments(query);
    
    // Récupérer les utilisateurs avec pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Transformer les résultats pour le client
    const formattedUsers = users.map(user => ({
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null
    }));
    
    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

// Suspendre/réactiver un utilisateur
export async function PUT(request) {
  // Vérifier l'autorisation
  const authError = await verifyAdmin(request);
  if (authError) return authError;
  
  try {
    const data = await request.json();
    
    if (!data.userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const User = mongoose.models.User;
    
    // Mettre à jour l'utilisateur
    const user = await User.findById(data.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    if (data.active !== undefined) {
      user.active = data.active;
    }
    
    if (data.role && ['client', 'professional', 'casual', 'admin'].includes(data.role)) {
      user.role = data.role;
    }
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: `Utilisateur ${user.active ? 'activé' : 'désactivé'} avec succès`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    );
  }
}