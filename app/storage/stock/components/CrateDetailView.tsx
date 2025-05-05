import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Divider,
  Paper, IconButton, Tooltip, Chip, useTheme,
  Grid, Card, CardContent, CardActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { supabase } from '../../../utils/supabase';
import AddBottleModal from './AddBottleModal';

// Types
type Wine = {
  id: string;
  name?: string | null;
  color?: string | null;
  vintage?: number | null;
  domain?: string | null;
  region?: string | null;
};

type Bottle = {
  id: string;
  wine_id: string;
  position_id?: string | null;
  crate_id?: string | null;
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
  bottles: Bottle[];
};

type CrateDetailViewProps = {
  crate: CrateData;
  open: boolean; // Ajout d'une prop open pour contrôler l'état
  onClose: () => void;
  onRefresh: () => void;
};

const CrateDetailView: React.FC<CrateDetailViewProps> = ({ 
  crate, 
  open, // Utiliser cette prop pour contrôler l'état de Dialog
  onClose, 
  onRefresh 
}) => {
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
      onRefresh();
    } catch (error: unknown) { 
      console.error('Erreur suppression bouteille:', error);
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
          crate_id: null,
          position_id: null
        })
        .eq('id', bottleId);
      
      if (error) throw error;
      onRefresh();
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
          crate_id: null,
          position_id: null
        })
        .eq('id', bottleId);
      
      if (error) throw error;
      onRefresh();
    } catch (error: unknown) { 
      console.error('Erreur statut offert:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTransferToShelf = async (_bottleId: string) => { 
    alert('Fonctionnalité de transfert vers étagère à implémenter');
  };
  
  // Fonction pour ajouter une bouteille à la caisse
  const handleAddBottle = () => {
    setIsAddBottleModalOpen(true);
  };
  
  // Obtenir la couleur de fond
  const getWineColorCode = (color: string | null | undefined): string => {
     return color === 'red' ? 'rgba(139, 0, 0, 0.9)' : 
            color === 'white' ? 'rgba(245, 245, 220, 0.9)' :
            color === 'rose' ? 'rgba(255, 182, 193, 0.9)' :
            color === 'sparkling' ? 'rgba(176, 196, 222, 0.9)' :
            color === 'fortified' ? 'rgba(139, 69, 19, 0.9)' :
            'rgba(120, 120, 120, 0.7)';
  };
  
  // Obtenir le nom de la couleur en français
  const getWineColorName = (color: string | null | undefined): string => {
      return color === 'red' ? 'Rouge' :
            color === 'white' ? 'Blanc' :
            color === 'rose' ? 'Rosé' :
            color === 'sparkling' ? 'Effervescent' :
            color === 'fortified' ? 'Fortifié' :
            'Inconnu';
  };
  
  // Gestion de la fermeture du modal
  const handleDialogClose = () => {
    // Appeler onClose pour informer le composant parent
    onClose();
  };
  
  return (
    <Dialog 
      open={open} // Utiliser la prop open ici au lieu de true
      onClose={handleDialogClose} // Utiliser notre fonction de gestion
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2, bgcolor: isDarkMode ? '#1A1A1A' : 'white', overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {crate?.name || "Détails de la caisse"}
          </Typography>
          <IconButton onClick={handleDialogClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            Capacité: {crate?.bottles?.length ?? 0}/{typeof crate?.capacity === 'number' ? crate.capacity : '?'} bouteilles
          </Typography>
          
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={handleAddBottle}
            disabled={(crate?.bottles?.length ?? 0) >= (crate?.capacity ?? Infinity) || loading}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Ajouter une bouteille
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {!crate || crate.bottles?.length === 0 ? ( 
          <Paper sx={{ p: 3, textAlign: 'center' }}> 
             <Typography>Cette caisse est vide. Ajoutez des bouteilles pour commencer.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {crate.bottles.map((bottle: Bottle) => ( 
              <Grid component="div" key={bottle.id} sx={{ width: { xs: '100%', md: '50%' } }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box display="flex" alignItems="flex-start" mb={1}>
                      <Box 
                        sx={{ 
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          mr: 2,
                          bgcolor: getWineColorCode(bottle.wine?.color), 
                        }}
                      >
                        {bottle.wine?.vintage && (
                          <Typography 
                            variant="caption"
                            sx={{ 
                              fontWeight: 'bold',
                              color: bottle.wine?.color === 'red' || bottle.wine?.color === 'fortified' ? 'white' : 'black',
                            }}
                          >
                            {bottle.wine.vintage}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {bottle.wine?.name || 'Vin sans nom'} 
                        </Typography>
                        
                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                          <Chip 
                            label={getWineColorName(bottle.wine?.color)} 
                            size="small"
                            sx={{ 
                              bgcolor: getWineColorCode(bottle.wine?.color),
                              color: bottle.wine?.color === 'red' || bottle.wine?.color === 'fortified' ? 'white' : 'black',
                            }}
                          />
                        </Box>
                        
                        {bottle.wine?.domain && (
                          <Typography variant="body2">{bottle.wine.domain}</Typography>
                        )}
                        {bottle.wine?.region && (
                          <Typography variant="body2" color="text.secondary">{bottle.wine.region}</Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {bottle.acquisition_date && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Acquise le {new Date(bottle.acquisition_date).toLocaleDateString('fr-FR')}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ pt: 0, pb: 1, px: 2, justifyContent: 'space-between' }}>
                    <Box display="flex">
                      <Tooltip title="Transférer vers étagère">
                        <IconButton size="small" onClick={() => handleTransferToShelf(bottle.id)} sx={{ mr: 0.5 }}>
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Consommée">
                        <IconButton size="small" onClick={() => handleConsumeBottle(bottle.id)} sx={{ mr: 0.5 }}>
                          <RestaurantIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Offerte">
                        <IconButton size="small" onClick={() => handleGiftBottle(bottle.id)} sx={{ mr: 0.5 }}>
                          <CardGiftcardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Tooltip title="Supprimer">
                      <IconButton size="small" onClick={() => handleRemoveBottle(bottle.id)}>
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
        <AddBottleModal 
          open={isAddBottleModalOpen}
          onClose={() => setIsAddBottleModalOpen(false)}
          crateId={crate?.id} 
          onBottleAdded={() => { 
             setIsAddBottleModalOpen(false);
             onRefresh();
           }}
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleDialogClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CrateDetailView;