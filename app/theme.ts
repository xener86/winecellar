// app/theme.ts
import { createTheme } from '@mui/material/styles';
import { Playfair_Display, Raleway } from 'next/font/google';

// Définir les polices qui seront utilisées avec Tailwind et MUI
const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

// Ces couleurs doivent correspondre à celles de votre tailwind.config.js
const colors = {
  'wine-red': '#8B0000',
  'wine-burgundy': '#800020',
  'wine-bordeaux': '#5E2129',
  'wine-white': '#F5F5DC',
  'wine-rose': '#FFB6C1',
  'wine-gold': '#D4AF37',
};

const theme = createTheme({
  palette: {
    primary: {
      main: colors['wine-burgundy'],
      light: colors['wine-rose'],
      dark: colors['wine-bordeaux'],
    },
    secondary: {
      main: '#f5f5f5', // Gris très clair
      dark: '#e0e0e0',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: raleway.style.fontFamily,
    h1: {
      fontFamily: playfair.style.fontFamily,
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h2: {
      fontFamily: playfair.style.fontFamily,
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontFamily: playfair.style.fontFamily,
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    h4: {
      fontFamily: playfair.style.fontFamily,
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontFamily: playfair.style.fontFamily,
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontFamily: playfair.style.fontFamily,
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontFamily: raleway.style.fontFamily,
    },
    body2: {
      fontFamily: raleway.style.fontFamily,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out',
          borderRadius: '0.75rem',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
          textTransform: 'none',
          fontWeight: 500,
          fontFamily: raleway.style.fontFamily,
        },
        containedPrimary: {
          backgroundImage: `linear-gradient(to right, ${colors['wine-burgundy']}, ${colors['wine-red']})`,
          boxShadow: 'none',
          '&:hover': {
            backgroundImage: `linear-gradient(to right, ${colors['wine-red']}, ${colors['wine-burgundy']})`,
            boxShadow: '0 2px 8px rgba(139, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(to right, ${colors['wine-burgundy']}, ${colors['wine-red']})`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '9999px', // Équivalent à rounded-full de Tailwind
          fontWeight: 500,
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
        }
      }
    }
  },
});

export default theme;