// app/storage/components/bottle-manager/MoveBottleTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, Button, CircularProgress,
  Paper, Grid, Alert
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WineBarIcon from '@mui/icons-material/WineBar';
import { alpha, useTheme } from '@mui/material/styles';
import { supabase } from '@/utils/supabase'; 
import { CommonTabProps, Position, Bottle } from '@/utils/types';
import { getWineColorInfo } from './utils';

const MoveBottleTab: React.FC<CommonTabProps> = ({ 
  position, 
  onSuccess, 
  showNotification 
}) => {
  const theme = useTheme();
  
  // États pour les bouteilles et positions
  const [stockBottles, setStockBottles] = useState<Bottle[]>([]);
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null);
  const [moveTargetPosition, setMoveTargetPosition] = useState<Position | null>(null);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [bottlesLoading, setBottlesLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);

  // Récupérer les bouteilles en stock
  const fetchStockBottles = useCallback(async () => {
    if (!position) return;
    
    setBottlesLoading(true);
    try {
      const { data: bottles, error: bottlesError } = await supabase
        .from('bottle')
        .select(`
          id, 
          wine_id, 
          position_id,
          crate_id,
          status,
          acquisition_date,
          consumption_date,
          tasting_note,
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
        .eq('status', 'in_stock')
        .is('position_id', null);
      
      if (bottlesError) throw bottlesError;
      
      const typedBottles: Bottle[] = bottles ? bottles.map(bottle => ({
        id: bottle.id,
        wine_id: bottle.wine_id,
        position_id: bottle.position_id,
        crate_id: bottle.crate_id,
        status: bottle.status,
        acquisition_date: bottle.acquisition_date,
        consumption_date: bottle.consumption_date,
        tasting_note: bottle.tasting_note,
        wine: bottle.wine && Array.isArray(bottle.wine) ? bottle.wine[0] : bottle.wine
      })) : [];
      
      setStockBottles(typedBottles);
    } catch (error: unknown) {
      console.error('Erreur lors de la récupération des bouteilles:', error instanceof Error ? error.message : error);
      showNotification('Erreur lors de la récupération des bouteilles en stock', 'error');
    } finally {
      setBottlesLoading(false);
    }
  }, [position, showNotification]);

  // Récupérer les positions disponibles
  const fetchAvailablePositions = useCallback(async () => {
    if (!position?.storage_location_id) return;
    
    setPositionsLoading(true);
    try {
      // Récupérer toutes les positions de l'emplacement actuel
      const { data: positions, error: positionsError } = await supabase
        .from('position')
        .select('*')
        .eq('storage_location_id', position.storage_location_id)
        .order('row_position', { ascending: true })
        .order('column_position', { ascending: true });
      
      if (positionsError) throw positionsError;
      
      // Récupérer les positions déjà occupées
      const { data: occupiedPositions, error: occupiedError } = await supabase
        .from('bottle')
        .select('position_id')
        .eq('status', 'in_stock')
        .not('position_id', 'is', null);
      
      if (occupiedError) throw occupiedError;
      
      const occupiedIds = new Set((occupiedPositions || []).map(p => p.position_id));
      
      // Filtrer pour ne garder que les positions disponibles
      const availablePos = (positions || []).filter(p => !occupiedIds.has(p.id) && p.id !== position.id);
      
      setAvailablePositions(availablePos);
    } catch (error: unknown) {
      console.error('Erreur lors de la récupération des positions:', error instanceof Error ? error.message : error);
      showNotification('Erreur lors de la récupération des positions disponibles', 'error');
    } finally {
      setPositionsLoading(false);
    }
  }, [position, showNotification]);

  // Charger les données au chargement du composant  
  useEffect(() => {
    fetchStockBottles();
    fetchAvailablePositions();
  }, [fetchStockBottles, fetchAvailablePositions]);

  // Déplacer une bouteille vers une nouvelle position
  const handleMoveBottle = async () => {
    if (!selectedBottle || !moveTargetPosition) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({ position_id: moveTargetPosition.id })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      showNotification('Bouteille déplacée avec succès', 'success');
      onSuccess();
    } catch (error: unknown) {
      console.error('Erreur lors du déplacement de la bouteille:', error instanceof Error ? error.message : error);
      showNotification(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`, 'error');
    }
  };

  // Rendu de la liste des bouteilles en stock
  const renderStockBottlesList = () => {
    if (bottlesLoading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={30} />
        </Box>
      );
    }
    
    if (stockBottles.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune bouteille disponible en stock pour être déplacée
        </Alert>
      );
    }
    
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          maxHeight: 350, 
          overflow: 'auto',
          borderRadius: 2,
          mt: 2
        }}
      >
        <Box>
          {stockBottles.map((bottle) => (
            <Box
              key={bottle.id}
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                bgcolor: selectedBottle?.id === bottle.id ? 
                  alpha(theme.palette.primary.main, 0.1) : 'transparent',
              }}
              onClick={() => setSelectedBottle(selectedBottle?.id === bottle.id ? null : bottle)}
            >
              <Grid container spacing={1} alignItems="center">
                <Grid component="div" sx={{ width: '8%' }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: getWineColorInfo(bottle.wine?.color || '').bgColor,
                      color: getWineColorInfo(bottle.wine?.color || '').textColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <WineBarIcon fontSize="small" />
                  </Box>
                </Grid>
                <Grid component="div" sx={{ width: '92%' }}>
                  <Typography variant="subtitle1">
                    {bottle.wine?.name || 'Vin inconnu'} {bottle.wine?.vintage && `(${bottle.wine.vintage})`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bottle.wine?.domain && `${bottle.wine.domain} • `}
                    {getWineColorInfo(bottle.wine?.color || '').label}
                    {bottle.wine?.region && ` • ${bottle.wine.region}`}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  };

  // Rendu de la liste des positions disponibles
  const renderPositionsList = () => {
    if (positionsLoading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={30} />
        </Box>
      );
    }
    
    if (availablePositions.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune position disponible dans cet emplacement
        </Alert>
      );
    }
    
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          maxHeight: 350, 
          overflow: 'auto',
          borderRadius: 2,
          mt: 2,
          p: 2
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Positions disponibles
        </Typography>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {availablePositions.map((pos) => (
            <Grid key={pos.id} component="div" sx={{ width: { xs: '33%', sm: '25%', md: '20%' } }}>
              <Box
                sx={{
                  border: `1px solid ${moveTargetPosition?.id === pos.id ? 
                    theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 1,
                  p: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: moveTargetPosition?.id === pos.id ? 
                    alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                  }
                }}
                onClick={() => setMoveTargetPosition(moveTargetPosition?.id === pos.id ? null : pos)}
              >
                <Typography variant="body2">
                  {pos.row_position}/{pos.column_position}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="body2" paragraph>
        Sélectionnez une bouteille en stock, puis choisissez une position disponible pour la déplacer.
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Étape 1: Sélectionner une bouteille à déplacer
        </Typography>
        {renderStockBottlesList()}
      </Box>
      
      {selectedBottle && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Étape 2: Choisir une nouvelle position
          </Typography>
          {renderPositionsList()}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowForwardIcon />}
            disabled={!selectedBottle || !moveTargetPosition}
            onClick={handleMoveBottle}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Déplacer la bouteille
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MoveBottleTab;