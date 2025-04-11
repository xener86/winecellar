import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Autocomplete,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
// IMPORTANT : On importe Grid depuis le chemin spécifique
import Grid from '@mui/material/Grid';

import { supabase } from '../../../utils/supabase';

interface Wine {
  id: string;
  name: string;
  color: 'red' | 'white' | 'rose' | 'sparkling' | 'fortified';
  vintage?: number | null;
  domain?: string | null;
  region?: string | null;
  appellation?: string | null;
  alcohol_percentage?: number | null;
  // Ajoutez ici d'autres champs si votre table `wine` en contient
}

type AddBottleModalProps = {
  open: boolean;
  onClose: () => void;
  crateId: string;
  onBottleAdded: () => void;
};

const AddBottleModal: React.FC<AddBottleModalProps> = ({
  open,
  onClose,
  crateId,
  onBottleAdded
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  // On remplace any par un tableau de Wine
  const [wines, setWines] = useState<Wine[]>([]);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // États pour créer un nouveau vin
  const [newWine, setNewWine] = useState<Wine>({
    name: '',
    color: 'red',
    vintage: new Date().getFullYear(),
    domain: '',
    region: '',
    appellation: '',
    alcohol_percentage: null
  });

  // Charger les vins existants
  // Ajout de fetchWines dans les dépendances du useEffect
  useEffect(() => {
    if (open && mode === 'existing') {
      fetchWines();
    }
  }, [open, mode, searchTerm]);

  const fetchWines = async () => {
    setLoading(true);
    try {
      let query = supabase.from('wine').select('*');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;

      setWines(data || []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors du chargement des vins :', error.message);
      } else {
        console.error('Erreur lors du chargement des vins :', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter une bouteille existante
  const handleAddExistingWine = async () => {
    if (!selectedWine) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Utilisateur non connecté');

      // On ne stocke plus 'data' vu qu'elle n'est pas utilisée
      const { error } = await supabase.from('bottle').insert({
        wine_id: selectedWine.id,
        crate_id: crateId,
        status: 'in_stock',
        acquisition_date: new Date().toISOString().split('T')[0],
        user_id: userData.user.id
      });

      if (error) throw error;

      onBottleAdded();
      handleClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erreur lors de l'ajout de la bouteille :", error.message);
        alert(`Erreur: ${error.message}`);
      } else {
        console.error("Erreur lors de l'ajout de la bouteille :", error);
        alert(`Erreur: une erreur inconnue est survenue`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour créer un nouveau vin et l'ajouter
  const handleAddNewWine = async () => {
    if (!newWine.name) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Utilisateur non connecté');

      // Créer le nouveau vin
      const { data: wineData, error: wineError } = await supabase
        .from('wine')
        .insert({
          name: newWine.name,
          color: newWine.color,
          vintage: newWine.vintage,
          domain: newWine.domain || null,
          region: newWine.region || null,
          appellation: newWine.appellation || null,
          alcohol_percentage: newWine.alcohol_percentage,
          user_id: userData.user.id
        })
        .select()
        .single();

      if (wineError) throw wineError;

      // Créer la bouteille associée à ce vin
      const { error: bottleError } = await supabase.from('bottle').insert({
        wine_id: wineData.id,
        crate_id: crateId,
        status: 'in_stock',
        acquisition_date: new Date().toISOString().split('T')[0],
        user_id: userData.user.id
      });

      if (bottleError) throw bottleError;

      onBottleAdded();
      handleClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la création du vin :', error.message);
        alert(`Erreur: ${error.message}`);
      } else {
        console.error('Erreur lors de la création du vin :', error);
        alert(`Erreur: une erreur inconnue est survenue`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire lors de la fermeture
  const handleClose = () => {
    setSelectedWine(null);
    setNewWine({
      name: '',
      color: 'red',
      vintage: new Date().getFullYear(),
      domain: '',
      region: '',
      appellation: '',
      alcohol_percentage: null
    });
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: isDarkMode ? '#1A1A1A' : 'white'
        }
      }}
    >
      <DialogTitle>Ajouter une bouteille</DialogTitle>

      <DialogContent>
        {/* On utilise FormControl + RadioGroup pour le choix du mode */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup
            row
            value={mode}
            onChange={(e) => setMode(e.target.value as 'existing' | 'new')}
          >
            <FormControlLabel
              value="existing"
              control={<Radio />}
              label="Choisir un vin existant"
            />
            <FormControlLabel
              value="new"
              control={<Radio />}
              label="Ajouter un nouveau vin"
            />
          </RadioGroup>
        </FormControl>

        {mode === 'existing' ? (
          <Box>
            <Autocomplete
              options={wines}
              loading={loading}
              getOptionLabel={(option) =>
                `${option.name} ${option.vintage || ''}${
                  option.domain ? ` (${option.domain})` : ''
                }`
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher un vin"
                  variant="outlined"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading && (
                          <CircularProgress color="inherit" size={20} />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              value={selectedWine}
              onChange={(_, newValue) => setSelectedWine(newValue)}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body1">
                      {option.name} {option.vintage || ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.domain && `${option.domain}`}
                      {option.region && ` - ${option.region}`}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {selectedWine && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  bgcolor: isDarkMode
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.02)'
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Détails du vin sélectionné
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Nom:
                    </Typography>
                    <Typography variant="body1">{selectedWine.name}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Couleur:
                    </Typography>
                    <Typography variant="body1">
                      {selectedWine.color === 'red'
                        ? 'Rouge'
                        : selectedWine.color === 'white'
                        ? 'Blanc'
                        : selectedWine.color === 'rose'
                        ? 'Rosé'
                        : selectedWine.color === 'sparkling'
                        ? 'Effervescent'
                        : 'Fortifié'}
                    </Typography>
                  </Grid>

                  {selectedWine.vintage && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Millésime:
                      </Typography>
                      <Typography variant="body1">
                        {selectedWine.vintage}
                      </Typography>
                    </Grid>
                  )}

                  {selectedWine.domain && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Domaine:
                      </Typography>
                      <Typography variant="body1">
                        {selectedWine.domain}
                      </Typography>
                    </Grid>
                  )}

                  {selectedWine.region && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Région:
                      </Typography>
                      <Typography variant="body1">
                        {selectedWine.region}
                      </Typography>
                    </Grid>
                  )}

                  {selectedWine.appellation && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Appellation:
                      </Typography>
                      <Typography variant="body1">
                        {selectedWine.appellation}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Informations sur le nouveau vin
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nom du vin"
                  fullWidth
                  required
                  value={newWine.name}
                  onChange={(e) =>
                    setNewWine({ ...newWine, name: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Couleur</InputLabel>
                  <Select
                    value={newWine.color}
                    label="Couleur"
                    onChange={(e) =>
                      setNewWine({ ...newWine, color: e.target.value as Wine['color'] })
                    }
                  >
                    <MenuItem value="red">Rouge</MenuItem>
                    <MenuItem value="white">Blanc</MenuItem>
                    <MenuItem value="rose">Rosé</MenuItem>
                    <MenuItem value="sparkling">Effervescent</MenuItem>
                    <MenuItem value="fortified">Fortifié</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Millésime"
                  type="number"
                  fullWidth
                  value={newWine.vintage ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setNewWine({
                      ...newWine,
                      vintage: isNaN(val) ? null : val
                    });
                  }}
                  inputProps={{
                    min: 1900,
                    max: new Date().getFullYear()
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Domaine"
                  fullWidth
                  value={newWine.domain ?? ''}
                  onChange={(e) =>
                    setNewWine({ ...newWine, domain: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Région"
                  fullWidth
                  value={newWine.region ?? ''}
                  onChange={(e) =>
                    setNewWine({ ...newWine, region: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Appellation"
                  fullWidth
                  value={newWine.appellation ?? ''}
                  onChange={(e) =>
                    setNewWine({ ...newWine, appellation: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Degré d'alcool (%)"
                  type="number"
                  fullWidth
                  value={newWine.alcohol_percentage ?? ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setNewWine({
                      ...newWine,
                      alcohol_percentage: isNaN(val) ? null : val
                    });
                  }}
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.1
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2 }} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={mode === 'existing' ? handleAddExistingWine : handleAddNewWine}
          variant="contained"
          disabled={
            loading || (mode === 'existing' ? !selectedWine : !newWine.name)
          }
          sx={{ borderRadius: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBottleModal;
