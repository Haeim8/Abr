export default function MentionsLegales() {
    return (
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Mentions Légales</h1>
        
        <div className="prose max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Éditeur du site</h2>
          <p className="mb-4">
            Le site Khaja est édité par la société Khaja SAS, au capital de 10 000€, 
            immatriculée au Registre du Commerce et des Sociétés sous le numéro RCS PARIS 123 456 789.
          </p>
          <p className="mb-4">
            Siège social : 123 Avenue Example, 75000 Paris
            <br />
            Téléphone : 01 23 45 67 89
            <br />
            Email : contact@khaja.fr
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Directeur de la publication</h2>
          <p className="mb-4">
            Le directeur de la publication est M. Jean Dupont, en sa qualité de Président de Khaja SAS.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Hébergement</h2>
          <p className="mb-4">
            Le site est hébergé par la société Vercel Inc., dont le siège social est situé à :
            <br />
            Vercel Inc.
            <br />
            340 S Lemon Ave #4133
            <br />
            Walnut, CA 91789
            <br />
            USA
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Propriété intellectuelle</h2>
          <p className="mb-4">
            L&apos;ensemble du contenu du site Khaja, incluant, de façon non limitative, les graphismes, 
            images, textes, vidéos, animations, sons, logos, icônes et leur mise en forme sont la 
            propriété exclusive de la société Khaja SAS à l&apos;exception des marques, logos ou 
            contenus appartenant à d&apos;autres sociétés partenaires ou auteurs.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Données personnelles</h2>
          <p className="mb-4">
            Les informations concernant la collecte et le traitement des données personnelles sont 
            détaillées dans notre <a href="/politique-confidentialite" className="text-blue-600 hover:underline">Politique de Confidentialité</a>.
          </p>
        </div>
      </div>
    );
  }