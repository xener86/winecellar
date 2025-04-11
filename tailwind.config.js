/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wine-red': '#8B0000',
        'wine-burgundy': '#800020',
        'wine-bordeaux': '#5E2129',
        'wine-white': '#F5F5DC',
        'wine-rose': '#FFB6C1',
        'wine-gold': '#D4AF37',
      },
      fontFamily: {
        'serif': ['var(--font-playfair)'],
        'sans': ['var(--font-raleway)'],
      },
      backgroundImage: {
        'gradient-wine': 'linear-gradient(to right, var(--wine-burgundy), var(--wine-red))',
        'gradient-wine-hover': 'linear-gradient(to right, var(--wine-red), var(--wine-burgundy))',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Désactive le reset CSS de Tailwind pour éviter les conflits avec MUI
  },
}