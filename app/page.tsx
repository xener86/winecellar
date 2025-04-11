// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import Navbar from './components/Navbar';
import { supabase } from './utils/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [wineCount, setWineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/login');
        return;
      }

      // Récupérer le nombre de vins
      const { count } = await supabase
        .from('wine')
        .select('*', { count: 'exact', head: true });
      
      setWineCount(count || 0);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return <Typography>Chargement...</Typography>;
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bienvenue dans votre cave à vin personnelle
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  {wineCount}
                </Typography>
                <Typography color="text.secondary">
                  Bouteilles dans votre cave
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Vous pourrez ajouter d'autres cartes ici plus tard */}
        </Grid>
      </Container>
    </>
  );
}