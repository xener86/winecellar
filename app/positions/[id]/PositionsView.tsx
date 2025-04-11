'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WineBarIcon from '@mui/icons-material/WineBar';
import Navbar from '../../components/Navbar';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type StorageLocation = {
  id: string;
  name: string;
  type: string;
  row_count: number | null;
  column_count: number | null;
};

type Position = {
  id: string;
  storage_location_id: string;
  row_position: number;
  column_position: number;
  qr_code: string | null;
};

type Wine = {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  position_id: string | null;
};

type PositionsViewProps = {
  params: {
    id: string;
  };
};

export default function PositionsView({ params }: PositionsViewProps) {
  const router = useRouter();
  const [location, setLocation] = useState<StorageLocation | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [wines, setWines] = useState<Wine[]>([]);
  const [availableWines, setAvailableWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWineId, setSelectedWineId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Vérifier l'authentification
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.push('/login');
          return;
        }
        
        // Récupérer l'emplacement
        const { data: locationData, error: locationError } = await supabase
          .from('storage_location')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (locationError) {
          console.error('Erreur récupération emplacement:', locationError);
          return;
        }
        
        setLocation(locationData);
        
        // Récupérer les positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('position')
          .select('*')
          .eq('storage_location_id', params.id)
          .order('row_position', { ascending: true })
          .order('column_position', { ascending: true });
        
        if (positionsError) {
          console.error('Erreur récupération positions:', positionsError);
          return;
        }
        
        setPositions(positionsData || []);
        
        // Récupérer tous les vins
        const { data: winesData, error: winesError } = await supabase
          .from('wine')
          .select('*');
        
        if (winesError) {
          console.error('Erreur récupération vins:', winesError);
          return;
        }
        
        setWines(winesData || []);
        
        // Filtrer les vins disponibles (sans position)
        setAvailableWines(winesData?.filter(wine => !wine.position_id) || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.id, router]);

  const getWineAtPosition = (positionId: string) => {
    return wines.find(wine => wine.position_id === positionId);
  };

  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position);
    setDialogOpen(true);
  };

  const assignWine = async () => {
    if (!selectedPosition || !selectedWineId) return;
    
    try {
      console.log('Assignation du vin', selectedWineId, 'à la position', selectedPosition.id);
      
      const { error } = await supabase
        .from('wine')
        .update({ position_id: selectedPosition.id })
        .eq('id', selectedWineId);
      
      if (error) {
        console.error("Erreur lors de l'assignation:", error);
        return;
      }
      
      // Fermer le dialogue et rafraîchir
      setDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const removeWine = async (wineId: string) => {
    try {
      const { error } = await supabase
        .from('wine')
        .update({ position_id: null })
        .eq('id', wineId);
      
      if (error) {
        console.error('Erreur lors du retrait:', error);
        return;
      }
      
      // Fermer le dialogue et rafraîchir
      setDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box mb={3}>
          <Button 
            component={Link} 
            href="/storage" 
            startIcon={<ArrowBackIcon />}
          >
            Retour aux emplacements
          </Button>
        </Box>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            {location?.name || 'Emplacement'}
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            Type:{' '}
            {location?.type === 'shelf'
              ? 'Étagère'
              : location?.type === 'case'
              ? 'Caisse'
              : location?.type === 'drawer'
              ? 'Tiroir'
              : location?.type === 'rack'
              ? 'Casier'
              : location?.type}
          </Typography>
          
          {/* Grille des positions */}
          {(location?.row_count && location?.column_count) ? (
            <Grid container spacing={1} sx={{ mt: 2 }}>
              {Array.from({ length: location.row_count ?? 0 }, (_, rowIndex) => (
                <Grid item component="div" xs={12} key={rowIndex}>
                  <Box display="flex" justifyContent="center">
                    {Array.from({ length: location.column_count ?? 0 }, (_, colIndex) => {
                      const position = positions.find(
                        p =>
                          p.row_position === rowIndex + 1 &&
                          p.column_position === colIndex + 1
                      );
                      const wine = position ? getWineAtPosition(position.id) : null;
                      
                      return (
                        <Box 
                          key={colIndex}
                          sx={{
                            width: 100,
                            height: 100,
                            m: 0.5,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: '1px solid #ccc',
                            borderRadius: 1,
                            backgroundColor: wine
                              ? (wine.color === 'red'
                                  ? '#8B0000'
                                  : wine.color === 'white'
                                  ? '#F5F5DC'
                                  : wine.color === 'rose'
                                  ? '#FFB6C1'
                                  : wine.color === 'sparkling'
                                  ? '#B0C4DE'
                                  : wine.color === 'fortified'
                                  ? '#8B4513'
                                  : '#f5f5f5')
                              : '#f5f5f5',
                            color: wine?.color === 'red' || wine?.color === 'fortified' ? '#fff' : '#000',
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                              boxShadow: 3,
                            }
                          }}
                          onClick={() => position && handlePositionClick(position)}
                        >
                          {wine ? (
                            <>
                              <WineBarIcon />
                              <Typography
                                variant="caption"
                                align="center"
                                sx={{ mt: 1, px: 1, wordBreak: 'break-word' }}
                              >
                                {wine.name}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2">Vide</Typography>
                          )}
                          <Typography variant="caption" sx={{ mt: 'auto' }}>
                            {rowIndex + 1}/{colIndex + 1}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" sx={{ mt: 2 }}>
              Cet emplacement n&apos;a pas de dimensions définies.
            </Typography>
          )}
        </Paper>
      </Container>
      
      {/* Dialogue pour assigner un vin */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          Position {selectedPosition?.row_position}/{selectedPosition?.column_position}
        </DialogTitle>
        <DialogContent>
          {getWineAtPosition(selectedPosition?.id || '') ? (
            <>
              <Typography variant="body1" gutterBottom>
                Vin actuellement assigné :
              </Typography>
              <Typography variant="h6">
                {getWineAtPosition(selectedPosition?.id || '')?.name}
              </Typography>
              <Button 
                variant="outlined" 
                color="error" 
                sx={{ mt: 2 }}
                onClick={() => {
                  const wine = getWineAtPosition(selectedPosition?.id || '');
                  if (wine) removeWine(wine.id);
                }}
              >
                Retirer le vin
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                Aucun vin assigné à cette position. Vous pouvez en assigner un :
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Sélectionner un vin</InputLabel>
                <Select
                  value={selectedWineId}
                  label="Sélectionner un vin"
                  onChange={(e) => setSelectedWineId(e.target.value as string)}
                >
                  {availableWines.map(wine => (
                    <MenuItem key={wine.id} value={wine.id}>
                      {wine.name} {wine.vintage && `(${wine.vintage})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                disabled={!selectedWineId}
                onClick={assignWine}
              >
                Assigner
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}