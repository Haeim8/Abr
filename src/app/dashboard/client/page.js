'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMenu, FiHome, FiUser, FiBook, FiFileText, FiHelpCircle, FiLogOut, FiCalendar } from 'react-icons/fi';

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [offers, setOffers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [availableServices, setAvailableServices] = useState([]);
  const [housing, setHousing] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
        // Charger le profil utilisateur avec les infos de logement
        const userResponse = await fetch(`/api/users/${session.user.id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setHousing(userData.housing);
        }
        
        // Charger les offres du client
        const offersResponse = await fetch(`/api/offers?clientId=${session.user.id}`);
        if (offersResponse.ok) {
          const offersData = await offersResponse.json();
          setOffers(offersData.offers || []);
        }
        
        // Charger l'abonnement actif du client
        const subscriptionResponse = await fetch(`/api/subscriptions/active?userId=${session.user.id}`);
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscription(subscriptionData.subscription || null);
        }
        
        // Charger les devis reçus pour toutes les offres du client
        const quotesResponse = await fetch(`/api/quotes?clientId=${session.user.id}`);
        if (quotesResponse.ok) {
          const quotesData = await quotesResponse.json();
          setQuotes(quotesData.quotes || []);
        }

        // Charger les services disponibles
        const servicesResponse = await fetch('/api/services/available');
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setAvailableServices(servicesData.services || []);
        } else {
          // Données de secours si l'API n'est pas encore implémentée
          setAvailableServices([
            { id: 'painting', name: 'Peinture', description: 'Travaux de peinture intérieure' },
            { id: 'plumbing', name: 'Plomberie', description: 'Réparations et installations de plomberie' },
            { id: 'electricity', name: 'Électricité', description: 'Travaux électriques et dépannage' },
            { id: 'gardening', name: 'Jardinage', description: 'Entretien de jardin et espaces verts' },
            { id: 'cleaning', name: 'Nettoyage', description: 'Nettoyage et entretien de l\'habitat' },
            { id: 'locksmith', name: 'Serrurerie', description: 'Dépannage et installation de serrures' }
          ]);
        }

        // Charger les professionnels
        const professionalsResponse = await fetch('/api/professionals');
        if (professionalsResponse.ok) {
          const professionalsData = await professionalsResponse.json();
          setProfessionals(professionalsData.professionals || []);
        } else {
          // Données de secours si l'API n'est pas encore implémentée
          setProfessionals([
            { id: '1', name: 'Dupont Électricité', specialties: ['electricity'], rating: 4.8, distance: 3, city: 'Paris' },
            { id: '2', name: 'Martin Plomberie', specialties: ['plumbing'], rating: 4.5, distance: 5, city: 'Paris' },
            { id: '3', name: 'Durand Peinture', specialties: ['painting'], rating: 4.9, distance: 7, city: 'Paris' },
            { id: '4', name: 'Bernard Jardinage', specialties: ['gardening'], rating: 4.7, distance: 4, city: 'Paris' }
          ]);
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

  // Accepter un devis
  const handleAcceptQuote = async (quoteId) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'acceptation du devis');
      }
      
      // Mettre à jour la liste des devis
      setQuotes(quotes.map(quote => 
        quote._id === quoteId 
          ? { ...quote, status: 'accepted' } 
          : quote
      ));
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de l\'acceptation du devis');
    }
  };

  // Calculer le nombre de jours jusqu'au prochain service disponible
  const getDaysUntilNextService = () => {
    if (!subscription || !subscription.lastResetDate) return 0;
    
    const today = new Date();
    const nextReset = new Date(subscription.lastResetDate);
    nextReset.setMonth(nextReset.getMonth() + 1);
    
    const diffTime = Math.max(0, nextReset - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Vérifier si un service est disponible en fonction de l'abonnement
  const isServiceAvailable = (serviceId) => {
    if (!subscription) return false;
    
    // Si l'abonnement est actif
    if (subscription.status === 'active') {
      // Si le client a encore des tâches disponibles
      if (subscription.tasksUsedThisMonth < (subscription.maxTasks || 0)) {
        // Liste des services disponibles par forfait
        const planServices = {
          'forfait1': ['painting', 'cleaning', 'gardening'],
          'forfait2': ['painting', 'cleaning', 'gardening', 'plumbing', 'electricity', 'carpentry'],
          'forfait3': ['painting', 'cleaning', 'gardening', 'plumbing', 'electricity', 'carpentry', 'locksmith'],
          'forfait4': ['painting', 'cleaning', 'gardening', 'plumbing', 'electricity', 'carpentry', 'locksmith', 'emergency_plumbing']
        };
        
        return planServices[subscription.planId]?.includes(serviceId) || false;
      }
    }
    
    return false;
  };

  // Filtrer les professionnels selon le terme de recherche
  const filteredProfessionals = professionals.filter(pro => 
    pro.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pro.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
    pro.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-indigo-800 text-white ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-30`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-700">
          <h2 className={`text-xl font-bold ${sidebarOpen ? 'block' : 'hidden'}`}>Khaja</h2>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-md hover:bg-indigo-700 focus:outline-none"
          >
            <FiMenu className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-900 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-700'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiHome className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Tableau de bord</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`${
                activeTab === 'profile' 
                  ? 'bg-indigo-900 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-700'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiUser className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Profil</span>
            </button>
            
            <button
              onClick={() => setActiveTab('professionals')}
              className={`${
                activeTab === 'professionals' 
                  ? 'bg-indigo-900 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-700'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiBook className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Annuaire</span>
            </button>
            
            <button
              onClick={() => setActiveTab('quotes')}
              className={`${
                activeTab === 'quotes' 
                  ? 'bg-indigo-900 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-700'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiFileText className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Devis</span>
            </button>
            
            <button
              onClick={() => setActiveTab('calendar')}
              className={`${
                activeTab === 'calendar' 
                  ? 'bg-indigo-900 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-700'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiCalendar className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Calendrier</span>
            </button>
          </div>
          
          <div className="pt-8 mt-6 border-t border-indigo-700 space-y-2">
            <button
              onClick={() => router.push('/help')}
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-indigo-100 hover:bg-indigo-700 w-full"
            >
              <FiHelpCircle className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Support</span>
            </button>
            
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-indigo-100 hover:bg-indigo-700 w-full"
            >
              <FiLogOut className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Déconnexion</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 ease-in-out`}>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'profile' && 'Mon profil'}
              {activeTab === 'professionals' && 'Annuaire des professionnels'}
              {activeTab === 'quotes' && 'Mes devis'}
              {activeTab === 'calendar' && 'Calendrier des rendez-vous'}
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Cards pour infos principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {/* Plan actuel */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Plan actuel
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {subscription ? (
                              subscription.planId === 'forfait1' ? 'Essentiel' :
                              subscription.planId === 'forfait2' ? 'Confort' :
                              subscription.planId === 'forfait3' ? 'Premium' :
                              subscription.planId === 'forfait4' ? 'Excellence' : 'Inconnu'
                            ) : 'Aucun abonnement'}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  {subscription && (
                    <div className="px-4 pb-4 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Tâches restantes:</span>
                        <span className="font-medium">
                          {subscription.maxTasks - subscription.tasksUsedThisMonth} / {subscription.maxTasks}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Mètres carrés cotisés */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Mètres carrés cotisés
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {housing?.area || 0} m²
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Moyenne par pièce:</span>
                      <span className="font-medium">
                        {housing?.roomCount 
                          ? Math.round((housing.area || 0) / housing.roomCount) 
                          : 0} m²
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Délai d'attente */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Délai d'attente
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {subscription 
                              ? subscription.maxTasks > subscription.tasksUsedThisMonth 
                                ? "0 jours" 
                                : `${getDaysUntilNextService()} jours`
                              : "N/A"}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Renouvellement le:</span>
                      <span className="font-medium">
                        {subscription && subscription.lastResetDate 
                          ? new Date(new Date(subscription.lastResetDate).setMonth(
                              new Date(subscription.lastResetDate).getMonth() + 1
                            )).toLocaleDateString('fr-FR')
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Liste des services disponibles */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Services disponibles
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Les services auxquels vous avez accès avec votre abonnement actuel.
                  </p>
                </div>
                
                <div className="px-4 py-5 sm:p-0">
                  <div className="border-t border-gray-200">
                    <dl>
                      {availableServices.length === 0 ? (
                        <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Aucun service disponible</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            Veuillez souscrire à un abonnement pour accéder aux services.
                          </dd>
                        </div>
                      ) : (
                        availableServices.map((service) => (
                          <div key={service.id} className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">{service.name}</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex justify-between items-center">
                              <div>
                                <p>{service.description}</p>
                                {service.restrictions && (
                                  <p className="text-xs text-gray-500 mt-1">{service.restrictions}</p>
                                )}
                              </div>
                              <div>
                                {isServiceAvailable(service.id) ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                      <circle cx="4" cy="4" r="3" />
                                    </svg>
                                    Disponible
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                                      <circle cx="4" cy="4" r="3" />
                                    </svg>
                                    Non disponible
                                  </span>
                                )}
                              </div>
                            </dd>
                          </div>
                        ))
                      )}
                    </dl>
                  </div>
                </div>
              </div>
              
              {/* Bouton pour demander un service */}
              {subscription && subscription.status === 'active' && (
                <div className="text-center mb-6">
                  <Link
                    href="/services/request"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Demander un service
                  </Link>
                </div>
              )}
              
              {/* Bouton pour s'abonner si pas d'abonnement */}
              {(!subscription || subscription.status !== 'active') && (
                <div className="text-center mb-6">
                  <Link
                    href="/abonnements"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Découvrir nos abonnements
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Informations personnelles
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Vos informations de profil et de logement.
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                    <dd className="mt-1 text-sm text-gray-900">{session.user.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{session.user.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Type de logement</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {housing?.type === 'apartment' ? 'Appartement' : housing?.type === 'house' ? 'Maison' : 'Non spécifié'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Surface</dt>
                    <dd className="mt-1 text-sm text-gray-900">{housing?.area || 0} m²</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Nombre de pièces</dt>
                    <dd className="mt-1 text-sm text-gray-900">{housing?.roomCount || 0}</dd>
                  </div>
                  {housing?.hasGarden && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Surface du jardin</dt>
                      <dd className="mt-1 text-sm text-gray-900">{housing.gardenArea || 0} m²</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => router.push('/profile/edit')}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Modifier mon profil
                </button>
              </div>
            </div>
          )}

          {/* Professionals Tab */}
          {activeTab === 'professionals' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Annuaire des professionnels
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Découvrez les professionnels disponibles dans votre région.
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher un professionnel..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    {filteredProfessionals.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        {searchTerm ? 'Aucun résultat trouvé' : 'Aucun professionnel disponible'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredProfessionals.map((pro) => (
                          <div key={pro.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <div className="px-4 py-5 sm:px-6 bg-gray-50">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {pro.name}
                              </h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                {pro.specialties.map((specialty) => {
                                  const service = availableServices.find(s => s.id === specialty);
                                  return service ? service.name : specialty;
                                }).join(', ')}
                              </p>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                  <dt className="text-sm font-medium text-gray-500">Note</dt>
                                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                    {pro.rating}
                                    <span className="ml-1 text-yellow-400">
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </span>
                                  </dd>
                                </div>
                                <div className="sm:col-span-1">
                                  <dt className="text-sm font-medium text-gray-500">Distance</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{pro.distance} km</dd>
                                </div>
                                <div className="sm:col-span-2">
                                  <dt className="text-sm font-medium text-gray-500">Ville</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{pro.city}</dd>
                                </div>
                              </dl>
                            </div>
                            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
                              <Link
                                href={`/professionals/${pro.id}`}
                                className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Voir le profil
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Devis reçus
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Consultez les devis proposés par les professionnels.
                </p>
              </div>
              <div className="border-t border-gray-200">
                {quotes.length === 0 ? (
                  <div className="px-4 py-5 sm:px-6 text-center">
                    <p className="text-gray-500">Vous n'avez pas encore reçu de devis.</p>
                    <Link
                      href="/offres/publier"
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Publier une offre
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
                            Proposé par: <span className="font-medium">{quote.professionalName || 'Professionnel'}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Durée estimée: {quote.estimatedDuration || 'Non spécifiée'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">{quote.message || quote.description || 'Aucun détail supplémentaire'}</p>
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

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Calendrier des rendez-vous
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Vos rendez-vous programmés avec les professionnels.
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun rendez-vous</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Vous n'avez pas encore de rendez-vous programmés.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/services/request"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Demander un service
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}