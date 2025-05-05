// app/storage/stock/components/TransferBottleDialog.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  AlertTitle,
  Alert
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WineBarIcon from '@mui/icons-material/WineBar';
import { supabase } from '../../../utils/supabase';

// Types
interface Wine {
  id: string;
  name: string;
  color: 'red' | 'white' | 'rose' | 'sparkling' | 'fortified';
  vintage?: number | null;
  domain?: string | null;
  region?: string | null;
  appellation?: string | null;
}

interface Bottle {
  id: string;
  wine_id: string;
  crate_id: string | null;
  position_id: string | null;
  status: string;
  wine?: Wine | null;
}

interface StorageLocation {
  id: string;
  name: string;
  type: string;
  row_count: number | null;
  column_count: number | null;
}

interface Position {
  id: string;
  storage_location_id: string;
  row_position: number;
  column_position: number;
  is_occupied?: boolean;
}

interface TransferBottleDialogProps {
  open: boolean;
  onClose: () => void;
  bottle: Bottle | null;
  onTransferComplete: () => void;
}

const TransferBottleDialog: React.FC<TransferBottleDialogProps> = ({
  open,
  onClose,
  bottle,
  onTransferComplete
}) => {
  const theme = useTheme();

  // États
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [error, setError] = useState('');

  // Charger les emplacements de stockage
  const fetchLocations = useCallback(async () => {
    if (!open) return;
    
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');
      
      const { data, error } = await supabase
        .from('storage_location')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(`Erreur lors du chargement des emplacements: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [open]);

  // Charger les positions pour l'emplacement sélectionné
  const fetchPositions = useCallback(async (locationId: string) => {
    setLoading(true);
    try {
      // Récupérer toutes les positions de l'emplacement
      const { data: positionsData, error: positionsError } = await supabase
        .from('position')
        .select('*')
        .eq('storage_location_id', locationId)
        .order('row_position', { ascending: true })
        .order('column_position', { ascending: true });
      
      if (positionsError) throw positionsError;
      
      // Récupérer les positions déjà occupées
      const { data: occupiedData, error: occupiedError } = await supabase
        .from('bottle')
        .select('position_id')
        .eq('status', 'in_stock')
        .not('position_id', 'is', null);
      
      if (occupiedError) throw occupiedError;
      
      // Identifier les positions occupées
      const occupiedIds = new Set((occupiedData || []).map(b => b.position_id));
      
      // Marquer les positions comme occupées ou non
      const allPositions = (positionsData || []).map(pos => ({
        ...pos,
        is_occupied: occupiedIds.has(pos.id)
      }));
      
      setPositions(allPositions);
      
      // Filtrer pour ne garder que les positions disponibles
      const available = allPositions.filter(pos => !pos.is_occupied);
      setAvailablePositions(available);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(`Erreur lors du chargement des positions: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les emplacements au chargement du modal
  useEffect(() => {
    if (open) {
      fetchLocations();
    } else {
      // Réinitialiser les états quand le modal se ferme
      setSelectedLocation(null);
      setPositions([]);
      setAvailablePositions([]);
      setSelectedPosition(null);
      setError('');
    }
  }, [open, fetchLocations]);

  // Mettre à jour les positions quand l'emplacement change
  useEffect(() => {
    if (selectedLocation?.id) {
      fetchPositions(selectedLocation.id);
    } else {
      setPositions([]);
      setAvailablePositions([]);
      setSelectedPosition(null);
    }
  }, [selectedLocation, fetchPositions]);

  // Fonction pour effectuer le transfert
  const handleTransfer = async () => {
    if (!bottle || !selectedPosition) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          position_id: selectedPosition.id,
          crate_id: null // Enlever de la caisse
        })
        .eq('id', bottle.id);
      
      if (error) throw error;
      
      onTransferComplete();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(`Erreur lors du transfert: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fermer le modal et réinitialiser les états
  const handleClose = () => {
    setSelectedLocation(null);
    setPositions([]);
    setAvailablePositions([]);
    setSelectedPosition(null);
    setError('');
    onClose();
  };

  // Obtenir informations sur la couleur du vin
  const getWineColorInfo = (color: string | undefined | null) => {
    const colors: Record<string, { label: string, bgColor: string, textColor: string }> = {
      'red': { label: 'Rouge', bgColor: 'rgba(139, 0, 0, 0.9)', textColor: '#fff' },
      'white': { label: 'Blanc', bgColor: 'rgba(245, 245, 220, 0.9)', textColor: '#000' },
      'rose': { label: 'Rosé', bgColor: 'rgba(255, 182, 193, 0.9)', textColor: '#000' },
      'sparkling': { label: 'Effervescent', bgColor: 'rgba(176, 196, 222, 0.9)', textColor: '#000' },
      'fortified': { label: 'Fortifié', bgColor: 'rgba(139, 69, 19, 0.9)', textColor: '#fff' }
    };
    
    return colors[color || ''] || { label: 'Inconnu', bgColor: '#607D8B', textColor: '#fff' };
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Transférer vers une étagère
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {!bottle ? (
          <Alert severity="error">Aucune bouteille sélectionnée pour le transfert.</Alert>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Bouteille à transférer
              </Typography>
              <Paper
                elevation={0}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2 }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: getWineColorInfo(bottle.wine?.color).bgColor,
                      color: getWineColorInfo(bottle.wine?.color).textColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <WineBarIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">
                      {bottle.wine?.name || 'Vin inconnu'} {bottle.wine?.vintage && `(${bottle.wine.vintage})`}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={getWineColorInfo(bottle.wine?.color).label}
                        size="small"
                        sx={{
                          bgcolor: getWineColorInfo(bottle.wine?.color).bgColor,
                          color: getWineColorInfo(bottle.wine?.color).textColor
                        }}
                      />
                      {bottle.wine?.domain && (
                        <Typography variant="body2" color="text.secondary">
                          {bottle.wine.domain}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Sélectionner un emplacement
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="location-select-label">Emplacement</InputLabel>
              <Select
                labelId="location-select-label"
                value={selectedLocation?.id || ''}
                label="Emplacement"
                onChange={(e) => {
                  const locationId = e.target.value;
                  const location = locations.find(loc => loc.id === locationId);
                  setSelectedLocation(location || null);
                }}
                disabled={loading || locations.length === 0}
              >
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name} ({location.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedLocation && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Sélectionner une position
                </Typography>

                {availablePositions.length === 0 ? (
                  <Alert severity="warning">
                    <AlertTitle>Aucune position disponible</AlertTitle>
                    Toutes les positions de cet emplacement sont occupées. Veuillez choisir un autre emplacement.
                  </Alert>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {availablePositions.length} position(s) disponible(s) sur {positions.length} total
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {availablePositions.map((position) => (
                        <Box
                          key={position.id}
                          sx={{
                            width: '50px',
                            height: '50px',
                            border: `1px solid ${
                              selectedPosition?.id === position.id
                                ? theme.palette.primary.main
                                : theme.palette.divider
                            }`,
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            bgcolor: selectedPosition?.id === position.id
                              ? alpha(theme.palette.primary.main, 0.1)
                              : 'transparent',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              borderColor: alpha(theme.palette.primary.main, 0.5)
                            }
                          }}
                          onClick={() => setSelectedPosition(position)}
                        >
                          <Typography variant="caption" fontWeight="medium">
                            {position.row_position}/{position.column_position}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2 }} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleTransfer}
          variant="contained"
          startIcon={<ArrowForwardIcon />}
          disabled={loading || !selectedPosition}
          sx={{ borderRadius: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Transférer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferBottleDialog;