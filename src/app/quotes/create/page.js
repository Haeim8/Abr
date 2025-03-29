'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiAlertTriangle, FiCheck, FiInfo } from 'react-icons/fi';

function CreateQuoteContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
  
    const jobId = searchParams.get('jobId') || '';
    const clientId = searchParams.get('clientId') || '';
  
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Formulaire de devis
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materials: [],
    laborCost: 0,
    materialsCost: 0,
    totalPrice: 0,
    estimatedDuration: '',
    validUntil: '',
    notes: ''
  });
  
  // Matériau en cours d'ajout
  const [material, setMaterial] = useState({
    name: '',
    quantity: 1,
    unitPrice: 0
  });

  // Rediriger si non connecté ou pas un professionnel
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session.user.role !== 'professional') {
      router.push('/dashboard/client');
    }
  }, [status, session, router]);

  // Charger les détails du projet ou du client
  useEffect(() => {
    const fetchInitialData = async () => {
      if (status !== 'authenticated') return;
      
      setIsLoading(true);
      try {
        if (jobId) {
          // Charger les détails du projet
          const projectResponse = await fetch(`/api/projects/${jobId}`);
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            setProject(projectData);
            
            // Pré-remplir le formulaire avec les informations du projet
            setFormData(prev => ({
              ...prev,
              title: `Devis pour ${projectData.title || 'travaux'}`,
              description: projectData.description || '',
              // Date de validité par défaut: 30 jours à partir d'aujourd'hui
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }));
            
            // Charger les informations du client
            if (projectData.clientId) {
              const clientResponse = await fetch(`/api/users/${projectData.clientId}`);
              if (clientResponse.ok) {
                const clientData = await clientResponse.json();
                setClient(clientData);
              }
            }
          }
        } else if (clientId) {
          // Charger uniquement les informations du client
          const clientResponse = await fetch(`/api/users/${clientId}`);
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            setClient(clientData);
            
            // Pré-remplir le formulaire avec un titre générique
            setFormData(prev => ({
              ...prev,
              title: `Devis pour ${clientData.name || 'client'}`,
              // Date de validité par défaut: 30 jours à partir d'aujourd'hui
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }));
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données initiales');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [status, jobId, clientId]);

  // Gestion des changements du formulaire principal
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Recalculer le prix total si les coûts changent
    if (name === 'laborCost' || name === 'materialsCost') {
      setFormData(prev => ({
        ...prev,
        totalPrice: (prev.laborCost || 0) + (prev.materialsCost || 0)
      }));
    }
  };

  // Gestion des changements du formulaire de matériau
  const handleMaterialChange = (e) => {
    const { name, value, type } = e.target;
    
    setMaterial(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Ajouter un matériau à la liste
  const handleAddMaterial = () => {
    if (!material.name || material.quantity <= 0 || material.unitPrice <= 0) {
      return;
    }
    
    const newMaterial = {
      ...material,
      id: Date.now().toString(), // ID unique temporaire
      totalPrice: material.quantity * material.unitPrice
    };
    
    // Ajouter le matériau à la liste
    setFormData(prev => {
      const updatedMaterials = [...prev.materials, newMaterial];
      
      // Recalculer le coût total des matériaux
      const newMaterialsCost = updatedMaterials.reduce((sum, mat) => sum + mat.totalPrice, 0);
      
      return {
        ...prev,
        materials: updatedMaterials,
        materialsCost: newMaterialsCost,
        totalPrice: prev.laborCost + newMaterialsCost
      };
    });
    
    // Réinitialiser le formulaire de matériau
    setMaterial({
      name: '',
      quantity: 1,
      unitPrice: 0
    });
  };

  // Supprimer un matériau de la liste
  const handleRemoveMaterial = (materialId) => {
    setFormData(prev => {
      const updatedMaterials = prev.materials.filter(mat => mat.id !== materialId);
      
      // Recalculer le coût total des matériaux
      const newMaterialsCost = updatedMaterials.reduce((sum, mat) => sum + mat.totalPrice, 0);
      
      return {
        ...prev,
        materials: updatedMaterials,
        materialsCost: newMaterialsCost,
        totalPrice: prev.laborCost + newMaterialsCost
      };
    });
  };

  // Soumettre le devis
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.totalPrice || !formData.validUntil) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const quoteData = {
        ...formData,
        projectId: jobId || null,
        clientId: clientId || (project ? project.clientId : null)
      };
      
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du devis');
      }
      
      // Devis créé avec succès
      setSuccess(true);
      
      // Rediriger vers le tableau de bord après 3 secondes
      setTimeout(() => {
        router.push('/dashboard/pro');
      }, 3000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue lors de la création du devis');
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
              <h1 className="text-lg font-medium leading-6 text-gray-900">Créer un devis</h1>
              <p className="mt-1 text-sm text-gray-600">
                Proposez un devis détaillé pour le client.
              </p>
              
              {/* Informations sur le client et le projet */}
              {(client || project) && (
                <div className="mt-6 overflow-hidden bg-white shadow sm:rounded-lg">
                  {client && (
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-sm font-medium text-gray-900">Client</h3>
                      <p className="mt-1 max-w-2xl text-xs text-gray-500">{client.name}</p>
                      {client.address && (
                        <p className="mt-1 max-w-2xl text-xs text-gray-500">
                          {client.address}, {client.postalCode} {client.city}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {project && (
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <h3 className="text-sm font-medium text-gray-900">Projet</h3>
                      <p className="mt-1 max-w-2xl text-xs text-gray-500">{project.title}</p>
                      {project.description && (
                        <p className="mt-1 max-w-2xl text-xs text-gray-500 line-clamp-3">
                          {project.description}
                        </p>
                      )}
                      {project.area && (
                        <p className="mt-1 max-w-2xl text-xs text-gray-500">
                          Surface: {project.area} m²
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
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
                          Un devis bien détaillé augmente vos chances d'être sélectionné par le client.
                        </p>
                        <p className="mt-1">
                          N'hésitez pas à inclure tous les matériaux nécessaires et à expliquer votre méthode de travail.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                        <h3 className="text-sm font-medium text-green-800">Devis créé avec succès</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Votre devis a été envoyé au client. Vous allez être redirigé vers votre tableau de bord.</p>
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
                    {/* Titre du devis */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Titre du devis *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Décrivez les travaux à réaliser, votre méthode de travail, etc."
                        required
                      />
                    </div>
                    
                    {/* Durée estimée */}
                    <div>
                      <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700">
                        Durée estimée *
                      </label>
                      <input
                        type="text"
                        name="estimatedDuration"
                        id="estimatedDuration"
                        value={formData.estimatedDuration}
                        onChange={handleChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ex: 3 jours, 2 semaines, etc."
                        required
                      />
                    </div>
                    
                    {/* Date de validité */}
                    <div>
                      <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                        Devis valable jusqu'au *
                      </label>
                      <input
                        type="date"
                        name="validUntil"
                        id="validUntil"
                        value={formData.validUntil}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    {/* Section Matériaux */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Matériaux</h3>
                      
                      {/* Liste des matériaux ajoutés */}
                      {formData.materials.length > 0 && (
                        <div className="mb-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Désignation</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantité</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Prix unitaire</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {formData.materials.map((mat) => (
                                <tr key={mat.id}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    {mat.name}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{mat.quantity}</td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{mat.unitPrice.toFixed(2)}€</td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{mat.totalPrice.toFixed(2)}€</td>
                                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMaterial(mat.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Supprimer
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {/* Formulaire d'ajout de matériau */}
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="material-name" className="block text-sm font-medium text-gray-700">
                            Désignation
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="material-name"
                            value={material.name}
                            onChange={handleMaterialChange}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="sm:col-span-1">
                          <label htmlFor="material-quantity" className="block text-sm font-medium text-gray-700">
                            Quantité
                          </label>
                          <input
                            type="number"
                            name="quantity"
                            id="material-quantity"
                            min="1"
                            value={material.quantity}
                            onChange={handleMaterialChange}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="sm:col-span-1">
                          <label htmlFor="material-price" className="block text-sm font-medium text-gray-700">
                            Prix unitaire (€)
                          </label>
                          <input
                            type="number"
                            name="unitPrice"
                            id="material-price"
                            min="0"
                            step="0.01"
                            value={material.unitPrice}
                            onChange={handleMaterialChange}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="sm:col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={handleAddMaterial}
                            disabled={!material.name || material.quantity <= 0 || material.unitPrice <= 0}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Coût de la main d'œuvre */}
                    <div>
                      <label htmlFor="laborCost" className="block text-sm font-medium text-gray-700">
                        Coût de la main d'œuvre (€) *
                      </label>
                      <input
                        type="number"
                        name="laborCost"
                        id="laborCost"
                        min="0"
                        step="0.01"
                        value={formData.laborCost}
                        onChange={handleChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    {/* Notes supplémentaires */}
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes supplémentaires
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Conditions particulières, garanties, etc."
                      />
                    </div>
                    
                    {/* Récapitulatif des coûts */}
                    <div className="bg-gray-50 rounded-md p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-4">Récapitulatif</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Coût des matériaux</dt>
                          <dd className="text-sm font-medium text-gray-900">{formData.materialsCost.toFixed(2)}€</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Coût de la main d'œuvre</dt>
                          <dd className="text-sm font-medium text-gray-900">{formData.laborCost.toFixed(2)}€</dd>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
                          <dt className="text-base text-gray-900">Total</dt>
                          <dd className="text-base text-indigo-600">{formData.totalPrice.toFixed(2)}€</dd>
                        </div>
                      </dl>
                    </div>
                    
                    {/* Boutons */}
                    <div className="flex justify-end space-x-3">
                      <Link
                        href="/dashboard/pro"
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Annuler
                      </Link>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {submitting ? 'Envoi en cours...' : 'Envoyer le devis'}
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
export default function CreateQuote() {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
        </div>
      }>
        <CreateQuoteContent />
      </Suspense>
    );
  }