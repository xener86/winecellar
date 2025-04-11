'use client';

import './globals.css';
// Correction Ligne 4: 'Inter' supprimé car non utilisé
import { Playfair_Display, Raleway } from 'next/font/google'; 
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway' });

// Correction: Le bloc <head> était mal placé et probablement redondant/incorrect ici.
// La gestion des métadonnées et liens se fait via l'export 'metadata' ou directement dans le JSX du layout dans l'App Router.
// Si Tailwind est configuré via postcss/tailwind.config.js, ce lien CDN est inutile.
/* <head>
  <link href="https://cdn.tailwindcss.com" rel="stylesheet" />
</head>
*/

// Thème personnalisé MUI
const theme = createTheme({
  palette: {
    primary: {
      main: '#8B0000', // Bordeaux
    },
    secondary: {
      main: '#C2185B', // Rose foncé
    },
  },
  typography: {
    fontFamily: raleway.style.fontFamily, // Police par défaut
    // Application de Playfair pour les titres
    h1: { fontFamily: playfair.style.fontFamily },
    h2: { fontFamily: playfair.style.fontFamily },
    h3: { fontFamily: playfair.style.fontFamily },
    h4: { fontFamily: playfair.style.fontFamily },
    h5: { fontFamily: playfair.style.fontFamily },
    h6: { fontFamily: playfair.style.fontFamily },
  },
});

// Définition des métadonnées (optionnel, mais bonne pratique pour le titre, etc.)
// export const metadata = {
//   title: 'Votre Titre',
//   description: 'Votre Description',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Application des variables CSS pour les polices
    <html lang="fr" suppressHydrationWarning className={`${playfair.variable} ${raleway.variable}`}>
      {/* La police Raleway est appliquée via le thème MUI et Playfair via les variables CSS/thème */}
      {/* Pas besoin d'ajouter la classe 'inter.className' ici car Inter n'est pas utilisé */}
      <body className="bg-gray-50" suppressHydrationWarning> 
        <ThemeProvider theme={theme}>
          <CssBaseline /> {/* Normalise les styles et applique les couleurs de fond/texte du thème */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}