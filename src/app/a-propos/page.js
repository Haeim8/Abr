export default function APropos() {
    return (
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">À propos de Khaja</h1>
        
        <div className="prose max-w-none">
          <p className="mb-4">
            Khaja est une plateforme innovante qui met en relation les artisans et les particuliers 
            pour simplifier la recherche et la réalisation de projets de rénovation et d&apos;entretien.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Notre mission</h2>
          <p className="mb-4">
            Notre mission est de simplifier l&apos;accès aux services professionnels de qualité 
            et de créer une communauté de confiance entre les prestataires et les clients.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Notre vision</h2>
          <p className="mb-4">
            Nous croyons qu&apos;un habitat bien entretenu contribue significativement au bien-être 
            quotidien. C&apos;est pourquoi nous travaillons à rendre accessibles les services d&apos;entretien 
            et de rénovation à tous, de manière simple et transparente.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Nos valeurs</h2>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2"><strong>Qualité</strong> : Nous sélectionnons soigneusement les professionnels sur notre plateforme.</li>
            <li className="mb-2"><strong>Transparence</strong> : Nous favorisons des tarifs clairs et des évaluations honnêtes.</li>
            <li className="mb-2"><strong>Accessibilité</strong> : Nous rendons les services d&apos;entretien accessibles à tous.</li>
            <li className="mb-2"><strong>Innovation</strong> : Nous utilisons la technologie pour améliorer l&apos;expérience utilisateur.</li>
          </ul>
        </div>
      </div>
    );
  }