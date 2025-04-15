import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, /* List, ListItem, */ Divider, // CORRECTION: List, ListItem supprimés
  Paper, IconButton, Tooltip, Chip, useTheme,
  Grid, Card, CardContent, CardActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// CORRECTION: SaveIcon supprimé
// import SaveIcon from '@mui/icons-material/Save'; 
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { supabase } from '../../../utils/supabase';
import AddBottleModal from './AddBottleModal'; // Assurez-vous que ce composant existe et est correct

// --- AJOUT: Types (Idéalement depuis un fichier central) ---
type Wine = {
  id: string;
  name?: string | null;
  color?: string | null;
  vintage?: number | null;
  domain?: string | null;
  region?: string | null;
  // Ajoutez d'autres champs si nécessaire
};

type Bottle = {
  id: string;
  wine_id: string;
  position_id?: string | null; // Peut être null si pas dans une position spécifique de Crate/Shelf
  crate_id?: string | null; // Ajout potentiel si une bouteille peut être liée à une caisse
  status?: string;
  acquisition_date?: string | null;
  consumption_date?: string | null;
  tasting_note?: string | null;
  label?: string | null;
  wine?: Wine | null; 
};

type CrateData = {
  id: string; 
  name: string;
  capacity: number;
  bottles: Bottle[]; // Tableau de bouteilles
};
// --- FIN AJOUT TYPES ---

// CORRECTION: Utiliser CrateData et typer onRefresh
type CrateDetailViewProps = {
  crate: CrateData; // Utilisation du type CrateData
  onClose: () => void;
  onRefresh: () => void; // Garder onRefresh si utilisé (appelé après actions)
};

const CrateDetailView: React.FC<CrateDetailViewProps> = ({ crate, onClose, onRefresh }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isAddBottleModalOpen, setIsAddBottleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Fonction pour supprimer une bouteille
  const handleRemoveBottle = async (bottleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette bouteille ?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bottle')
        .delete()
        .eq('id', bottleId);
      
      if (error) throw error;
      onRefresh(); // Rafraîchir après suppression
    // CORRECTION: Typage de l'erreur dans catch
    } catch (error: unknown) { 
      console.error('Erreur suppression bouteille:', error);
      // Utiliser instanceof Error pour accéder à message
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour consommer une bouteille
  const handleConsumeBottle = async (bottleId: string) => {
    if (!window.confirm('Marquer cette bouteille comme consommée ?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'consumed',
          consumption_date: new Date().toISOString().split('T')[0],
          crate_id: null, // Supposer qu'on la retire de la caisse aussi
          position_id: null // Et de sa position si elle en avait une
        })
        .eq('id', bottleId);
      
      if (error) throw error;
      onRefresh(); // Rafraîchir
    // CORRECTION: Typage de l'erreur dans catch
    } catch (error: unknown) {
      console.error('Erreur consommation bouteille:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour offrir une bouteille
  const handleGiftBottle = async (bottleId: string) => {
    if (!window.confirm('Marquer cette bouteille comme offerte ?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'gifted',
          crate_id: null, // Supposer qu'on la retire de la caisse
          position_id: null
        })
        .eq('id', bottleId);
      
      if (error) throw error;
      onRefresh(); // Rafraîchir
    // CORRECTION: Typage de l'erreur dans catch
    } catch (error: unknown) { 
      console.error('Erreur statut offert:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour transférer une bouteille vers une étagère
  // CORRECTION: Préfixer bottleId avec _ car non utilisé
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTransferToShelf = async (_bottleId: string) => { 
    // Cette fonction sera complétée pour ouvrir un sélecteur d'étagère et d'emplacement
    alert('Fonctionnalité de transfert vers étagère à implémenter');
    // TODO: Implémenter la logique de transfert
    // const { error } = await supabase.from('bottle').update({ crate_id: null, position_id: newPositionId }).eq('id', bottleId);
    // if (!error) onRefresh();
  };
  
  // Fonction pour ajouter une bouteille à la caisse
  const handleAddBottle = () => {
    setIsAddBottleModalOpen(true);
  };
  
  // Obtenir la couleur de fond (inchangée)
  const getWineColorCode = (color: string | null | undefined): string => {
     // ... (code existant) ...
     return color === 'red' ? 'rgba(139, 0, 0, 0.9)' : 
            color === 'white' ? 'rgba(245, 245, 220, 0.9)' :
            color === 'rose' ? 'rgba(255, 182, 193, 0.9)' :
            color === 'sparkling' ? 'rgba(176, 196, 222, 0.9)' :
            color === 'fortified' ? 'rgba(139, 69, 19, 0.9)' : // Ajout Fortified
            'rgba(120, 120, 120, 0.7)';
  };
  
  // Obtenir le nom de la couleur en français (inchangée)
  const getWineColorName = (color: string | null | undefined): string => {
     // ... (code existant) ...
      return color === 'red' ? 'Rouge' :
            color === 'white' ? 'Blanc' :
            color === 'rose' ? 'Rosé' :
            color === 'sparkling' ? 'Effervescent' :
            color === 'fortified' ? 'Fortifié' : // Ajout Fortified
            'Inconnu';
  };
  
  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2, bgcolor: isDarkMode ? '#1A1A1A' : 'white', overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {crate?.name || "Détails de la caisse"} {/* Ajouter fallback */}
          </Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {/* Vérifier existence de capacity et bottles */}
            Capacité: {crate?.bottles?.length ?? 0}/{typeof crate?.capacity === 'number' ? crate.capacity : '?'} bouteilles
          </Typography>
          
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={handleAddBottle}
            // Vérifier existence avant comparaison
            disabled={(crate?.bottles?.length ?? 0) >= (crate?.capacity ?? Infinity) || loading}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Ajouter une bouteille
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Utiliser ?.length pour vérifier */}
        {!crate || crate.bottles?.length === 0 ? ( 
          <Paper /* ... Message caisse vide ... */ > 
             {/* ... */}
          </Paper>
        ) : (
          <Grid container spacing={2}>
             {/* CORRECTION: Utiliser le type Bottle dans le map */}
            {crate.bottles.map((bottle: Bottle) => ( 
              <Grid component="div" key={bottle.id} sx={{ width: { xs: '100%', md: '50%' } }}>
                <Card /* ... Styles carte bouteille ... */ >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box display="flex" alignItems="flex-start" mb={1}>
                      <Box /* ... Box pour image/couleur bouteille ... */
                        sx={{ 
                           /* ... autres styles ... */
                           // Utilisation de ?. pour accès sécurisé
                          bgcolor: getWineColorCode(bottle.wine?.color), 
                        }}
                      >
                        {bottle.wine?.vintage && (
                          <Typography /* ... Styles millésime ... */
                            sx={{ 
                               /* ... autres styles ... */
                              // Utilisation de ?. pour accès sécurisé
                              color: bottle.wine?.color === 'red' || bottle.wine?.color === 'fortified' ? 'white' : 'black',
                            }}
                          >
                            {bottle.wine.vintage}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1 }}>
                         {/* Utilisation de ?. et fallback */}
                        <Typography variant="subtitle1" sx={{ /* ... */ }}>
                          {bottle.wine?.name || 'Vin sans nom'} 
                        </Typography>
                        
                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                          <Chip 
                             // Utilisation de ?. et fallback
                            label={getWineColorName(bottle.wine?.color)} 
                            size="small"
                            sx={{ 
                               /* ... autres styles ... */
                               // Utilisation de ?. pour accès sécurisé
                              bgcolor: getWineColorCode(bottle.wine?.color),
                              color: bottle.wine?.color === 'red' || bottle.wine?.color === 'fortified' ? 'white' : 'black',
                            }}
                          />
                        </Box>
                        
                        {/* Utilisation de ?. pour accès sécurisé */}
                        {bottle.wine?.domain && (<Typography /* ... */ >{bottle.wine.domain}</Typography>)}
                        {bottle.wine?.region && (<Typography /* ... */ >{bottle.wine.region}</Typography>)}
                      </Box>
                    </Box>
                    
                    {/* Utilisation de ?. pour accès sécurisé */}
                    {bottle.acquisition_date && (
                      <Typography /* ... */ >
                        Acquise le {new Date(bottle.acquisition_date).toLocaleDateString('fr-FR')}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ /* ... */ }}>
                    <Box display="flex">
                      <Tooltip title="Transférer vers étagère">
                         {/* CORRECTION: Utiliser _bottleId car renommé */}
                        <IconButton size="small" onClick={() => handleTransferToShelf(bottle.id)} sx={{ /* ... */ }}>
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Consommée">
                        <IconButton size="small" onClick={() => handleConsumeBottle(bottle.id)} sx={{ /* ... */ }}>
                          <RestaurantIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Offerte">
                        <IconButton size="small" onClick={() => handleGiftBottle(bottle.id)} sx={{ /* ... */ }}>
                          <CardGiftcardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Tooltip title="Supprimer">
                      <IconButton size="small" onClick={() => handleRemoveBottle(bottle.id)} sx={{ /* ... */ }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Modal pour ajouter une bouteille */}
        {/* Assurez-vous que AddBottleModal gère bien crateId */}
        <AddBottleModal 
          open={isAddBottleModalOpen}
          onClose={() => setIsAddBottleModalOpen(false)}
          // Passer crateId si nécessaire au modal, ou gérer l'ajout directement ici
          crateId={crate?.id} 
          onBottleAdded={() => { 
             setIsAddBottleModalOpen(false); // Fermer modal après ajout
             onRefresh(); // Rafraîchir la liste
           }}
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CrateDetailView;