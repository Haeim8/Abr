'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const userId = searchParams.get('id') || (session?.user?.id || '');

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Données du formulaire
  const [formData, setFormData] = useState({
    // Type d'habitation
    housingType: 'apartment', // 'apartment' ou 'house'
    // Appartement
    roomCount: 1,
    apartmentArea: 0,
    // Maison
    hasGarden: false,
    gardenArea: 0,
    houseRoomCount: 1,
    houseArea: 0,
    // Abonnement
    subscriptionPlan: 'forfait1',
    // Priorités de travaux
    priorities: [],
  });

  // Liste des travaux disponibles
  const workTypes = [
    { id: 'painting', name: 'Peinture' },
    { id: 'plumbing', name: 'Plomberie' },
    { id: 'electricity', name: 'Électricité' },
    { id: 'carpentry', name: 'Menuiserie' },
    { id: 'gardening', name: 'Jardinage' },
    { id: 'cleaning', name: 'Nettoyage' },
    { id: 'tiling', name: 'Carrelage' },
    { id: 'flooring', name: 'Parquet' },
    { id: 'wallpapering', name: 'Tapisserie' },
  ];

  // Liste des forfaits disponibles
  const subscriptionPlans = [
    { id: 'forfait1', name: 'Essentiel', price: '39€/mois', description: '1 tâche par mois', features: ['Une intervention par mois', 'Délai d\'intervention de 72h', 'Support par téléphone'] },
    { id: 'forfait2', name: 'Confort', price: '99€/mois', description: '3 tâches par mois', features: ['Trois interventions par mois', 'Délai d\'intervention de 48h', 'Support prioritaire'] },
    { id: 'forfait3', name: 'Premium', price: '139€/mois', description: '3 tâches + dépannage serrurier', features: ['Trois interventions par mois', 'Dépannage serrurier inclus', 'Délai d\'intervention de 24h'] },
    { id: 'forfait4', name: 'Excellence', price: '189€/mois', description: '3 tâches + dépannage serrurier et plomberie', features: ['Trois interventions par mois', 'Dépannage serrurier et plomberie', 'Intervention d\'urgence'] },
  ];

  // Vérification de l'authentification
  useEffect(() => {
    if (status === 'unauthenticated' && !userId) {
      router.push('/auth/signin');
    }
  }, [status, router, userId]);

  // Gestion des changements de formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestion des changements numériques
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  // Gestion des priorités de travaux
  const handlePriorityChange = (workId) => {
    setFormData(prev => {
      const currentPriorities = [...prev.priorities];
      const index = currentPriorities.indexOf(workId);
      
      if (index === -1) {
        // Ajouter si pas déjà présent
        currentPriorities.push(workId);
      } else {
        // Retirer si déjà présent
        currentPriorities.splice(index, 1);
      }
      
      return {
        ...prev,
        priorities: currentPriorities
      };
    });
  };

  // Navigation entre les étapes
  const nextStep = () => {
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // Soumission finale du formulaire
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...formData
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Une erreur est survenue');
      }
      
      setSuccess('Votre profil a été enregistré avec succès !');
      
      // Redirection après quelques secondes
      setTimeout(() => {
        router.push('/dashboard/client');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Passer directement au dashboard
  const skipOnboarding = () => {
    router.push('/dashboard/client');
  };

  // Afficher un spinner pendant le chargement
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Complétez votre profil
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Ces informations nous aideront à mieux vous servir
          </p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Étapes de progression */}
          <div className="bg-gray-50 py-4 px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white font-medium">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Type d'habitation</span>
              </div>
              <div className="w-12 h-1 bg-indigo-600"></div>
              <div className="flex items-center">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                } font-medium`}>
                  2
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= 2 ? 'text-gray-900' : 'text-gray-500'
                }`}>Abonnement</span>
              </div>
              <div className={`w-12 h-1 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
              <div className="flex items-center">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                } font-medium`}>
                  3
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= 3 ? 'text-gray-900' : 'text-gray-500'
                }`}>Priorités</span>
              </div>
            </div>
          </div>

          {/* Contenu du formulaire */}
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                <p>{success}</p>
              </div>
            )}

            {/* Étape 1: Type d'habitation */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Quel type d'habitation avez-vous ?</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className={`relative rounded-lg border p-4 ${
                    formData.housingType === 'apartment' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                  }`}>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="housingType"
                        value="apartment"
                        checked={formData.housingType === 'apartment'}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-900">Appartement</span>
                    </label>
                  </div>
                  
                  <div className={`relative rounded-lg border p-4 ${
                    formData.housingType === 'house' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                  }`}>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="housingType"
                        value="house"
                        checked={formData.housingType === 'house'}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-900">Maison</span>
                    </label>
                  </div>
                </div>

                {/* Champs spécifiques pour appartement */}
                {formData.housingType === 'apartment' && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de pièces
                      </label>
                      <select
                        name="roomCount"
                        value={formData.roomCount}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>{num} pièce{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Surface totale (m²)
                      </label>
                      <input
                        type="number"
                        name="apartmentArea"
                        value={formData.apartmentArea}
                        onChange={handleNumberChange}
                        min="0"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}

                {/* Champs spécifiques pour maison */}
                {formData.housingType === 'house' && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de pièces
                      </label>
                      <select
                        name="houseRoomCount"
                        value={formData.houseRoomCount}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>{num} pièce{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Surface habitable (m²)
                      </label>
                      <input
                        type="number"
                        name="houseArea"
                        value={formData.houseArea}
                        onChange={handleNumberChange}
                        min="0"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="hasGarden"
                          name="hasGarden"
                          type="checkbox"
                          checked={formData.hasGarden}
                          onChange={handleChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="hasGarden" className="font-medium text-gray-700">
                          Jardin
                        </label>
                      </div>
                    </div>
                    
                    {formData.hasGarden && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Surface du jardin (m²)
                        </label>
                        <input
                          type="number"
                          name="gardenArea"
                          value={formData.gardenArea}
                          onChange={handleNumberChange}
                          min="0"
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-5">
                  <button
                    type="button"
                    onClick={skipOnboarding}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Ignorer pour l'instant
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {/* Étape 2: Choix d'abonnement */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Choisissez votre abonnement</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {subscriptionPlans.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`relative rounded-lg border p-4 hover:shadow-md transition-all ${
                        formData.subscriptionPlan === plan.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, subscriptionPlan: plan.id }))}
                    >
                      <div className="flex items-start">
                        <div className="h-5 flex items-center">
                          <input
                            type="radio"
                            name="subscriptionPlan"
                            value={plan.id}
                            checked={formData.subscriptionPlan === plan.id}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 border-gray-300"
                          />
                        </div>
                        <div className="ml-3 text-sm w-full">
                          <label className="font-medium text-gray-900 flex justify-between items-baseline">
                            <span>{plan.name}</span>
                            <span className="font-semibold text-indigo-600">{plan.price}</span>
                          </label>
                          <p className="text-gray-500 mt-1">{plan.description}</p>
                          <ul className="mt-2 space-y-1">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center">
                                <svg className="h-4 w-4 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between space-x-3 pt-5">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {/* Étape 3: Priorités de travaux */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Quels sont vos besoins prioritaires ?</h3>
                <p className="text-sm text-gray-500">Sélectionnez les types de travaux qui vous intéressent prioritairement.</p>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {workTypes.map((work) => (
                    <div 
                      key={work.id}
                      className={`relative rounded-lg border p-4 hover:bg-gray-50 cursor-pointer ${
                        formData.priorities.includes(work.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                      }`}
                      onClick={() => handlePriorityChange(work.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`work-${work.id}`}
                          checked={formData.priorities.includes(work.id)}
                          onChange={() => handlePriorityChange(work.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`work-${work.id}`} className="block text-sm font-medium text-gray-700">
                          {work.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between space-x-3 pt-5">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isLoading ? 'Enregistrement...' : 'Terminer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}