export default function PolitiqueConfidentialite() {
    return (
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Politique de Confidentialité</h1>
        
        <div className="prose max-w-none">
          <p className="mb-4">
            Chez Khaja, nous accordons une grande importance à la protection de vos données personnelles.
            Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et
            protégeons vos informations personnelles lorsque vous utilisez notre plateforme.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Informations que nous collectons</h2>
          <p className="mb-4">
            Nous collectons différents types d&apos;informations vous concernant :
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">
              <strong>Informations d&apos;identification</strong> : Nom, prénom, adresse email, numéro de téléphone, 
              adresse postale, etc.
            </li>
            <li className="mb-2">
              <strong>Informations sur votre logement</strong> : Type de logement, superficie, nombre de pièces, etc.
            </li>
            <li className="mb-2">
              <strong>Informations de paiement</strong> : Coordonnées bancaires, historique de facturation, etc.
            </li>
            <li className="mb-2">
              <strong>Données d&apos;utilisation</strong> : Informations sur la façon dont vous utilisez notre service,
              historique des interventions, préférences, etc.
            </li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Comment nous utilisons vos informations</h2>
          <p className="mb-4">
            Nous utilisons vos informations pour :
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Fournir, maintenir et améliorer notre service</li>
            <li className="mb-2">Mettre en relation les clients avec les professionnels appropriés</li>
            <li className="mb-2">Traiter les paiements et gérer les abonnements</li>
            <li className="mb-2">Communiquer avec vous au sujet de votre compte ou de nos services</li>
            <li className="mb-2">Vous envoyer des informations marketing (avec votre consentement)</li>
            <li className="mb-2">Prévenir la fraude et améliorer la sécurité de notre plateforme</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Partage de vos informations</h2>
          <p className="mb-4">
            Nous pouvons partager vos informations avec :
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">
              <strong>Les professionnels</strong> : Pour faciliter la prestation de services que vous avez demandés
            </li>
            <li className="mb-2">
              <strong>Les fournisseurs de services</strong> : Qui nous aident à exploiter notre service (paiement,
              hébergement, analyse, etc.)
            </li>
            <li className="mb-2">
              <strong>Les autorités légales</strong> : Si nous sommes légalement tenus de le faire
            </li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Conservation des données</h2>
          <p className="mb-4">
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos
            services et respecter nos obligations légales. Lorsque vous supprimez votre compte, nous
            supprimons ou anonymisons vos données, sauf si la loi nous oblige à les conserver.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Vos droits</h2>
          <p className="mb-4">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des
            droits suivants :
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Droit d&apos;accès à vos données personnelles</li>
            <li className="mb-2">Droit de rectification des données inexactes</li>
            <li className="mb-2">Droit à l&apos;effacement de vos données</li>
            <li className="mb-2">Droit à la limitation du traitement</li>
            <li className="mb-2">Droit à la portabilité des données</li>
            <li className="mb-2">Droit d&apos;opposition au traitement</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Sécurité des données</h2>
          <p className="mb-4">
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées
            pour protéger vos données personnelles contre la perte, l&apos;accès non autorisé, la divulgation,
            l&apos;altération ou la destruction.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies et technologies similaires</h2>
          <p className="mb-4">
            Nous utilisons des cookies et d&apos;autres technologies similaires pour améliorer votre expérience
            sur notre plateforme, comprendre comment vous utilisez notre service et personnaliser nos
            communications marketing.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Modifications de cette politique</h2>
          <p className="mb-4">
            Nous pouvons modifier cette politique de confidentialité de temps à autre. Nous vous
            informerons de tout changement significatif par email ou par une notification sur notre
            plateforme.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Nous contacter</h2>
          <p className="mb-4">
            Si vous avez des questions concernant cette politique de confidentialité ou la façon dont
            nous traitons vos données personnelles, veuillez nous contacter à l&apos;adresse suivante :
            privacy@khaja.fr
          </p>
          
          <p className="mt-8">
            Date de dernière mise à jour : 1er mars 2025
          </p>
        </div>
      </div>
    );
  }