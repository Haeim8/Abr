'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfessionalDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [quotes, setQuotes] = useState([]);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [squareMeterRates, setSquareMeterRates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('projets');
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(0);

  // Types de travaux disponibles
  const workTypes = [
    'Peinture', 'Plomberie', 'Électricité', 'Maçonnerie', 
    'Menuiserie', 'Carrelage', 'Couverture', 'Chauffage',
    'Isolation', 'Rénovation', 'Décoration', 'Jardinage'
  ];

  // Rediriger si non connecté ou pas un professionnel
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session.user.role !== 'professional') {
      router.push('/dashboard/client');
    }
  }, [status, session, router]);

  // Charger les données du professionnel
  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (status !== 'authenticated' || !session.user.id) return;
      
      setIsLoading(true);
      try {
        // Charger les devis proposés par le professionnel
        const quotesResponse = await fetch(`/api/quotes?professionalId=${session.user.id}`);
        if (quotesResponse.ok) {
          const quotesData = await quotesResponse.json();
          setQuotes(quotesData.quotes);
        }
        
        // Charger les offres disponibles
        const offersResponse = await fetch('/api/offers?status=open');
        if (offersResponse.ok) {
          const offersData = await offersResponse.json();
          setAvailableOffers(offersData.offers);
        }
        
        // Charger les projets en cours du professionnel
        const projectsResponse = await fetch(`/api/projects?professionalId=${session.user.id}`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects);
        }
        
        // Charger les tarifs au m² et le taux horaire du professionnel
        const professionalResponse = await fetch(`/api/professionals/${session.user.id}`);
        if (professionalResponse.ok) {
          const professionalData = await professionalResponse.json();
          setSquareMeterRates(professionalData.professional.squareMeterRates || {});
          setHourlyRate(professionalData.professional.hourlyRate || 0);
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error('Erreur lors du chargement des données du professionnel:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfessionalData();
  }, [session, status]);

  // Mettre à jour les tarifs
  const handleUpdateRates = async () => {
    if (!session || !session.user.id) return;
    
    try {
      const response = await fetch(`/api/professionals/${session.user.id}/rates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hourlyRate,
          squareMeterRates,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour des tarifs');
      }
      
      // Réinitialiser le mode d'édition
      setIsEditingRates(false);
      
      // Afficher un message de succès (vous pouvez ajouter un state pour cela)
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour des tarifs:', err);
      // Afficher un message d'erreur (vous pouvez ajouter un state pour cela)
    }
  };

  // Mettre à jour les tarifs au m²
  const handleSquareMeterRateChange = (workType, value) => {
    setSquareMeterRates(prev => ({
      ...prev,
      [workType]: parseFloat(value) || 0,
    }));
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement du tableau de bord...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Professionnel</h1>
            <div>
              <button
                onClick={() => setActiveTab('tarifs')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Gérer mes tarifs
              </button>
            </div>
          </div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('projets')}
                className={`${
                  activeTab === 'projets'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Mes projets
              </button>
              <button
                onClick={() => setActiveTab('devis')}
                className={`${
                  activeTab === 'devis'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Mes devis
              </button>
              <button
                onClick={() => setActiveTab('offres')}
                className={`${
                  activeTab === 'offres'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Offres disponibles
              </button>
              <button
                onClick={() => setActiveTab('tarifs')}
                className={`${
                  activeTab === 'tarifs'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Mes tarifs
              </button>
              <button
                onClick={() => setActiveTab('profil')}
                className={`${
                  activeTab === 'profil'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Mon profil
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Onglet Mes projets */}
        {activeTab === 'projets' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Mes projets en cours</h2>
              </div>
              {projects.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-gray-500">Vous n'avez pas encore de projets en cours.</p>
                  <Link
                    href="/offres"
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Voir les offres disponibles
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {projects.map((project) => (
                    <li key={project._id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600">{project.title}</p>
                          <p className="text-sm text-gray-500">
                            Client: {project.clientName}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {project.status === 'in_progress' ? 'En cours' : 'Terminé'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Adresse: {project.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          Prix: {project.price}€
                        </p>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => /* Fonction pour marquer comme terminé */ {}}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {project.status === 'in_progress' ? 'Marquer comme terminé' : 'Voir les détails'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Onglet Mes devis */}
        {activeTab === 'devis' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Mes devis envoyés</h2>
              </div>
              {quotes.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-gray-500">Vous n'avez pas encore envoyé de devis.</p>
                  <Link
                    href="/offres"
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Voir les offres disponibles
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <li key={quote._id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link href={`/offres/${quote.offerId}`} className="text-sm font-medium text-indigo-600">
                            {quote.offerTitle || 'Offre'}
                          </Link>
                          {quote.status === 'accepted' && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Accepté
                            </span>
                          )}
                        </div>
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Prix: {quote.price}€
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Client: {quote.clientName || 'Client'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Durée estimée: {quote.estimatedDuration}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{quote.message}</p>
                      </div>
                      <div className="mt-3">
                        <Link
                          href={`/offres/${quote.offerId}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Voir l'offre
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Onglet Offres disponibles */}
        {activeTab === 'offres' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Offres disponibles</h2>
              </div>
              {availableOffers.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-gray-500">Aucune offre disponible pour le moment.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {availableOffers.map((offer) => (
                    <li key={offer._id}>
                      <Link href={`/offres/${offer._id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">{offer.title}</p>
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
                                {offer.location}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Publié le {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Onglet Mes tarifs */}
        {activeTab === 'tarifs' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Mes tarifs</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Définissez vos tarifs horaires et au m² pour chaque type de travaux.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingRates(!isEditingRates)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isEditingRates ? 'Annuler' : 'Modifier'}
                </button>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                      Taux horaire (€)
                    </label>
                    {isEditingRates ? (
                      <input
                        type="number"
                        id="hourlyRate"
                        min="0"
                        step="0.01"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                        className="max-w-lg block w-24 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{hourlyRate}€ / heure</span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tarifs au m²</h3>
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  {workTypes.map((workType) => (
                    <div key={workType} className="flex justify-between items-center">
                      <label htmlFor={`rate-${workType}`} className="block text-sm font-medium text-gray-700">
                        {workType}
                      </label>
                      {isEditingRates ? (
                        <input
                          type="number"
                          id={`rate-${workType}`}
                          min="0"
                          step="0.01"
                          value={squareMeterRates[workType] || ''}
                          onChange={(e) => handleSquareMeterRateChange(workType, e.target.value)}
                          className="max-w-lg block w-24 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{squareMeterRates[workType] || 0}€ / m²</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {isEditingRates && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleUpdateRates}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Profil */}
        {activeTab === 'profil' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Informations du profil</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Détails professionnels et paramètres du compte.
                </p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.name || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Nom de l'entreprise</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.professional?.companyName || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Adresse email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.email || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.phone || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.address 
                        ? `${session.user.address}, ${session.user.postalCode || ''} ${session.user.city || ''}` 
                        : 'Non renseignée'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">SIRET</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.professional?.siret || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Spécialités</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.professional?.specialties?.length > 0 
                        ? session.user.professional.specialties.join(', ') 
                        : 'Aucune spécialité renseignée'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Statut de vérification</dt>
                    <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                      {session?.user?.professional?.verified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Vérifié
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          En attente de vérification
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Modifier le profil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}