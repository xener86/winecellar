// app/food-pairing/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Button,
  useTheme,
} from '@mui/material';

import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';

import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

import Navbar from '@/components/Navbar';
import AIPairingInterface from '@/components/AIPairingInterface';

export default function FoodPairingPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiProvider, setApiProvider] = useState<'openai' | 'mistral'>('openai');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData?.user) {
        setError('Vous devez être connecté pour accéder à cette page');
        setLoading(false);
        return;
      }

      setUserData(authData.user);

      // Récupérer les préférences (clés API)
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key, default_ai_provider')
        .eq('user_id', authData.user.id)
        .single();

      if (prefsError) {
        console.error('Erreur lors de la récupération des préférences:', prefsError);
      }

      if (prefsData) {
        // Priorité : OpenAI > Mistral
        if (prefsData.openai_api_key) {
          setApiKey(prefsData.openai_api_key);
          setApiProvider('openai');
        } else if (prefsData.mistral_api_key) {
          setApiKey(prefsData.mistral_api_key);
          setApiProvider('mistral');
        }
      }

      if (!prefsData?.openai_api_key && !prefsData?.mistral_api_key) {
        setError('Aucune clé API configurée. Veuillez configurer une clé API dans les paramètres.');
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Une erreur est survenue lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 8 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 8 }}>
          <Alert 
            severity="error" 
            sx={{ maxWidth: 600, mx: 'auto' }}
            action={
              error.includes('clé API') ? (
                <Button 
                  color="inherit" 
                  size="small" 
                  component={Link}
                  href="/settings"
                  startIcon={<SettingsIcon />}
                >
                  Configurer
                </Button>
              ) : undefined
            }
          >
            {error}
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',
        py: 4 
      }}>
        <AIPairingInterface
          userId={userData!.id}
          apiKey={apiKey}
          apiProvider={apiProvider}
        />
      </Box>
    </>
  );
}