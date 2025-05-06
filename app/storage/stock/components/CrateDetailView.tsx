import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Divider,
  Paper, IconButton, Tooltip, Chip, useTheme,
  Grid, Card, CardContent, CardActions, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { supabase } from '../../../utils/supabase';
import AddBottleModal from './AddBottleModal';
import TransferBottleDialog from './TransferBottleDialog';
import { Bottle } from '@/utils/types';

// Type spécifique pour ce composant
type CrateData = {
  id: string; 
  name: string;
  capacity: number;
  bottles: Bottle[];
};

type CrateDetailViewProps = {
  crate: CrateData;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

const CrateDetailView: React.FC<CrateDetailViewProps> = ({ 
  crate, 
  open, 
  onClose, 
  onRefresh 
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // États
  const [isAddBottleModalOpen, setIsAddBottleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Récupération de la clé API
  useEffect(() => {
    const fetchApiKey = async () => {
      if (!open) return;
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;
        
        const { data, error } = await supabase
          .from('user_preferences')
          .select('openai_api_key, mistral_api_key')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erreur récupération clés API:', error);
          return;
        }
        
        if (data?.openai_api_key) {
          setApiKey(data.openai_api_key);
        } else if (data?.mistral_api_key) {
          setApiKey(data.mistral_api_key);
        }
      } catch (error) {
        console.error('Erreur fetchAPIKeys:', error);
      }
    };
    
    fetchApiKey();
  }, [open]);
  
  // Fonction pour supprimer une bouteille
  const handleRemoveBottle = async (bottleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette bouteille ?')) return;
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase
        .from('bottle')
        .delete()
        .eq('id', bottleId);
      
      if (error) throw error;
      onRefresh();
    } catch (error: unknown) { 
      console.error('Erreur suppression bouteille:', error);
      setErrorMessage(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour consommer une bouteille
  const handleConsumeBottle = async (bottleId: string) => {
    if (!window.confirm('Marquer cette bouteille comme consommée ?')) return;
    
    setLoading(true);
    setErrorMessage(null);
    
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
      setErrorMessage(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour offrir une bouteille
  const handleGiftBottle = async (bottleId: string) => {
    if (!window.confirm('Marquer cette bouteille comme offerte ?')) return;
    
    setLoading(true);
    setErrorMessage(null);
    
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
      setErrorMessage(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour transférer une bouteille vers une étagère
  const handleTransferToShelf = (bottle: Bottle) => {
    setSelectedBottle(bottle);
    setIsTransferDialogOpen(true);
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
  
  // Obtenir la couleur du texte en fonction du fond
  const getTextColorForBackground = (color: string | null | undefined): string => {
    return color === 'red' || color === 'fortified' ? 'white' : 'black';
  };
  
  // Gestion de la fermeture du modal
  const handleDialogClose = () => {
    onClose();
  };
  
  // Gestion de la fin du transfert
  const handleTransferComplete = () => {
    setIsTransferDialogOpen(false);
    onRefresh();
  };
  
  return (
    <Dialog 
      open={open}
      onClose={handleDialogClose}
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
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}
        
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
                          color: getTextColorForBackground(bottle.wine?.color)
                        }}
                      >
                        {bottle.wine?.vintage && (
                          <Typography 
                            variant="caption"
                            sx={{ 
                              fontWeight: 'bold'
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
                              color: getTextColorForBackground(bottle.wine?.color),
                            }}
                          />
                          
                          {bottle.label && (
                            <Chip
                              label={
                                bottle.label === 'favorite' ? 'Coup de cœur' :
                                bottle.label === 'special' ? 'Occasion spéciale' :
                                bottle.label === 'keep' ? 'À garder' :
                                bottle.label === 'aperitif' ? 'Apéritif' :
                                bottle.label === 'ready' ? 'Prêt à boire' : bottle.label
                              }
                              size="small"
                              variant="outlined"
                              color={
                                bottle.label === 'favorite' ? 'error' :
                                bottle.label === 'special' ? 'secondary' :
                                bottle.label === 'keep' ? 'primary' :
                                bottle.label === 'aperitif' ? 'warning' :
                                bottle.label === 'ready' ? 'success' : 'default'
                              }
                            />
                          )}
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
                        <IconButton 
                          size="small" 
                          onClick={() => handleTransferToShelf(bottle)} 
                          sx={{ mr: 0.5 }}
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Consommée">
                        <IconButton 
                          size="small" 
                          onClick={() => handleConsumeBottle(bottle.id)} 
                          sx={{ mr: 0.5 }}
                        >
                          <RestaurantIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Offerte">
                        <IconButton 
                          size="small" 
                          onClick={() => handleGiftBottle(bottle.id)} 
                          sx={{ mr: 0.5 }}
                        >
                          <CardGiftcardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveBottle(bottle.id)}
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
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleDialogClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Fermer
        </Button>
      </DialogActions>
      
      {/* Modals et dialogs */}
      <AddBottleModal 
        open={isAddBottleModalOpen}
        onClose={() => setIsAddBottleModalOpen(false)}
        crateId={crate?.id}
        apiKey={apiKey}
        currentCapacity={crate?.bottles?.length || 0}
        maxCapacity={crate?.capacity || 6}
        onBottleAdded={() => { 
          setIsAddBottleModalOpen(false);
          onRefresh();
        }}
      />
      
      {selectedBottle && (
        <TransferBottleDialog
          open={isTransferDialogOpen}
          onClose={() => setIsTransferDialogOpen(false)}
          bottle={{
            ...selectedBottle,
            // Assurons-nous que tous les champs correspondent au type attendu par TransferBottleDialog
            crate_id: selectedBottle.crate_id ?? null,
            position_id: selectedBottle.position_id ?? null
          }}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </Dialog>
  );
};

export default CrateDetailView;