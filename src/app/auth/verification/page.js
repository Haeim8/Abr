'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

// Schéma de validation pour la vérification
const verificationSchema = z.object({
  idDocument: z.any()
    .refine(value => value?.length > 0, 'Pièce d\'identité requise')
    .refine(
      value => {
        if (value && value[0]) {
          return ['image/jpeg', 'image/png', 'application/pdf'].includes(value[0].type);
        }
        return false;
      },
      'Format invalide. Utilisez JPG, PNG ou PDF'
    ),
  bankInfo: z.any()
    .refine(value => value?.length > 0, 'RIB requis')
    .refine(
      value => {
        if (value && value[0]) {
          return ['image/jpeg', 'image/png', 'application/pdf'].includes(value[0].type);
        }
        return false;
      },
      'Format invalide. Utilisez JPG, PNG ou PDF'
    ),
  // Compétences professionnelles
  skills: z.array(z.string()).min(1, 'Sélectionnez au moins une compétence'),
  hourlyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Taux horaire invalide'),
  availability: z.array(z.object({
    day: z.string(),
    available: z.boolean().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })),
  description: z.string().min(20, 'Description trop courte (minimum 20 caractères)'),
  acceptTerms: z.boolean().refine(val => val === true, 'Vous devez accepter les conditions'),
});

export default function VerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userId = searchParams.get('id') || (session?.user?.id || '');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      skills: [],
      hourlyRate: '',
      availability: [
        { day: 'lundi', available: false, startTime: '08:00', endTime: '18:00' },
        { day: 'mardi', available: false, startTime: '08:00', endTime: '18:00' },
        { day: 'mercredi', available: false, startTime: '08:00', endTime: '18:00' },
        { day: 'jeudi', available: false, startTime: '08:00', endTime: '18:00' },
        { day: 'vendredi', available: false, startTime: '08:00', endTime: '18:00' },
        { day: 'samedi', available: false, startTime: '08:00', endTime: '18:00' },
        { day: 'dimanche', available: false, startTime: '08:00', endTime: '18:00' },
      ],
      description: '',
      acceptTerms: false,
    }
  });

  const idDocument = watch('idDocument');
  const bankInfo = watch('bankInfo');
  const selectedSkills = watch('skills') || [];
  const availability = watch('availability');

  // Liste des compétences disponibles
  const skillsList = [
    { id: 'assemblage_meubles', name: 'Assemblage de meubles' },
    { id: 'taille_haie', name: 'Taille de haie' },
    { id: 'tonte_pelouse', name: 'Tonte de pelouse' },
    { id: 'menage_interieur', name: 'Ménage intérieur' },
    { id: 'peinture', name: 'Peinture' },
    { id: 'refection_joint', name: 'Réfection joint sanitaire' },
    { id: 'nettoyage_karcher', name: 'Nettoyage Karcher' },
    { id: 'pose_accessoires', name: 'Pose d\'accessoires' },
    { id: 'entretien_luminaires', name: 'Entretien luminaires' },
    { id: 'plomberie', name: 'Plomberie' },
    { id: 'electricite', name: 'Électricité' },
    { id: 'debroussaillage', name: 'Débroussaillage' },
    { id: 'pose_papier_peint', name: 'Pose papier peint' },
    { id: 'pose_carrelage', name: 'Pose de carrelage' },
    { id: 'pose_parquet', name: 'Pose de parquet' },
  ];

  // Vérification de l'authentification
  useEffect(() => {
    if (status === 'unauthenticated' && !userId) {
      router.push('/auth/signin');
    }
  }, [status, router, userId]);

  const handleSkillChange = (skillId) => {
    const newSelectedSkills = selectedSkills.includes(skillId)
      ? selectedSkills.filter(id => id !== skillId)
      : [...selectedSkills, skillId];
    
    setValue('skills', newSelectedSkills);
  };

  const handleAvailabilityChange = (index, field, value) => {
    const newAvailability = [...availability];
    newAvailability[index] = {
      ...newAvailability[index],
      [field]: value
    };
    setValue('availability', newAvailability);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    // Créer un FormData pour l'envoi des fichiers
    const formData = new FormData();
    
    // Ajouter l'ID utilisateur
    formData.append('userId', userId);
    
    // Ajouter les fichiers
    if (data.idDocument?.[0]) {
      formData.append('idDocument', data.idDocument[0]);
    }
    
    if (data.bankInfo?.[0]) {
      formData.append('bankInfo', data.bankInfo[0]);
    }
    
    // Ajouter les autres données
    formData.append('skills', JSON.stringify(data.skills));
    formData.append('hourlyRate', data.hourlyRate);
    formData.append('availability', JSON.stringify(data.availability));
    formData.append('description', data.description);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Une erreur est survenue lors de la vérification');
      }

      setSuccess('Documents soumis avec succès ! Votre compte est en attente de vérification par nos administrateurs.');
      
      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/dashboard/pro?pending=true');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="spinner border-t-4 border-indigo-500 rounded-full w-12 h-12 animate-spin"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Vérification de votre compte professionnel
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Veuillez compléter votre profil et fournir les documents nécessaires pour la vérification
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
                <span className="ml-2 text-sm font-medium text-gray-900">Inscription</span>
              </div>
              <div className="w-12 h-1 bg-indigo-600"></div>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Vérification</span>
              </div>
              <div className="w-12 h-1 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 text-gray-500 font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Validation</span>
              </div>
            </div>
          </div>

          {/* Formulaire */}
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
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Section documents */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Documents requis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pièce d'identité */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pièce d'identité (CNI, Passeport)
                    </label>
                    <div className="mt-1 flex justify-center px-6 py-4 border-2 border-dashed rounded-md border-gray-300 hover:border-indigo-500 transition-colors">
                      <div className="space-y-1 text-center">
                        {idDocument && idDocument[0] ? (
                          <p className="text-sm text-gray-600">
                            Fichier sélectionné: <span className="font-medium">{idDocument[0].name}</span>
                          </p>
                        ) : (
                          <>
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-sm text-gray-600">
                              Cliquez ou déposez un fichier ici
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG ou PDF (max 5MB)
                            </p>
                          </>
                        )}
                        <input 
                          id="idDocument" 
                          type="file" 
                          className="sr-only"
                          {...register('idDocument')}
                          accept=".jpg,.jpeg,.png,.pdf"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('idDocument').click()}
                          className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Sélectionner un fichier
                        </button>
                      </div>
                    </div>
                    {errors.idDocument && (
                      <p className="mt-1 text-sm text-red-600">{errors.idDocument.message}</p>
                    )}
                  </div>

                  {/* RIB */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relevé d'identité bancaire (RIB)
                    </label>
                    <div className="mt-1 flex justify-center px-6 py-4 border-2 border-dashed rounded-md border-gray-300 hover:border-indigo-500 transition-colors">
                      <div className="space-y-1 text-center">
                        {bankInfo && bankInfo[0] ? (
                          <p className="text-sm text-gray-600">
                            Fichier sélectionné: <span className="font-medium">{bankInfo[0].name}</span>
                          </p>
                        ) : (
                          <>
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-sm text-gray-600">
                              Cliquez ou déposez un fichier ici
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG ou PDF (max 5MB)
                            </p>
                          </>
                        )}
                        <input 
                          id="bankInfo" 
                          type="file" 
                          className="sr-only"
                          {...register('bankInfo')}
                          accept=".jpg,.jpeg,.png,.pdf"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('bankInfo').click()}
                          className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Sélectionner un fichier
                        </button>
                      </div>
                    </div>
                    {errors.bankInfo && (
                      <p className="mt-1 text-sm text-red-600">{errors.bankInfo.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section compétences */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Compétences professionnelles</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Taux horaire */}
                  <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                      Taux horaire (€)
                    </label>
                    <div className="mt-1">
                      <input
                        id="hourlyRate"
                        type="text"
                        {...register('hourlyRate')}
                        placeholder="45.00"
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.hourlyRate ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      />
                      {errors.hourlyRate && (
                        <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Compétences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionnez vos compétences
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {skillsList.map((skill) => (
                        <div key={skill.id} className="flex items-center">
                          <input
                            id={`skill-${skill.id}`}
                            type="checkbox"
                            value={skill.id}
                            checked={selectedSkills.includes(skill.id)}
                            onChange={() => handleSkillChange(skill.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`skill-${skill.id}`}
                            className="ml-2 block text-sm text-gray-700"
                          >
                            {skill.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.skills && (
                      <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section disponibilité */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Disponibilité</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jour
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Disponible
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Début
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availability.map((day, index) => (
                        <tr key={day.day}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <input
                              type="checkbox"
                              checked={day.available}
                              onChange={(e) => handleAvailabilityChange(index, 'available', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                              disabled={!day.available}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                              disabled={!day.available}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Description professionnelle */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description professionnelle
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={4}
                    {...register('description')}
                    placeholder="Décrivez votre expérience, vos qualifications et les services que vous proposez..."
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Conditions d'exercice */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    {...register('acceptTerms')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="font-medium text-gray-700">
                    J'accepte les conditions d'exercice
                  </label>
                  <p className="text-gray-500">
                    Je certifie être en règle avec la législation française pour exercer mon activité professionnelle
                    et j'accepte les conditions générales d'utilisation de la plateforme.
                  </p>
                  {errors.acceptTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
                  )}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/dashboard/pro"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ignorer pour l'instant
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Envoi en cours...' : 'Soumettre pour vérification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}