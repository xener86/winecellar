'use client';

import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Grid, Button, CircularProgress, 
  Paper, Divider, Snackbar, Alert, useTheme
} from '@mui/material';
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
import { Bottle, Wine } from '@/utils/types';

// Type spécifique pour la caisse, adapté pour correspondre à CrateData
type Crate = {
  id: string;
  name: string;
  capacity: number;
  bottles: Bottle[];
  created_at: string;
  user_id: string;
};

export default function StockManagement() {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [crates, setCrates] = useState<Crate[]>([]);
  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null);
  // Nouvel état pour contrôler l'ouverture/fermeture du modal de détail
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isAddCrateModalOpen, setIsAddCrateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  });

  // Fonction pour récupérer les caisses
  const fetchCrates = React.useCallback(async () => {
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

          // Traiter les résultats pour s'assurer qu'ils correspondent au type Bottle attendu
          const processedBottles: Bottle[] = [];
          
          if (bottlesData) {
            for (const rawBottle of bottlesData) {
              // On utilise une approche très sécurisée pour traiter les données
              const bottle: Bottle = {
                id: rawBottle.id,
                wine_id: rawBottle.wine_id,
                position_id: rawBottle.position_id,
                crate_id: rawBottle.crate_id,
                status: rawBottle.status,
                acquisition_date: rawBottle.acquisition_date,
                consumption_date: rawBottle.consumption_date,
                tasting_note: rawBottle.tasting_note,
                label: rawBottle.label,
                // Initialiser wine à undefined, nous le remplirons ensuite
                wine: undefined
              };
              
              // Traitement de wine séparément en fonction de sa structure
              let wineData;
              if (Array.isArray(rawBottle.wine)) {
                // Si c'est un tableau, prendre le premier élément (ou null)
                wineData = rawBottle.wine[0] || null;
              } else {
                // Sinon, utiliser directement l'objet
                wineData = rawBottle.wine || null;
              }
              
              // Si nous avons des données de vin, créer un objet Wine correctement typé
              if (wineData) {
                // Déterminer la couleur avec un type sécurisé
                const colorMapping: Record<string, 'red' | 'white' | 'rose' | 'sparkling' | 'fortified'> = {
                  'red': 'red',
                  'white': 'white',
                  'rose': 'rose',
                  'sparkling': 'sparkling',
                  'fortified': 'fortified'
                };
                
                // Utiliser une couleur par défaut sûre si la couleur n'est pas reconnue
                const color = typeof wineData.color === 'string' 
                  ? (colorMapping[wineData.color] || 'red') 
                  : 'red';
                
                const wine: Wine = {
                  id: String(wineData.id || ''),
                  name: String(wineData.name || ''),
                  color: color,
                  vintage: typeof wineData.vintage === 'number' ? wineData.vintage : null,
                  region: wineData.region ? String(wineData.region) : null,
                  domain: wineData.domain ? String(wineData.domain) : null,
                  appellation: wineData.appellation ? String(wineData.appellation) : null,
                  alcohol_percentage: typeof wineData.alcohol_percentage === 'number' ? wineData.alcohol_percentage : null
                };
                
                // Assigner l'objet Wine à la bouteille
                bottle.wine = wine;
              }
              
              processedBottles.push(bottle);
            }
          }

          return {
            ...crate,
            bottles: processedBottles
          };
        })
      );

      setCrates(cratesWithBottles);
      setLoading(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      console.error('Message d\'erreur', error);
      setNotification({
          open: true,
          message: `Erreur: ${errorMessage}`,
          severity: 'error'
      });
    }
  }, [router]);
  
  // Charger les caisses au chargement de la page
  useEffect(() => {
    fetchCrates();
  }, [fetchCrates]);

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de caisse:';
      console.error('Message d\'erreur', error);
      setNotification({
        open: true,
        message: `Erreur: ${errorMessage}`,
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
      
      // Si la caisse sélectionnée est celle qu'on supprime, réinitialiser
      if (selectedCrate?.id === crateId) {
        setSelectedCrate(null);
        setIsDetailViewOpen(false); // S'assurer que la vue détaillée est fermée
      }
      
      setNotification({
        open: true,
        message: 'Caisse supprimée avec succès',
        severity: 'success'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      console.error('Erreur lors de la suppression de caisse:', error);
      setNotification({
        open: true,
        message: `Erreur: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Nouvelle fonction pour gérer la sélection d'une caisse
  const handleSelectCrate = (crateId: string) => {
    const crate = crates.find(c => c.id === crateId);
    if (crate) {
      setSelectedCrate(crate);
      setIsDetailViewOpen(true); // Ouvrir la vue détaillée
    }
  };

  // Fonction pour fermer la vue détaillée
  const handleCloseDetailView = () => {
    setIsDetailViewOpen(false);
    // On peut garder selectedCrate pour une éventuelle réouverture, ou le réinitialiser
    // setSelectedCrate(null);
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
              <Grid component="div" key={crate.id} sx={{ width: { xs: '100%', sm: '50%', md: '33%' } }}>
                <CrateCard 
                  crate={crate}
                  onSelect={handleSelectCrate} // Utiliser la nouvelle fonction
                  onDelete={() => handleDeleteCrate(crate.id)}
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
        
        {/* Vue détaillée d'une caisse - passer l'état open */}
        {selectedCrate && (
          <CrateDetailView 
            crate={selectedCrate}
            open={isDetailViewOpen} // Contrôler l'état d'ouverture
            onClose={handleCloseDetailView} // Gérer la fermeture
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