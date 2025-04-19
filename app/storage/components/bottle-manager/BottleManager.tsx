// app/storage/components/bottle-manager/BottleManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Button, Tabs, Tab, IconButton,
  Snackbar, Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { BottleManagerProps, Notification } from '@/utils/types';

// Importer les composants d'onglets
import ExistingBottleTab from './ExistingBottleTab';
import NewWineTab from './NewWineTab';
import MoveBottleTab from './MoveBottleTab';

const BottleManager: React.FC<BottleManagerProps> = ({ 
  open, 
  onClose, 
  position, 
  onBottleAdded,
  apiKey = ''
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Logs de débogage
  useEffect(() => {
    console.log("BottleManager monté avec props:", {
      open,
      position: position?.id,
      onBottleAdded: typeof onBottleAdded
    });
  }, [open, position, onBottleAdded]);

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Afficher une notification
  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Gérer le succès d'une opération
  const handleSuccess = () => {
    console.log("handleSuccess appelé dans BottleManager", {
      onBottleAddedType: typeof onBottleAdded,
      onBottleAddedValue: onBottleAdded
    });
    
    try {
      if (typeof onBottleAdded === 'function') {
        console.log("Appel de onBottleAdded depuis BottleManager");
        onBottleAdded();
      } else {
        console.error("ERREUR: onBottleAdded n'est pas une fonction:", onBottleAdded);
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'appel à onBottleAdded:', error);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
          <Typography variant="h6">
            Gestion des bouteilles
            {position && (
              <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                - Position {position.row_position}/{position.column_position}
              </Typography>
            )}
          </Typography>
          <IconButton edge="end" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Placer une bouteille" />
          <Tab label="Ajouter une référence" />
          <Tab label="Déplacer une bouteille" />
        </Tabs>
        
        {/* Onglet 1: Placer une bouteille existante */}
        {tabIndex === 0 && (
          <ExistingBottleTab 
            position={position}
            onSuccess={handleSuccess}
            showNotification={showNotification}
          />
        )}
        
        {/* Onglet 2: Ajouter une nouvelle référence de vin */}
        {tabIndex === 1 && (
          <NewWineTab 
            position={position}
            apiKey={apiKey}
            onSuccess={handleSuccess}
            showNotification={showNotification}
          />
        )}
        
        {/* Onglet 3: Déplacer une bouteille */}
        {tabIndex === 2 && (
          <MoveBottleTab
            position={position}
            onSuccess={handleSuccess}
            showNotification={showNotification}
          />
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
          Annuler
        </Button>
      </DialogActions>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={notification.severity} 
          onClose={() => setNotification({ ...notification, open: false })}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BottleManager;