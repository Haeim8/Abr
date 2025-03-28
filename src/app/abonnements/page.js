'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Composant qui utilise useSearchParams
function AbonnementsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const userId = searchParams.get('id') || (session?.user?.id || '');

  // Les 4 forfaits basés sur votre document Excel
  const plans = [
    {
      id: 'forfait1',
      name: 'Forfait 1',
      price: 39,
      description: '1 tâche cumulable par mois',
      features: [
        'Assemblage de meubles (1 meuble/mois)',
        'Taille de haie (10 m²/mois)',
        'Tonte de pelouse (100 m²/mois)',
        'Ménage intérieur (15 m²/mois)',
        'Nettoyage extérieur Karcher (15 m²/mois)',
        'Pose d\'accessoires muraux (3 unités/mois)',
        'Entretien luminaires (5 unités/mois)',
        'Entretien maison/appartement (3 unités/mois)',
        'Arrosage plantes (10 m²/mois)',
        'Remplacement appareillage électrique (3/mois)'
      ],
      after6months: [
        'Réfection peinture blanche (5 m²/mois)',
        'Pose papier peint (5 m²/mois)',
        'Réfection joint sanitaire (1 SDB/mois)',
        'Débroussaillage (5 m²/mois)'
      ],
      color: 'bg-blue-600',
      popular: false,
      commitment: '6 mois minimum'
    },
    {
      id: 'forfait2',
      name: 'Forfait 2',
      price: 99,
      description: '3 tâches cumulables par mois',
      features: [
        'Assemblage de meubles (1 meuble/mois)',
        'Taille de haie (15 m²/mois)',
        'Tonte de pelouse (100 m²/mois)',
        'Ménage intérieur (15 m²/mois)',
        'Réfection peinture blanche (5 m²/mois)',
        'Réfection joint sanitaire (1 SDB/mois)',
        'Nettoyage extérieur Karcher (15 m²/mois)',
        'Pose d\'accessoires muraux (3 unités/mois)',
        'Entretien luminaires (5 unités/mois)',
        'Entretien maison/appartement (3 unités/mois)',
        'Arrosage plantes (15 m²/mois)',
        'Remplacement appareillage électrique (3/mois)',
        'Pose papier peint (5 m²/mois)',
        'Débroussaillage (5 m²/mois)'
      ],
      after6months: [],
      color: 'bg-indigo-600',
      popular: true,
      commitment: '6 mois minimum'
    },
    {
      id: 'forfait3',
      name: 'Forfait 3',
      price: 139,
      description: '3 tâches cumulables avec dépannage serrurier',
      features: [
        'Dépannage serrurier (1 fois/an)',
        'Assemblage de meubles (1 meuble/mois)',
        'Taille de haie (20 m²/mois)',
        'Tonte de pelouse (150 m²/mois)',
        'Ménage intérieur (20 m²/mois)',
        'Réfection peinture blanche (10 m²/mois)',
        'Réfection joint sanitaire (1 SDB/mois)',
        'Nettoyage extérieur Karcher (30 m²/mois)',
        'Pose d\'accessoires muraux (5 unités/mois)',
        'Entretien luminaires (5 unités/mois)',
        'Entretien maison/appartement (3 unités/mois)',
        'Arrosage plantes (25 m²/mois)',
        'Remplacement appareillage électrique (5/mois)',
        'Pose papier peint (10 m²/mois)',
        'Pose de carrelage (2 m²/mois)',
        'Pose de parquet flottant (2 m²/mois)',
        'Débroussaillage (10 m²/mois)',
        'Réfection joints carrelage (2 m²/mois)'
      ],
      after6months: [],
      color: 'bg-purple-600',
      popular: false,
      commitment: '6 mois minimum'
    },
    {
      id: 'forfait4',
      name: 'Forfait 4',
      price: 189,
      description: '3 tâches cumulables avec dépannage serrurier et plomberie',
      features: [
        'Dépannage serrurier (1 fois/an)',
        'Dépannage plomberie (1 fois/mois)',
        'Assemblage de meubles (1 meuble/mois)',
        'Taille de haie (25 m²/mois)',
        'Tonte de pelouse (200 m²/mois)',
        'Ménage intérieur (35 m²/mois)',
        'Réfection peinture blanche (10 m²/mois)',
        'Réfection joint sanitaire (1 SDB/mois)',
        'Nettoyage extérieur Karcher (30 m²/mois)',
        'Pose d\'accessoires muraux (5 unités/mois)',
        'Entretien luminaires (5 unités/mois)',
        'Entretien maison/appartement (3 unités/mois)',
        'Arrosage plantes (30 m²/mois)',
        'Remplacement appareillage électrique (5/mois)',
        'Pose papier peint (10 m²/mois)',
        'Pose de carrelage (2 m²/mois)',
        'Pose de parquet flottant (2 m²/mois)',
        'Ramonage cheminée/insert (1 fois/mois)',
        'Débroussaillage (15 m²/mois)',
        'Réfection joints carrelage (2 m²/mois)'
      ],
      after6months: [],
      color: 'bg-green-600',
      popular: false,
      commitment: '6 mois minimum'
    }
  ];

  // Vérification de l'authentification
  useEffect(() => {
    if (status === 'unauthenticated' && !userId) {
      router.push('/auth/signin');
    }
  }, [status, router, userId]);

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || session?.user?.id,
          planId: selectedPlan
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Une erreur est survenue lors de la souscription');
      }
      
      // Redirection vers la page de paiement ou le dashboard
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        router.push('/dashboard/client');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choisissez votre forfait d'abonnement
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Des services professionnels à votre disposition chaque mois.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mt-8 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 lg:max-w-7xl lg:mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg shadow-sm divide-y divide-gray-200 ${
                plan.popular ? 'border-indigo-400 ring-2 ring-indigo-500' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                {plan.popular && (
                  <p className="absolute top-0 transform -translate-y-1/2 inset-x-0 bg-indigo-500 rounded-full text-white text-xs font-semibold tracking-wide py-1 px-3 w-32 mx-auto text-center">
                    Recommandé
                  </p>
                )}
                <h2 className="text-lg leading-6 font-medium text-gray-900">{plan.name}</h2>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}€</span>
                  <span className="text-base font-medium text-gray-500">/mois</span>
                </p>
                <p className="mt-1 text-sm text-gray-500">{plan.commitment}</p>
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`mt-8 block w-full ${
                    selectedPlan === plan.id
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  } rounded-md py-2 text-sm font-semibold text-center transition-colors`}
                >
                  {selectedPlan === plan.id ? 'Sélectionné' : 'Sélectionner'}
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  Services inclus
                </h3>
                <ul className="mt-6 space-y-4 max-h-96 overflow-y-auto">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex space-x-3">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.after6months.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                      Après 6 mois d'abonnement
                    </h3>
                    <ul className="mt-4 space-y-4">
                      {plan.after6months.map((feature, index) => (
                        <li key={index} className="flex space-x-3">
                          <svg
                            className="flex-shrink-0 h-5 w-5 text-indigo-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-gray-500">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={handleSubscribe}
            disabled={!selectedPlan || isLoading}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${
              selectedPlan && !isLoading
                ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {isLoading ? 'Traitement en cours...' : 'S\'abonner maintenant'}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Engagement de 6 mois minimum. Sans reconduction automatique.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Pour toute question concernant nos abonnements, contactez notre service client.
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant principal avec Suspense
export default function AbonnementsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner border-t-4 border-indigo-500 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    }>
      <AbonnementsContent />
    </Suspense>
  );
}