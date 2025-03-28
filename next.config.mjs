/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Désactive les vérifications ESLint pendant la construction
      ignoreDuringBuilds: true,
    },
  };
  
  export default nextConfig;