'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [offers, setOffers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('offres');

  // Rediriger si non connecté ou pas un client
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session.user.role !== 'client') {
      router.push('/dashboard/pro');
    }
  }, [status, session, router]);

  // Charger les données du client
  useEffect(() => {
    const fetchClientData = async () => {
      if (status !== 'authenticated' || !session.user.id) return;
      
      setIsLoading(true);
      try {
        // Charger les offres du client
        const offersResponse = await fetch(`/api/offers?clientId=${session.user.id}`);
        if (offersResponse.ok) {
          const offersData = await offersResponse.json();
          setOffers(offersData.offers);
        }
        
        // Charger les abonnements du client
        const subscriptionsResponse = await fetch(`/api/subscriptions?clientId=${session.user.id}`);
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          setSubscriptions(subscriptionsData.subscriptions);
        }
        
        // Charger les devis reçus pour toutes les offres du client
        const quotesResponse = await fetch(`/api/quotes?clientId=${session.user.id}`);
        if (quotesResponse.ok) {
          const quotesData = await quotesResponse.json();
          setQuotes(quotesData.quotes);
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error('Erreur lors du chargement des données du client:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientData();
  }, [session, status]);

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

  // Traduire le statut en français
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

  // Obtenir la classe de badge en fonction du statut
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <div>
              <Link
                href="/offres/publier"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Publier une offre
              </Link>
            </div>
          </div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('offres')}
                className={`${
                  activeTab === 'offres'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Mes offres
              </button>
              <button
                onClick={() => setActiveTab('devis')}
                className={`${
                  activeTab === 'devis'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Devis reçus
              </button>
              <button
                onClick={() => setActiveTab('abonnements')}
                className={`${
                  activeTab === 'abonnements'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Mes abonnements
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
        {/* Onglet Mes offres */}
        {activeTab === 'offres' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Mes offres publiées</h2>
              </div>
              {offers.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-gray-500">Vous n'avez pas encore publié d'offres.</p>
                  <Link
                    href="/offres/publier"
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Publier votre première offre
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {offers.map((offer) => (
                    <li key={offer._id}>
                      <Link href={`/offres/${offer._id}`} className="block hover:bg-gray-50">
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
                                {offer.location}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Publié le {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              {offer.quotesCount || 0} devis reçus
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

        {/* Onglet Devis reçus */}
        {activeTab === 'devis' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Devis reçus</h2>
              </div>
              {quotes.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-gray-500">Vous n'avez pas encore reçu de devis.</p>
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
                          Proposé par: <span className="font-medium">{quote.professionalName || 'Professionnel'}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Durée estimée: {quote.estimatedDuration}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{quote.message}</p>
                      </div>
                      {quote.status !== 'accepted' && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleAcceptQuote(quote._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Accepter ce devis
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Onglet Abonnements */}
        {activeTab === 'abonnements' && (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Mes abonnements</h2>
              </div>
              {subscriptions.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-gray-500">Vous n'avez pas encore d'abonnement actif.</p>
                  <Link
                    href="/abonnements"
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Découvrir nos abonnements
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <li key={subscription._id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{subscription.plan}</p>
                          <p className="text-sm text-gray-500">
                            {subscription.status === 'active' ? 'Actif' : 'Inactif'}
                          </p>
                        </div>
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {subscription.amount}€ / mois
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Début: {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                        </p>
                        {subscription.endDate && (
                          <p className="text-sm text-gray-600">
                            Fin: {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Montant épargné: {subscription.savedAmount || 0}€
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
                  Détails personnels et paramètres du compte.
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
                    <dt className="text-sm font-medium text-gray-500">Adresse email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.email || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.phone || 'Non renseigné'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {session?.user?.address 
                        ? `${session.user.address}, ${session.user.postalCode || ''} ${session.user.city || ''}` 
                        : 'Non renseignée'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Type de compte</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      Client particulier
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