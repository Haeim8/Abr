'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sector, setSector] = useState('');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fonction pour charger les projets récents/exemples
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/projects/showcase');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        } else {
          console.error('Erreur lors du chargement des projets');
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Liste des secteurs/corps de métier
  const sectors = [
    { id: 'plomberie', name: 'Plomberie' },
    { id: 'electricite', name: 'Électricité' },
    { id: 'peinture', name: 'Peinture' },
    { id: 'menuiserie', name: 'Menuiserie' },
    { id: 'maconnerie', name: 'Maçonnerie' },
    { id: 'jardinage', name: 'Jardinage' },
    { id: 'renovation', name: 'Rénovation générale' },
    { id: 'autre', name: 'Autre' }
  ];

  // Gérer la soumission de la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Construire l'URL de recherche
    let searchUrl = '/offres?';
    if (searchTerm) searchUrl += `q=${encodeURIComponent(searchTerm)}`;
    if (sector) searchUrl += `${searchTerm ? '&' : ''}sector=${encodeURIComponent(sector)}`;
    
    router.push(searchUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section héro avec moteur de recherche */}
      <div className="bg-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl mb-8">
              Trouvez le professionnel idéal pour vos projets
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-indigo-200 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Comparez les professionnels, consultez leurs réalisations et obtenez des devis adaptés à vos besoins.
            </p>
            
            <form onSubmit={handleSearch} className="mt-8 max-w-3xl mx-auto">
              <div className="sm:flex">
                <div className="flex-1 min-w-0 sm:mr-3 mb-3 sm:mb-0">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Que recherchez-vous ? (ex: rénovation cuisine, peinture salon...)"
                    className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div className="min-w-0 sm:mr-3 mb-3 sm:mb-0">
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">Tous les métiers</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <button
                    type="submit"
                    className="block w-full px-5 py-3 rounded-md shadow bg-indigo-500 text-white font-medium hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Section des projets récents */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Réalisations récentes
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Découvrez les derniers projets réalisés par nos professionnels
            </p>
          </div>

          {isLoading ? (
            <div className="mt-12 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-12 text-center text-gray-500">
              Aucun projet à afficher pour le moment
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div key={project._id} className="overflow-hidden rounded-lg shadow-lg bg-white">
                  {project.photos && project.photos.length > 0 ? (
                    <div className="h-48 w-full relative">
                      <img
                        src={project.photos[0]}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">Pas d'image disponible</p>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500">{project.category}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {project.finalCost ? `${project.finalCost}€` : (project.estimatedCost ? `${project.estimatedCost}€` : 'Prix sur demande')}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">{project.description}</p>
                    <div className="mt-4">
                      <span className="text-xs font-medium text-gray-500">Réalisé par:</span>
                      <p className="text-sm font-medium text-indigo-600">{project.professional?.name || 'Professionnel'}</p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/projects/${project._id}`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Voir les détails
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Voir plus de réalisations
            </Link>
          </div>
        </div>
      </div>

      {/* Section des avantages */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Pourquoi choisir Khaja ?
            </h2>
          </div>
          
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="rounded-md bg-indigo-100 p-3 inline-block">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Des professionnels vérifiés</h3>
              <p className="mt-2 text-base text-gray-500">
                Tous nos artisans sont vérifiés et validés par notre équipe. Leurs certifications et assurances sont contrôlées.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="rounded-md bg-indigo-100 p-3 inline-block">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Devis instantanés</h3>
              <p className="mt-2 text-base text-gray-500">
                Obtenez des devis en quelques clics grâce à notre système automatisé basé sur les tarifs réels des professionnels.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="rounded-md bg-indigo-100 p-3 inline-block">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Épargne projet</h3>
              <p className="mt-2 text-base text-gray-500">
                Économisez progressivement pour vos projets de rénovation grâce à notre système d'abonnement et de cagnotte dédiée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}