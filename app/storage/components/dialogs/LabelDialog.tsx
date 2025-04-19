// File: app/storage/components/dialogs/LabelDialog.tsx
import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Typography, Box, Button, Grid
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import { Bottle } from '@types';

// Étiquettes personnalisées
const customLabels = [
  { id: 'favorite', label: 'Coup de cœur', icon: <FavoriteIcon color="error" />, color: '#FFD54F' },
  { id: 'special', label: 'Occasion spéciale', icon: <CelebrationIcon color="secondary" />, color: '#7986CB' },
  { id: 'keep', label: 'À garder', icon: <AccessTimeIcon color="primary" />, color: '#81C784' },
  { id: 'aperitif', label: 'Apéritif', icon: <LunchDiningIcon color="warning" />, color: '#FF8A65' }
];

interface LabelDialogProps {
  open: boolean;
  onClose: () => void;
  bottle: Bottle | null;
  onSetLabel: (labelId: string) => void;
}

const LabelDialog: React.FC<LabelDialogProps> = ({
  open,
  onClose,
  bottle,
  onSetLabel
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  if (!bottle) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 400,
          bgcolor: isDarkMode ? '#1A1A1A' : 'white',
          backgroundImage: isDarkMode 
            ? 'linear-gradient(145deg, rgba(40,40,40,0.7), rgba(30,30,30,0.5))' 
            : 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,245,245,0.7))',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{ 
          fontWeight: 600,
          background: isDarkMode
            ? 'linear-gradient(90deg, rgba(40,40,40,0.9), rgba(30,30,30,0.7))'
            : 'linear-gradient(90deg, rgba(250,250,250,0.9), rgba(240,240,240,0.7))',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}
      >
        <Typography variant="h6">Étiquettes personnalisées</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
          {bottle.wine?.name} {bottle.wine?.vintage && `(${bottle.wine.vintage})`}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          Sélectionnez une étiquette pour cette bouteille:
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {customLabels.map(label => (
            <Grid component="div" key={label.id} sx={{ width: { xs: '50%'} }}>
              <Button
                fullWidth
                variant={bottle.label === label.id ? "contained" : "outlined"}
                startIcon={label.icon}
                onClick={() => onSetLabel(label.id)}
                sx={{ 
                  borderRadius: 2,
                  mb: 1,
                  height: 42,
                  bgcolor: bottle.label === label.id ? label.color : 'transparent',
                  borderColor: label.color,
                  color: bottle.label === label.id ? 'rgba(0,0,0,0.8)' : label.color,
                  boxShadow: bottle.label === label.id ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: bottle.label === label.id 
                      ? alpha(label.color, 0.9)
                      : alpha(label.color, 0.1),
                    borderColor: label.color,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {label.label}
              </Button>
            </Grid>
          ))}
        </Grid>
        
        <Box mt={2} p={2} bgcolor={isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'} borderRadius={2}>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" fontWeight="medium" color={isDarkMode ? 'primary.light' : 'primary.main'}>Astuce:</Box> Cliquez sur une étiquette déjà sélectionnée pour la retirer
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            borderRadius: 2,
            px: 3,
            backgroundColor: isDarkMode 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.03)',
            '&:hover': {
              backgroundColor: isDarkMode 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.05)',
            }
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabelDialog;