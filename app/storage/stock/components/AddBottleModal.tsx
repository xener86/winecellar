// storage/stock/components/AddBottleModal.tsx
// CORRECTION: Importer useCallback
import React, { useState, useEffect, useCallback } from 'react'; 
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
  MenuItem,
  SelectChangeEvent // Importer SelectChangeEvent pour l'utiliser
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Utilisation de Grid ici
import { supabase } from '../../../utils/supabase';

// Déplacer l'interface Wine ici ou l'importer d'un fichier centralisé
interface Wine {
  id: string;
  name: string;
  color: 'red' | 'white' | 'rose' | 'sparkling' | 'fortified';
  vintage?: number | null;
  domain?: string | null;
  region?: string | null;
  appellation?: string | null;
  alcohol_percentage?: number | null;
}

type AddBottleModalProps = {
  open: boolean;
  onClose: () => void;
  crateId: string; // ID de la caisse à laquelle ajouter
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

  const [wines, setWines] = useState<Wine[]>([]); // Utiliser le type Wine défini
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Préciser le type pour Wine
  const [newWine, setNewWine] = useState<Omit<Wine, 'id'>>({ // Omettre 'id' car il sera généré
    name: '',
    color: 'red', // Valeur par défaut valide
    vintage: new Date().getFullYear(), // Valeur par défaut
    domain: '',
    region: '',
    appellation: '',
    alcohol_percentage: null
  });

  // CORRECTION: Envelopper fetchWines dans useCallback
  const fetchWines = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('wine').select('*');

      // searchTerm est utilisé ici, il doit être une dépendance de useCallback
      if (searchTerm) { 
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;

      setWines((data || []) as Wine[]); // Cast en Wine[] si la structure correspond
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur chargement vins:', error.message);
      } else {
        console.error('Erreur chargement vins:', error);
      }
      // Ajouter une notification utilisateur ici serait une bonne pratique
    } finally {
      setLoading(false);
    }
  // Dépendances de useCallback: searchTerm
  }, [searchTerm]); 


  // CORRECTION: Ajouter fetchWines aux dépendances du useEffect
  useEffect(() => {
    // Charger les vins seulement si le modal est ouvert et en mode 'existant'
    if (open && mode === 'existing') {
      fetchWines(); 
    }
    // Ajouter fetchWines (stable grâce à useCallback) aux dépendances
  }, [open, mode, searchTerm, fetchWines]); 

  // Fonction pour ajouter une bouteille existante
  const handleAddExistingWine = async () => {
    if (!selectedWine) return;
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase.from('bottle').insert({
        wine_id: selectedWine.id,
        crate_id: crateId, // Utiliser la prop crateId
        status: 'in_stock',
        acquisition_date: new Date().toISOString().split('T')[0],
        user_id: user.id
      });
      if (error) throw error;

      onBottleAdded(); // Appeler le callback de succès
      handleClose(); // Fermer le modal
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error("Erreur ajout bouteille:", message);
      alert(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleColorChange = (event: SelectChangeEvent<string>) => {
    setNewWine(prev => ({
      ...prev,
      color: event.target.value as Wine['color']
    }));
  };

  // Fonction pour créer un nouveau vin et ajouter la bouteille
  const handleAddNewWine = async () => {
    if (!newWine.name) return; // Vérification basique
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');

      // Créer le nouveau vin
      const { data: wineData, error: wineError } = await supabase
        .from('wine')
        .insert({
          name: newWine.name,
          color: newWine.color,
          // S'assurer que vintage est number ou null
          vintage: typeof newWine.vintage === 'number' ? newWine.vintage : null, 
          domain: newWine.domain || null,
          region: newWine.region || null,
          appellation: newWine.appellation || null,
          alcohol_percentage: newWine.alcohol_percentage,
          user_id: user.id // Lier à l'utilisateur
        })
        .select() // Récupérer l'enregistrement créé
        .single(); // S'attendre à un seul résultat

      if (wineError) throw wineError;
      if (!wineData) throw new Error("La création du vin n'a pas retourné de données.");

      // Créer la bouteille associée
      const { error: bottleError } = await supabase.from('bottle').insert({
        wine_id: wineData.id, // Utiliser l'ID du vin créé
        crate_id: crateId, // Utiliser la prop crateId
        status: 'in_stock',
        acquisition_date: new Date().toISOString().split('T')[0],
        user_id: user.id
      });
      if (bottleError) throw bottleError;

      onBottleAdded(); // Callback de succès
      handleClose(); // Fermer
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur création vin/bouteille:', message);
      alert(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire et fermer
  const handleClose = () => {
    setSelectedWine(null);
    setNewWine({
      name: '', color: 'red', vintage: new Date().getFullYear(), 
      domain: '', region: '', appellation: '', alcohol_percentage: null
    });
    setSearchTerm('');
    setMode('existing'); // Revenir au mode par défaut ?
    onClose(); // Appeler le onClose passé en prop
  };

  // Gestionnaire de changement pour les champs du nouveau vin
  const handleNewWineChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<Wine['color']>
    ) => {
    const { name, value } = e.target;
    if(name) {
       setNewWine(prev => ({
          ...prev,
          // Gérer la conversion pour vintage et alcohol_percentage
          [name]: (name === 'vintage' || name === 'alcohol_percentage') 
                 ? (value === '' ? null : name === 'vintage' ? parseInt(value, 10) : parseFloat(value)) 
                 : value
       }));
    }
  };


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2, bgcolor: isDarkMode ? '#1A1A1A' : 'white' } }}
    >
      <DialogTitle>Ajouter une bouteille à la caisse</DialogTitle> 

      <DialogContent>
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as 'existing' | 'new')}>
            <FormControlLabel value="existing" control={<Radio />} label="Choisir un vin existant" />
            <FormControlLabel value="new" control={<Radio />} label="Ajouter un nouveau vin" />
          </RadioGroup>
        </FormControl>

        {mode === 'existing' ? (
          // --- Section Vin Existant ---
          <Box>
            <Autocomplete
              options={wines}
              loading={loading && wines.length === 0} // Afficher loading seulement si on charge initialement
              getOptionLabel={(option) => `${option.name} ${option.vintage || ''}${option.domain ? ` (${option.domain})` : ''}` }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher un vin existant"
                  variant="outlined"
                  value={searchTerm} // Lier value à searchTerm pour le contrôle
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              value={selectedWine}
              onChange={(_, newValue) => setSelectedWine(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id} // Important pour comparer objets
              renderOption={(props, option) => (
                // Ajouter key ici pour la performance de React
                <Box component="li" {...props} key={option.id}> 
                  <Box> {/* Pas besoin de flex ici */}
                    <Typography variant="body1">{option.name} {option.vintage || ''}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.domain && `${option.domain}`}
                      {option.region && `${option.domain ? ' - ' : ''}${option.region}`}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText="Aucun vin trouvé"
              loadingText="Chargement..."
            />

            {/* Affichage des détails du vin sélectionné (pour confirmation) */}
            {selectedWine && (
              <Box sx={{ mt: 3, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <Typography variant="subtitle1" gutterBottom>Vin sélectionné</Typography>
                <Grid container spacing={1}>
                <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                <Typography variant="body2"><b>Nom:</b> {selectedWine.name}</Typography></Grid>
                <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                <Typography variant="body2"><b>Couleur:</b> {selectedWine.color}</Typography></Grid>
                  {selectedWine.vintage && <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="body2"><b>Millésime:</b> {selectedWine.vintage}</Typography></Grid>}
                  {selectedWine.domain &&                   <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="body2"><b>Domaine:</b> {selectedWine.domain}</Typography></Grid>}
                  {selectedWine.region &&                   <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="body2"><b>Région:</b> {selectedWine.region}</Typography></Grid>}
                  {selectedWine.appellation &&                   <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="body2"><b>Appellation:</b> {selectedWine.appellation}</Typography></Grid>}
                </Grid>
              </Box>
            )}
          </Box>
        ) : (
          // --- Section Nouveau Vin ---
          <Box>
            <Typography variant="subtitle2" gutterBottom>Informations sur le nouveau vin</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid component="div" sx={{ width: { xs: '100%'} }}>

                <TextField label="Nom du vin" name="name" fullWidth required value={newWine.name} onChange={handleNewWineChange}/>
              </Grid>
              <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
              <FormControl fullWidth>
                  <InputLabel>Couleur</InputLabel>
                  <Select 
  name="color" 
  value={newWine.color} 
  label="Couleur" 
  onChange={handleColorChange}>
  <MenuItem value="red">Rouge</MenuItem>
  <MenuItem value="white">Blanc</MenuItem>
  <MenuItem value="rose">Rosé</MenuItem>
  <MenuItem value="sparkling">Effervescent</MenuItem>
  <MenuItem value="fortified">Fortifié</MenuItem>
</Select>
                </FormControl>
              </Grid>
              <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField label="Millésime" name="vintage" type="number" fullWidth value={newWine.vintage ?? ''} onChange={handleNewWineChange} inputProps={{ min: 1900, max: new Date().getFullYear() }} />
              </Grid>
                  <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField label="Domaine" name="domain" fullWidth value={newWine.domain ?? ''} onChange={handleNewWineChange}/>
              </Grid>
              <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField label="Région" name="region" fullWidth value={newWine.region ?? ''} onChange={handleNewWineChange}/>
              </Grid>
                  <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField label="Appellation" name="appellation" fullWidth value={newWine.appellation ?? ''} onChange={handleNewWineChange}/>
              </Grid>
              <Grid component="div" sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField label="Degré d'alcool (%)" name="alcohol_percentage" type="number" fullWidth value={newWine.alcohol_percentage ?? ''} onChange={handleNewWineChange} inputProps={{ min: 0, max: 100, step: 0.1 }} />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2 }} disabled={loading}>Annuler</Button>
        <Button
          onClick={mode === 'existing' ? handleAddExistingWine : handleAddNewWine}
          variant="contained"
          disabled={loading || (mode === 'existing' ? !selectedWine : !newWine.name)}
          sx={{ borderRadius: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Ajouter la bouteille'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBottleModal;