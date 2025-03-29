'use client';

import { useState } from 'react';

export default function FAQ() {
  const faqs = [
    {
      question: "Comment fonctionne Khaja ?",
      answer: "Khaja est une plateforme qui met en relation les particuliers avec des artisans qualifiés. Vous pouvez publier votre projet, recevoir des devis, et choisir le professionnel qui vous convient le mieux. Vous pouvez également souscrire à un abonnement pour bénéficier de services réguliers d'entretien."
    },
    {
      question: "Comment s'inscrire sur la plateforme ?",
      answer: "Pour vous inscrire, cliquez sur 'Inscription' en haut à droite de la page d'accueil. Vous pourrez choisir entre un compte 'Particulier' ou 'Professionnel', et suivre les étapes pour compléter votre profil."
    },
    {
      question: "Quels types de services sont proposés ?",
      answer: "Khaja propose une large gamme de services d'entretien et de rénovation : plomberie, électricité, peinture, jardinage, menuiserie, nettoyage, et bien d'autres. Vous pouvez consulter la liste complète dans la section 'Services'."
    },
    {
      question: "Comment sont sélectionnés les professionnels ?",
      answer: "Tous les professionnels présents sur Khaja sont vérifiés. Nous contrôlons leurs qualifications, leurs assurances, et leurs références professionnelles avant de les accepter sur notre plateforme."
    },
    {
      question: "Comment fonctionnent les abonnements ?",
      answer: "Nos abonnements permettent d'accéder à des services réguliers d'entretien à tarif préférentiel. Plusieurs formules sont disponibles selon vos besoins, avec un nombre défini d'interventions par an. Vous pouvez consulter les détails dans la section 'Abonnements'."
    },
    {
      question: "Que faire en cas de problème avec un professionnel ?",
      answer: "Si vous rencontrez un problème, vous pouvez contacter notre service client via la page 'Contact'. Nous interviendrons pour trouver une solution adaptée. Tous les travaux réalisés via notre plateforme sont garantis."
    },
    {
      question: "Comment sont fixés les prix ?",
      answer: "Les prix sont fixés librement par les professionnels. Pour les services en abonnement, des tarifs préférentiels négociés sont appliqués. Vous avez toujours accès à un devis détaillé avant de valider une intervention."
    },
    {
      question: "Puis-je annuler une intervention programmée ?",
      answer: "Oui, vous pouvez annuler ou reporter une intervention jusqu'à 24h avant l'heure prévue sans frais. Au-delà, des frais d'annulation peuvent s'appliquer selon les conditions du professionnel."
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">Foire Aux Questions</h1>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center"
              onClick={() => toggleFAQ(index)}
            >
              <span className="font-medium">{faq.question}</span>
              <svg 
                className={`w-5 h-5 transition-transform ${openIndex === index ? 'transform rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <div 
              className={`px-6 py-4 bg-gray-50 transition-all duration-300 ${
                openIndex === index ? 'block' : 'hidden'
              }`}
            >
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-indigo-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Vous ne trouvez pas la réponse à votre question ?</h2>
        <p className="mb-4">
          N'hésitez pas à nous contacter directement. Notre équipe se fera un plaisir de vous aider.
        </p>
        <a 
          href="/contact" 
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Nous contacter
        </a>
      </div>
    </div>
  );
}