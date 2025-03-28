'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMenu, FiHome, FiUser, FiSettings, FiFileText, FiHelpCircle, FiLogOut, FiCalendar, FiClock } from 'react-icons/fi';

export default function ProfessionalDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [quotes, setQuotes] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [squareMeterRates, setSquareMeterRates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [availability, setAvailability] = useState([
    { day: 'Lundi', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Mardi', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Mercredi', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Jeudi', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Vendredi', isAvailable: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Samedi', isAvailable: false, startTime: '09:00', endTime: '13:00' },
    { day: 'Dimanche', isAvailable: false, startTime: '09:00', endTime: '13:00' },
  ]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [statistics, setStatistics] = useState({
    completedJobs: 0,
    pendingJobs: 0,
    averageRating: 0,
    totalEarnings: 0,
    thisMonth: 0
  });
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    skills: [],
    bio: '',
    companyName: '',
    website: '',
    siret: '',
    profileImage: ''
  });

  // Types de travaux disponibles
  const workTypes = [
    { id: 'painting', name: 'Peinture' },
    { id: 'plumbing', name: 'Plomberie' },
    { id: 'electricity', name: 'Électricité' },
    { id: 'carpentry', name: 'Menuiserie' },
    { id: 'gardening', name: 'Jardinage' },
    { id: 'cleaning', name: 'Nettoyage' },
    { id: 'locksmith', name: 'Serrurerie' },
    { id: 'tiling', name: 'Carrelage' }
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
        // Charger le profil professionnel avec les tarifs
        const profileResponse = await fetch(`/api/professionals/${session.user.id}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setHourlyRate(profileData.hourlyRate || 0);
          setSquareMeterRates(profileData.squareMeterRates || {});
          setAvailability(profileData.availability || availability);
          setIsAvailable(profileData.available || true);
          setProfileData(profileData);
        }
        
        // Charger les statistiques
        const statsResponse = await fetch(`/api/professionals/${session.user.id}/statistics`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData);
        }
        
        // Charger les devis proposés
        const quotesResponse = await fetch(`/api/quotes?professionalId=${session.user.id}`);
        if (quotesResponse.ok) {
          const quotesData = await quotesResponse.json();
          setQuotes(quotesData.quotes || []);
        }
        
        // Charger les jobs disponibles
        const jobsResponse = await fetch('/api/jobs/available');
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setAvailableJobs(jobsData.jobs || []);
        }
        
        // Charger les projets en cours
        const projectsResponse = await fetch(`/api/projects?professionalId=${session.user.id}`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error('Erreur lors du chargement des données du professionnel:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfessionalData();
  }, [session, status, availability]);

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
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour des tarifs:', err);
      alert('Une erreur est survenue lors de la mise à jour des tarifs');
    }
  };

  // Mettre à jour la disponibilité
  const handleToggleAvailability = async () => {
    try {
      const response = await fetch(`/api/professionals/${session.user.id}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          available: !isAvailable,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la disponibilité');
      }
      
      setIsAvailable(!isAvailable);
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la disponibilité:', err);
      alert('Une erreur est survenue lors de la mise à jour de la disponibilité');
    }
  };

  // Mettre à jour les tarifs au m²
  const handleSquareMeterRateChange = (workType, value) => {
    setSquareMeterRates(prev => ({
      ...prev,
      [workType]: parseFloat(value) || 0,
    }));
  };

  // Mettre à jour les disponibilités hebdomadaires
  const handleAvailabilityChange = (day, field, value) => {
    setAvailability(prev => {
      const newAvailability = [...prev];
      const dayIndex = newAvailability.findIndex(d => d.day === day);
      
      if (dayIndex === -1) {
        // Si le jour n'existe pas, l'ajouter
        newAvailability.push({
          day,
          isAvailable: field === 'isAvailable' ? value : false,
          startTime: field === 'startTime' ? value : '09:00',
          endTime: field === 'endTime' ? value : '18:00'
        });
      } else {
        // Sinon, mettre à jour le jour existant
        newAvailability[dayIndex] = {
          ...newAvailability[dayIndex],
          [field]: value
        };
      }
      
      return newAvailability;
    });
  };

  // Sauvegarder les disponibilités
  const handleSaveAvailability = async () => {
    try {
      const response = await fetch(`/api/professionals/${session.user.id}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour des disponibilités');
      }
      
      alert('Vos disponibilités ont été mises à jour avec succès.');
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour des disponibilités:', err);
      alert('Une erreur est survenue lors de la mise à jour des disponibilités');
    }
  };

  // Accepter un job disponible
  const handleAcceptJob = async (jobId) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'acceptation du job');
      }
      
      // Mettre à jour la liste des jobs disponibles
      setAvailableJobs(availableJobs.filter(job => job.id !== jobId));
      
      // Recharger les projets en cours
      const projectsResponse = await fetch(`/api/projects?professionalId=${session.user.id}`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }
      
    } catch (err) {
      console.error('Erreur lors de l\'acceptation du job:', err);
      alert('Une erreur est survenue lors de l\'acceptation du job');
    }
  };

  // Marquer un projet comme terminé
  const handleCompleteProject = async (projectId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la complétion du projet');
      }
      
      // Mettre à jour la liste des projets
      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, status: 'completed' } 
          : project
      ));
      
    } catch (err) {
      console.error('Erreur lors de la complétion du projet:', err);
      alert('Une erreur est survenue lors de la complétion du projet');
    }
  };

  // Mettre à jour le profil
  const handleUpdateProfile = async (updatedProfile) => {
    try {
      const response = await fetch(`/api/professionals/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du profil');
      }
      
      setProfileData(prev => ({ ...prev, ...updatedProfile }));
      alert('Profil mis à jour avec succès');
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      alert('Une erreur est survenue lors de la mise à jour du profil');
    }
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-indigo-800 text-white ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-30`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-700">
          <h2 className={`text-xl font-bold ${sidebarOpen ? 'block' : 'hidden'}`}>Khaja Pro</h2>
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
              onClick={() => setActiveTab('projects')}
              className={`${
                activeTab === 'projects' 
                  ? 'bg-indigo-900 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-700'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiFileText className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Mes projets</span>
            </button>
            
            <button
              onClick={() => setActiveTab('jobs')}
              className={`${
                activeTab === 'jobs' 
                  ? 'bg-indigo-900 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-700'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiClock className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Jobs disponibles</span>
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
              <span className={sidebarOpen ? 'block' : 'hidden'}>Agenda</span>
            </button>
            
            <button
              onClick={() => setActiveTab('rates')}
              className={`${
                activeTab === 'rates' 
                  ? 'bg-indigo-900 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-700'
              } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
            >
              <FiSettings className={`mr-3 h-6 w-6 ${sidebarOpen ? '' : 'mx-auto'}`} />
              <span className={sidebarOpen ? 'block' : 'hidden'}>Tarifs</span>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {activeTab === 'dashboard' && 'Tableau de bord Pro'}
              {activeTab === 'projects' && 'Mes projets'}
              {activeTab === 'jobs' && 'Jobs disponibles'}
              {activeTab === 'calendar' && 'Agenda'}
              {activeTab === 'rates' && 'Mes tarifs'}
              {activeTab === 'profile' && 'Mon profil'}
            </h1>
            
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isAvailable ? 'Disponible' : 'Indisponible'}
              </span>
              <button
                onClick={handleToggleAvailability}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isAvailable ? 'Me rendre indisponible' : 'Me rendre disponible'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Completed Jobs */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Jobs complétés
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statistics.completedJobs}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Pending Jobs */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          En attente
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statistics.pendingJobs}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Note moyenne
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statistics.averageRating.toFixed(1)}/5
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Earnings */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Ce mois-ci
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statistics.thisMonth.toFixed(0)}€
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Projects */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Projets récents
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Vos projets en cours et récemment complétés.
                  </p>
                </div>
                <div className="overflow-hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projet
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            Aucun projet récent à afficher
                          </td>
                        </tr>
                      ) : (
                        projects.slice(0, 5).map((project) => (
                          <tr key={project.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-indigo-600">
                                <Link href={`/projects/${project.id}`}>
                                  {project.title}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-500">{project.serviceType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{project.clientName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {project.status === 'pending' ? 'En attente' :
                                 project.status === 'in_progress' ? 'En cours' :
                                 project.status === 'completed' ? 'Terminé' : project.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.price ? `${project.price}€` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {project.status === 'in_progress' && (
                                <button
                                  onClick={() => handleCompleteProject(project.id)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Marquer comme terminé
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {projects.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab('projects')}
                      className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Voir tous les projets
                    </button>
                  </div>
                )}
              </div>
              
              {/* Recent Available Jobs */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Jobs disponibles
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Opportunités de travail à proximité correspondant à vos compétences.
                  </p>
                </div>
                <div className="overflow-hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Adresse
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant estimé
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availableJobs.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            Aucun job disponible pour le moment
                          </td>
                        </tr>
                      ) : (
                        availableJobs.slice(0, 3).map((job) => (
                          <tr key={job.id}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">{job.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{job.serviceType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{job.address}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{new Date(job.scheduledDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {job.estimatedPrice ? `${job.estimatedPrice}€` : 'Sur devis'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleAcceptJob(job.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Accepter
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {availableJobs.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab('jobs')}
                      className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Voir tous les jobs disponibles
                    </button>
                  </div>
                )}
              </div>
              
              {/* Recent Quotes */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Devis récents
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Vos devis en attente de réponse client.
                  </p>
                </div>
                <div className="overflow-hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Devis
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quotes.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                            Aucun devis récent à afficher
                          </td>
                        </tr>
                      ) : (
                        quotes.slice(0, 3).map((quote) => (
                          <tr key={quote.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-indigo-600">
                                <Link href={`/quotes/${quote.id}`}>
                                  {quote.title || `Devis #${quote.id}`}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-500">{quote.serviceType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{quote.clientName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{new Date(quote.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {quote.status === 'pending' ? 'En attente' :
                                 quote.status === 'accepted' ? 'Accepté' :
                                 quote.status === 'rejected' ? 'Rejeté' : quote.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {quote.totalAmount ? `${quote.totalAmount}€` : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Tous mes projets
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Liste complète de vos projets en cours et terminés.
                  </p>
                </div>
                <div className="overflow-hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Projet
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date de début
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            Vous n'avez pas encore de projets
                          </td>
                        </tr>
                      ) : (
                        projects.map((project) => (
                          <tr key={project.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-indigo-600">
                                <Link href={`/projects/${project.id}`}>
                                  {project.title}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-500">{project.serviceType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{project.clientName}</div>
                              <div className="text-sm text-gray-500">{project.clientAddress}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{new Date(project.startDate || project.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {project.status === 'pending' ? 'En attente' :
                                 project.status === 'in_progress' ? 'En cours' :
                                 project.status === 'completed' ? 'Terminé' : project.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.price ? `${project.price}€` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {project.status === 'in_progress' && (
                                <button
                                  onClick={() => handleCompleteProject(project.id)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Marquer comme terminé
                                </button>
                              )}
                              <Link href={`/projects/${project.id}`} className="ml-4 text-indigo-600 hover:text-indigo-900">
                                Détails
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 sm:px-6">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-700">
                      <p>Total: {projects.length} projet(s)</p>
                    </div>
                    <div>
                      <select 
                        className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        defaultValue="all"
                      >
                        <option value="all">Tous les projets</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminés</option>
                        <option value="pending">En attente</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Available Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Jobs disponibles
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Opportunités de travail correspondant à vos compétences et à votre zone d'activité.
                  </p>
                </div>
                <div className="overflow-hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Adresse
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date prévue
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant estimé
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availableJobs.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            Aucun job disponible pour le moment
                          </td>
                        </tr>
                      ) : (
                        availableJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">{job.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{job.serviceType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{job.address}</div>
                              <div className="text-sm text-gray-500">{job.city}, {job.postalCode}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{new Date(job.scheduledDate).toLocaleDateString()}</div>
                              <div className="text-sm text-gray-500">
                                {job.timeSlot || 'Horaire à définir'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {job.estimatedPrice ? `${job.estimatedPrice}€` : 'Sur devis'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleAcceptJob(job.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Accepter
                              </button>
                              {job.canQuote && (
                                <button
                                  className="ml-4 text-indigo-600 hover:text-indigo-900"
                                  onClick={() => router.push(`/quotes/create?jobId=${job.id}`)}
                                >
                                  Proposer un devis
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 sm:px-6">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-700">
                      <p>Total: {availableJobs.length} job(s) disponible(s)</p>
                    </div>
                    <div>
                      <select 
                        className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        defaultValue="all"
                      >
                        <option value="all">Tous les types de travaux</option>
                        {workTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Mon agenda
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Gérez vos rendez-vous et disponibilités.
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="text-base font-medium text-gray-900 mb-2">Mes disponibilités hebdomadaires</h4>
                    <p className="text-sm text-gray-500 mb-4">Configurez vos horaires de disponibilité par défaut pour chaque jour de la semaine.</p>
                    
                    <div className="space-y-4">
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => {
                        const dayData = availability?.find(d => d.day === day) || { day, isAvailable: false, startTime: '09:00', endTime: '18:00' };
                        
                        return (
                          <div key={day} className="flex items-center space-x-4">
                            <div className="w-28">
                              <span className="text-sm font-medium text-gray-700">{day}</span>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`available-${day}`}
                                checked={dayData.isAvailable}
                                onChange={(e) => handleAvailabilityChange(day, 'isAvailable', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`available-${day}`} className="ml-2 text-sm text-gray-700">
                                Disponible
                              </label>
                            </div>
                            {dayData.isAvailable && (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={dayData.startTime}
                                  onChange={(e) => handleAvailabilityChange(day, 'startTime', e.target.value)}
                                  className="mt-1 block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <span className="text-gray-500">à</span>
                                <input
                                  type="time"
                                  value={dayData.endTime}
                                  onChange={(e) => handleAvailabilityChange(day, 'endTime', e.target.value)}
                                  className="mt-1 block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={handleSaveAvailability}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Enregistrer les disponibilités
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Mes rendez-vous à venir</h4>
                    <div className="overflow-hidden overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rendez-vous
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Client
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Heure
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Adresse
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projects.filter(p => p.status === 'scheduled' || p.status === 'in_progress').length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                Aucun rendez-vous à venir
                              </td>
                            </tr>
                          ) : (
                            projects
                              .filter(p => p.status === 'scheduled' || p.status === 'in_progress')
                              .map((project) => (
                                <tr key={project.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-indigo-600">
                                      <Link href={`/projects/${project.id}`}>
                                        {project.title}
                                      </Link>
                                    </div>
                                    <div className="text-sm text-gray-500">{project.serviceType}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{project.clientName}</div>
                                    <div className="text-sm text-gray-500">{project.clientPhone}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{new Date(project.scheduledDate).toLocaleDateString()}</div>
                                    <div className="text-sm text-gray-500">{project.scheduledTime || 'Horaire à définir'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {project.clientAddress}, {project.clientCity}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900">
                                      Détails
                                    </Link>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Rates Tab */}
          {activeTab === 'rates' && (
            <div className="space-y-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Mes tarifs
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Gérez vos tarifs horaires et au m² pour générer automatiquement des devis.
                    </p>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsEditingRates(!isEditingRates)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {isEditingRates ? 'Annuler' : 'Modifier les tarifs'}
                    </button>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="mb-6">
                    <h4 className="text-base font-medium text-gray-900 mb-2">Tarif horaire</h4>
                    <div className="flex items-center">
                      <div className="relative rounded-md shadow-sm w-48">
                        <input
                          type="number"
                          min="0"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                          disabled={!isEditingRates}
                          className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md ${!isEditingRates ? 'bg-gray-100' : ''}`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">€ / h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Tarifs au m² par type de travaux</h4>
                    <p className="text-sm text-gray-500 mb-4">Ces tarifs sont utilisés pour calculer automatiquement les devis en fonction de la surface à traiter.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workTypes.map(type => (
                        <div key={type.id} className="flex items-center space-x-4">
                          <div className="w-36">
                            <span className="text-sm font-medium text-gray-700">{type.name}</span>
                          </div>
                          <div className="relative rounded-md shadow-sm w-36">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={squareMeterRates[type.id] || 0}
                              onChange={(e) => handleSquareMeterRateChange(type.id, e.target.value)}
                              disabled={!isEditingRates}
                              className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md ${!isEditingRates ? 'bg-gray-100' : ''}`}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">€ / m²</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {isEditingRates && (
                      <div className="mt-6">
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
            </div>
          )}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Mon profil professionnel
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Informations personnelles et professionnelles visibles par les clients.
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Informations personnelles</h3>
                      <p className="mt-1 text-sm text-gray-500">Ces informations seront partiellement visibles par les clients potentiels.</p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                      <form>
                        <div className="grid grid-cols-6 gap-6">
                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">Prénom</label>
                            <input
                              type="text"
                              name="first-name"
                              id="first-name"
                              value={profileData.firstName || ''}
                              onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Nom</label>
                            <input
                              type="text"
                              name="last-name"
                              id="last-name"
                              value={profileData.lastName || ''}
                              onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={profileData.email || ''}
                              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              value={profileData.phone || ''}
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse</label>
                            <input
                              type="text"
                              name="address"
                              id="address"
                              value={profileData.address || ''}
                              onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ville</label>
                            <input
                              type="text"
                              name="city"
                              id="city"
                              value={profileData.city || ''}
                              onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">Code postal</label>
                            <input
                              type="text"
                              name="postal-code"
                              id="postal-code"
                              value={profileData.postalCode || ''}
                              onChange={(e) => setProfileData({...profileData, postalCode: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="hidden sm:block" aria-hidden="true">
                    <div className="py-5">
                      <div className="border-t border-gray-200"></div>
                    </div>
                  </div>

                  <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Informations professionnelles</h3>
                      <p className="mt-1 text-sm text-gray-500">Ces informations aideront les clients à vous trouver et à vous faire confiance.</p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                      <form>
                        <div className="grid grid-cols-6 gap-6">
                          <div className="col-span-6">
                            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                            <input
                              type="text"
                              name="company-name"
                              id="company-name"
                              value={profileData.companyName || ''}
                              onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="website" className="block text-sm font-medium text-gray-700">Site web</label>
                            <input
                              type="text"
                              name="website"
                              id="website"
                              value={profileData.website || ''}
                              onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="siret" className="block text-sm font-medium text-gray-700">Numéro SIRET</label>
                            <input
                              type="text"
                              name="siret"
                              id="siret"
                              value={profileData.siret || ''}
                              onChange={(e) => setProfileData({...profileData, siret: e.target.value})}
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="col-span-6">
                            <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Compétences</label>
                            <div className="mt-1 space-y-2">
                              {workTypes.map(type => (
                                <div key={type.id} className="flex items-center">
                                  <input
                                    id={`skill-${type.id}`}
                                    name={`skill-${type.id}`}
                                    type="checkbox"
                                    checked={profileData.skills?.includes(type.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setProfileData({
                                          ...profileData,
                                          skills: [...(profileData.skills || []), type.id]
                                        });
                                      } else {
                                        setProfileData({
                                          ...profileData,
                                          skills: (profileData.skills || []).filter(s => s !== type.id)
                                        });
                                      }
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`skill-${type.id}`} className="ml-3 text-sm text-gray-700">
                                    {type.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="col-span-6">
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio professionnelle</label>
                            <div className="mt-1">
                              <textarea
                                id="bio"
                                name="bio"
                                rows="4"
                                value={profileData.bio || ''}
                                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Décrivez votre expérience et vos spécialités..."
                              ></textarea>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <button
                            type="button"
                            onClick={() => handleUpdateProfile(profileData)}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </form>
                    </div>
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