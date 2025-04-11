// Fichier: /app/tasting-notes/edit/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../../../components/Navbar';
import TastingForm from '../../../components/TastingForm';
import { supabase } from '../../../utils/supabase';

export default function EditTastingPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tastingData, setTastingData] = useState(null);
  
  useEffect(() => {
    const fetchTastingData = async () => {
      try {
        setLoading(true);
        
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          router.push('/login');
          return;
        }
        
        const { data, error } = await supabase
          .from('tasting_notes')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        if (!data) throw new Error('Dégustation non trouvée');
        
        // Vérifier que l'utilisateur est bien le propriétaire
        if (data.user_id !== authData.user.id) {
          throw new Error('Vous n\'êtes pas autorisé à modifier cette dégustation');
        }
        
        setTastingData(data);
      } catch (error) {
        console.error('Erreur lors du chargement de la dégustation:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTastingData();
  }, [id, router]);
  
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('tasting_notes')
        .update({
          ...formData,
          updated_at: new Date()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      router.push(`/tasting-notes/${id}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dégustation:', error);
      setError(error.message);
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
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
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button 
            onClick={() => router.back()}
            startIcon={<ArrowBackIcon />}
            variant="contained"
          >
            Retour
          </Button>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            Retour
          </Button>
          <Typography variant="h5">
            Modifier la dégustation
          </Typography>
        </Box>
        
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            mb: 4
          }}
        >
          {tastingData && (
            <TastingForm 
              initialData={tastingData}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
            />
          )}
        </Paper>
      </Container>
    </>
  );
}