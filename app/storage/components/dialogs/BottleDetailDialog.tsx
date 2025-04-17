// File: app/storage/components/dialogs/BottleDetailDialog.tsx
import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Typography, Box, Button, Grid, Chip, Divider,
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import { Bottle } from '../../types';

interface BottleDetailDialogProps {
  open: boolean;
  onClose: () => void;
  bottle: Bottle | null;
  onConsumeClick: () => void;
  onGiftClick: () => void;
  onLabelClick: () => void;
}

const BottleDetailDialog: React.FC<BottleDetailDialogProps> = ({
  open,
  onClose,
  bottle,
  onConsumeClick,
  onGiftClick,
  onLabelClick
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  if (!bottle || !bottle.wine) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 420,
          bgcolor: isDarkMode ? '#1A1A1A' : 'white',
          backgroundImage: isDarkMode 
            ? 'linear-gradient(145deg, rgba(40,40,40,0.7), rgba(30,30,30,0.5))' 
            : 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,245,245,0.7))',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          position: 'relative',
          '&::before': bottle.wine.color ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: bottle.wine.color === 'red' 
              ? 'linear-gradient(90deg, #8B0000, #C62828)' :
              bottle.wine.color === 'white' 
              ? 'linear-gradient(90deg, #FFF176, #FFEE58)' :
              bottle.wine.color === 'rose' 
              ? 'linear-gradient(90deg, #F48FB1, #F06292)' :
              bottle.wine.color === 'sparkling' 
              ? 'linear-gradient(90deg, #90CAF9, #64B5F6)' :
              'linear-gradient(90deg, #A1887F, #8D6E63)'
          } : {}
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 600,
              pr: 3 // Pour éviter le chevauchement avec le bouton de fermeture
            }}
          >
            {bottle.wine.name}
          </Typography>
          {bottle.wine.vintage && (
            <Chip 
              label={bottle.wine.vintage} 
              size="small" 
              color="primary"
              sx={{ 
                fontWeight: 'bold',
                height: 24,
                background: isDarkMode 
                  ? 'linear-gradient(145deg, rgba(25,118,210,0.9), rgba(30,136,229,0.8))' 
                  : 'linear-gradient(145deg, rgba(25,118,210,0.8), rgba(30,136,229,0.7))',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          )}
          <IconButton 
            aria-label="close" 
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box mb={2}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid component="div" sx={{ width: { xs: '50%'} }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Type:
              </Typography>
              <Chip 
                label={
                  bottle.wine.color === 'red' ? 'Rouge' :
                  bottle.wine.color === 'white' ? 'Blanc' :
                  bottle.wine.color === 'rose' ? 'Rosé' :
                  bottle.wine.color === 'sparkling' ? 'Effervescent' :
                  'Fortifié'
                } 
                size="small" 
                sx={{ 
                  mt: 0.5,
                  backgroundColor: bottle.wine.color === 'red' ? 'rgba(139, 0, 0, 0.9)' :
                                   bottle.wine.color === 'white' ? 'rgba(245, 245, 220, 0.9)' :
                                   bottle.wine.color === 'rose' ? 'rgba(255, 182, 193, 0.9)' :
                                   bottle.wine.color === 'sparkling' ? 'rgba(176, 196, 222, 0.9)' :
                                   'rgba(139, 69, 19, 0.9)',
                  color: bottle.wine.color === 'red' || bottle.wine.color === 'fortified' ? 'white' : 'black',
                  fontWeight: 500,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            </Grid>
            
            {bottle.wine.domain && (
              <Grid component="div" sx={{ width: { xs: '50%' } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Domaine:
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
                  {bottle.wine.domain}
                </Typography>
              </Grid>
            )}
            
            {bottle.wine.appellation && (
              <Grid component="div" sx={{ width: { xs: '50%'} }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Appellation:
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
                  {bottle.wine.appellation}
                </Typography>
              </Grid>
            )}
            
            {bottle.wine.region && (
              <Grid component="div" sx={{ width: { xs: '50%'} }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Région:
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
                  {bottle.wine.region}
                </Typography>
              </Grid>
            )}
            
            {bottle.acquisition_date && (
              <Grid component="div" sx={{ width: { xs: '50%'} }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Acquise le:
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
                  {new Date(bottle.acquisition_date).toLocaleDateString('fr-FR')}
                </Typography>
              </Grid>
            )}
            
            {bottle.wine.alcohol_percentage && (
              <Grid component="div" sx={{ width: { xs: '50%'} }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Degré:
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
                  {bottle.wine.alcohol_percentage}%
                </Typography>
              </Grid>
            )}
            
            {bottle.position && (
              <Grid component="div" sx={{ width: { xs: '50%'} }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Position:
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
                  Rangée {bottle.position.row_position}, Col {bottle.position.column_position}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography 
          variant="subtitle2" 
          color="primary" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -4,
              left: 0,
              width: 24,
              height: 2,
              borderRadius: 4,
              backgroundColor: theme.palette.primary.main
            }
          }}
        >
          Actions
        </Typography>
        
        <Grid container spacing={1} sx={{ mt: 0.5 }}>
          <Grid component="div" sx={{ width: { xs: '50%'} }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MenuBookIcon />}
              component={Link}
              href={`/wines/${bottle.wine_id}`}
              onClick={onClose}
              sx={{ 
                borderRadius: 2,
                fontWeight: 500,
                height: 40,
                borderWidth: '1.5px',
                '&:hover': {
                  borderWidth: '1.5px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Fiche vin
            </Button>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '50%'} }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FavoriteIcon />}
              onClick={onLabelClick}
              sx={{ 
                borderRadius: 2,
                fontWeight: 500,
                height: 40,
                borderWidth: '1.5px',
                color: theme.palette.secondary.main,
                borderColor: theme.palette.secondary.main,
                '&:hover': {
                  borderWidth: '1.5px',
                  borderColor: theme.palette.secondary.dark,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Étiquette
            </Button>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '50%'} }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<RestaurantIcon />}
              onClick={onConsumeClick}
              sx={{ 
                borderRadius: 2,
                fontWeight: 500,
                height: 40,
                borderWidth: '1.5px',
                mt: 1,
                '&:hover': {
                  borderWidth: '1.5px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Consommée
            </Button>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '50%'} }}>
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              startIcon={<CardGiftcardIcon />}
              onClick={onGiftClick}
              sx={{ 
                borderRadius: 2,
                fontWeight: 500,
                height: 40,
                borderWidth: '1.5px',
                mt: 1,
                '&:hover': {
                  borderWidth: '1.5px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Offerte
            </Button>
          </Grid>
        </Grid>
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

export default BottleDetailDialog;