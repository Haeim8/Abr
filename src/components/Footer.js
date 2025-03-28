import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Khaja</h3>
            <p className="text-gray-300 text-sm">
              La solution pour mettre en relation professionnels et particuliers 
              et financer vos projets de rénovation.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/offres" className="hover:text-white">
                  Offres
                </Link>
              </li>
              <li>
                <Link href="/abonnements" className="hover:text-white">
                  Abonnements
                </Link>
              </li>
              <li>
                <Link href="/professionnels" className="hover:text-white">
                  Professionnels
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Informations</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/a-propos" className="hover:text-white">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/conditions-utilisation" className="hover:text-white">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="hover:text-white">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-white">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 mt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Khaja. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}