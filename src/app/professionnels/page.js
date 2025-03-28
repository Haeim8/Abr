// src/app/professionnels/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfessionnelsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirection vers la page d'administration des professionnels
    router.push('/admin/professionnels');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
}