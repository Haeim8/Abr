'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminProfessionalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [professionals, setProfessionals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // 'pending', 'verified', 'all'
  const [searchTerm, setSearchTerm] = useState('');

  // Rediriger si non connecté ou pas un admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/dashboard/client');
    }
  }, [status, session, router]);

  // Charger les professionnels
  useEffect(() => {
    const fetchProfessionals = async () => {
      if (status !== 'authenticated') return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/professionals?status=${filter}`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des professionnels');
        }
        
        const data = await response.json();
        setProfessionals(data.professionals || []);
      } catch (err) {
        setError(err.message);
        console.error('Erreur:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfessionals();
  }, [filter, status]);

  // Filtrer les professionnels en fonction du terme de recherche
  const filteredProfessionals = searchTerm
    ? professionals.filter(pro => 
        pro.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pro.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pro.professional?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pro.professional?.siret?.includes(searchTerm)
      )
    : professionals;

  // Vérifier un professionnel
  const handleVerifyProfessional = async (professionalId, verified) => {
    try {
      const response = await fetch(`/api/admin/professionals/${professionalId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du professionnel');
      }
      
      // Mettre à jour la liste des professionnels
      setProfessionals(prevProfessionals => 
        prevProfessionals.map(pro => 
          pro._id === professionalId
            ? { ...pro, professional: { ...pro.professional, verified } }
            : pro
        )
      );
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Vérification des professionnels</h1>
            <Link
              href="/dashboard/client"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-medium text-gray-900">Liste des professionnels</h2>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">En attente de vérification</option>
                    <option value="verified">Vérifiés</option>
                    <option value="all">Tous</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {filteredProfessionals.length === 0 ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">Aucun professionnel trouvé.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredProfessionals.map((professional) => (
                <li key={professional._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{professional.name}</h3>
                      <p className="text-sm text-gray-500">{professional.email}</p>
                    </div>
                    <div>
                      {professional.professional?.verified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Vérifié
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          En attente
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex sm:flex-col">
                      <p className="text-sm text-gray-500">
                        Entreprise: {professional.professional?.companyName || 'Non renseigné'}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        SIRET: {professional.professional?.siret || 'Non renseigné'}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Spécialités: {professional.professional?.specialties?.join(', ') || 'Aucune'}
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      {professional.professional?.kbisUrl && (
                        <a
                          href={professional.professional.kbisUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Voir le KBIS
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    {professional.professional?.verified ? (
                      <button
                        onClick={() => handleVerifyProfessional(professional._id, false)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Annuler la vérification
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyProfessional(professional._id, true)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Vérifier
                      </button>
                    )}
                    
                    <Link
                      href={`/admin/professionnels/${professional._id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Voir en détail
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}