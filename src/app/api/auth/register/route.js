// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export async function POST(request) {
  console.log("POST /api/auth/register - Début de la requête");
  
  try {
    // Essayer de se connecter à la base de données
    console.log("Tentative de connexion à MongoDB...");
    try {
      await connectToDatabase();
      console.log("✅ Connexion à MongoDB réussie");
    } catch (dbError) {
      console.error("❌ Erreur de connexion à MongoDB:", dbError);
      return NextResponse.json(
        { error: 'Échec de connexion à la base de données', details: dbError.message },
        { status: 500 }
      );
    }
    
    // Analyser le corps de la requête
    console.log("Analyse du corps de la requête...");
    let body;
    try {
      body = await request.json();
      console.log("✅ Corps de la requête analysé:", JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error("❌ Erreur d'analyse JSON:", jsonError);
      return NextResponse.json(
        { error: 'Format de requête invalide' },
        { status: 400 }
      );
    }
    
    const { name, email, password, role, phone, address, postalCode, city, specialties } = body;

    // Validation de base
    console.log("Validation des champs...");
    if (!name || !email || !password || !role) {
      console.log("❌ Champs obligatoires manquants");
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires' },
        { status: 400 }
      );
    }
    
    // Vérifier que le rôle est valide
    if (role !== 'client' && role !== 'professional') {
      console.log("❌ Rôle invalide:", role);
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    // Récupérer le modèle User directement de mongoose
    const User = mongoose.models.User;
    if (!User) {
      console.error("❌ Modèle User non disponible");
      return NextResponse.json(
        { error: 'Erreur interne du serveur: modèle utilisateur non disponible' },
        { status: 500 }
      );
    }

    // Vérification si l'utilisateur existe déjà
    console.log("Vérification de l'existence de l'utilisateur...");
    let existingUser;
    try {
      existingUser = await User.findOne({ email });
      console.log("✅ Vérification d'existence terminée");
    } catch (findError) {
      console.error("❌ Erreur lors de la recherche d'utilisateur:", findError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification d\'utilisateur', details: findError.message },
        { status: 500 }
      );
    }
    
    if (existingUser) {
      console.log("❌ L'utilisateur existe déjà");
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée' },
        { status: 409 }
      );
    }

    // Création des données utilisateur
    console.log("Préparation des données utilisateur...");
    const userData = {
      name,
      email,
      password, // sera haché par le middleware pre-save
      role,
      phone,
      address,
      postalCode,
      city,
      createdAt: new Date(),
    };

    // Ajout des champs spécifiques aux professionnels
    if (role === 'professional') {
      userData.professional = {
        companyName: body.companyName,
        siret: body.siret,
        specialties: specialties || [],
        verified: false,
      };
    }
    console.log("✅ Données utilisateur préparées");

    // Créer et sauvegarder l'utilisateur
    console.log("Création et sauvegarde de l'utilisateur...");
    let newUser;
    try {
      newUser = new User(userData);
      await newUser.save();
      console.log("✅ Utilisateur enregistré avec succès");
    } catch (saveError) {
      console.error("❌ Erreur lors de l'enregistrement de l'utilisateur:", saveError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte', details: saveError.message },
        { status: 500 }
      );
    }
    
    // Retourner la réponse sans le mot de passe
    const userObject = newUser.toObject();
    delete userObject.password;
    
    console.log("✅ Inscription réussie");
    return NextResponse.json(
      { 
        success: true, 
        message: 'Inscription réussie', 
        user: userObject 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("❌ Erreur non gérée lors de l'inscription:", error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription', details: error.message },
      { status: 500 }
    );
  }
}