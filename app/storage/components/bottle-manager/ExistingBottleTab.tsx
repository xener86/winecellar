// app/storage/components/bottle-manager/ExistingBottleTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, TextField, Button, CircularProgress,
  InputAdornment, Paper, Grid, Divider, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WineBarIcon from '@mui/icons-material/WineBar';
import { alpha, useTheme } from '@mui/material/styles';
import { supabase } from '@/utils/supabase'; 
import { CommonTabProps, Wine, Bottle } from '@/utils/types';
import { getWineColorInfo } from './utils';

const ExistingBottleTab: React.FC<CommonTabProps> = ({ 
  position, 
  onSuccess, 
  showNotification 
}) => {
  const theme = useTheme();
  
  // États pour les vins et les bouteilles
  const [wineSearchTerm, setWineSearchTerm] = useState('');
  const [availableWines, setAvailableWines] = useState<Wine[]>([]);
  const [stockBottles, setStockBottles] = useState<Bottle[]>([]);
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [winesLoading, setWinesLoading] = useState(false);
  const [bottlesLoading, setBottlesLoading] = useState(false);

  // Récupérer les vins disponibles pour recherche
  const fetchWines = useCallback(async (searchTerm = '') => {
    setWinesLoading(true);
    try {
      let query = supabase
        .from('wine')
        .select(`
          id, 
          name, 
          color, 
          vintage, 
          domain,
          region,
          appellation,
          alcohol_percentage
        `)
        .order('name');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,domain.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`);
      }
      
      const { data: wines, error: winesError } = await query;
      
      if (winesError) throw winesError;
      
      setAvailableWines(wines as Wine[] || []);
    } catch (error: unknown) {
      console.error('Erreur lors de la récupération des vins:', error instanceof Error ? error.message : error);
      showNotification('Erreur lors de la récupération des vins', 'error');
    } finally {
      setWinesLoading(false);
    }
  }, [showNotification]);

  // Récupérer les bouteilles en stock (non placées)
  const fetchStockBottles = useCallback(async () => {
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
      
      // Ajout des propriétés manquantes pour éviter l'erreur TS2345
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
  }, [showNotification]);

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchWines();
    fetchStockBottles();
  }, [fetchWines, fetchStockBottles]);

  // Placer une bouteille existante à la position sélectionnée
  const handlePlaceBottle = async () => {
    if (!position || !selectedBottle) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({ position_id: position.id })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      showNotification('Bouteille placée avec succès', 'success');
      onSuccess();
    } catch (error: unknown) {
      console.error('Erreur lors du placement de la bouteille:', error instanceof Error ? error.message : error);
      showNotification(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`, 'error');
    }
  };

  // Créer une nouvelle bouteille à partir d'un vin existant
  const handleCreateBottleFromWine = async () => {
    if (!position || !selectedWine) return;
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');
      
      const { error } = await supabase
        .from('bottle')
        .insert({
          wine_id: selectedWine.id,
          position_id: position.id,
          status: 'in_stock',
          acquisition_date: new Date().toISOString().split('T')[0],
          user_id: user.id
        });
      
      if (error) throw error;
      
      showNotification('Nouvelle bouteille ajoutée avec succès', 'success');
      onSuccess();
    } catch (error: unknown) {
      console.error('Erreur lors de la création de la bouteille:', error instanceof Error ? error.message : error);
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
          Aucune bouteille disponible en stock
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

  // Rendu de la liste des vins disponibles
  const renderWinesList = () => {
    if (winesLoading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={30} />
        </Box>
      );
    }
    
    if (availableWines.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucun vin trouvé
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
          {availableWines.map((wine) => (
            <Box
              key={wine.id}
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                bgcolor: selectedWine?.id === wine.id ? 
                  alpha(theme.palette.primary.main, 0.1) : 'transparent',
              }}
              onClick={() => setSelectedWine(selectedWine?.id === wine.id ? null : wine)}
            >
              <Grid container spacing={1} alignItems="center">
                <Grid component="div" sx={{ width: '8%' }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: getWineColorInfo(wine.color).bgColor,
                      color: getWineColorInfo(wine.color).textColor,
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
                    {wine.name} {wine.vintage && `(${wine.vintage})`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {wine.domain && `${wine.domain} • `}
                    {getWineColorInfo(wine.color).label}
                    {wine.region && ` • ${wine.region}`}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  };
  
  return (
    <Box>
      <Typography variant="body2" paragraph>
        Vous pouvez soit placer une bouteille déjà en stock, soit créer une nouvelle bouteille d&apos;un vin existant.
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Option 1: Placer une bouteille du stock
        </Typography>
        {renderStockBottlesList()}
        <Button
          variant="contained"
          color="primary"
          disabled={!selectedBottle}
          onClick={handlePlaceBottle}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Placer la bouteille sélectionnée
        </Button>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Option 2: Créer une nouvelle bouteille d&apos;un vin existant
        </Typography>
        <TextField
          fullWidth
          label="Rechercher un vin"
          value={wineSearchTerm}
          onChange={(e) => {
            setWineSearchTerm(e.target.value);
            fetchWines(e.target.value);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        
        {renderWinesList()}
        
        <Button
          variant="contained"
          color="primary"
          disabled={!selectedWine}
          onClick={handleCreateBottleFromWine}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Créer une bouteille de ce vin
        </Button>
      </Box>
    </Box>
  );
};

export default ExistingBottleTab;