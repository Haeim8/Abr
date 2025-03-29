export default function Blog() {
    // Articles de blog fictifs
    const articles = [
      {
        id: 1,
        title: "Comment choisir le bon artisan pour vos travaux ?",
        excerpt: "Découvrez nos conseils pour trouver l'artisan idéal pour votre projet de rénovation...",
        date: "15 mars 2025",
        author: "Sophie Martin",
        category: "Conseils"
      },
      {
        id: 2,
        title: "Les tendances déco 2025 pour votre intérieur",
        excerpt: "Exploration des nouvelles tendances en matière de décoration intérieure pour cette année...",
        date: "2 mars 2025",
        author: "Thomas Dubois",
        category: "Décoration"
      },
      {
        id: 3,
        title: "Rénovation énergétique : les aides disponibles en 2025",
        excerpt: "Tour d'horizon des dispositifs d'aide financière pour vos projets de rénovation énergétique...",
        date: "18 février 2025",
        author: "Marie Lefèvre",
        category: "Financement"
      },
      {
        id: 4,
        title: "Entretien de votre jardin au printemps : les étapes essentielles",
        excerpt: "Guide pratique pour préparer votre jardin à la belle saison et assurer de belles floraisons...",
        date: "5 février 2025",
        author: "Pierre Durand",
        category: "Jardinage"
      }
    ];
  
    return (
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Blog</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-indigo-600 font-medium">{article.category}</span>
                  <span className="text-sm text-gray-500">{article.date}</span>
                </div>
                <h2 className="text-xl font-bold mb-2 hover:text-indigo-600">
                  <a href={`/blog/${article.id}`}>{article.title}</a>
                </h2>
                <p className="text-gray-600 mb-4">{article.excerpt}</p>
                <div className="flex items-center">
                  <div className="bg-indigo-100 rounded-full h-10 w-10 flex items-center justify-center text-indigo-500 font-bold">
                    {article.author.charAt(0)}
                  </div>
                  <span className="ml-2 text-sm text-gray-700">{article.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Cette page est en construction. Plus d&apos;articles seront ajoutés prochainement.
          </p>
        </div>
      </div>
    );
  }