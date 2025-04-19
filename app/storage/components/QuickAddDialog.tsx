// app/storage/components/QuickAddDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, IconButton, Box, Button
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Position } from '@/utils/types'; // Utiliser le type centralisé
import { supabase } from '../../utils/supabase';

// Importer notre nouveau gestionnaire de bouteilles décomposé
import BottleManager from './bottle-manager';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedPosition: Position | null;
  onBottleAdded: () => void;
}

const QuickAddDialog: React.FC<Props> = ({ 
  open, 
  onClose, 
  selectedPosition,
  onBottleAdded
}) => {
  const [showBottleManager, setShowBottleManager] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  console.log("QuickAddDialog props:", { open, onBottleAdded: typeof onBottleAdded });
  
  // Récupérer la clé API utilisateur pour l'IA
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
      } catch (error: unknown) {
        console.error('Erreur fetchAPIKeys:', error);
      }
    };
    
    fetchApiKey();
  }, [open]);
  
  // Définir une fonction de rappel sécurisée
  const handleBottleAdded = () => {
    console.log("handleBottleAdded appelé dans QuickAddDialog");
    // S'assurer que onBottleAdded est une fonction avant de l'appeler
    if (typeof onBottleAdded === 'function') {
      onBottleAdded();
    } else {
      console.error("onBottleAdded n'est pas une fonction:", onBottleAdded);
    }
  };
  
  // Réinitialiser l'état lorsque le dialogue est fermé
  const handleDialogClose = () => {
    console.log("handleDialogClose appelé dans QuickAddDialog");
    setShowBottleManager(false);
    onClose();
  };
  
  // Si le gestionnaire de bouteilles est ouvert, l'afficher directement
  if (showBottleManager && selectedPosition) {
    return (
      <BottleManager
        open={true}
        onClose={handleDialogClose}
        position={selectedPosition}
        onBottleAdded={handleBottleAdded}
        apiKey={apiKey}
      />
    );
  }

  // Sinon afficher le dialogue d'introduction
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Ajouter une bouteille</Typography>
          <IconButton edge="end" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box my={2}>
          <Typography variant="subtitle2" gutterBottom>
            Position : Rangée {selectedPosition?.row_position}, Colonne {selectedPosition?.column_position}
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            Que souhaitez-vous faire ?
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2} mt={3}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={() => setShowBottleManager(true)}
              sx={{ height: 64, borderRadius: 2 }}
            >
              Gérer les bouteilles à cette position
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>Annuler</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickAddDialog;