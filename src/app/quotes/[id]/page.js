'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiClock, FiCalendar, FiDollarSign, FiUser, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

export default function QuoteDetails({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const quoteId = params.id;
  
  const [quote, setQuote] = useState(null);
  const [professional, setProfessional] = useState(null);
  const [client, setClient] = useState(null);
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Rediriger si non connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Charger les données du devis
  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!quoteId) return;
      
      setIsLoading(true);
      try {
        // Charger les détails du devis
        const quoteResponse = await fetch(`/api/quotes/${quoteId}`);
        if (!quoteResponse.ok) {
          throw new Error('Devis non trouvé');
        }
        const quoteData = await quoteResponse.json();
        setQuote(quoteData);
        
        // Charger les informations du professionnel
        if (quoteData.professionalId) {
          const professionalResponse = await fetch(`/api/professionals/${quoteData.professionalId}`);
          if (professionalResponse.ok) {
            const professionalData = await professionalResponse.json();
            setProfessional(professionalData);
          }
        }
        
        // Charger les informations du client
        if (quoteData.clientId) {
          const clientResponse = await fetch(`/api/users/${quoteData.clientId}`);
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            setClient(clientData);
          }
        }
        
        // Charger les informations du projet associé
        if (quoteData.projectId) {
          const projectResponse = await fetch(`/api/projects/${quoteData.projectId}`);
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            setProject(projectData);
          }
        }
        
        // Si l'utilisateur est un client, charger son abonnement
        if (status === 'authenticated' && session.user.role === 'client') {
          const subscriptionResponse = await fetch(`/api/subscriptions/active?userId=${session.user.id}`);
          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json();
            setSubscription(subscriptionData.subscription);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Erreur lors du chargement des données:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuoteData();
  }, [quoteId, session, status]);

  // Vérifier si l'utilisateur est le client ou le professionnel associé à ce devis
  const isQuoteParticipant = () => {
    if (!quote || !session) return false;
    
    return (
      (session.user.role === 'client' && quote.clientId === session.user.id) ||
      (session.user.role === 'professional' && quote.professionalId === session.user.id)
    );
  };

  // Vérifier si l'utilisateur est le client de ce devis
  const isQuoteClient = () => {
    if (!quote || !session) return false;
    return session.user.role === 'client' && quote.clientId === session.user.id;
  };

  // Vérifier si l'utilisateur est le professionnel de ce devis
  const isQuoteProfessional = () => {
    if (!quote || !session) return false;
    return session.user.role === 'professional' && quote.professionalId === session.user.id;
  };

  // Vérifier si l'utilisateur peut accepter le devis (client avec forfait 3 ou 4)
  const canAcceptQuote = () => {
    if (!isQuoteClient() || quote.status !== 'pending') return false;
    if (!subscription || subscription.status !== 'active') return false;
    return ['forfait3', 'forfait4'].includes(subscription.planId);
  };

  // Accepter le devis
  const handleAcceptQuote = async () => {
    if (!canAcceptQuote()) return;
    
    setActionInProgress(true);
    
    try {
      const response = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'acceptation du devis');
      }
      
      // Mettre à jour le statut du devis
      setQuote(prevQuote => ({
        ...prevQuote,
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      }));
      
      setConfirmModalOpen(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'acceptation du devis');
    } finally {
      setActionInProgress(false);
    }
  };

  // Refuser le devis
  const handleRejectQuote = async () => {
    if (!isQuoteClient() || quote.status !== 'pending') return;
    
    setActionInProgress(true);
    
    try {
      const response = await fetch(`/api/quotes/${quoteId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du refus du devis');
      }
      
      // Mettre à jour le statut du devis
      setQuote(prevQuote => ({
        ...prevQuote,
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      }));
      
      setConfirmModalOpen(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du refus du devis');
    } finally {
      setActionInProgress(false);
    }
  };

  // Ouvrir le modal de confirmation d'action
  const openConfirmModal = (action) => {
    setConfirmAction(action);
    setConfirmModalOpen(true);
  };

  // Générer un statut visuel pour le devis
  const getStatusBadge = () => {
    switch (quote?.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> En attente
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> Accepté
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
           <FiXCircle className="mr-1" /> Refusé
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FiAlertCircle className="mr-1" /> Expiré
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {quote?.status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement du devis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Erreur</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <Link
                  href={session?.user?.role === 'client' ? '/dashboard/client' : '/dashboard/pro'}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retour au tableau de bord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Devis non trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">Le devis demandé n'existe pas ou a été supprimé.</p>
              <div className="mt-6">
                <Link
                  href={session?.user?.role === 'client' ? '/dashboard/client' : '/dashboard/pro'}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retour au tableau de bord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a le droit de voir ce devis
  if (!isQuoteParticipant()) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Accès refusé</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous n'avez pas l'autorisation de consulter ce devis.
              </p>
              <div className="mt-6">
                <Link
                  href={session?.user?.role === 'client' ? '/dashboard/client' : '/dashboard/pro'}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retour au tableau de bord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Entête du devis */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {quote.title}
              </h1>
              <div className="mt-1 flex items-center">
                {getStatusBadge()}
                <span className="ml-2 text-sm text-gray-500">
                  Devis créé le {new Date(quote.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href={session?.user?.role === 'client' ? '/dashboard/client' : '/dashboard/pro'}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </div>
          
          {/* Informations sur le devis */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {isQuoteClient() && professional && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FiUser className="mr-2" /> Professionnel
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {professional.companyName || professional.name}
                  </dd>
                </div>
              )}
              
              {isQuoteProfessional() && client && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FiUser className="mr-2" /> Client
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.name}
                  </dd>
                </div>
              )}
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiCalendar className="mr-2" /> Valable jusqu'au
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(quote.validUntil).toLocaleDateString()}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiDollarSign className="mr-2" /> Montant total
                </dt>
                <dd className="mt-1 text-sm font-medium text-indigo-600">
                  {quote.totalPrice.toFixed(2)}€
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiClock className="mr-2" /> Durée estimée
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {quote.estimatedDuration || 'Non spécifiée'}
                </dd>
              </div>
              
              {project && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Projet associé</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900">
                      {project.title}
                    </Link>
                  </dd>
                </div>
              )}
              
              <div className="sm:col-span-3">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {quote.description}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Actions disponibles en fonction du rôle et du statut */}
          {quote.status === 'pending' && (
            <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
              <div className="flex flex-wrap gap-3">
                {isQuoteClient() && (
                  <>
                    <button
                      onClick={() => openConfirmModal('accept')}
                      disabled={!canAcceptQuote()}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                        canAcceptQuote()
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    >
                      <FiCheckCircle className="mr-1.5 -ml-0.5" /> Accepter ce devis
                    </button>
                    
                    <button
                      onClick={() => openConfirmModal('reject')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FiXCircle className="mr-1.5 -ml-0.5" /> Refuser
                    </button>
                    
                    {!canAcceptQuote() && ['forfait1', 'forfait2'].includes(subscription?.planId) && (
                      <div className="w-full mt-2 text-xs text-yellow-600">
                        Pour accepter ce devis, vous devez être abonné au forfait Premium ou Excellence.
                        <Link href="/abonnements" className="ml-1 underline">
                          Mettre à niveau mon abonnement
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Détails des matériaux */}
        {quote.materials && quote.materials.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Matériaux et fournitures
              </h2>
            </div>
            <div className="border-t border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Désignation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quote.materials.map((material, index) => (
                    <tr key={material.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {material.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {material.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {material.unitPrice.toFixed(2)}€
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {material.totalPrice.toFixed(2)}€
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      Sous-total matériaux:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quote.materialsCost.toFixed(2)}€
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Récapitulatif des coûts */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Récapitulatif
            </h2>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Coût des matériaux</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.materialsCost.toFixed(2)}€</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Coût de la main d'œuvre</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.laborCost.toFixed(2)}€</dd>
              </div>
              <div className="sm:col-span-2 border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Total</dt>
                <dd className="mt-1 text-base font-medium text-indigo-600">{quote.totalPrice.toFixed(2)}€</dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Notes supplémentaires */}
        {quote.notes && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Notes supplémentaires
              </h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation */}
      {confirmModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    confirmAction === 'accept' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {confirmAction === 'accept' ? (
                      <FiCheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <FiXCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {confirmAction === 'accept' ? 'Accepter le devis' : 'Refuser le devis'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {confirmAction === 'accept' 
                          ? 'Êtes-vous sûr de vouloir accepter ce devis ? Cette action créera un projet avec ce professionnel.'
                          : 'Êtes-vous sûr de vouloir refuser ce devis ? Cette action ne peut pas être annulée.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={actionInProgress}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${
                    confirmAction === 'accept' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={confirmAction === 'accept' ? handleAcceptQuote : handleRejectQuote}
                >
                  {actionInProgress 
                    ? 'Traitement en cours...' 
                    : confirmAction === 'accept' ? 'Accepter' : 'Refuser'}
                </button>
                <button
                  type="button"
                  disabled={actionInProgress}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setConfirmModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}