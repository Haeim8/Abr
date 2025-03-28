'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

// Schéma de validation Zod modifié
const signupSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['client', 'professional'], {
    required_error: 'Veuillez sélectionner un rôle',
  }),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Format de téléphone invalide (ex: 0612345678)'),
  address: z.string().optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal à 5 chiffres requis'),
  city: z.string().min(1, 'Ville requise'),
  companyName: z.string().optional(),
  siret: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  termsAccepted: z.boolean().refine(value => value === true, 'Vous devez accepter les conditions d\'utilisation'),
});

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('client');
  const [step, setStep] = useState(1); // Étape du formulaire (1: infos de base, 2: vérification)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'client',
      specialties: [],
      termsAccepted: false,
    },
  });

  // Surveiller le rôle sélectionné
  const role = watch('role');

  // Liste des spécialités disponibles
  const specialtiesList = [
    'Peinture', 'Plomberie', 'Électricité', 'Maçonnerie', 
    'Menuiserie', 'Carrelage', 'Couverture', 'Chauffage',
    'Isolation', 'Rénovation', 'Décoration', 'Jardinage',
    'Nettoyage', 'Débroussaillage', 'Tonte de pelouse', 'Taille de haie'
  ];
  
  // Liste des forfaits disponibles (pour les clients)
  const subscriptionPlans = [
    { id: 'forfait1', name: 'Forfait 1', price: '39€/mois', description: '1 tâche par mois' },
    { id: 'forfait2', name: 'Forfait 2', price: '99€/mois', description: '3 tâches par mois' },
    { id: 'forfait3', name: 'Forfait 3', price: '139€/mois', description: '3 tâches + dépannage serrurier' },
    { id: 'forfait4', name: 'Forfait 4', price: '189€/mois', description: '3 tâches + dépannage serrurier et plomberie' },
  ];
  
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const nextStep = () => {
    setStep(2);
  };

  const prevStep = () => {
    setStep(1);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Une erreur est survenue lors de l\'inscription');
      }
      
      if (role === 'professional') {
        // Pour les professionnels, redirection vers la page de vérification
        router.push('/auth/verification?id=' + result.userId);
      } else {
        // Pour les clients, redirection vers la page de sélection d'abonnement
        router.push('/abonnements?id=' + result.userId);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 1: Informations de base
  const renderStepOne = () => (
    <>
      {/* Type de compte */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Type de compte</label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <button
              type="button"
              className={`w-full py-2 px-4 rounded-md focus:outline-none ${
                role === 'client'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
              onClick={() => handleRoleChange('client')}
            >
              Particulier
            </button>
          </div>
          <div>
            <button
              type="button"
              className={`w-full py-2 px-4 rounded-md focus:outline-none ${
                role === 'professional'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
              onClick={() => handleRoleChange('professional')}
            >
              Professionnel
            </button>
          </div>
        </div>
        <input type="hidden" {...register('role')} />
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Nom complet */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nom complet*
        </label>
        <div className="mt-1">
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Adresse email*
        </label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Mot de passe */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mot de passe*
        </label>
        <div className="mt-1">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      </div>

      {/* Téléphone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Téléphone*
        </label>
        <div className="mt-1">
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0612345678"
            {...register('phone')}
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Adresse */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Adresse
        </label>
        <div className="mt-1">
          <input
            id="address"
            type="text"
            autoComplete="street-address"
            {...register('address')}
            className={`appearance-none block w-full px-3 py-2 border ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>
      </div>

      {/* Code postal et ville sur la même ligne */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            Code postal*
          </label>
          <div className="mt-1">
            <input
              id="postalCode"
              type="text"
              autoComplete="postal-code"
              {...register('postalCode')}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.postalCode ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Ville*
          </label>
          <div className="mt-1">
            <input
              id="city"
              type="text"
              autoComplete="address-level2"
              {...register('city')}
              className={`appearance-none block w-full px-3 py-2 border ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Champs spécifiques aux professionnels */}
      {role === 'professional' && (
        <>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Nom de l'entreprise (optionnel)
            </label>
            <div className="mt-1">
              <input
                id="companyName"
                type="text"
                {...register('companyName')}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.companyName ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="siret" className="block text-sm font-medium text-gray-700">
              Numéro SIRET (optionnel)
            </label>
            <div className="mt-1">
              <input
                id="siret"
                type="text"
                {...register('siret')}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.siret ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.siret && (
                <p className="mt-1 text-sm text-red-600">{errors.siret.message}</p>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Conditions d'utilisation */}
      <div className="flex items-center">
        <input
          id="termsAccepted"
          type="checkbox"
          {...register('termsAccepted')}
          className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
            errors.termsAccepted ? 'border-red-300' : ''
          }`}
        />
        <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700">
          J'accepte les <Link href="/conditions" className="text-indigo-600 hover:text-indigo-500">conditions d'utilisation</Link>*
        </label>
      </div>
      {errors.termsAccepted && (
        <p className="mt-1 text-sm text-red-600">{errors.termsAccepted.message}</p>
      )}

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Créer un compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
            connectez-vous si vous avez déjà un compte
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && renderStepOne()}
          </form>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>* Champs obligatoires</p>
          </div>
        </div>
      </div>
    </div>
  );
}