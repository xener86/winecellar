// app/storage/stock/components/CrateCard.tsx
import React from 'react';
import { 
  Box, Card, CardContent, Typography, IconButton, 
  Tooltip, useTheme, Chip, Stack, Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WineBarIcon from '@mui/icons-material/WineBar';

// Types
type Wine = {
  id: string;
  name?: string | null;
  color?: string | null;
  vintage?: number | null;
  domain?: string | null;
  region?: string | null;
};

type Bottle = {
  id: string;
  wine_id: string;
  wine?: Wine | null;
};

type CrateData = {
  id: string;
  name: string;
  capacity: number;
  bottles: Bottle[];
};

type CrateCardProps = {
  crate: CrateData;
  onSelect: (crateId: string) => void;
  onDelete: (crateId: string) => void;
};

// Fonction pour obtenir les détails de couleur pour une bouteille de vin
const getWineColorStyles = (color: string | null | undefined) => {
  const colorMap = {
    red: { bg: 'rgba(139, 0, 0, 0.9)', text: 'white', label: 'Rouge' },
    white: { bg: 'rgba(245, 245, 220, 0.9)', text: 'black', label: 'Blanc' },
    rose: { bg: 'rgba(255, 182, 193, 0.9)', text: 'black', label: 'Rosé' },
    sparkling: { bg: 'rgba(176, 196, 222, 0.9)', text: 'black', label: 'Effervescent' },
    fortified: { bg: 'rgba(139, 69, 19, 0.9)', text: 'white', label: 'Fortifié' },
  };
  
  return colorMap[color as keyof typeof colorMap] || 
    { bg: 'rgba(120, 120, 120, 0.7)', text: 'white', label: 'Inconnu' };
};

// Fonction pour grouper les bouteilles par vin
const groupBottlesByWine = (bottles: Bottle[]) => {
  const groups: Record<string, { wine: Wine | null, count: number }> = {};

  bottles.forEach(bottle => {
    if (!bottle.wine_id) return;

    if (!groups[bottle.wine_id]) {
      groups[bottle.wine_id] = {
        wine: bottle.wine || null,
        count: 0
      };
    }
    groups[bottle.wine_id].count++;
  });

  return Object.values(groups);
};

const CrateCard: React.FC<CrateCardProps> = ({ crate, onSelect, onDelete }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Grouper les bouteilles par vin
  const groupedBottles = groupBottlesByWine(crate.bottles);
  const emptySlots = Math.max(0, crate.capacity - crate.bottles.length);
  
  // Gestion du clic sur les boutons
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(crate.id);
  };
  
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(crate.id);
  };

  const handleCardClick = () => {
    onSelect(crate.id);
  };
  
  return (
    <Card 
      onClick={handleCardClick}
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
    >
      <CardContent sx={{ pb: 2 }}>
        {/* En-tête: Nom + Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" 
            sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              flex: 1 
            }}
          >
            {crate.name}
          </Typography>
          <Box>
            {crate.bottles.length < crate.capacity && (
              <Tooltip title="Ajouter une bouteille">
                <IconButton size="small" onClick={handleAddClick}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Supprimer cette caisse">
              <IconButton size="small" onClick={handleDeleteClick}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Compteur de bouteilles */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            {crate.bottles.length}/{crate.capacity} bouteilles
          </Typography>
        </Box>
        
        {/* Contenu de la caisse */}
        {groupedBottles.length === 0 ? (
          // Caisse vide
          <Box 
            sx={{ 
              height: 85, 
              borderRadius: 1, 
              border: `1px dashed ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Caisse vide
            </Typography>
          </Box>
        ) : (
          // Affichage compact des groupes de bouteilles
          <Stack spacing={1.5}>
            {groupedBottles.map((group, index) => {
              const wine = group.wine;
              const colorInfo = getWineColorStyles(wine?.color);
              
              return (
                <Box 
                  key={`wine-${index}`} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                  }}
                >
                  {/* Cercle coloré avec millésime */}
                  <Avatar 
                    sx={{ 
                      bgcolor: colorInfo.bg, 
                      color: colorInfo.text,
                      width: 40,
                      height: 40,
                      mr: 1.5,
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {wine?.vintage || <WineBarIcon />}
                  </Avatar>
                  
                  {/* Info du vin */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {wine?.name || 'Vin inconnu'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={colorInfo.label}
                        size="small"
                        sx={{ 
                          bgcolor: colorInfo.bg,
                          color: colorInfo.text,
                          height: 20,
                          fontSize: '0.7rem'
                        }}
                      />
                      
                      {/* Compteur de bouteilles */}
                      <Chip
                        label={`${group.count} ${group.count > 1 ? 'bouteilles' : 'bouteille'}`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          fontWeight: 400
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}
            
            {/* Affichage des emplacements vides si nécessaire */}
            {emptySlots > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {emptySlots} emplacement{emptySlots > 1 ? 's' : ''} disponible{emptySlots > 1 ? 's' : ''}
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default CrateCard;