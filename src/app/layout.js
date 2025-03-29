import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/Auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'arb - Plateforme de mise en relation artisans et particuliers',
  description: 'arb met en relation les professionnels et les particuliers pour tous vos projets de rénovation et d\'entretien.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

