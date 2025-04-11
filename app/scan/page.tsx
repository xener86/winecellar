'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, Button, CircularProgress, 
  Chip, Divider, Snackbar, Alert, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WineBarIcon from '@mui/icons-material/WineBar';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import MobileNavbar from '../components/MobileNavbar';

// Types
type Position = {
  id: string;
  storage_location_id: string;
  row_position: number;
  column_position: number;
  qr_code: string | null;
};

type StorageLocation = {
  id: string;
  name: string;
  type: string;
};

type Bottle = {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  acquisition_date: string | null;
  consumption_date: string | null;
  tasting_note: string | null;
  label?: string;
  wine?: Wine;
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

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const positionId = searchParams.get('position');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [location, setLocation] = useState<StorageLocation | null>(null);
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [consumeDialogOpen, setConsumeDialogOpen] = useState(false);
  const [consumeData, setConsumeData] = useState({
    consumption_date: new Date().toISOString().split('T')[0],
    tasting_note: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  });

  const fetchPositionAndBottle = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }

      const { data: positionData, error: positionError } = await supabase
        .from('position')
        .select('*')
        .eq('id', id)
        .single();

      if (positionError) throw positionError;
      if (!positionData) throw new Error('Position non trouvée');

      setPosition(positionData);

      const { data: locationData, error: locationError } = await supabase
        .from('storage_location')
        .select('*')
        .eq('id', positionData.storage_location_id)
        .single();

      if (locationError) throw locationError;
      setLocation(locationData);

      const { data: bottleData, error: bottleError } = await supabase
        .from('bottle')
        .select(`
          id, 
          wine_id, 
          position_id, 
          status, 
          acquisition_date, 
          consumption_date, 
          tasting_note,
          label,
          wine:wine_id (id, name, color, vintage, domain, region, appellation, alcohol_percentage)
        `)
        .eq('position_id', id)
        .eq('status', 'in_stock')
        .single();

      if (bottleError && bottleError.code !== 'PGRST116') {
        throw bottleError;
      }

      setBottle(bottleData ? {
        ...bottleData,
        wine: Array.isArray(bottleData.wine) ? bottleData.wine[0] : bottleData.wine
      } : null);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (positionId) {
      fetchPositionAndBottle(positionId);
    } else {
      setLoading(false);
      setError('Aucun identifiant de position spécifié');
    }
  }, [positionId, fetchPositionAndBottle]);

  const handleRemoveBottle = async () => {
    if (!bottle) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({ position_id: null })
        .eq('id', bottle.id);
      
      if (error) throw error;
      
      setBottle(null);
      setNotification({
        open: true,
        message: 'Bouteille retirée avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };
  
  const handleConsumeBottle = async () => {
    if (!bottle) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'consumed',
          consumption_date: consumeData.consumption_date,
          tasting_note: consumeData.tasting_note,
          position_id: null
        })
        .eq('id', bottle.id);
      
      if (error) throw error;
      
      setBottle(null);
      setConsumeDialogOpen(false);
      setNotification({
        open: true,
        message: 'Bouteille marquée comme consommée',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };
  
  const handleGiftBottle = async () => {
    if (!bottle) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'gifted',
          position_id: null
        })
        .eq('id', bottle.id);
      
      if (error) throw error;
      
      setBottle(null);
      setNotification({
        open: true,
        message: 'Bouteille marquée comme offerte',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error'
      });
    }
  };

  const getWineColorInfo = (color: string) => {
    const colors = {
      'red': { label: 'Rouge', bgColor: '#8B0000', textColor: '#fff' },
      'white': { label: 'Blanc', bgColor: '#F5F5DC', textColor: '#000' },
      'rose': { label: 'Rosé', bgColor: '#FFB6C1', textColor: '#000' },
      'sparkling': { label: 'Effervescent', bgColor: '#B0C4DE', textColor: '#000' },
      'fortified': { label: 'Fortifié', bgColor: '#8B4513', textColor: '#fff' }
    };
    
    return colors[color as keyof typeof colors] || { label: 'Inconnu', bgColor: '#607D8B', textColor: '#fff' };
  };

  return (
    <>
      <MobileNavbar minimal={true} />
      <Container maxWidth="sm" sx={{ pt: 2, pb: 5 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', mt: 2 }}>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              component={Link} 
              href="/"
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              Retour à l&apos;accueil
            </Button>
          </Paper>
        ) : (
          <Box>
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" component="h1">
                    {location?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Position {position?.row_position}/{position?.column_position}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined"
                  component={Link}
                  href="/storage"
                  startIcon={<ArrowBackIcon />}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  Retour
                </Button>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              {bottle ? (
                <Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2,
                      mb: 3,
                      borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.03)'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: getWineColorInfo(bottle.wine?.color || '').bgColor,
                        color: getWineColorInfo(bottle.wine?.color || '').textColor
                      }}
                    >
                      <WineBarIcon fontSize="large" />
                    </Box>
                    
                    <Typography variant="h5" align="center" gutterBottom>
                      {bottle.wine?.name}
                    </Typography>
                    
                    <Typography variant="subtitle1" align="center">
                      {bottle.wine?.vintage || ''}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" mt={1} flexWrap="wrap" justifyContent="center">
                      <Chip 
                        label={getWineColorInfo(bottle.wine?.color || '').label}
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                      {bottle.wine?.domain && (
                        <Chip 
                          label={bottle.wine.domain}
                          size="small"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      )}
                      {bottle.wine?.region && (
                        <Chip 
                          label={bottle.wine.region}
                          size="small"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      )}
                    </Box>
                    
                    {bottle.label && (
                      <Box display="flex" alignItems="center" mt={2}>
                        <FavoriteIcon color="error" sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">
                          Coup de cœur
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Actions rapides
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        onClick={() => router.push(`/wines/${bottle.wine_id}`)}
                        startIcon={<InfoIcon />}
                        sx={{ height: 56, borderRadius: 2 }}
                      >
                        Détails
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="secondary"
                        onClick={() => setConsumeDialogOpen(true)}
                        startIcon={<RestaurantIcon />}
                        sx={{ height: 56, borderRadius: 2 }}
                      >
                        Consommer
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="warning"
                        onClick={handleGiftBottle}
                        startIcon={<CardGiftcardIcon />}
                        sx={{ height: 56, borderRadius: 2 }}
                      >
                        Offrir
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={handleRemoveBottle}
                        startIcon={<DeleteIcon />}
                        sx={{ height: 56, borderRadius: 2 }}
                      >
                        Retirer
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Box 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(0,0,0,0.05)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mx: 'auto',
                      mb: 3
                    }}
                  >
                    <WineBarIcon fontSize="large" sx={{ opacity: 0.5 }} />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    Emplacement vide
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Aucune bouteille n&apos;est actuellement stockée à cette position.
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => router.push(`/add-bottle?position=${positionId}`)}
                    startIcon={<AddIcon />}
                    sx={{ mt: 2, height: 56, borderRadius: 2 }}
                  >
                    Ajouter une bouteille
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>
        )}
        
        <Dialog
          open={consumeDialogOpen}
          onClose={() => setConsumeDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle>
            Marquer comme consommée
          </DialogTitle>
          <DialogContent>
            <Box my={2}>
              <TextField
                fullWidth
                label="Date de consommation"
                type="date"
                value={consumeData.consumption_date}
                onChange={(e) => setConsumeData({
                  ...consumeData,
                  consumption_date: e.target.value
                })}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Notes de dégustation"
                multiline
                rows={4}
                value={consumeData.tasting_note || ''}
                onChange={(e) => setConsumeData({
                  ...consumeData,
                  tasting_note: e.target.value
                })}
                placeholder="Vos impressions, arômes, saveurs, accords réussis..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setConsumeDialogOpen(false)} 
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleConsumeBottle} 
              variant="contained" 
              color="secondary"
              sx={{ borderRadius: 2 }}
            >
              Confirmer
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setNotification({ ...notification, open: false })} 
            severity={notification.severity}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}