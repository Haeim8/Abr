'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardServices() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  // Récupérer les informations d'abonnement
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscriptions/current');
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données d\'abonnement');
        }
        
        const data = await response.json();
        setSubscription(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user) {
      fetchSubscription();
    }
  }, [session]);

  // Demander un service
  const requestService = async (serviceId) => {
    try {
      const response = await fetch('/api/services/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          quantity: 1
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la demande de service');
      }
      
      const result = await response.json();
      
      // Mettre à jour l'abonnement avec les nouvelles données
      setSubscription(result.subscription);
      
      // Fermer le modal de service
      setSelectedService(null);
      
      // Afficher une notification de succès (à implémenter)
      alert('Demande de service enregistrée avec succès !');
    } catch (err) {
      alert(err.message);
    }
  };

  // Ouvrir le modal de détails du service
  const openServiceDetails = (service) => {
    setSelectedService(service);
  };

  // Fermer le modal de détails du service
  const closeServiceDetails = () => {
    setSelectedService(null);
  };

  // Calculer les jours restants avant réinitialisation
  const getDaysUntilReset = () => {
    if (!subscription) return 0;
    
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const diffTime = nextMonth - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner border-t-4 border-indigo-500 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription || !subscription.hasSubscription) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Aucun abonnement actif</h2>
        <p className="text-gray-600 mb-6">
          Vous n'avez pas d'abonnement actif. Souscrivez à un forfait pour accéder à nos services.
        </p>
        <Link
          href="/abonnements"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Voir les forfaits
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec résumé de l'abonnement */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-semibold">
              {subscription.planName}
            </h2>
            <p className="text-gray-600">
              {subscription.price}€/mois
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 bg-indigo-50 rounded-lg p-3">
            <div className="text-center">
              <span className="text-2xl font-bold text-indigo-700">
                {subscription.tasksRemaining}
              </span>
              <span className="text-sm text-indigo-700 ml-1">
                tâche{subscription.tasksRemaining !== 1 ? 's' : ''} restante{subscription.tasksRemaining !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">
              Réinitialisation dans {getDaysUntilReset()} jour{getDaysUntilReset() !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des services disponibles */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium">Services disponibles</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {subscription.services && subscription.services.map((service) => (
            <div 
              key={service.id}
              className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${!service.isAvailable ? 'opacity-60' : ''}`}
              onClick={() => service.isAvailable && openServiceDetails(service)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{service.name}</h4>
                  <p className="text-sm text-gray-500">
                    {service.remainingQuantity} {service.unit} disponible{service.remainingQuantity !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {!service.isAvailable ? (
                  <div className="text-sm text-gray-500">
                    <span className="bg-gray-100 rounded-full py-1 px-3">
                      Disponible dans {service.unlockInMonths} mois
                    </span>
                  </div>
                ) : (
                  <button
                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      openServiceDetails(service);
                    }}
                  >
                    Demander
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de détails du service */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">{selectedService.name}</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Vous pouvez demander jusqu'à {selectedService.limit} {selectedService.unit} par mois.
              </p>
              <p className="text-gray-600">
                Déjà utilisé: {selectedService.usedQuantity} {selectedService.unit}
              </p>
              <p className="text-gray-600">
                Restant: {selectedService.remainingQuantity} {selectedService.unit}
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-500 mb-4">
                Souhaitez-vous demander ce service maintenant ?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                  onClick={closeServiceDetails}
                >
                  Annuler
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors"
                  onClick={() => requestService(selectedService.id)}
                >
                  Demander
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}