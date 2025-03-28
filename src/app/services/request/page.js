'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ServiceRequest() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [subscription, setSubscription] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // État du formulaire
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    date: '',
    timePreference: 'morning',
    address: '',
    room: '',
    area: 0,
    urgency: 'normal'
  });

  // Rediriger si non connecté ou pas un client
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session.user.role !== 'client') {
      router.push('/dashboard/pro');
    }
  }, [status, session, router]);

  // Charger les données nécessaires
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated' || !session.user.id) return;
      
      setIsLoading(true);
      try {
        // Charger l'abonnement actif du client
        const subscriptionResponse = await fetch(`/api/subscriptions/active?userId=${session.user.id}`);
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscription(subscriptionData.subscription);
          
          // Rediriger si pas d'abonnement actif
          if (!subscriptionData.subscription || subscriptionData.subscription.status !== 'active') {
            router.push('/abonnements');
            return;
          }
        }
        
        // Charger les services disponibles
        const servicesResponse = await fetch('/api/services/available');
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setAvailableServices(servicesData.services);
        }
        
        // Pré-remplir certains champs du formulaire avec les données du profil
        const userResponse = await fetch(`/api/users/${session.user.id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setFormData(prev => ({
            ...prev,
            address: userData.address || '',
          }));
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [session, status, router]);

  // Vérifier si un service est disponible en fonction de l'abonnement
  const isServiceAvailable = (serviceId) => {
    if (!subscription) return false;
    
    // Si l'abonnement est actif
    if (subscription.status === 'active') {
      // Si le client a encore des tâches disponibles
      if (subscription.tasksUsedThisMonth < subscription.maxTasks) {
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

  // Obtenir la liste des services disponibles pour l'abonnement actuel
  const getAvailableServiceOptions = () => {
    return availableServices.filter(service => isServiceAvailable(service.id));
  };

  // Gestion des changements de formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.serviceType) {
      setError('Veuillez sélectionner un type de service');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/services/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user.id,
          ...formData
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la demande de service');
      }
      
      setSuccess('Votre demande de service a été envoyée avec succès!');
      
      // Redirection après quelques secondes
      setTimeout(() => {
        router.push('/dashboard/client');
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement...</p>
      </div>
    );
  }

  // Afficher un message si aucun abonnement actif
  if (!subscription || subscription.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun abonnement actif</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous devez avoir un abonnement actif pour demander des services.
              </p>
              <div className="mt-6">
                <Link
                  href="/abonnements"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Découvrir nos abonnements
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-lg font-medium text-gray-900">Demande de service</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Complétez le formulaire ci-dessous pour demander un service auprès de nos professionnels.
            </p>
          </div>
          
          {error && (
            <div className="mx-4 my-2 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mx-4 my-2 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
              <p>{success}</p>
            </div>
          )}
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type de service */}
              <div>
                <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                  Type de service *
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Sélectionnez un service</option>
                  {getAvailableServiceOptions().map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description du besoin *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez les travaux à réaliser, les matériaux nécessaires, etc."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              {/* Date et horaire */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date souhaitée *
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="timePreference" className="block text-sm font-medium text-gray-700">
                    Préférence horaire
                  </label>
                  <select
                    id="timePreference"
                    name="timePreference"
                    value={formData.timePreference}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="morning">Matin (8h-12h)</option>
                    <option value="afternoon">Après-midi (13h-17h)</option>
                    <option value="evening">Soir (17h-20h)</option>
                  </select>
                </div>
              </div>
              
              {/* Adresse */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Adresse d'intervention *
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Adresse complète"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              {/* Pièce et surface */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                    Pièce concernée
                  </label>
                  <input
                    id="room"
                    name="room"
                    type="text"
                    value={formData.room}
                    onChange={handleChange}
                    placeholder="Ex: Salon, Cuisine, etc."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                    Surface (m²)
                  </label>
                  <input
                    id="area"
                    name="area"
                    type="number"
                    min="0"
                    value={formData.area}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              {/* Urgence */}
              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
                  Niveau d'urgence
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent (sous 48h)</option>
                  <option value="emergency">Urgence (sous 24h)</option>
                </select>
                {formData.urgency !== 'normal' && subscription.planId !== 'forfait4' && (
                  <p className="mt-1 text-sm text-yellow-600">
                    Note: Les interventions urgentes sont réservées au forfait Excellence. Des frais supplémentaires peuvent s'appliquer.
                  </p>
                )}
              </div>
              
              {/* Tâches restantes dans l'abonnement */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Tâches restantes dans votre forfait:</span>
                  <span className="font-bold text-indigo-600">{subscription.maxTasks - subscription.tasksUsedThisMonth} sur {subscription.maxTasks}</span>
                </div>
              </div>
              
              {/* Boutons */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/dashboard/client"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}