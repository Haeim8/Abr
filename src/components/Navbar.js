'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isLoggedIn = status === 'authenticated';
  const isClient = isLoggedIn && session?.user?.userType === 'client';
  const isProfessional = isLoggedIn && session?.user?.userType === 'professional';

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Khaja</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link href="/" className="px-3 py-2 rounded-md hover:bg-indigo-700">
                Accueil
              </Link>
              <Link href="/offres" className="px-3 py-2 rounded-md hover:bg-indigo-700">
                Offres
              </Link>
              <Link href="/abonnements" className="px-3 py-2 rounded-md hover:bg-indigo-700">
                Abonnements
              </Link>
              <Link href="/professionnels" className="px-3 py-2 rounded-md hover:bg-indigo-700">
                Professionnels
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-sm">
                  {session.user.name}
                </span>
                <Link href={isClient ? "/dashboard/client" : "/dashboard/pro"} className="px-3 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800">
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-2 rounded-md hover:bg-indigo-700"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="px-3 py-2 rounded-md hover:bg-indigo-700">
                  Connexion
                </Link>
                <Link href="/auth/signup" className="px-3 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800">
                  Inscription
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-indigo-700 focus:outline-none"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md hover:bg-indigo-700">
              Accueil
            </Link>
            <Link href="/offres" className="block px-3 py-2 rounded-md hover:bg-indigo-700">
              Offres
            </Link>
            <Link href="/abonnements" className="block px-3 py-2 rounded-md hover:bg-indigo-700">
              Abonnements
            </Link>
            <Link href="/professionnels" className="block px-3 py-2 rounded-md hover:bg-indigo-700">
              Professionnels
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link href={isClient ? "/dashboard/client" : "/dashboard/pro"} className="block px-3 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800">
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-indigo-700"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="block px-3 py-2 rounded-md hover:bg-indigo-700">
                  Connexion
                </Link>
                <Link href="/auth/signup" className="block px-3 py-2 rounded-md bg-indigo-700 hover:bg-indigo-800">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}