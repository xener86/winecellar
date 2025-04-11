import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, List, ListItem, Divider,
  Paper, IconButton, Tooltip, Chip, useTheme,
  Grid, Card, CardContent, CardActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { supabase } from '../../../utils/supabase';
import AddBottleModal from './AddBottleModal';

type CrateDetailViewProps = {
  crate: any;
  onClose: () => void;
  onRefresh: () => void;
};

const CrateDetailView: React.FC<CrateDetailViewProps> = ({ crate, onClose, onRefresh }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isAddBottleModalOpen, setIsAddBottleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Fonction pour supprimer une bouteille
  const handleRemoveBottle = async (bottleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette bouteille ?')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bottle')
        .delete()
        .eq('id', bottleId);
      
      if (error) throw error;
      
      onRefresh();
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la bouteille:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour consommer une bouteille
  const handleConsumeBottle = async (bottleId: string) => {
    if (!window.confirm('Marquer cette bouteille comme consommée ?')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'consumed',
          consumption_date: new Date().toISOString().split('T')[0],
          crate_id: null
        })
        .eq('id', bottleId);
      
      if (error) throw error;
      
      onRefresh();
    } catch (error: any) {
      console.error('Erreur lors de la consommation de la bouteille:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour offrir une bouteille
  const handleGiftBottle = async (bottleId: string) => {
    if (!window.confirm('Marquer cette bouteille comme offerte ?')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'gifted',
          crate_id: null
        })
        .eq('id', bottleId);
      
      if (error) throw error;
      
      onRefresh();
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour transférer une bouteille vers une étagère
  const handleTransferToShelf = async (bottleId: string) => {
    // Cette fonction sera complétée pour ouvrir un sélecteur d'étagère et d'emplacement
    alert('Fonctionnalité de transfert vers étagère à implémenter');
  };
  
  // Fonction pour ajouter une bouteille à la caisse
  const handleAddBottle = () => {
    setIsAddBottleModalOpen(true);
  };
  
  // Obtenir la couleur de fond pour une bouteille de vin
  const getWineColorCode = (color: string) => {
    return color === 'red' ? 'rgba(139, 0, 0, 0.9)' : 
           color === 'white' ? 'rgba(245, 245, 220, 0.9)' :
           color === 'rose' ? 'rgba(255, 182, 193, 0.9)' :
           color === 'sparkling' ? 'rgba(176, 196, 222, 0.9)' :
           'rgba(139, 69, 19, 0.9)';
  };
  
  // Obtenir le nom de la couleur en français
  const getWineColorName = (color: string) => {
    return color === 'red' ? 'Rouge' :
           color === 'white' ? 'Blanc' :
           color === 'rose' ? 'Rosé' :
           color === 'sparkling' ? 'Effervescent' :
           'Fortifié';
  };
  
  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: isDarkMode ? '#1A1A1A' : 'white',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {crate.name}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            Capacité: {crate.bottles.length}/{crate.capacity} bouteilles
          </Typography>
          
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={handleAddBottle}
            disabled={crate.bottles.length >= crate.capacity || loading}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Ajouter une bouteille
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {crate.bottles.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Cette caisse est vide. Ajoutez des bouteilles pour commencer.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {crate.bottles.map((bottle: any) => (
              <Grid item xs={12} sm={6} md={4} key={bottle.id}>
                <Card 
                  elevation={0}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box display="flex" alignItems="flex-start" mb={1}>
                      <Box 
                        sx={{ 
                          width: 40,
                          height: 80,
                          borderRadius: '10px 10px 0 0',
                          bgcolor: getWineColorCode(bottle.wine?.color || 'red'),
                          mr: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {bottle.wine?.vintage && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              position: 'absolute',
                              bottom: 5,
                              color: bottle.wine.color === 'red' || bottle.wine.color === 'fortified' ? 'white' : 'black',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          >
                            {bottle.wine.vintage}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5, lineHeight: 1.2 }}>
                          {bottle.wine?.name || 'Vin sans nom'}
                        </Typography>
                        
                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                          <Chip 
                            label={getWineColorName(bottle.wine?.color || 'red')} 
                            size="small"
                            sx={{ 
                              bgcolor: getWineColorCode(bottle.wine?.color || 'red'),
                              color: bottle.wine?.color === 'red' || bottle.wine?.color === 'fortified' ? 'white' : 'black',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </Box>
                        
                        {bottle.wine?.domain && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {bottle.wine.domain}
                          </Typography>
                        )}
                        
                        {bottle.wine?.region && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {bottle.wine.region}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {bottle.acquisition_date && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.7rem' }}>
                        Acquise le {new Date(bottle.acquisition_date).toLocaleDateString('fr-FR')}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pt: 0, pb: 2 }}>
                    <Box display="flex">
                      <Tooltip title="Transférer vers étagère">
                        <IconButton 
                          size="small" 
                          onClick={() => handleTransferToShelf(bottle.id)}
                          sx={{ 
                            mr: 0.5,
                            color: theme.palette.primary.main,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)'
                            }
                          }}
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Consommée">
                        <IconButton 
                          size="small" 
                          onClick={() => handleConsumeBottle(bottle.id)}
                          sx={{ 
                            mr: 0.5,
                            color: theme.palette.secondary.main,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.05)',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)'
                            }
                          }}
                        >
                          <RestaurantIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Offerte">
                        <IconButton 
                          size="small" 
                          onClick={() => handleGiftBottle(bottle.id)}
                          sx={{ 
                            color: theme.palette.warning.main,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)'
                            }
                          }}
                        >
                          <CardGiftcardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveBottle(bottle.id)}
                        sx={{ 
                          color: theme.palette.error.main,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.1)'
                          }
                        }}
                      >
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
          crateId={crate.id}
          onBottleAdded={onRefresh}
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CrateDetailView;