import React from 'react';
import { 
  Box, Card, CardContent, Typography, IconButton, 
  Tooltip, useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WineBarIcon from '@mui/icons-material/WineBar';
import { alpha } from '@mui/material/styles';

type CrateCardProps = {
  crate: any;
  onSelect: () => void;
  onDelete: () => void;
  onRefresh: () => void;
};

// Fonction pour obtenir la couleur de fond pour une bouteille de vin
const getWineColorCode = (color: string) => {
  return color === 'red' ? 'rgba(139, 0, 0, 0.9)' : 
         color === 'white' ? 'rgba(245, 245, 220, 0.9)' :
         color === 'rose' ? 'rgba(255, 182, 193, 0.9)' :
         color === 'sparkling' ? 'rgba(176, 196, 222, 0.9)' :
         'rgba(139, 69, 19, 0.9)';
};

// Fonction pour obtenir la couleur du texte adaptée au fond
const getTextColorForBackground = (color: string) => {
  return color === 'red' || color === 'fortified' ? 'white' : 'black';
};

const CrateCard: React.FC<CrateCardProps> = ({ crate, onSelect, onDelete, onRefresh }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Gestion du clic sur le bouton de suppression
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };
  
  // Gestion du clic sur le bouton d'ajout
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implémenter l'ajout de bouteille à la caisse
    // Pour l'instant, on se contente de sélectionner la caisse
    onSelect();
  };
  
  return (
    <Card 
      sx={{ 
        borderRadius: 2, 
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{crate.name}</Typography>
          <Box>
            {crate.bottles.length < crate.capacity && (
              <Tooltip title="Ajouter une bouteille">
                <IconButton 
                  size="small" 
                  onClick={handleAddClick}
                  sx={{ 
                    '&:hover': {
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Supprimer cette caisse">
              <IconButton 
                size="small" 
                onClick={handleDeleteClick}
                sx={{ 
                  ml: 0.5,
                  '&:hover': {
                    color: theme.palette.error.main,
                    bgcolor: alpha(theme.palette.error.main, 0.1)
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem'
            }}
          >
            {crate.bottles.length}/{crate.capacity} bouteilles
          </Typography>
        </Box>
        
        {/* Aperçu visuel des bouteilles */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            justifyContent: 'center',
            p: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            borderRadius: 2
          }}
        >
          {crate.bottles.map((bottle: any) => (
            <Tooltip 
              key={bottle.id} 
              title={`${bottle.wine?.name || 'Vin'} ${bottle.wine?.vintage || ''}`}
              arrow
            >
              <Box 
                sx={{ 
                  width: 30, 
                  height: 60, 
                  borderRadius: '10px 10px 0 0',
                  bgcolor: getWineColorCode(bottle.wine?.color || 'red'),
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  pb: 0.5
                }}
              >
                <WineBarIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: getTextColorForBackground(bottle.wine?.color || 'red'),
                    opacity: 0.7,
                    mb: 0.5
                  }} 
                />
                
                {bottle.wine?.vintage && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.6rem',
                      color: getTextColorForBackground(bottle.wine.color),
                      fontWeight: 'bold'
                    }}
                  >
                    {bottle.wine.vintage}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          ))}
          
          {/* Emplacements vides */}
          {Array.from({ length: crate.capacity - crate.bottles.length }).map((_, index) => (
            <Box 
              key={`empty-${index}`}
              sx={{ 
                width: 30, 
                height: 60, 
                borderRadius: '10px 10px 0 0',
                border: '1px dashed #ccc',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CrateCard;