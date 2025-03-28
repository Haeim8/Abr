'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Identifiants incorrects.';
      case 'OAuthAccountNotLinked':
        return 'Ce compte est déjà lié à une autre méthode de connexion.';
      case 'EmailSignin':
        return 'Erreur d\'envoi d\'email. Veuillez réessayer.';
      case 'SessionRequired':
        return 'Vous devez être connecté pour accéder à cette page.';
      default:
        return 'Une erreur s\'est produite. Veuillez réessayer.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Erreur d'authentification
          </h2>
        </div>

        <div className="rounded-md bg-red-50 p-4 my-8">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {getErrorMessage(error)}
              </h3>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            href="/auth/signin"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Retour à la page de connexion
          </Link>
        </div>
      </div>
    </div>
  );
}