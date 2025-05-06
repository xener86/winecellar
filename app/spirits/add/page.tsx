// app/spirits/add/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, 
  Button, useTheme, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '@/components/Navbar';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spirit } from '@/utils/types/spirit.types';
import { useSpiritData } from '../hooks/useSpiritData';
import SpiritForm from '../components/SpiritForm';
import { supabase } from '@/utils/supabase';

export default function AddSpiritPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { addSpirit, spiritLoading } = useSpiritData();
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
  const handleSubmit = async (spiritData: Spirit) => {
    setLoading(true);
    setError(null);
    
    try {
      const newSpiritId = await addSpirit(spiritData);
      
      if (newSpiritId) {
        router.push('/spirits');
      } else {
        throw new Error("Erreur lors de l'ajout du spiritueux");
      }
    } catch (err: unknown) {
      console.error('Erreur ajout spiritueux:', err);
      setError(err instanceof Error ? err.message : "Une erreur inattendue est survenue");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Breadcrumbs />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Ajouter un Spiritueux
          </Typography>
          
          <Button
            component={Link}
            href="/spirits"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2 }}
          >
            Retour
          </Button>
        </Box>
        
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <SpiritForm 
            onSubmit={handleSubmit}
            apiKey={apiKey}
            onCancel={() => router.push('/spirits')}
            loading={loading || spiritLoading}
          />
        </Paper>
      </Container>
    </>
  );
}