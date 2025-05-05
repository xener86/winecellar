import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Button, Chip, Slider, 
  FormGroup, FormControlLabel, Checkbox,
  IconButton, Divider
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import WineBarIcon from '@mui/icons-material/WineBar';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

// Type pour les options de filtrage
export interface FilterOptions {
  colors: string[];
  labels: string[];
  vintage: { min: number | null; max: number | null };
  searchTerm: string;
}

// Type pour les props du composant
interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  vintageRange: { min: number; max: number };
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onClose,
  filters,
  onApplyFilters,
  vintageRange
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // État local pour les filtres qui sera appliqué seulement à la confirmation
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  
  // Réinitialiser l'état local quand la boîte de dialogue s'ouvre
  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);
  
  // Options de couleur disponibles
  const colorOptions = [
    { value: 'red', label: 'Rouge', icon: <WineBarIcon />, color: '#8B0000', textColor: '#fff' },
    { value: 'white', label: 'Blanc', icon: <WineBarIcon />, color: '#F5F5DC', textColor: '#000' },
    { value: 'rose', label: 'Rosé', icon: <WineBarIcon />, color: '#FFB6C1', textColor: '#000' },
    { value: 'sparkling', label: 'Effervescent', icon: <WineBarIcon />, color: '#B0C4DE', textColor: '#000' },
    { value: 'fortified', label: 'Fortifié', icon: <WineBarIcon />, color: '#8B4513', textColor: '#fff' }
  ];
  
  // Options d'étiquettes disponibles
  const labelOptions = [
    { value: 'favorite', label: 'Coup de cœur', icon: <FavoriteIcon />, color: '#FFD54F' },
    { value: 'special', label: 'Occasion spéciale', icon: <CelebrationIcon />, color: '#7986CB' },
    { value: 'keep', label: 'À garder', icon: <AccessTimeIcon />, color: '#81C784' },
    { value: 'aperitif', label: 'Apéritif', icon: <LunchDiningIcon />, color: '#FF8A65' },
    { value: 'ready', label: 'Prêt à boire', icon: <WaterDropIcon />, color: '#4CAF50' },
    { value: 'null', label: 'Sans étiquette', icon: null, color: '#9E9E9E' }
  ];
  
  // Gérer le changement de couleur
  const handleColorToggle = (color: string) => {
    setLocalFilters(prevFilters => {
      const newColors = prevFilters.colors.includes(color)
        ? prevFilters.colors.filter(c => c !== color)
        : [...prevFilters.colors, color];
      
      return {
        ...prevFilters,
        colors: newColors
      };
    });
  };
  
  // Gérer le changement d'étiquette
  const handleLabelToggle = (label: string) => {
    setLocalFilters(prevFilters => {
      const newLabels = prevFilters.labels.includes(label)
        ? prevFilters.labels.filter(l => l !== label)
        : [...prevFilters.labels, label];
      
      return {
        ...prevFilters,
        labels: newLabels
      };
    });
  };
  
  // Gérer le changement de millésime
  const handleVintageChange = (_event: Event, newValue: number | number[]) => {
    const [min, max] = Array.isArray(newValue) ? newValue : [newValue, newValue];
    
    setLocalFilters(prevFilters => ({
      ...prevFilters,
      vintage: {
        min: min === vintageRange.min ? null : min,
        max: max === vintageRange.max ? null : max
      }
    }));
  };
  
  // Appliquer les filtres et fermer
  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };
  
  // Réinitialiser tous les filtres
  const handleReset = () => {
    const resetFilters: FilterOptions = {
      colors: [],
      labels: [],
      vintage: { min: null, max: null },
      searchTerm: filters.searchTerm // Conserver le terme de recherche
    };
    
    setLocalFilters(resetFilters);
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: isDarkMode ? '#1A1A1A' : 'white',
          backgroundImage: isDarkMode 
            ? 'linear-gradient(145deg, rgba(40,40,40,0.7), rgba(30,30,30,0.5))' 
            : 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,245,245,0.7))',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <FilterAltIcon color="primary" />
            <Typography variant="h6">Filtrer les bouteilles</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Section filtres par couleur */}
        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Couleur du vin
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            {colorOptions.map(option => (
              <Chip
                key={option.value}
                icon={option.icon}
                label={option.label}
                onClick={() => handleColorToggle(option.value)}
                color={localFilters.colors.includes(option.value) ? 'primary' : 'default'}
                variant={localFilters.colors.includes(option.value) ? 'filled' : 'outlined'}
                sx={{
                  '& .MuiChip-icon': {
                    color: localFilters.colors.includes(option.value) ? 'inherit' : option.color,
                  },
                  '&.MuiChip-outlined': {
                    borderColor: option.color,
                    backgroundColor: alpha(option.color, 0.05)
                  },
                  '&.MuiChip-filled': {
                    backgroundColor: option.color,
                    color: option.textColor
                  }
                }}
              />
            ))}
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Section filtres par étiquette */}
        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Étiquettes personnalisées
          </Typography>
          <FormGroup row>
            {labelOptions.map(option => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={localFilters.labels.includes(option.value)}
                    onChange={() => handleLabelToggle(option.value)}
                    icon={option.icon ? 
                      React.cloneElement(option.icon, { 
                        sx: { color: alpha(option.color, 0.6) } 
                      }) : 
                      <Box 
                        sx={{ 
                          width: 18, 
                          height: 18, 
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 0.5,
                          bgcolor: 'transparent'
                        }} 
                      />
                    }
                    checkedIcon={option.icon ? 
                      React.cloneElement(option.icon, { 
                        sx: { color: option.color } 
                      }) : 
                      <Box 
                        sx={{ 
                          width: 18, 
                          height: 18, 
                          border: `1px solid ${option.color}`,
                          borderRadius: 0.5,
                          bgcolor: alpha(option.color, 0.2)
                        }} 
                      />
                    }
                  />
                }
                label={option.label}
                sx={{ width: { xs: '50%', sm: '33%' }, mb: 1 }}
              />
            ))}
          </FormGroup>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Section filtres par millésime */}
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Millésime
          </Typography>
          <Box px={2} mt={4}>
            <Slider
              value={[
                localFilters.vintage.min !== null ? localFilters.vintage.min : vintageRange.min,
                localFilters.vintage.max !== null ? localFilters.vintage.max : vintageRange.max
              ]}
              onChange={handleVintageChange}
              valueLabelDisplay="on"
              min={vintageRange.min}
              max={vintageRange.max}
              marks={[
                { value: vintageRange.min, label: vintageRange.min.toString() },
                { value: vintageRange.max, label: vintageRange.max.toString() }
              ]}
            />
          </Box>
        </Box>
        
        {/* Résumé des filtres actifs */}
        <Box 
          mt={4} 
          p={2} 
          bgcolor={isDarkMode ? alpha(theme.palette.background.paper, 0.2) : alpha(theme.palette.background.paper, 0.5)}
          borderRadius={2}
        >
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Filtres actifs
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            {localFilters.colors.length === 0 && 
            localFilters.labels.length === 0 &&
            localFilters.vintage.min === null &&
            localFilters.vintage.max === null ? (
              <Typography variant="body2" color="text.secondary">
                Aucun filtre actif
              </Typography>
            ) : (
              <>
                {localFilters.colors.map(color => {
                  const option = colorOptions.find(opt => opt.value === color);
                  return option ? (
                    <Chip
                      key={`color-${color}`}
                      label={option.label}
                      size="small"
                      onDelete={() => handleColorToggle(color)}
                      color="primary"
                      variant="outlined"
                    />
                  ) : null;
                })}
                
                {localFilters.labels.map(label => {
                  const option = labelOptions.find(opt => opt.value === label);
                  return option ? (
                    <Chip
                      key={`label-${label}`}
                      label={option.label}
                      size="small"
                      onDelete={() => handleLabelToggle(label)}
                      color="secondary"
                      variant="outlined"
                    />
                  ) : null;
                })}
                
                {(localFilters.vintage.min !== null || localFilters.vintage.max !== null) && (
                  <Chip
                    label={`Millésime: ${localFilters.vintage.min || vintageRange.min} - ${localFilters.vintage.max || vintageRange.max}`}
                    size="small"
                    onDelete={() => setLocalFilters(prev => ({
                      ...prev,
                      vintage: { min: null, max: null }
                    }))}
                    color="info"
                    variant="outlined"
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleReset} 
          sx={{ 
            borderRadius: 2,
            mr: 1
          }}
        >
          Réinitialiser
        </Button>
        <Button 
          onClick={onClose} 
          sx={{ borderRadius: 2 }}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleApply} 
          variant="contained" 
          color="primary"
          startIcon={<FilterAltIcon />}
          sx={{ borderRadius: 2 }}
        >
          Appliquer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog;