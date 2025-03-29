'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiUser, FiCalendar, FiMapPin, FiDollarSign, FiClock, FiCheckCircle, FiMessageCircle, FiUpload, FiStar } from 'react-icons/fi';

export default function ProjectDetails({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const projectId = params.id;
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [messages, setMessages] = useState([]);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);

  // Rediriger si non connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Charger les données du projet
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        // Charger les détails du projet
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error('Projet non trouvé');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);
        
        // Charger les messages liés au projet
        const messagesResponse = await fetch(`/api/projects/${projectId}/messages`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages || []);
        }
      } catch (err) {
        setError(err.message);
        console.error('Erreur lors du chargement des données:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);

  // Vérifier si l'utilisateur est le propriétaire ou le professionnel de ce projet
  const isProjectParticipant = () => {
    if (!project || !session) return false;
    
    return (
      (session.user.role === 'client' && project.clientId === session.user.id) ||
      (session.user.role === 'professional' && project.professionalId === session.user.id)
    );
  };

  // Vérifier si l'utilisateur est le client de ce projet
  const isProjectClient = () => {
    if (!project || !session) return false;
    return session.user.role === 'client' && project.clientId === session.user.id;
  };

  // Vérifier si l'utilisateur est le professionnel de ce projet
  const isProjectProfessional = () => {
    if (!project || !session) return false;
    return session.user.role === 'professional' && project.professionalId === session.user.id;
  };

  // Gérer l'upload des images
  const handleImageUpload = async (e) => {
    e.preventDefault();
    
    if (!beforeImage && !afterImage) {
      return;
    }
    
    setButtonLoading(true);
    
    try {
      const formData = new FormData();
      if (beforeImage) formData.append('beforeImage', beforeImage);
      if (afterImage) formData.append('afterImage', afterImage);
      
      const response = await fetch(`/api/projects/${projectId}/images`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload des images');
      }
      
      // Mettre à jour les images dans le state du projet
      const result = await response.json();
      setProject(prevProject => ({
        ...prevProject,
        beforeImageUrl: result.beforeImageUrl || prevProject.beforeImageUrl,
        afterImageUrl: result.afterImageUrl || prevProject.afterImageUrl
      }));
      
      setUploadSuccess(true);
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadSuccess(false);
        setBeforeImage(null);
        setAfterImage(null);
      }, 2000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'upload des images');
    } finally {
      setButtonLoading(false);
    }
  };

  // Soumettre une évaluation
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating || !review.trim()) {
      return;
    }
    
    setButtonLoading(true);
    
    try {
      const response = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          rating,
          comment: review,
          recipientId: isProjectClient() ? project.professionalId : project.clientId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la soumission de l\'avis');
      }
      
      setReviewSuccess(true);
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewSuccess(false);
        setRating(5);
        setReview('');
      }, 2000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la soumission de l\'avis');
    } finally {
      setButtonLoading(false);
    }
  };

  // Envoyer un message
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }
    
    setButtonLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          recipientId: isProjectClient() ? project.professionalId : project.clientId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }
      
      // Ajouter le message à la liste
      const newMessage = await response.json();
      setMessages([...messages, newMessage]);
      
      setMessageSuccess(true);
      setMessage('');
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        setMessageModalOpen(false);
        setMessageSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setButtonLoading(false);
    }
  };

  // Marquer un projet comme terminé (pour les professionnels)
  const handleCompleteProject = async () => {
    if (!isProjectProfessional() || project.status === 'completed') {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la complétion du projet');
      }
      
      // Mettre à jour le statut du projet
      setProject(prevProject => ({
        ...prevProject,
        status: 'completed',
        completedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la complétion du projet');
    }
  };

  // Valider un projet terminé (pour les clients)
  const handleValidateProject = async () => {
    if (!isProjectClient() || project.status !== 'completed' || project.validated) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/validate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la validation du projet');
      }
      
      // Mettre à jour le statut du projet
      setProject(prevProject => ({
        ...prevProject,
        validated: true,
        validatedAt: new Date().toISOString()
      }));
      
      // Ouvrir le modal d'évaluation
      setReviewModalOpen(true);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la validation du projet');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement du projet...</p>
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

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Projet non trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">Le projet demandé n'existe pas ou a été supprimé.</p>
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

  // Vérifier si l'utilisateur a le droit de voir ce projet
  if (!isProjectParticipant()) {
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
                Vous n'avez pas l'autorisation de consulter ce projet.
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

  // Fonction pour afficher le statut du projet
  const getStatusBadge = () => {
    switch (project.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            En attente
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Programmé
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            En cours
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Terminé
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Annulé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {project.status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Entête du projet */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {project.title}
              </h1>
              <div className="mt-1 flex items-center">
                {getStatusBadge()}
                {project.validated && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FiCheckCircle className="mr-1" /> Validé par le client
                  </span>
                )}
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
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiUser className="mr-2" />
                  {isProjectClient() ? 'Professionnel' : 'Client'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isProjectClient() ? project.professionalName : project.clientName}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiCalendar className="mr-2" /> Date de la demande
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiMapPin className="mr-2" /> Adresse
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {project.address || 'Non spécifiée'}
                </dd>
              </div>
              
              {project.scheduledDate && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FiCalendar className="mr-2" /> Date programmée
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(project.scheduledDate).toLocaleDateString()}{' '}
                    {project.timeSlot && `(${project.timeSlot})`}
                  </dd>
                </div>
              )}
              
              {project.price && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FiDollarSign className="mr-2" /> Prix
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.price}€
                  </dd>
                </div>
              )}
              
              {project.serviceType && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FiClock className="mr-2" /> Type de service
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.serviceType}
                  </dd>
                </div>
              )}
              
              {project.area && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Surface</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.area} m²
                  </dd>
                </div>
              )}
              
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {project.description || 'Aucune description fournie'}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Actions disponibles en fonction du rôle et du statut */}
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap gap-3">
              {/* Bouton pour envoyer un message */}
              <button
                onClick={() => setMessageModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiMessageCircle className="mr-1.5 -ml-0.5" /> Envoyer un message
              </button>
              
              {/* Pour les professionnels: Uploader des photos et marquer comme terminé */}
              {isProjectProfessional() && project.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FiUpload className="mr-1.5 -ml-0.5" /> Uploader des photos
                  </button>
                  
                  <button
                    onClick={handleCompleteProject}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FiCheckCircle className="mr-1.5 -ml-0.5" /> Marquer comme terminé
                  </button>
                </>
              )}
              
              {/* Pour les clients: Valider un projet terminé */}
              {isProjectClient() && project.status === 'completed' && !project.validated && (
                <button
                  onClick={handleValidateProject}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FiCheckCircle className="mr-1.5 -ml-0.5" /> Valider le projet
                </button>
              )}
              
              {/* Pour les clients: Laisser un avis (projet validé) */}
              {isProjectClient() && project.validated && !project.reviewSubmitted && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <FiStar className="mr-1.5 -ml-0.5" /> Laisser un avis
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Galerie de photos avant/après */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Photos avant/après
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Visualisez la progression du projet.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Avant</h3>
                {project.beforeImageUrl ? (
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <Image
                      src={project.beforeImageUrl}
                      alt="Avant"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-500">
                      Aucune photo avant disponible
                    </p>
                    {isProjectProfessional() && (
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Uploader une photo
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Après</h3>
                {project.afterImageUrl ? (
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <Image
                      src={project.afterImageUrl}
                      alt="Après"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2a 2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-500">
                      Aucune photo après disponible
                    </p>
                    {isProjectProfessional() && project.status === 'completed' && (
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Uploader une photo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Messages
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Communiquez avec {isProjectClient() ? 'le professionnel' : 'le client'}.
              </p>
            </div>
            <button
              onClick={() => setMessageModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiMessageCircle className="mr-1.5 -ml-0.5" /> Nouveau message
            </button>
          </div>
          <div className="border-t border-gray-200">
            {messages.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="mt-1 text-sm text-gray-500">
                  Aucun message pour le moment.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {messages.map((msg) => (
                  <li key={msg.id} className="px-4 py-4">
                    <div className={`flex ${msg.senderId === session.user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-lg rounded-lg px-4 py-2 ${
                        msg.senderId === session.user.id
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm">
                          <span className="font-medium">
                            {msg.senderId === session.user.id ? 'Vous' : msg.senderName}
                          </span>
                          <span className="mx-1 text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1">{msg.message}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'upload des images */}
      {uploadModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Upload des photos
                    </h3>
                    <div className="mt-2">
                      {uploadSuccess ? (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <FiCheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-700">
                                Photos téléchargées avec succès !
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleImageUpload} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Photo avant
                            </label>
                            <div className="mt-1 flex justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-md">
                              <div className="space-y-1 text-center">
                                {beforeImage ? (
                                  <p className="text-sm text-gray-600">{beforeImage.name}</p>
                                ) : (
                                  <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                      <label htmlFor="before-image" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                        <span>Télécharger une photo</span>
                                        <input
                                          id="before-image"
                                          name="before-image"
                                          type="file"
                                          className="sr-only"
                                          accept="image/*"
                                          onChange={(e) => setBeforeImage(e.target.files[0])}
                                        />
                                      </label>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      PNG, JPG, GIF jusqu'à 10MB
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Photo après
                            </label>
                            <div className="mt-1 flex justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-md">
                              <div className="space-y-1 text-center">
                                {afterImage ? (
                                  <p className="text-sm text-gray-600">{afterImage.name}</p>
                                ) : (
                                  <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                      <label htmlFor="after-image" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                        <span>Télécharger une photo</span>
                                        <input
                                          id="after-image"
                                          name="after-image"
                                          type="file"
                                          className="sr-only"
                                          accept="image/*"
                                          onChange={(e) => setAfterImage(e.target.files[0])}
                                        />
                                      </label>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      PNG, JPG, GIF jusqu'à 10MB
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {uploadSuccess ? (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setUploadModalOpen(false);
                      setUploadSuccess(false);
                    }}
                  >
                    Fermer
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={buttonLoading || (!beforeImage && !afterImage)}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleImageUpload}
                    >
                      {buttonLoading ? 'Envoi en cours...' : 'Envoyer'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setUploadModalOpen(false)}
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'évaluation */}
      {reviewModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Évaluer le travail du professionnel
                    </h3>
                    <div className="mt-2">
                      {reviewSuccess ? (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <FiCheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-700">
                                Merci pour votre évaluation !
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Note
                            </label>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="text-2xl focus:outline-none"
                                >
                                  <FiStar
                                    className={`h-6 w-6 ${
                                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label htmlFor="review" className="block text-sm font-medium text-gray-700">
                              Commentaire
                            </label>
                            <textarea
                              id="review"
                              name="review"
                              rows={4}
                              value={review}
                              onChange={(e) => setReview(e.target.value)}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="Partagez votre expérience..."
                              required
                            />
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {reviewSuccess ? (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setReviewModalOpen(false);
                      setReviewSuccess(false);
                    }}
                  >
                    Fermer
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={buttonLoading || !review.trim()}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleReviewSubmit}
                    >
                      {buttonLoading ? 'Envoi en cours...' : 'Envoyer'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setReviewModalOpen(false)}
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de message */}
      {messageModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Envoyer un message
                    </h3>
                    <div className="mt-2">
                      {messageSuccess ? (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <FiCheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-700">
                                Message envoyé avec succès !
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleMessageSubmit} className="space-y-4">
                          <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                              Message
                            </label>
                            <textarea
                              id="message"
                              name="message"
                              rows={4}
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="Écrivez votre message ici..."
                              required
                            />
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {messageSuccess ? (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setMessageModalOpen(false);
                      setMessageSuccess(false);
                    }}
                  >
                    Fermer
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={buttonLoading || !message.trim()}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleMessageSubmit}
                    >
                      {buttonLoading ? 'Envoi en cours...' : 'Envoyer'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setMessageModalOpen(false)}
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}