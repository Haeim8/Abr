'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiFileText,
  FiAlertCircle,
  FiSettings,
  FiPieChart,
  FiCheckCircle,
  FiImage,
  FiPackage,
  FiMenu,
  FiLogOut,
  FiDownload,
  FiUpload,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [isEditingRates, setIsEditingRates] = useState(false);
  
  // Statistiques globales
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfessionals: 0,
    verifiedProfessionals: 0,
    pendingVerifications: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    recentProjects: 0,
    monthlyRevenue: 0,
    openDisputes: 0
  });
  
  // État pour les tarifs
  const [rates, setRates] = useState({
    hourly: {
      casual: 25.00,
      electrician: 45.00,
      plumber: 42.00,
      painter: 35.00,
      gardener: 28.00
    },
    sqm: {
      painting: 12.50,
      tiling: 35.00,
      lawn: 1.50,
      cleaning: 4.50
    },
    commission: {
      pro: 15.00,
      casual: 25.00
    }
  });
  
  // État pour les abonnements
  const [subscriptionPlans, setSubscriptionPlans] = useState([
    {
      id: '1',
      name: 'Essentiel',
      description: 'Forfait de base pour les petits travaux occasionnels',
      price: 19.99,
      activeSubscribers: 127,
      servicesCount: 4
    },
    {
      id: '2',
      name: 'Confort',
      description: "Idéal pour l'entretien régulier du domicile",
      price: 49.99,
      activeSubscribers: 89,
      servicesCount: 8
    },
    {
      id: '3',
      name: 'Premium',
      description: 'Entretien complet et rénovations légères',
      price: 79.99,
      activeSubscribers: 43,
      servicesCount: 12
    },
    {
      id: '4',
      name: 'Excellence',
      description: "Solution complète pour l'entretien et les rénovations",
      price: 129.99,
      activeSubscribers: 22,
      servicesCount: 'Illimité'
    }
  ]);
  
  // État pour les services par abonnement
  const [services, setServices] = useState([
    {
      id: '1',
      name: 'Ménage',
      description: 'Nettoyage intérieur (salon, chambre, cuisine)',
      essential: '1x / mois',
      comfort: '2x / mois',
      premium: '4x / mois',
      excellence: 'Illimité'
    },
    {
      id: '2',
      name: 'Jardinage',
      description: 'Tonte de pelouse et entretien basique',
      essential: 'Non inclus',
      comfort: '1x / mois',
      premium: '2x / mois',
      excellence: '4x / mois'
    },
    {
      id: '3',
      name: 'Plomberie',
      description: 'Réparations simples et dépannage',
      essential: '1x / trim.',
      comfort: '1x / mois',
      premium: '2x / mois',
      excellence: 'Illimité'
    },
    {
      id: '4',
      name: 'Électricité',
      description: 'Réparations et installations simples',
      essential: 'Non inclus',
      comfort: '1x / trim.',
      premium: '1x / mois',
      excellence: '2x / mois'
    }
  ]);
  
  // Données pour les transactions récentes (maquette)
  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: '12345',
      type: 'Abonnement',
      client: {
        name: 'John Doe',
        email: 'client@example.com'
      },
      amount: 49.99,
      date: '01/03/2025',
      status: 'Réussi'
    },
    {
      id: '12344',
      type: 'Service',
      client: {
        name: 'Jane Smith',
        email: 'jane@example.com'
      },
      amount: 75.00,
      date: '28/02/2025',
      status: 'Réussi'
    },
    {
      id: '12343',
      type: 'Paiement pro',
      client: {
        name: 'Robert Johnson',
        email: 'robert@example.com'
      },
      amount: -128.50,
      date: '27/02/2025',
      status: 'En attente'
    }
  ]);
  
  // Rediriger si non connecté ou pas un admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/dashboard/client');
    }
  }, [status, session, router]);

  // Charger les données du tableau de bord
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status !== 'authenticated' || !session.user.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données du tableau de bord');
        }
        
        const data = await response.json();
        setStats(data);
        
        // Charger également les tarifs et abonnements
        const ratesResponse = await fetch('/api/admin/rates');
        if (ratesResponse.ok) {
          const ratesData = await ratesResponse.json();
          // Traiter et organiser les données de tarifs
          const organizedRates = {
            hourly: {},
            sqm: {},
            commission: {}
          };
          
          ratesData.forEach(rate => {
            if (rate.type === 'hourly') {
              organizedRates.hourly[rate.category] = rate.amount;
            } else if (rate.type === 'sqm') {
              organizedRates.sqm[rate.category] = rate.amount;
            } else if (rate.type === 'percentage') {
              organizedRates.commission[rate.category] = rate.amount;
            }
          });
          
          setRates(organizedRates);
        }
        
        // Charger les abonnements
        const subscriptionsResponse = await fetch('/api/admin/subscriptions');
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          setSubscriptionPlans(subscriptionsData);
        }
        
        // Charger les services
        const servicesResponse = await fetch('/api/admin/services');
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData);
        }
        
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [session, status]);
  
  // Gérer la mise à jour des tarifs
  const handleRateChange = (category, type, value) => {
    const newRates = { ...rates };
    newRates[type][category] = parseFloat(value) || 0;
    setRates(newRates);
  };
  
  // Sauvegarder les modifications de tarifs
 // Sauvegarder les modifications de tarifs
 const handleSaveRates = async () => {
    // Vérification des permissions
    if (!session.user.permissions?.rates?.edit && !session.user.isSuperAdmin) {
      alert("Vous n'avez pas les permissions nécessaires pour modifier les tarifs.");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Transformer les tarifs en format d'API
      const ratesForApi = [];
      
      // Tarifs horaires
      Object.entries(rates.hourly).forEach(([category, amount]) => {
        ratesForApi.push({
          category,
          type: 'hourly',
          amount
        });
      });
      
      // Tarifs au m²
      Object.entries(rates.sqm).forEach(([category, amount]) => {
        ratesForApi.push({
          category,
          type: 'sqm',
          amount
        });
      });
      
      // Commissions
      Object.entries(rates.commission).forEach(([category, amount]) => {
        ratesForApi.push({
          category,
          type: 'percentage',
          amount
        });
      });
      
      const response = await fetch('/api/admin/rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratesForApi),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des tarifs');
      }
      
      setIsEditingRates(false);
      alert('Les tarifs ont été mis à jour avec succès!');
      
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue lors de la mise à jour des tarifs');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestionnaire pour éditer un abonnement
  // Gestionnaire pour éditer un abonnement
  const handleEditPlan = (plan) => {
    // Vérification des permissions
    if (!session.user.permissions?.subscriptions?.edit && !session.user.isSuperAdmin) {
      alert("Vous n'avez pas les permissions nécessaires pour modifier les abonnements.");
      return;
    }
    
    setEditingPlan({...plan});
  };
  
  // Gestionnaire pour éditer un service
  // Gestionnaire pour éditer un service
const handleEditService = (service) => {
    // Vérification des permissions
    if (!session.user.permissions?.subscriptions?.edit && !session.user.isSuperAdmin) {
      alert("Vous n'avez pas les permissions nécessaires pour modifier les services.");
      return;
    }
    
    setEditingService({...service});
  };
  
  // Gérer l'exportation des données comptables
  const handleExportFinancialData = () => {
    alert('Fonctionnalité d\'exportation des données comptables à implémenter');
  };
  
  // Gestionnaire pour la section des finances
  const handleGenerateInvoice = () => {
    alert('Fonctionnalité de génération de facture à implémenter');
  };
  
  const handleVerifyProfessional = async (id, status) => {
    // Vérification des permissions
    if (!session.user.permissions?.professionals?.verify && !session.user.isSuperAdmin) {
      alert("Vous n'avez pas les permissions nécessaires pour vérifier les professionnels.");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/professionals/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified: status }),
      });
  
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du professionnel');
      }
      
      // Recharger les données
      const updatedStats = await fetch('/api/admin/dashboard').then(res => res.json());
      setStats(updatedStats);
      
      alert(`Professionnel ${id} ${status ? 'vérifié' : 'refusé'} avec succès`);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue lors de la vérification du professionnel');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement du tableau de bord administrateur...</p>
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
      <div className={`bg-indigo-900 text-white ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-50`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-800">
          <h2 className={`text-xl font-bold ${sidebarOpen ? 'block' : 'hidden'}`}>Khaja Admin</h2>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-md hover:bg-indigo-800 focus:outline-none"
          >
            <FiMenu className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-2">
            <button
              onClick={() => setActiveSection('overview')}
              className={`${
                activeSection === 'overview' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiHome className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Aperçu</span>
            </button>
            
            <button
              onClick={() => setActiveSection('users')}
              className={`${
                activeSection === 'users' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiUsers className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Utilisateurs</span>
            </button>
            
            <button
              onClick={() => setActiveSection('professionals')}
              className={`${
                activeSection === 'professionals' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiCheckCircle className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Professionnels</span>
            </button>
            
            <button
              onClick={() => setActiveSection('finances')}
              className={`${
                activeSection === 'finances' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiDollarSign className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Finances</span>
            </button>
            
            <button
              onClick={() => setActiveSection('invoices')}
              className={`${
                activeSection === 'invoices' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiFileText className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Factures</span>
            </button>
            
            <button
              onClick={() => setActiveSection('projects')}
              className={`${
                activeSection === 'projects' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiImage className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Projets</span>
            </button>
            
            <button
              onClick={() => setActiveSection('disputes')}
              className={`${
                activeSection === 'disputes' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiAlertCircle className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Litiges</span>
            </button>
            
            <button
              onClick={() => setActiveSection('subscriptions')}
              className={`${
                activeSection === 'subscriptions' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiPackage className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Abonnements</span>
            </button>
            
            <button
              onClick={() => setActiveSection('analytics')}
              className={`${
                activeSection === 'analytics' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiPieChart className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Analytique</span>
            </button>
            
            <button
              onClick={() => setActiveSection('settings')}
              className={`${
                activeSection === 'settings' 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiSettings className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Paramètres</span>
            </button>
          </div>
          
          <div className="pt-6 mt-6 border-t border-indigo-800">
            <button
              onClick={() => router.push('/auth/signout')}
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-indigo-100 hover:bg-indigo-800 w-full"
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
            <h1 className="text-2xl font-semibold text-gray-900">
              {activeSection === 'overview' && 'Tableau de bord administrateur'}
              {activeSection === 'users' && 'Gestion des utilisateurs'}
              {activeSection === 'professionals' && 'Gestion des professionnels'}
              {activeSection === 'finances' && 'Gestion financière'}
              {activeSection === 'invoices' && 'Gestion des factures'}
              {activeSection === 'projects' && 'Gestion des projets'}
              {activeSection === 'disputes' && 'Gestion des litiges'}
              {activeSection === 'subscriptions' && 'Gestion des abonnements'}
              {activeSection === 'analytics' && 'Analytique'}
              {activeSection === 'settings' && 'Paramètres'}
            </h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Aperçu global */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Cartes de statistiques */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <FiUsers className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Utilisateurs totaux
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.totalUsers}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-900">
                        Voir tous les utilisateurs
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <FiCheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Pros vérifiés / Total
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.verifiedProfessionals} / {stats.totalProfessionals}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/admin/professionals" className="font-medium text-indigo-600 hover:text-indigo-900">
                        Gérer les professionnels
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <FiAlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Vérifications en attente
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.pendingVerifications}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/admin/professionals/pending" className="font-medium text-indigo-600 hover:text-indigo-900">
                        Vérifier les professionnels
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <FiPackage className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Abonnements actifs
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.activeSubscriptions}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/admin/subscriptions" className="font-medium text-indigo-600 hover:text-indigo-900">
                        Gérer les abonnements
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <FiDollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Revenu mensuel
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.monthlyRevenue} €
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/admin/finances" className="font-medium text-indigo-600 hover:text-indigo-900">
                        Voir les finances
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                        <FiAlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Litiges ouverts
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.openDisputes}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/admin/disputes" className="font-medium text-indigo-600 hover:text-indigo-900">
                        Gérer les litiges
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Graphique de l'activité récente */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">Activité récente</h3>
                <div className="mt-4 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Graphique d'activité à implémenter</p>
                </div>
              </div>
              
              {/* Dernières transactions */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Dernières transactions</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              #{transaction.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.client.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transaction.client.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.amount.toFixed(2)} €
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                transaction.status === 'Réussi' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/admin/transactions/${transaction.id}`} className="text-indigo-600 hover:text-indigo-900">
                                Détails
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6">
                  <Link
                    href="/admin/finances"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Voir toutes les transactions
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Gestion des abonnements et tarifs */}
          {activeSection === 'subscriptions' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Gestion des abonnements</h3>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    Ajouter un forfait
                  </button>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nom
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prix mensuel
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Abonnés actifs
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Services inclus
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subscriptionPlans.map((plan) => (
                          <tr key={plan.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">{plan.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{plan.price.toFixed(2)} €</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{plan.activeSubscribers}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{plan.servicesCount}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => handleEditPlan(plan)} 
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Éditer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* Gestion des tarifs professionnels */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Tarifs professionnels</h3>
                  {(session.user.permissions?.rates?.edit || session.user.isSuperAdmin) && (
                    <button 
                       onClick={() => setIsEditingRates(!isEditingRates)} 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                         >
                        {isEditingRates ? 'Annuler' : 'Modifier les tarifs'}
                   </button>
                 )}
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">Taux horaires par catégorie</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Travailleurs occasionnels</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="casual_rate"
                              id="casual_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.hourly.casual}
                              onChange={(e) => handleRateChange('casual', 'hourly', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/h</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Électriciens</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="electrician_rate"
                              id="electrician_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.hourly.electrician}
                              onChange={(e) => handleRateChange('electrician', 'hourly', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/h</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Plombiers</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="plumber_rate"
                              id="plumber_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.hourly.plumber}
                              onChange={(e) => handleRateChange('plumber', 'hourly', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/h</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Peintres</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="painter_rate"
                              id="painter_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.hourly.painter}
                              onChange={(e) => handleRateChange('painter', 'hourly', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/h</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Jardiniers</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="gardener_rate"
                              id="gardener_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.hourly.gardener}
                              onChange={(e) => handleRateChange('gardener', 'hourly', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">Tarifs au m² par catégorie</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Peinture murale</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="painting_rate"
                              id="painting_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.sqm.painting}
                              onChange={(e) => handleRateChange('painting', 'sqm', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/m²</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Pose de carrelage</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="tiling_rate"
                              id="tiling_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.sqm.tiling}
                              onChange={(e) => handleRateChange('tiling', 'sqm', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/m²</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Tonte de pelouse</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="lawn_rate"
                              id="lawn_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.sqm.lawn}
                              onChange={(e) => handleRateChange('lawn', 'sqm', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/m²</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">Nettoyage intérieur</label>
                          <div className="flex mt-1 relative rounded-md shadow-sm">
                            <input
                              type="number"
                              name="cleaning_rate"
                              id="cleaning_rate"
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={rates.sqm.cleaning}
                              onChange={(e) => handleRateChange('cleaning', 'sqm', e.target.value)}
                              disabled={!isEditingRates}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€/m²</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Options de commission</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Commission sur revenus des professionnels
                        </label>
                        <div className="flex mt-1 relative rounded-md shadow-sm">
                          <input
                            type="number"
                            name="pro_commission"
                            id="pro_commission"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0.00"
                            value={rates.commission.pro}
                            onChange={(e) => handleRateChange('pro', 'commission', e.target.value)}
                            disabled={!isEditingRates}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Commission sur travailleurs occasionnels
                        </label>
                        <div className="flex mt-1 relative rounded-md shadow-sm">
                          <input
                            type="number"
                            name="casual_commission"
                            id="casual_commission"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0.00"
                            value={rates.commission.casual}
                            onChange={(e) => handleRateChange('casual', 'commission', e.target.value)}
                            disabled={!isEditingRates}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEditingRates && (
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveRates}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Enregistrer les modifications
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Gestion des services par abonnement */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Services inclus par abonnement</h3>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    Ajouter un service
                  </button>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Essentiel
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Confort
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Premium
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Excellence
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {services.map((service) => (
                          <tr key={service.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{service.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">{service.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{service.essential}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{service.comfort}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{service.premium}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{service.excellence}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => handleEditService(service)} 
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Éditer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Gestion des utilisateurs */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Gestion des utilisateurs</h3>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md"
                    />
                    <select className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md">
                      <option value="all">Tous les utilisateurs</option>
                      <option value="client">Clients</option>
                      <option value="professional">Professionnels</option>
                      <option value="admin">Administrateurs</option>
                    </select>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                      Ajouter
                    </button>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nom
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rôle
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date d'inscription
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Exemple de données utilisateurs */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  John Doe
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">john@example.com</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">Client</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Actif
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            01/01/2025
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              Éditer
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Suspendre
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  Jane Smith
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">jane@example.com</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">Professional</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Actif
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            15/01/2025
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              Éditer
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Suspendre
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Précédent
                    </a>
                    <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Suivant
                    </a>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">1</span> à <span className="font-medium">10</span> sur <span className="font-medium">100</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          <span className="sr-only">Précédent</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </a>
                        <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          1
                        </a>
                        <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          2
                        </a>
                        <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          3
                        </a>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          10
                        </a>
                        <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          <span className="sr-only">Suivant</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Gestion des professionnels */}
          {activeSection === 'professionals' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Professionnels à vérifier</h3>
                  <div className="flex space-x-3">
                    <select className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md">
                      <option value="pending">En attente de vérification</option>
                      <option value="verified">Vérifiés</option>
                      <option value="rejected">Refusés</option>
                      <option value="all">Tous</option>
                    </select>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Professionnel
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Documents
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date de demande
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Exemple de données professionnels */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  Marc Dubois
                                </div>
                                <div className="text-sm text-gray-500">
                                  marc@example.com
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Société</div>
                            <div className="text-sm text-gray-500">Dubois Plomberie</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                ID
                              </button>
                              <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                KBIS
                              </button>
                              <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                RIB
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            15/02/2025
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              En attente
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  {(session.user.permissions?.professionals?.verify || session.user.isSuperAdmin) && (
    <>
      <button 
        onClick={() => handleVerifyProfessional('1', true)} 
        className="text-green-600 hover:text-green-900 mr-3"
      >
        Approuver
      </button>
      <button 
        onClick={() => handleVerifyProfessional('1', false)} 
        className="text-red-600 hover:text-red-900"
      >
        Refuser
      </button>
    </>
  )}
</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  Sophie Martin
                                </div>
                                <div className="text-sm text-gray-500">
                                  sophie@example.com
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Travailleur occasionnel</div>
                            <div className="text-sm text-gray-500">Jardinage, Ménage</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                ID
                              </button>
                              <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                RIB
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            20/02/2025
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              En attente
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  {(session.user.permissions?.professionals?.verify || session.user.isSuperAdmin) && (
    <>
      <button 
        onClick={() => handleVerifyProfessional('2', true)} 
        className="text-green-600 hover:text-green-900 mr-3"
      >
        Approuver
      </button>
      <button 
        onClick={() => handleVerifyProfessional('2', false)} 
        className="text-red-600 hover:text-red-900"
      >
        Refuser
      </button>
    </>
  )}
</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Liste des professionnels vérifiés */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Professionnels vérifiés</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Professionnel
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Services
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Projets complétés
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Note
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Exemple de données professionnels vérifiés */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  Jean Dupont
                                </div>
                                <div className="text-sm text-gray-500">
                                  jean@example.com
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Société</div>
                            <div className="text-sm text-gray-500">Dupont Électricité</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">Électricité, Installation</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            24
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="text-yellow-500">★★★★</span><span className="text-gray-300">★</span>
                              <span className="ml-1">4.2</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              Voir profil
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Suspendre
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Section Finances */}
          {activeSection === 'finances' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Aperçu financier</h3>
                  <div>
                    <button 
                      onClick={handleExportFinancialData}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 mr-3"
                    >
                      <FiDownload className="mr-2 h-4 w-4" />
                      Exporter
                    </button>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-base font-medium text-gray-900 mb-2">Revenu mensuel</h4>
                      <p className="text-2xl font-bold text-indigo-600">{stats.monthlyRevenue} €</p>
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="text-green-500">+12.5%</span> vs mois précédent
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-base font-medium text-gray-900 mb-2">Paiements en attente</h4>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</p>
                      <div className="mt-1 text-sm text-gray-500">
                        Valeur totale: 4,580.50 €
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-base font-medium text-gray-900 mb-2">Commissions perçues</h4>
                      <p className="text-2xl font-bold text-green-600">2,345.75 €</p>
                      <div className="mt-1 text-sm text-gray-500">
                        15-25% sur les transactions
                      </div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Transactions récentes</h4>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client / Pro
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              #{transaction.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.client.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transaction.client.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.amount.toFixed(2)} €
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                transaction.status === 'Réussi' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/admin/transactions/${transaction.id}`} className="text-indigo-600 hover:text-indigo-900">
                                Détails
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Section Factures */}
          {activeSection === 'invoices' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Gestion des factures</h3>
                  <div>
                    <button 
                      onClick={handleGenerateInvoice}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <FiFileText className="mr-2 h-4 w-4" />
                      Générer une facture
                    </button>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="mb-4 flex items-center space-x-4">
                    <div>
                      <label htmlFor="invoice-month" className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                      <select
                        id="invoice-month"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="all">Tous</option>
                        <option value="3">Mars 2025</option>
                        <option value="2">Février 2025</option>
                        <option value="1">Janvier 2025</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="invoice-status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                      <select
                        id="invoice-status"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="all">Tous</option>
                        <option value="paid">Payée</option>
                        <option value="pending">En attente</option>
                        <option value="canceled">Annulée</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="invoice-search" className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                      <input
                        type="text"
                        id="invoice-search"
                        placeholder="N° facture, client..."
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            N° Facture
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant HT
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            TVA
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Montant TTC
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            FACT-2025-001
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Martin Dubois
                            </div>
                            <div className="text-sm text-gray-500">
                              martin@example.com
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            01/03/2025
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            83,33 €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            20% (16,67 €)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            100,00 €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Payée
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              <FiDownload className="h-5 w-5" />
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <FiEdit className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            FACT-2025-002
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Sophie Renard
                            </div>
                            <div className="text-sm text-gray-500">
                              sophie@example.com
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            28/02/2025
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            41,67 €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            20% (8,33 €)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            50,00 €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              En attente
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                              <FiDownload className="h-5 w-5" />
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <FiEdit className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Précédent
                    </a>
                    <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Suivant
                    </a>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">1</span> à <span className="font-medium">2</span> sur <span className="font-medium">20</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          <span className="sr-only">Précédent</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </a>
                        <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          1
                        </a>
                        <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          2
                        </a>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          <span className="sr-only">Suivant</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Section Projets */}
          {activeSection === 'projects' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Projets récents</h3>
                  <div className="flex space-x-3">
                    <select className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md">
                      <option value="all">Tous les projets</option>
                      <option value="completed">Terminés</option>
                      <option value="in_progress">En cours</option>
                      <option value="pending">En attente</option>
                    </select>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                      <FiUpload className="mr-2 h-4 w-4" />
                      Exporter
                    </button>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Carte de projet 1 */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="h-40 bg-gray-200 flex items-center justify-center">
                        <p className="text-gray-500">Photo du projet</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-medium text-gray-900">Rénovation salle de bain</h4>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Terminé
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Client: Jean Martin</p>
                        <p className="text-sm text-gray-500">Pro: Plomberie Express</p>
                        <p className="text-sm text-gray-500">Date: 15/02/2025</p>
                        <div className="mt-3 flex justify-end">
                          <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                            Voir les détails
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Carte de projet 2 */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="h-40 bg-gray-200 flex items-center justify-center">
                        <p className="text-gray-500">Photo du projet</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-medium text-gray-900">Peinture salon</h4>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            En cours
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Client: Marie Durand</p>
                        <p className="text-sm text-gray-500">Pro: Artistik Peinture</p>
                        <p className="text-sm text-gray-500">Date: 01/03/2025</p>
                        <div className="mt-3 flex justify-end">
                          <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                            Voir les détails
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Carte de projet 3 */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="h-40 bg-gray-200 flex items-center justify-center">
                        <p className="text-gray-500">Photo du projet</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-medium text-gray-900">Installation électrique</h4>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Planifié
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Client: Pierre Lemoine</p>
                        <p className="text-sm text-gray-500">Pro: Électricité Plus</p>
                        <p className="text-sm text-gray-500">Date: 10/03/2025</p>
                        <div className="mt-3 flex justify-end">
                          <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                            Voir les détails
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
                  <button className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                    Voir tous les projets
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Section Litiges */}
          {activeSection === 'disputes' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Litiges actifs</h3>
                  <div className="flex space-x-3">
                    <select className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md">
                      <option value="all">Tous les litiges</option>
                      <option value="new">Nouveaux</option>
                      <option value="in_progress">En traitement</option>
                      <option value="resolved">Résolus</option>
                    </select>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Projet
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Professionnel
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Motif
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            #L12345
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Installation électrique
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Thomas Bernard</div>
                            <div className="text-sm text-gray-500">thomas@example.com</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Électricité Pro</div>
                            <div className="text-sm text-gray-500">contact@electpro.com</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            01/03/2025
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Travaux non conformes
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Nouveau
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              Traiter
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            #L12343
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Plomberie salle de bain
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Amélie Leroy</div>
                            <div className="text-sm text-gray-500">amelie@example.com</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Plomberie Express</div>
                            <div className="text-sm text-gray-500">contact@plombexpress.com</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            28/02/2025
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Retard significatif
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              En traitement
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              Continuer
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Statistiques des litiges */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques des litiges</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-base font-medium text-gray-900 mb-2">Litiges actifs</h4>
                    <p className="text-2xl font-bold text-red-600">8</p>
                    <div className="mt-1 text-sm text-gray-500">
                      <span className="text-red-500">+2</span> vs mois précédent
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-base font-medium text-gray-900 mb-2">Résolution moyenne</h4>
                    <p className="text-2xl font-bold text-indigo-600">5.2 jours</p>
                    <div className="mt-1 text-sm text-gray-500">
                      <span className="text-green-500">-0.8j</span> vs mois précédent
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-base font-medium text-gray-900 mb-2">Taux de satisfaction</h4>
                    <p className="text-2xl font-bold text-green-600">78%</p>
                    <div className="mt-1 text-sm text-gray-500">
                      <span className="text-green-500">+3%</span> vs mois précédent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Section Analytics */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Performance globale</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-base font-medium text-gray-900 mb-2">Chiffre d'affaires total</h4>
                      <p className="text-2xl font-bold text-indigo-600">54,780 €</p>
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="text-green-500">+12.8%</span> vs mois précédent
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-base font-medium text-gray-900 mb-2">Nouveaux clients</h4>
                      <p className="text-2xl font-bold text-indigo-600">128</p>
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="text-green-500">+8.5%</span> vs mois précédent
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-base font-medium text-gray-900 mb-2">Projets complétés</h4>
                      <p className="text-2xl font-bold text-indigo-600">245</p>
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="text-green-500">+15.2%</span> vs mois précédent
                      </div>
                    </div>
                  </div>
                  
                  {/* Graphiques */}
                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <h4 className="text-base font-medium text-gray-900 mb-4">Revenus mensuels</h4>
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Graphique de revenus à implémenter</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <h4 className="text-base font-medium text-gray-900 mb-4">Répartition des services</h4>
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Graphique en camembert à implémenter</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <h4 className="text-base font-medium text-gray-900 mb-4">Activité par région</h4>
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Carte de chaleur à implémenter</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <h4 className="text-base font-medium text-gray-900 mb-4">Satisfaction clients</h4>
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Graphique d'évolution à implémenter</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Rapports analytiques */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Rapports disponibles</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FiUsers className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-base font-medium text-gray-900">Utilisateurs actifs</h4>
                          <p className="text-sm text-gray-500">Analyse de l'engagement utilisateur</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                          Générer <FiDownload className="inline-block ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <FiDollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-base font-medium text-gray-900">Performance financière</h4>
                          <p className="text-sm text-gray-500">Analyse des revenus et marges</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                          Générer <FiDownload className="inline-block ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FiPackage className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-base font-medium text-gray-900">Abonnements</h4>
                          <p className="text-sm text-gray-500">Analyse des forfaits et rétention</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                          Générer <FiDownload className="inline-block ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <FiAlertCircle className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-base font-medium text-gray-900">Analyse des litiges</h4>
                          <p className="text-sm text-gray-500">Causes et résolutions des problèmes</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                          Générer <FiDownload className="inline-block ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <FiCheckCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-base font-medium text-gray-900">Professionnels</h4>
                          <p className="text-sm text-gray-500">Performance et satisfaction</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                          Générer <FiDownload className="inline-block ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Section Paramètres */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Paramètres généraux</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">Informations de l'entreprise</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom de l'entreprise
                          </label>
                          <input
                            type="text"
                            name="company_name"
                            id="company_name"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="Khaja Services"
                          />
                        </div>
                        <div>
                          <label htmlFor="company_email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email de contact
                          </label>
                          <input
                            type="email"
                            name="company_email"
                            id="company_email"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="contact@khaja.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Téléphone
                          </label>
                          <input
                            type="text"
                            name="company_phone"
                            id="company_phone"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="+33 1 23 45 67 89"
                          />
                        </div>
                        <div>
                          <label htmlFor="company_address" className="block text-sm font-medium text-gray-700 mb-1">
                            Adresse
                          </label>
                          <input
                            type="text"
                            name="company_address"
                            id="company_address"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="123 Avenue des Services, 75001 Paris"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-5 border-t border-gray-200">
                      <h4 className="text-base font-medium text-gray-900 mb-4">Paramètres de notification</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Notifications de nouveaux utilisateurs</h5>
                            <p className="text-sm text-gray-500">Recevoir un email pour chaque nouvel utilisateur inscrit</p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              defaultChecked
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Notifications de litiges</h5>
                            <p className="text-sm text-gray-500">Recevoir un email pour chaque nouveau litige</p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              defaultChecked
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Rapport hebdomadaire</h5>
                            <p className="text-sm text-gray-500">Recevoir un rapport hebdomadaire par email</p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-5 border-t border-gray-200">
                      <h4 className="text-base font-medium text-gray-900 mb-4">Paramètres de paiement</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="vat_rate" className="block text-sm font-medium text-gray-700 mb-1">
                            Taux de TVA (%)
                          </label>
                          <input
                            type="number"
                            name="vat_rate"
                            id="vat_rate"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="20"
                          />
                        </div>
                        <div>
                          <label htmlFor="payment_delay" className="block text-sm font-medium text-gray-700 mb-1">
                            Délai de paiement (jours)
                          </label>
                          <input
                            type="number"
                            name="payment_delay"
                            id="payment_delay"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>
              </div>
              
            {session.user.isSuperAdmin && (
  <div className="bg-white shadow sm:rounded-lg">
    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Gestion des administrateurs</h3>
    </div>
    <div className="px-4 py-5 sm:p-6">
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Ajouter un administrateur
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière connexion
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      Admin Principal
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">admin@khaja.com</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">Super Admin</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Actif
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Maintenant
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                  Éditer
                </button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      Admin Support
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">support@khaja.com</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">Support Admin</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Actif
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                02/03/2025 10:30
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                  Éditer
                </button>
                <button className="text-red-600 hover:text-red-900">
                  Désactiver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}