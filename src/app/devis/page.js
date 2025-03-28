// src/app/devis/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DevisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Rediriger si non connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Charger les devis
  useEffect(() => {
    const fetchQuotes = async () => {
      if (status !== 'authenticated') return;
      
      setIsLoading(true);
      try {
        const userId = session.user.id;
        const endpoint = session.user.role === 'professional' 
          ? `/api/quotes?professionalId=${userId}`
          : `/api/quotes?clientId=${userId}`;
          
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des devis');
        }
        
        const data = await response.json();
        setQuotes(data.quotes || []);
      } catch (err) {
        setError(err.message);
        console.error('Erreur:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuotes();
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement des devis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Mes devis</h1>
            {session?.user?.role === 'professional' && (
              <Link
                href="/devis/creer"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Créer un devis
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {quotes.length === 0 ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">Aucun devis trouvé.</p>
              {session?.user?.role === 'professional' && (
                <div className="mt-4">
                  <Link
                    href="/offres"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Parcourir les offres disponibles
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {quotes.map((quote) => (
                <li key={quote._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-indigo-600">{quote.offerTitle || 'Devis sans titre'}</h3>
                      <p className="text-sm text-gray-500">
                        {session?.user?.role === 'professional' 
                          ? `Pour : Client #${quote.offerID?.substring(0, 8) || 'N/A'}`
                          : `De : ${quote.professionalName || 'Professionnel'}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {quote.price}€
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{quote.description || 'Aucune description'}</p>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/devis/${quote._id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Voir les détails
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}