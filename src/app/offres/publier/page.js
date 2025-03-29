'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiAlertTriangle, FiCheck, FiInfo } from 'react-icons/fi';

export default function PublierOffre() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    room: '',
    area: '',
    urgency: 'normal',
    preferredDate: '',
    photos: []
  });
  
  // Liste des catégories de travaux
  const categories = [
    { id: 'painting', name: 'Peinture' },
    { id: 'plumbing', name: 'Plomberie' },
    { id: 'electricity', name: 'Électricité' },
    { id: 'carpentry', name: 'Menuiserie' },
    { id: 'tiling', name: 'Carrelage' },
    { id: 'flooring', name: 'Revêtement de sol' },
    { id: 'roofing', name: 'Toiture' },
    { id: 'gardening', name: 'Jardinage' },
    { id: 'cleaning', name: 'Nettoyage' },
    { id: 'renovation', name: 'Rénovation complète' },
    { id: 'construction', name: 'Construction' },
    { id: 'other', name: 'Autre' }
  ];

  // Vérifier l'authentification et le rôle
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session.user.role !== 'client') {
      router.push('/dashboard/pro');
    }
  }, [status, session, router]);

  // Charger l'abonnement actif du client
  useEffect(() => {
    const fetchSubscription = async () => {
      if (status !== 'authenticated' || !session.user.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/subscriptions/active?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
          
          // Vérifier que l'utilisateur a un abonnement de niveau suffisant (forfait 3 ou 4)
          if (!data.subscription || !['forfait3', 'forfait4'].includes(data.subscription.planId)) {
            setError('Vous devez avoir un abonnement Premium ou Excellence pour publier des offres.');
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement de l\'abonnement:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscription();
  }, [session, status]);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      // Gestion des fichiers
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        photos: files
      }));
    } else {
      // Gestion des autres champs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier que l'utilisateur a un abonnement de niveau suffisant
    if (!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)) {
      setError('Vous devez avoir un abonnement Premium ou Excellence pour publier des offres.');
      return;
    }
    
    // Vérifier les champs obligatoires
    if (!formData.title || !formData.description || !formData.category) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Créer un FormData pour envoyer les fichiers
      const data = new FormData();
      
      // Ajouter les champs du formulaire
      Object.keys(formData).forEach(key => {
        if (key !== 'photos') {
          data.append(key, formData[key]);
        }
      });
      
      // Ajouter les photos
      formData.photos.forEach((photo, index) => {
        data.append(`photos[${index}]`, photo);
      });
      
      // Envoyer les données
      const response = await fetch('/api/offres', {
        method: 'POST',
        body: data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la publication de l\'offre');
      }
      
      // Offre publiée avec succès
      setSuccess(true);
      
      // Rediriger vers le tableau de bord après 3 secondes
      setTimeout(() => {
        router.push('/dashboard/client');
      }, 3000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue lors de la publication de l\'offre');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h1 className="text-lg font-medium leading-6 text-gray-900">Publier une offre</h1>
              <p className="mt-1 text-sm text-gray-600">
                Décrivez vos besoins pour recevoir des devis de professionnels qualifiés.
              </p>
              
              {subscription && ['forfait3', 'forfait4'].includes(subscription.planId) ? (
                <div className="mt-6">
                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiInfo className="h-5 w-5 text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Informations</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Plus votre description est précise, plus les devis que vous recevrez seront adaptés à vos besoins.
                          </p>
                          <p className="mt-1">
                            Les photos sont facultatives mais très utiles pour les professionnels.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiAlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Abonnement requis</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            La publication d'offres est réservée aux abonnements Premium et Excellence.
                          </p>
                          <Link href="/abonnements" className="font-medium text-yellow-700 underline">
                            Mettre à niveau mon abonnement
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="shadow sm:rounded-md">
              <div className="px-4 py-5 bg-white sm:p-6">
                {/* Message de succès */}
                {success && (
                  <div className="rounded-md bg-green-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiCheck className="h-5 w-5 text-green-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Offre publiée avec succès</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Votre offre a été publiée. Les professionnels pourront vous envoyer des devis. Vous allez être redirigé vers votre tableau de bord.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Message d'erreur */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiAlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {!success && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Titre de l'offre */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Titre de l'offre *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ex: Rénovation de ma salle de bain"
                        required
                        disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                      />
                    </div>
                    
                    {/* Catégorie */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Catégorie de travaux *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                        disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description détaillée *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={6}
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Décrivez précisément les travaux à réaliser, les matériaux souhaités, etc."
                        required
                        disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                      />
                    </div>
                    
                    {/* Budget */}
                    <div>
                      <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                        Budget estimé (€)
                      </label>
                      <input
                        type="text"
                        name="budget"
                        id="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ex: 2000"
                        disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Laissez vide si vous n'avez pas d'idée précise du budget.
                      </p>
                    </div>
                    
                    {/* Pièce et superficie */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                          Pièce concernée
                        </label>
                        <input
                          type="text"
                          name="room"
                          id="room"
                          value={formData.room}
                          onChange={handleChange}
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          placeholder="Ex: Salon, Cuisine, Salle de bain"
                          disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                          Superficie (m²)
                        </label>
                        <input
                          type="number"
                          name="area"
                          id="area"
                          min="0"
                          value={formData.area}
                          onChange={handleChange}
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          placeholder="Ex: 15"
                          disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                        />
                      </div>
                    </div>
                    
                    {/* Lieu et date souhaitée */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                          Adresse des travaux
                        </label>
                        <input
                          type="text"
                          name="location"
                          id="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          placeholder="Ex: 123 Rue de Paris, 75001 Paris"
                          disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700">
                          Date de démarrage souhaitée
                        </label>
                        <input
                          type="date"
                          name="preferredDate"
                          id="preferredDate"
                          value={formData.preferredDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                        />
                      </div>
                    </div>
                    
                    {/* Niveau d'urgence */}
                    <div>
                      <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
                        Niveau d'urgence
                      </label>
                      <select
                        id="urgency"
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                      >
                        <option value="normal">Normal - Dans les 30 jours</option>
                        <option value="medium">Moyen - Dans les 15 jours</option>
                        <option value="high">Élevé - Dans les 7 jours</option>
                        <option value="urgent">Urgent - Dès que possible</option>
                      </select>
                    </div>
                    
                    {/* Photos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Photos (facultatif)
                      </label>
                      <div className="mt-1 flex justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label htmlFor="file-upload" className={`relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 ${!subscription || !['forfait3', 'forfait4'].includes(subscription.planId) ? 'opacity-50 pointer-events-none' : ''}`}>
                              <span>Télécharger des fichiers</span>
                              <input 
                                id="file-upload" 
                                name="photos" 
                                type="file" 
                                className="sr-only" 
                                onChange={handleChange}
                                multiple
                                accept="image/*"
                                disabled={!subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                              />
                            </label>
                            <p className="pl-1">ou glisser-déposer</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF jusqu'à 10MB
                          </p>
                          {formData.photos.length > 0 && (
                            <p className="text-sm text-indigo-600">
                              {formData.photos.length} photo(s) sélectionnée(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Boutons */}
                    <div className="flex justify-end space-x-3">
                      <Link
                        href="/dashboard/client"
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Annuler
                      </Link>
                      <button
                        type="submit"
                        disabled={submitting || !subscription || !['forfait3', 'forfait4'].includes(subscription.planId)}
                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                          subscription && ['forfait3', 'forfait4'].includes(subscription.planId)
                            ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {submitting ? 'Publication en cours...' : 'Publier l\'offre'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}