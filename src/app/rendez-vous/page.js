// src/app/rendez-vous/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RendezVousPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Rediriger si non connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Charger les rendez-vous
  useEffect(() => {
    const fetchAppointments = async () => {
      if (status !== 'authenticated') return;
      
      setIsLoading(true);
      try {
        const userId = session.user.id;
        const endpoint = session.user.role === 'professional' 
          ? `/api/calendar?professionalId=${userId}`
          : `/api/calendar?clientId=${userId}`;
          
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des rendez-vous');
        }
        
        const data = await response.json();
        setAppointments(data.appointments || []);
      } catch (err) {
        setError(err.message);
        console.error('Erreur:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, [session, status]);

  // Formater la date et l'heure
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-gray-700">Chargement des rendez-vous...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Mes rendez-vous</h1>
            <Link
              href="/rendez-vous/creer"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Planifier un rendez-vous
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {appointments.length === 0 ? (
            <div className="px-4 py-5 sm:px-6 text-center">
              <p className="text-gray-500">Aucun rendez-vous planifié.</p>
              <div className="mt-4">
                <Link
                  href="/rendez-vous/creer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Planifier votre premier rendez-vous
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {appointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.startTime);
                const { time: endTime } = formatDateTime(appointment.endTime);
                
                return (
                  <li key={appointment._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-indigo-600">{appointment.title}</h3>
                        <p className="text-sm text-gray-500">
                          {session?.user?.role === 'professional' 
                            ? `Avec : ${appointment.clientName || 'Client'}`
                            : `Avec : ${appointment.professionalName || 'Professionnel'}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {date}
                        </span>
                        <span className="mt-1 text-xs text-gray-500">
                          {time} - {endTime}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">{appointment.description || 'Aucune description'}</p>
                      {appointment.location && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Lieu:</span> {appointment.location}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Link
                        href={`/rendez-vous/${appointment._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Détails
                      </Link>
                      {new Date(appointment.startTime) > new Date() && (
                        <button
                          onClick={() => handleCancelAppointment(appointment._id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}