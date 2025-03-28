'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Composant qui utilise useSearchParams
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  let errorMessage = "Une erreur est survenue lors de l'authentification";
  
  if (error === 'CredentialsSignin') {
    errorMessage = "Identifiants incorrects. Veuillez vérifier votre email et mot de passe.";
  } else if (error) {
    errorMessage = `Erreur: ${error}`;
  }
  
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur d'authentification</h2>
      <p className="text-gray-700 mb-6">{errorMessage}</p>
      <div className="flex justify-between">
        <Link href="/auth/signin">
          <span className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Retour à la connexion</span>
        </Link>
        <Link href="/">
          <span className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Accueil</span>
        </Link>
      </div>
    </div>
  );
}

// Page d'erreur
export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Suspense fallback={<div>Chargement...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}