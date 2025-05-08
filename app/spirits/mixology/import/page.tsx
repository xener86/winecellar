// app/spirits/mixology/import/page.tsx

'use client';

import React, { useState } from 'react';
import { 
  Container, Typography, Box, Paper, 
  Button, useTheme, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '@/components/Navbar';
import { Breadcrumbs } from '@/components/ui/Navigation';
import Link from 'next/link';
import { useMixologyData } from '../../hooks/useMixologyData';
import { useSpiritData } from '../../hooks/useSpiritData';
import ExternalCocktailSearch from '../../components/ExternalCocktailSearch';
import { Cocktail } from '@/utils/types/cocktail.types';

export default function ImportCocktailsPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { spirits } = useSpiritData();
  const { createCocktail } = useMixologyData();
  
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Gérer l'importation d'un cocktail
  const handleImport = async (cocktail: Cocktail) => {
    try {
      // Préparation des données
      const cocktailData = {
        ...cocktail,
        isCustom: false, // Ce n'est pas une création personnelle
        isFavorite: false, // Par défaut, pas dans les favoris
      };
      
      // Enregistrer dans la base de données locale
      const cocktailId = await createCocktail(cocktailData);
      
      if (cocktailId) {
        setNotification(`Le cocktail "${cocktail.name}" a été importé avec succès`);
        
        // Effacer la notification après 3 secondes
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        throw new Error("Erreur lors de l'importation du cocktail");
      }
    } catch (err) {
      console.error('Erreur lors de l\'importation du cocktail:', err);
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue");
      
      // Effacer l'erreur après 5 secondes
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Breadcrumbs />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Importer des Cocktails
          </Typography>
          
          <Button
            component={Link}
            href="/spirits/mixology"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2 }}
          >
            Retour
          </Button>
        </Box>
        
        {/* Notifications */}
        {notification && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {notification}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Introduction */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
            mb: 3
          }}
        >
          <Typography variant="h6" gutterBottom>
            Découvrez et importez de nouvelles recettes
          </Typography>
          
          <Typography paragraph>
            Cette page vous permet de rechercher et d&apos;importer des recettes de cocktails depuis TheCocktailDB, 
            une vaste collection de cocktails du monde entier. Vous pouvez rechercher par nom, catégorie ou 
            ingrédient principal.
          </Typography>
          
          <Typography paragraph>
            Importez les recettes qui vous plaisent dans votre collection personnelle. Vous pourrez ensuite 
            les modifier, les marquer comme favoris, ou les adapter selon vos préférences.
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Source des données: <Link href="https://www.thecocktaildb.com/" target="_blank" rel="noopener noreferrer">
              TheCocktailDB.com
            </Link>
          </Typography>
        </Paper>
        
        {/* Composant de recherche et d'importation */}
        <ExternalCocktailSearch 
          onImport={handleImport}
          availableSpirits={spirits}
        />
      </Container>
    </>
  );
}