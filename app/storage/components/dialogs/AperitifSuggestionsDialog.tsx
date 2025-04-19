// File: app/storage/components/dialogs/AperitifSuggestionsDialog.tsx
import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, List, 
  Alert, Chip
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import { Bottle } from '@types';

interface AperitifSuggestionsDialogProps {
  open: boolean;
  onClose: () => void;
  suggestions: Bottle[];
}

const AperitifSuggestionsDialog: React.FC<AperitifSuggestionsDialogProps> = ({
  open,
  onClose,
  suggestions
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 500,
          bgcolor: isDarkMode ? '#1A1A1A' : 'white',
          backgroundImage: isDarkMode 
            ? 'linear-gradient(145deg, rgba(40,40,40,0.7), rgba(30,30,30,0.5))' 
            : 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,245,245,0.7))',
          boxShadow: '0 16px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between" 
          sx={{ 
            px: 3, 
            py: 2,
            background: 'linear-gradient(45deg, #FF9800, #FF5722)',
            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
            color: 'white'
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <LunchDiningIcon fontSize="large" />
            <Typography variant="h6" fontWeight={600}>Suggestions pour l&apos;apéritif</Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: 'white',
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.2)' 
              } 
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 3 }}>
        {suggestions.length > 0 ? (
          <List sx={{ p: 0 }}>
            {suggestions.map((bottle, index) => (
              <Box
                key={bottle.id}
                component={Button}
                href={`/wines/${bottle.wine_id}`}
                sx={{ 
                  display: 'block',
                  textAlign: 'left',
                  mb: 2, 
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 2,
                  width: '100%',
                  bgcolor: isDarkMode 
                    ? alpha(theme.palette.background.paper, 0.2)
                    : alpha(theme.palette.background.paper, 0.7),
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: isDarkMode 
                      ? alpha(theme.palette.action.hover, 0.3)
                      : alpha(theme.palette.action.hover, 0.1),
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '5px',
                    height: '100%',
                    background: bottle.wine?.color === 'sparkling' 
                      ? 'linear-gradient(to bottom, #90CAF9, #64B5F6)' :
                      bottle.wine?.color === 'white' 
                      ? 'linear-gradient(to bottom, #FFF176, #FFEE58)' :
                      'linear-gradient(to bottom, #F48FB1, #F06292)',
                  }
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  fontWeight={500}
                  color="text.primary"
                  sx={{ ml: 1 }}
                >
                  {bottle.wine?.name} {bottle.wine?.vintage && `(${bottle.wine.vintage})`}
                </Typography>
                <Box display="flex" alignItems="center" mt={0.5} ml={1}>
                  <Chip
                    size="small"
                    label={bottle.wine?.color === 'sparkling' ? 'Effervescent' : 
                           bottle.wine?.color === 'white' ? 'Blanc' : 'Rosé'}
                    sx={{
                      mr: 1,
                      bgcolor: bottle.wine?.color === 'sparkling' ? '#B0C4DE' : 
                              bottle.wine?.color === 'white' ? '#F5F5DC' : '#FFB6C1',
                      color: 'rgba(0,0,0,0.8)',
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  />
                  {bottle.wine?.domain && (
                    <Typography variant="body2" color="text.secondary">
                      {bottle.wine.domain}
                    </Typography>
                  )}
                </Box>
                {index === 0 && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8,
                      background: 'linear-gradient(45deg, #FF9800, #FF5722)',
                      color: 'white',
                      borderRadius: '12px',
                      px: 1,
                      py: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                    }}
                  >
                    TOP
                  </Box>
                )}
              </Box>
            ))}
          </List>
        ) : (
          <Alert 
            severity="info"
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            Aucune suggestion disponible. Ajoutez plus de bouteilles à votre cave !
          </Alert>
        )}
        
        <Box 
          mt={3}
          p={2.5} 
          bgcolor={isDarkMode ? alpha(theme.palette.background.paper, 0.2) : alpha(theme.palette.background.paper, 0.7)} 
          borderRadius={3}
          border={`1px solid ${theme.palette.divider}`}
          boxShadow="0 2px 8px rgba(0,0,0,0.05)"
        >
          <Typography variant="subtitle2" color="primary.main" gutterBottom fontWeight={600}>
            Comment sont sélectionnées les suggestions ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Les vins sont sélectionnés selon leur pertinence pour l&apos;apéritif :
          </Typography>
          <Box component="ol" sx={{ pl: 3, mt: 1, mb: 0 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              <Box component="span" fontWeight={500}>Vins effervescents</Box> (prioritaires)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              <Box component="span" fontWeight={500}>Vins blancs secs</Box>
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              <Box component="span" fontWeight={500}>Vins rosés</Box>
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          color="warning"
          sx={{ 
            borderRadius: 2,
            px: 3,
            borderWidth: '1.5px',
            fontWeight: 500,
            '&:hover': {
              borderWidth: '1.5px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AperitifSuggestionsDialog;