// File: app/storage/components/QuickAddDialog.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, IconButton, TextField, Box, Button, alpha, useTheme
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { Bottle, Position } from '@types';
import Link from 'next/link';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedPosition: Position | null;
  recentBottles: Bottle[];
}

const QuickAddDialog: React.FC<Props> = ({ open, onClose, selectedPosition, recentBottles }) => {
  const theme = useTheme();

  if (!open || !selectedPosition) return null;

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
            Position : Rangée {selectedPosition.row_position}, Colonne {selectedPosition.column_position}
          </Typography>

          <TextField
            fullWidth
            placeholder="Rechercher une référence existante..."
            variant="outlined"
            margin="normal"
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
          />

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            Références récentes :
          </Typography>

          <Box>
            {recentBottles.slice(0, 4).map((bottle) => (
              <Box
                key={bottle.id}
                sx={{
                  p: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: alpha(theme.palette.primary.main, 0.3)
                  },
                  display: 'flex',
                  alignItems: 'center'
                }}
                onClick={() => {
                  // À remplacer avec un vrai handler si besoin
                  console.log(`Ajout de la bouteille ${bottle.id} à la position ${selectedPosition.id}`);
                  onClose();
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: bottle.wine?.color === 'red' ? 'rgba(139, 0, 0, 0.9)' :
                            bottle.wine?.color === 'white' ? 'rgba(245, 245, 220, 0.9)' :
                            bottle.wine?.color === 'rose' ? 'rgba(255, 182, 193, 0.9)' :
                            bottle.wine?.color === 'sparkling' ? 'rgba(176, 196, 222, 0.9)' :
                            'rgba(139, 69, 19, 0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: ['red', 'fortified'].includes(bottle.wine?.color || '') ? 'white' : 'black',
                    fontWeight: 'bold',
                    mr: 2
                  }}
                >
                  {bottle.wine?.vintage}
                </Box>
                <Box>
                  <Typography variant="body1">{bottle.wine?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bottle.wine?.domain} • {
                      bottle.wine?.color === 'red' ? 'Rouge' :
                      bottle.wine?.color === 'white' ? 'Blanc' :
                      bottle.wine?.color === 'rose' ? 'Rosé' :
                      bottle.wine?.color === 'sparkling' ? 'Effervescent' :
                      'Fortifié'
                    }
                  </Typography>
                </Box>
              </Box>
            ))}

            {recentBottles.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 2 }}>
                Aucune référence récente disponible
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          href={`/wines/add?position_id=${selectedPosition.id}`}
          endIcon={<AddIcon />}
        >
          Nouvelle référence
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickAddDialog;
