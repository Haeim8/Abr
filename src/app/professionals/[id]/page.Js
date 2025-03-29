'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiPhone, FiMail, FiMapPin, FiStar, FiClock, FiCheckCircle, FiAward } from 'react-icons/fi';

export default function ProfessionalProfile({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const professionalId = params.id;
  
  const [professional, setProfessional] = useState(null);
  const [projects, setProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Rediriger si non connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Charger les données du professionnel
  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!professionalId) return;
      
      setIsLoading(true);
      try {
        // Charger le profil du professionnel
        const profileResponse = await fetch(`/api/professionals/${professionalId}`);
        if (!profileResponse.ok) {
          throw new Error('Professionnel non trouvé');
        }
        const profileData = await profileResponse.json();
        setProfessional(profileData);
        
        // Charger les projets réalisés par ce professionnel
        const projectsResponse = await fetch(`/api/projects?professionalId=${professionalId}&status=completed`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
        }
        
        // Charger les avis sur ce professionnel
        const reviewsResponse = await fetch(`/api/reviews?professionalId=${professionalId}`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
        }
        
        // Si l'utilisateur est connecté et est un client, charger son abonnement
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
    
    fetchProfessionalData();
  }, [professionalId, session, status]);

  // Vérifier si le client peut demander un devis (forfait 3 ou 4)
  const canRequestQuote = () => {
    if (!subscription || subscription.status !== 'active') return false;
    return ['forfait3', 'forfait4'].includes(subscription.planId);
  };

  // Calculer la note moyenne
  const calculateAverageRating = () => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  // Envoyer un message au professionnel
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    if (!contactMessage.trim()) {
      return;
    }
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: professionalId,
          message: contactMessage
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }
      
      setContactSuccess(true);
      setContactMessage('');
      
      // Fermer le modal après 3 secondes
      setTimeout(() => {
        setContactModalOpen(false);
        setContactSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'envoi du message');
    }
  };

  // Afficher les détails d'un projet
  const showProjectDetails = (project) => {
    setSelectedProject(project);
    setImageModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement du profil...</p>
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
                  href="/dashboard/client"
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

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Professionnel non trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">Le profil demandé n'existe pas ou a été supprimé.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/client"
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
      <div className="max-w-7xl mx-auto">
        {/* Section Profil */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {professional.companyName || professional.name}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {professional.specialties?.map(specialty => {
                  // Convertir les IDs en noms lisibles
                  const specialtyNames = {
                    'assemblage_meubles': 'Assemblage de meubles',
                    'taille_haie': 'Taille de haie',
                    'tonte_pelouse': 'Tonte de pelouse',
                    'menage_interieur': 'Ménage intérieur',
                    'peinture': 'Peinture',
                    'refection_joint': 'Réfection joint sanitaire',
                    'nettoyage_karcher': 'Nettoyage Karcher',
                    'pose_accessoires': 'Pose d\'accessoires',
                    'entretien_luminaires': 'Entretien luminaires',
                    'plomberie': 'Plomberie',
                    'electricite': 'Électricité',
                    'debroussaillage': 'Débroussaillage',
                    'pose_papier_peint': 'Pose papier peint',
                    'pose_carrelage': 'Pose de carrelage',
                    'pose_parquet': 'Pose de parquet'
                  };
                  return specialtyNames[specialty] || specialty;
                }).join(', ')}
              </p>
            </div>
            <div className="flex items-center">
              <div className="flex items-center text-yellow-400">
                <FiStar className="h-5 w-5 fill-current" />
                <span className="ml-1 text-gray-900 font-bold">{calculateAverageRating()}</span>
              </div>
              <span className="ml-2 text-gray-500">({reviews.length} avis)</span>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiMapPin className="mr-2" /> Localisation
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {professional.city}, {professional.postalCode}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiClock className="mr-2" /> Expérience
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {professional.experience || 'Non spécifiée'}
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">À propos</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {professional.bio || professional.description || 'Aucune description fournie'}
                </dd>
              </div>
            </dl>
          </div>
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {professional.verified ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FiCheckCircle className="mr-1" /> Vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    En attente de vérification
                  </span>
                )}
              </span>
              <div className="flex space-x-3">
                {session?.user?.role === 'client' && (
                  <>
                    <button
                      onClick={() => setContactModalOpen(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiMail className="mr-1.5 -ml-0.5" /> Contacter
                    </button>
                    
                    {canRequestQuote() && (
                      <Link
                        href={`/devis/demander?proId=${professionalId}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Demander un devis
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Galerie de projets */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Réalisations
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Projets terminés avec photos avant/après
            </p>
          </div>
          <div className="border-t border-gray-200">
            {projects.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center">
                <p className="text-gray-500">Aucun projet terminé à afficher</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => showProjectDetails(project)}
                  >
                    {project.beforeImage ? (
                      <div className="relative h-48">
                        <Image
                          src={project.beforeImage}
                          alt={`Avant - ${project.title}`}
                          layout="fill"
                          objectFit="cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                          <div className="p-3 text-white">
                            <h3 className="font-medium text-sm">{project.title}</h3>
                            <p className="text-xs opacity-90">{project.serviceType}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-400">Aucune image</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Avis */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Avis des clients
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Évaluations des clients précédents
            </p>
          </div>
          <div className="border-t border-gray-200">
            {reviews.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center">
                <p className="text-gray-500">Aucun avis pour le moment</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <li key={review.id} className="px-4 py-4">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium text-gray-900">{review.clientName}</div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal Contact */}
      {contactModalOpen && (
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
                      Contacter {professional.name}
                    </h3>
                    <div className="mt-2">
                      {contactSuccess ? (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <FiCheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-700">
                                Votre message a été envoyé avec succès!
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                          <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                              Message
                            </label>
                            <textarea
                              id="message"
                              name="message"
                              rows={4}
                              value={contactMessage}
                              onChange={(e) => setContactMessage(e.target.value)}
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
                {contactSuccess ? (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setContactModalOpen(false);
                      setContactSuccess(false);
                    }}
                  >
                    Fermer
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleContactSubmit}
                    >
                      Envoyer
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setContactModalOpen(false)}
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

      {/* Modal Photos Avant/Après */}
      {imageModalOpen && selectedProject && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {selectedProject.title}
                    </h3>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Avant</p>
                        {selectedProject.beforeImage ? (
                          <div className="relative h-60 rounded overflow-hidden">
                            <Image
                              src={selectedProject.beforeImage}
                              alt="Avant"
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        ) : (
                          <div className="h-60 bg-gray-100 flex items-center justify-center rounded">
                            <p className="text-gray-400">Aucune image</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Après</p>
                        {selectedProject.afterImage ? (
                          <div className="relative h-60 rounded overflow-hidden">
                            <Image
                              src={selectedProject.afterImage}
                              alt="Après"
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        ) : (
                          <div className="h-60 bg-gray-100 flex items-center justify-center rounded">
                            <p className="text-gray-400">Aucune image</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">Description</p>
                      <p className="mt-1 text-sm text-gray-600">{selectedProject.description || 'Aucune description'}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {selectedProject.serviceType}
                      </div>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {new Date(selectedProject.completedAt || selectedProject.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setImageModalOpen(false);
                    setSelectedProject(null);
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}