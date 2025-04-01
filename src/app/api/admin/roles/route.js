// src/app/api/admin/roles/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Vérifier que l'utilisateur est super admin (CEO)
async function verifySuperAdmin(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin' || !session.user.isSuperAdmin) {
    return new NextResponse(
      JSON.stringify({ error: 'Non autorisé. Seul le CEO peut gérer les droits administratifs.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return null; // Aucune erreur, l'utilisateur est super admin
}

// GET: Récupérer tous les administrateurs et leurs permissions
export async function GET(request) {
  // Vérifier l'autorisation
  const authError = await verifySuperAdmin(request);
  if (authError) return authError;
  
  try {
    await connectToDatabase();
    
    // Récupérer le modèle User
    const User = mongoose.models.User;
    
    // Récupérer tous les administrateurs
    const admins = await User.find({ 
      role: 'admin' 
    }).select('name email permissions lastLogin active isSuperAdmin').lean();
    
    // Transformer les résultats
    const formattedAdmins = admins.map(admin => ({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      permissions: admin.permissions || {
        users: { view: true, edit: false, delete: false },
        professionals: { view: true, edit: false, verify: false },
        subscriptions: { view: true, edit: false },
        rates: { view: true, edit: false },
        transactions: { view: true, process: false },
        disputes: { view: true, resolve: false },
        reports: { view: true, export: false }
      },
      isSuperAdmin: admin.isSuperAdmin || false,
      lastLogin: admin.lastLogin ? admin.lastLogin.toISOString() : null,
      active: admin.active !== false
    }));
    
    return NextResponse.json({ admins: formattedAdmins });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des administrateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des administrateurs' },
      { status: 500 }
    );
  }
}

// POST: Créer un nouvel administrateur
export async function POST(request) {
  // Vérifier l'autorisation
  const authError = await verifySuperAdmin(request);
  if (authError) return authError;
  
  try {
    const data = await request.json();
    
    // Validation basique
    if (!data.email || !data.name || !data.password) {
      return NextResponse.json(
        { error: 'Email, nom et mot de passe requis' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Récupérer le modèle User
    const User = mongoose.models.User;
    
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: data.email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }
    
    // Créer le nouvel administrateur
    const newAdmin = new User({
      name: data.name,
      email: data.email,
      password: data.password, // Le modèle devrait hasher ceci
      role: 'admin',
      isSuperAdmin: data.isSuperAdmin === true ? true : false,
      permissions: data.permissions || {
        users: { view: true, edit: false, delete: false },
        professionals: { view: true, edit: false, verify: false },
        subscriptions: { view: true, edit: false },
        rates: { view: true, edit: false },
        transactions: { view: true, process: false },
        disputes: { view: true, resolve: false },
        reports: { view: true, export: false }
      },
      createdAt: new Date(),
      active: true
    });
    
    await newAdmin.save();
    
    return NextResponse.json({
      success: true,
      message: 'Administrateur créé avec succès',
      admin: {
        id: newAdmin._id.toString(),
        name: newAdmin.name,
        email: newAdmin.email,
        permissions: newAdmin.permissions,
        isSuperAdmin: newAdmin.isSuperAdmin
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'administrateur' },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour les permissions d'un administrateur
export async function PUT(request) {
  // Vérifier l'autorisation
  const authError = await verifySuperAdmin(request);
  if (authError) return authError;
  
  try {
    const data = await request.json();
    
    if (!data.adminId) {
      return NextResponse.json(
        { error: 'ID administrateur requis' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Récupérer le modèle User
    const User = mongoose.models.User;
    
    // Trouver l'administrateur
    const admin = await User.findById(data.adminId);
    
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Administrateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Mettre à jour les champs permis
    if (data.permissions) {
      admin.permissions = data.permissions;
    }
    
    if (data.active !== undefined) {
      admin.active = data.active;
    }
    
    if (data.name) {
      admin.name = data.name;
    }
    
    // Mettre à jour le statut de super admin (uniquement si on ne se désactive pas soi-même)
    const session = await getServerSession(authOptions);
    if (data.isSuperAdmin !== undefined && admin._id.toString() !== session.user.id) {
      admin.isSuperAdmin = data.isSuperAdmin;
    }
    
    await admin.save();
    
    return NextResponse.json({
      success: true,
      message: 'Administrateur mis à jour avec succès',
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        permissions: admin.permissions,
        active: admin.active,
        isSuperAdmin: admin.isSuperAdmin
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'administrateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'administrateur' },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer un administrateur
export async function DELETE(request) {
  // Vérifier l'autorisation
  const authError = await verifySuperAdmin(request);
  if (authError) return authError;
  
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('id');
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'ID administrateur requis' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Récupérer le modèle User
    const User = mongoose.models.User;
    
    // Vérifier qu'on ne supprime pas son propre compte
    const session = await getServerSession(authOptions);
    if (adminId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }
    
    // Trouver et supprimer l'administrateur
    const admin = await User.findById(adminId);
    
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Administrateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Option 1: Supprimer réellement l'utilisateur
    // await User.findByIdAndDelete(adminId);
    
    // Option 2: Désactiver l'utilisateur (approche recommandée)
    admin.active = false;
    await admin.save();
    
    return NextResponse.json({
      success: true,
      message: 'Administrateur désactivé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'administrateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'administrateur' },
      { status: 500 }
    );
  }
}