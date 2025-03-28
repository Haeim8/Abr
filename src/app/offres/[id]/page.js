'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function OfferDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [offer, setOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    price: '',
    description: '',
    estimatedDuration: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Récupérer les détails de l'offre
  useEffect(() => {
    const fetchOfferDetails = async () => {
      setIsLoading(true);
      try {
        console.log(`Chargement des détails de l'offre ${id}...`);
        const response = await fetch(`/api/offers/${id}`);
        if (!response.ok) {
          throw new Error(`Erreur lors du chargement des détails de l'offre (${response.status})`);
        }
        const data = await response.json();
        console.log('Données de l\'offre reçues:', data);
        setOffer(data.offer);
      } catch (err) {
        setError(`Impossible de charger les détails de l'offre: ${err.message}`);
        console.error('Erreur:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOfferDetails();
    }
  }, [id]);

  // Gérer les changements dans le formulaire de devis
  const handleQuoteChange = (e) => {
    const { name, value } = e.target;
    setQuoteForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumettre un devis
  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    
    if (!session || !session.user) {
      router.push('/auth/signin');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: id,
          professional: session.user.id,
          client: offer.client.id,
          totalPrice: parseFloat(quoteForm.price),
          description: quoteForm.description,
          labor: {
            hours: parseInt(quoteForm.estimatedDuration) || 0,
            rate: 0,
            total: 0
          },
          title: `Devis pour ${offer.title}`,
          status: 'sent'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la soumission du devis');
      }
      
      setSubmitSuccess(true);
      setQuoteForm({
        price: '',
        description: '',
        estimatedDuration: ''
      });
      
      // Recharger l'offre pour voir le nouveau devis
      const offerResponse = await fetch(`/api/offers/${id}`);
      if (offerResponse.ok) {
        const offerData = await offerResponse.json();
        setOffer(offerData.offer);
      }
    } catch (err) {
      setSubmitError(err.message);
      console.error('Erreur:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Accepter un devis
  const handleAcceptQuote = async (quoteId) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: 'PUT'
      });
      if (!response.ok) {
        throw new Error('Erreur lors de l\'acceptation du devis');
      }
      
      // Recharger l'offre pour voir le devis mis à jour
      const offerResponse = await fetch(`/api/offers/${id}`);
      if (offerResponse.ok) {
        const offerData = await offerResponse.json();
        setOffer(offerData.offer);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de l\'acceptation du devis: ' + err.message);
    }
  };

  // Refuser un devis
  const handleRejectQuote = async (quoteId) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/reject`, {
        method: 'PUT'
      });
      if (!response.ok) {
        throw new Error('Erreur lors du refus du devis');
      }
      
      // Recharger l'offre pour voir le devis mis à jour
      const offerResponse = await fetch(`/api/offers/${id}`);
      if (offerResponse.ok) {
        const offerData = await offerResponse.json();
        setOffer(offerData.offer);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors du refus du devis: ' + err.message);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement des détails de l'offre...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-gray-700">{error}</p>
            <div className="mt-4">
              <Link
                href="/offres"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retour à la liste des offres
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Offre non trouvée</h1>
            <p className="text-gray-700">L'offre que vous recherchez n'existe pas ou a été supprimée.</p>
            <div className="mt-4">
              <Link
                href="/offres"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retour à la liste des offres
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/offres"
            className="text-indigo-600 hover:text-indigo-900 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"></path>
            </svg>
            Retour aux offres
          </Link>
          
          {session && offer.client && session.user.id === offer.client.id && (
            <div className="flex space-x-2">
              <Link
                href={`/offres/${id}/edit`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Modifier
              </Link>
              <button
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Publié le {formatDate(offer.createdAt)} par {offer.client?.name || 'Client anonyme'}
                </p>
              </div>
              <div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {offer.status === 'open' ? 'Ouvert' : offer.status === 'in_progress' ? 'En cours' : 'Terminé'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h2 className="text-lg font-medium text-gray-900">Description</h2>
                <p className="mt-1 text-sm text-gray-500">{offer.description}</p>
              </div>
              
              <div>
                <h2 className="text-sm font-medium text-gray-500">Catégorie</h2>
                <p className="mt-1 text-sm text-gray-900">{offer.category}</p>
              </div>
              
              <div>
                <h2 className="text-sm font-medium text-gray-500">Budget estimé</h2>
                <p className="mt-1 text-sm text-gray-900">{offer.budget}€</p>
              </div>
              
              {offer.location && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Localisation</h2>
                  <p className="mt-1 text-sm text-gray-900">{offer.location}</p>
                </div>
              )}
              
              <div>
                <h2 className="text-sm font-medium text-gray-500">Contact</h2>
                <p className="mt-1 text-sm text-gray-900">{offer.client?.email || 'Non disponible'}</p>
              </div>
            </div>
            
            {offer.rooms && offer.rooms.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Pièces concernées</h2>
                <div className="mt-2 border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {offer.rooms.map((room, index) => (
                      <li key={index} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{room.name || `Pièce ${index + 1}`}</p>
                          <p className="text-sm text-gray-500">{room.type || 'Non spécifié'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{room.area} m²</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Section devis */}
          {offer.quotes && offer.quotes.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Devis reçus ({offer.quotes.length})</h2>
              <div className="mt-2">
                <ul className="divide-y divide-gray-200">
                  {offer.quotes.map((quote) => (
                    <li key={quote._id} className="py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {quote.professional?.name || 'Professionnel'} 
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                              {quote.status === 'accepted' ? 'Accepté' : quote.status === 'rejected' ? 'Refusé' : 'En attente'}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-gray-500">{formatDate(quote.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{quote.totalPrice}€</p>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{quote.description}</p>
                      
                      {session && offer.client && session.user.id === offer.client.id && quote.status === 'sent' && (
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() => handleAcceptQuote(quote._id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleRejectQuote(quote._id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Formulaire de devis pour les professionnels */}
          {session && 
           session.user.role === 'professional' && 
           offer.status === 'open' && 
           offer.client && 
           session.user.id !== offer.client.id && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Proposer un devis</h2>
              
              {submitSuccess && (
                <div className="mt-2 rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Votre devis a été envoyé avec succès.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {submitError && (
                <div className="mt-2 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {submitError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmitQuote} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Prix total (€)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="0.01"
                      required
                      value={quoteForm.price}
                      onChange={handleQuoteChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700">
                    Durée estimée (heures)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="estimatedDuration"
                      id="estimatedDuration"
                      min="0"
                      value={quoteForm.estimatedDuration}
                      onChange={handleQuoteChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description du devis
                  </label>
                  <div className="mt-1">
                    <textarea
                      name="description"
                      id="description"
                      rows="4"
                      required
                      value={quoteForm.description}
                      onChange={handleQuoteChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Détaillez votre proposition de devis..."
                    ></textarea>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le devis'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}