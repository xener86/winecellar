/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.ctfassets.net',  // Add your Contentful domain
      'via.placeholder.com',    // Add placeholder image domain
    ],
  },
  reactStrictMode: true,
  // Forcer Next.js à recharger les pages pendant le développement
  onDemandEntries: {
    // période (en ms) où la page restera en mémoire
    maxInactiveAge: 25 * 1000,
    // nombre de pages à garder en mémoire
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
