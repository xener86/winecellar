// app/spirits/mixology/create/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, CircularProgress, 
  Button, useTheme, Alert, Stepper, Step, StepLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import Navbar from '@/components/Navbar';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cocktail } from '@/utils/types/cocktail.types';
import { useMixologyData } from '../../hooks/useMixologyData';
import { useSpiritData } from '../../hooks/useSpiritData';
import RecipeBuilder from '../../components/RecipeBuilder';
import { supabase } from '@/utils/supabase';

export default function CreateCocktailPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { createCocktail, cocktailLoading } = useMixologyData();
  const { spirits, loading: spiritsLoading } = useSpiritData();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer la clé API
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login');
          return;
        }
        
        const { data, error } = await supabase
          .from('user_preferences')
          .select('openai_api_key, mistral_api_key')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erreur récupération clés API:', error);
          return;
        }
        
        if (data?.openai_api_key) {
          setApiKey(data.openai_api_key);
        } else if (data?.mistral_api_key) {
          setApiKey(data.mistral_api_key);
        }
      } catch (error) {
        console.error('Erreur fetchAPIKeys:', error);
      }
    };
    
    fetchApiKey();
  }, [router]);
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (cocktailData: Cocktail) => {
    setLoading(true);
    setError(null);
    
    try {
      const cocktailId = await createCocktail(cocktailData);
      
      if (cocktailId) {
        router.push('/spirits/mixology');
      } else {
        throw new Error("Erreur lors de la création du cocktail");
      }
    } catch (err: unknown) {
      console.error('Erreur création cocktail:', err);
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue");
    } finally {
      setLoading(false);
    }
  };
  
  // Afficher un écran de chargement pendant le chargement des spiritueux
  if (spiritsLoading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Breadcrumbs />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Créer un Cocktail
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
        
        {/* Alerte si pas de spiritueux */}
        {spirits.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Vous n&apos;avez pas encore de spiritueux dans votre collection. 
            Les suggestions de recettes seront limitées. 
            <Button 
              component={Link} 
              href="/spirits/add" 
              size="small" 
              color="inherit" 
              sx={{ ml: 1 }}
            >
              Ajouter un spiritueux
            </Button>
          </Alert>
        )}
        
        {/* Affichage des erreurs */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Builder de recette */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
          }}
        >
          <RecipeBuilder 
            availableSpirits={spirits}
            onSave={handleSubmit}
            apiKey={apiKey}
            loading={loading || cocktailLoading}
          />
        </Paper>
      </Container>
    </>
  );
}