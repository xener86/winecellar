// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
      // Ignorer les erreurs de type pendant le build
      ignoreBuildErrors: true
    }
  };
  
  export default nextConfig;