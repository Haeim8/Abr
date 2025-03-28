'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  // Charge les offres depuis l'API
  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true);
      try {
        console.log('Chargement des offres...');
        const response = await fetch('/api/offers');
        if (!response.ok) {
          throw new Error('Échec du chargement des offres');
        }
        const data = await response.json();
        console.log('Offres reçues:', data);
        setOffers(data.offers || []);
      } catch (err) {
        setError('Impossible de charger les offres: ' + err.message);
        console.error('Erreur lors du chargement des offres:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Filtre les offres en fonction du filtre et du terme de recherche
  const filteredOffers = offers.filter((offer) => {
    // Filtre par statut
    if (filter !== 'all' && offer.status !== filter) {
      return false;
    }
    
    // Filtre par terme de recherche
    if (searchTerm && !offerMatchesSearch(offer, searchTerm)) {
      return false;
    }
    
    return true;
  });

  // Vérifie si une offre correspond au terme de recherche
  const offerMatchesSearch = (offer, term) => {
    const lowercaseTerm = term.toLowerCase();
    return (
      offer.title.toLowerCase().includes(lowercaseTerm) ||
      offer.description.toLowerCase().includes(lowercaseTerm) ||
      (offer.location && offer.location.toLowerCase().includes(lowercaseTerm))
    );
  };

  // Détermine la classe de badge en fonction du statut
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Traduit le statut en français
  const translateStatus = (status) => {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Offres disponibles</h1>
          
          {session && session.user.role === 'client' && (
            <Link
              href="/offres/publier"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Publier une offre
            </Link>
          )}
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
          <div className="p-4 border-b border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-medium text-gray-900">Filtrer les offres</h2>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="open">Ouvert</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-4 sm:p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Chargement des offres...</p>
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="p-4 sm:p-6 text-center">
              <p className="text-gray-500">Aucune offre ne correspond à vos critères.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredOffers.map((offer) => (
                <li key={offer._id}>
                  <div className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">{offer.title}</p>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(offer.status)}`}>
                            {translateStatus(offer.status)}
                          </span>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Budget: {offer.budget}€
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {offer.location || 'Non spécifié'}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Publié le {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {offer.description}
                        </p>
                      </div>
                      <div className="mt-3 flex">
                        <Link 
                          href={`/offres/${offer._id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Voir les détails
                        </Link>

                        {session && session.user.role === 'professional' && offer.status === 'open' && (
                          <button
                            onClick={() => router.push(`/offres/${offer._id}`)}
                            className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Proposer un devis
                          </button>
                        )}
                      </div>
                    </div>
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