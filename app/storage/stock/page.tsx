'use client';

import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Grid, Button, CircularProgress, 
  Paper, Divider, Tabs, Tab, Snackbar, Alert, useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import CrateCard from './components/CrateCard';
import AddCrateModal from './components/AddCrateModal';
import CrateDetailView from './components/CrateDetailView';

// Types
type Crate = {
  id: string;
  name: string;
  capacity: number;
  bottles: Bottle[];
  created_at: string;
  user_id: string;
};

type Bottle = {
  id: string;
  wine_id: string;
  crate_id: string | null;
  position_id: string | null;
  status: string;
  acquisition_date: string | null;
  consumption_date: string | null;
  tasting_note: string | null;
  wine?: Wine;
  label?: string;
};

type Wine = {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
};

export default function StockManagement() {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [crates, setCrates] = useState<Crate[]>([]);
  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null);
  const [isAddCrateModalOpen, setIsAddCrateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  });

  // Charger les caisses au chargement de la page
  useEffect(() => {
    fetchCrates();
  }, []);

  // Fonction pour récupérer les caisses
  const fetchCrates = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }

      // Récupérer les caisses avec leur contenu
      const { data: cratesData, error: cratesError } = await supabase
        .from('crates')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (cratesError) throw cratesError;

      // Pour chaque caisse, récupérer les bouteilles associées
      const cratesWithBottles = await Promise.all(
        (cratesData || []).map(async (crate) => {
          const { data: bottlesData, error: bottlesError } = await supabase
            .from('bottle')
            .select(`
              id, 
              wine_id, 
              crate_id, 
              position_id, 
              status, 
              acquisition_date, 
              consumption_date, 
              tasting_note,
              label,
              wine:wine_id (
                id, 
                name, 
                color, 
                vintage, 
                domain,
                region,
                appellation,
                alcohol_percentage
              )
            `)
            .eq('crate_id', crate.id)
            .eq('status', 'in_stock');

          if (bottlesError) throw bottlesError;

          return {
            ...crate,
            bottles: bottlesData || []
          };
        })
      );

      setCrates(cratesWithBottles);
      setLoading(false);
    } catch (error: any) {
      console.error('Erreur lors du chargement des caisses:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Fonction pour ajouter une nouvelle caisse
  const handleAddCrate = async (crateName: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Utilisateur non connecté");

      const { data: newCrate, error } = await supabase
        .from('crates')
        .insert({
          name: crateName,
          capacity: 6,
          user_id: userData.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter la nouvelle caisse à l'état local
      setCrates([{ ...newCrate, bottles: [] }, ...crates]);
      
      setNotification({
        open: true,
        message: 'Caisse ajoutée avec succès',
        severity: 'success'
      });
      
      setIsAddCrateModalOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de caisse:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Fonction pour supprimer une caisse
  const handleDeleteCrate = async (crateId: string) => {
    try {
      // Vérifier si la caisse contient des bouteilles
      const crateToDelete = crates.find(c => c.id === crateId);
      
      if (crateToDelete && crateToDelete.bottles.length > 0) {
        if (!confirm(`Cette caisse contient ${crateToDelete.bottles.length} bouteille(s). Les bouteilles seront également supprimées. Voulez-vous continuer?`)) {
          return;
        }
        
        // Supprimer d'abord les bouteilles associées
        const { error: bottlesError } = await supabase
          .from('bottle')
          .delete()
          .eq('crate_id', crateId);
        
        if (bottlesError) throw bottlesError;
      }
      
      // Puis supprimer la caisse
      const { error } = await supabase
        .from('crates')
        .delete()
        .eq('id', crateId);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setCrates(crates.filter(crate => crate.id !== crateId));
      
      if (selectedCrate?.id === crateId) {
        setSelectedCrate(null);
      }
      
      setNotification({
        open: true,
        message: 'Caisse supprimée avec succès',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression de caisse:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  // Composant de fil d'Ariane
  const renderBreadcrumbs = () => (
    <Breadcrumbs 
      separator={<NavigateNextIcon fontSize="small" />} 
      aria-label="breadcrumb"
      sx={{ mb: 3 }}
    >
      <Button component={Link} href="/" color="inherit" size="small" startIcon={<HomeIcon />}>
        Accueil
      </Button>
      <Button component={Link} href="/storage" color="inherit" size="small" startIcon={<ArrowBackIcon />}>
        Emplacements
      </Button>
      <Typography color="text.primary">Stock</Typography>
    </Breadcrumbs>
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container 
        sx={{ 
          width: '100%', 
          maxWidth: { 
            xs: '100%', 
            sm: '100%', 
            md: '98%', 
            lg: '1400px'
          }, 
          mt: 4, 
          mb: 6,
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        {renderBreadcrumbs()}
        
        {/* Titre et actions principales */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="500">
            Mon Stock
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setIsAddCrateModalOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Nouvelle Caisse
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Liste des caisses */}
        {crates.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune caisse dans votre stock
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Commencez par ajouter une caisse pour stocker vos bouteilles.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setIsAddCrateModalOpen(true)}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              Ajouter une caisse
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {crates.map((crate) => (
              <Grid item xs={12} sm={6} md={4} key={crate.id}>
                <CrateCard 
                  crate={crate}
                  onSelect={() => setSelectedCrate(crate)}
                  onDelete={() => handleDeleteCrate(crate.id)}
                  onRefresh={fetchCrates}
                />
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Modal pour ajouter une caisse */}
        <AddCrateModal 
          open={isAddCrateModalOpen}
          onClose={() => setIsAddCrateModalOpen(false)}
          onAdd={handleAddCrate}
        />
        
        {/* Vue détaillée d'une caisse */}
        {selectedCrate && (
          <CrateDetailView 
            crate={selectedCrate}
            onClose={() => setSelectedCrate(null)}
            onRefresh={fetchCrates}
          />
        )}
        
        {/* Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setNotification({ ...notification, open: false })} 
            severity={notification.severity}
            variant="filled"
            sx={{ borderRadius: 2, boxShadow: 3 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}