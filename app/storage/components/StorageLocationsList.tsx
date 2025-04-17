// File: app/storage/components/StorageLocationsList.tsx
import React from 'react';
import { 
  Typography, Box, Card, CardContent, Chip, IconButton,
  Paper, Divider
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import { StorageLocation } from '../types';

interface StorageLocationsListProps {
  locations: StorageLocation[];
  selectedLocation: StorageLocation | null;
  onLocationSelect: (location: StorageLocation) => void;
  onLocationDelete: (id: string, name: string) => void;
}

// Types d'emplacement avec leurs icônes et couleurs
const locationTypes: Record<string, { label: string, icon: string, color: string }> = {
  shelf: { label: 'Étagère', icon: '📚', color: '#4CAF50' },
  case: { label: 'Caisse', icon: '📦', color: '#FF9800' },
  drawer: { label: 'Tiroir', icon: '🗄️', color: '#2196F3' },
  rack: { label: 'Casier', icon: '🥂', color: '#9C27B0' },
  cellar: { label: 'Cave complète', icon: '🏰', color: '#795548'},
  fridge: { label: 'Réfrigérateur', icon: '❄️', color: '#00BCD4'},
  other: { label: 'Autre', icon: '🍷', color: '#607D8B'}
};

const StorageLocationsList: React.FC<StorageLocationsListProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
  onLocationDelete
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Obtenir les informations pour un type d'emplacement
  const getTypeInfo = (type: string) => {
    return locationTypes[type] || { label: type || 'Inconnu', icon: '❓', color: '#607D8B' };
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
        position: { md: 'sticky' },
        top: { md: 16 },
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        color="primary"
        sx={{
          fontWeight: 600,
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -4,
            left: 0,
            width: 40,
            height: 3,
            borderRadius: 4,
            backgroundColor: theme.palette.primary.main,
            background: 'linear-gradient(90deg, #8b0000, #C62828)'
          }
        }}
      >
        Mes Emplacements
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ 
        overflowY: 'auto', 
        maxHeight: 'calc(100vh - 300px)',
        px: 0.5, // Padding to account for scrollbar
        mx: -0.5, // Offset the padding
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.primary.main, 0.2),
          borderRadius: '10px',
        },
        '&:hover::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.primary.main, 0.5),
        }
      }}>
        {locations.map((location) => {
          const typeInfo = getTypeInfo(location.type);
          const isSelected = selectedLocation?.id === location.id;
          
          return (
            <Card 
              key={location.id} 
              elevation={0}
              onClick={() => onLocationSelect(location)}
              sx={{
                mb: 2,
                cursor: 'pointer',
                border: isSelected 
                  ? `2px solid ${theme.palette.primary.main}` 
                  : `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: isSelected 
                  ? theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.light, 0.15)
                  : 'transparent',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                '&:hover': {
                  backgroundColor: isSelected 
                    ? theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.primary.light, 0.2)
                    : theme.palette.mode === 'dark' 
                      ? 'rgba(50, 50, 50, 0.5)' 
                      : 'rgba(242, 242, 242, 0.5)',
                  transform: 'translateY(-2px) scale(1.02)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': isSelected ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '5px',
                  height: '100%',
                  background: 'linear-gradient(to bottom, #8b0000, #C62828)',
                  borderRadius: '2px 0 0 2px'
                } : {}
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <Box 
                      sx={{ 
                        fontSize: '1.8rem', 
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        backgroundColor: alpha(typeInfo.color, 0.1),
                        boxShadow: isSelected ? `0 0 0 2px ${alpha(typeInfo.color, 0.3)}` : 'none'
                      }}
                    >
                      {typeInfo.icon}
                    </Box>
                    <Box>
                      <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                          fontSize: '1rem', 
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {location.name}
                      </Typography>
                      <Chip 
                        label={typeInfo.label} 
                        size="small" 
                        sx={{ 
                          backgroundColor: typeInfo.color, 
                          color: 'white', 
                          mt: 0.5,
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 20,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      component={Link}
                      href={`/storage/edit?id=${location.id}`}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        color: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      color="error" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocationDelete(location.id, location.name);
                      }}
                      sx={{
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.2),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                  
                {(location.row_count && location.column_count) && (
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      <Box component="span" fontWeight="medium">Capacité:</Box> {location.row_count * location.column_count} bouteilles
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      <Box component="span" fontWeight="medium">Dimensions:</Box> {location.row_count} rangées × {location.column_count} colonnes
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Paper>
  );
};
export default StorageLocationsList;