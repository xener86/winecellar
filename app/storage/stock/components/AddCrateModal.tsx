import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, useTheme
} from '@mui/material';

type AddCrateModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (crateName: string) => void;
};

const AddCrateModal: React.FC<AddCrateModalProps> = ({ open, onClose, onAdd }) => {
  const [crateName, setCrateName] = useState('');
  const [error, setError] = useState('');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const handleSubmit = () => {
    if (!crateName.trim()) {
      setError('Veuillez saisir un nom pour la caisse');
      return;
    }
    
    onAdd(crateName);
    setCrateName('');
    setError('');
  };
  
  const handleClose = () => {
    setCrateName('');
    setError('');
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: isDarkMode ? '#1A1A1A' : 'white',
          maxWidth: 400
        }
      }}
    >
      <DialogTitle>
        Ajouter une nouvelle caisse
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chaque caisse peut contenir jusqu&apos;à 6 bouteilles, qui peuvent être de différentes références.
        </Typography>
        
        <TextField
          autoFocus
          margin="dense"
          label="Nom de la caisse"
          fullWidth
          value={crateName}
          onChange={(e) => {
            setCrateName(e.target.value);
            if (e.target.value.trim()) setError('');
          }}
          error={!!error}
          helperText={error}
          placeholder="Ex: Bordeaux récents, Achats mars 2025..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          sx={{ borderRadius: 2 }}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!crateName.trim()}
          sx={{ borderRadius: 2 }}
        >
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCrateModal;