'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Paper, 
  Grid, 
  Fade, 
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Définition des types
interface WineNuance {
  id: string;
  name: string;
  color: string;
  description: string;
  age: string;
}

interface WineColorCategory {
  name: string;
  description: string;
  color: string;
  nuances: WineNuance[];
}

interface WineColors {
  [key: string]: WineColorCategory;
}

interface WineColorPickerProps {
  value?: string;
  onChange: (value: string) => void;
  onClose?: () => void;
}

interface SelectedColorInfo {
  mainColor: string;
  nuance: WineNuance;
}

// Définition des couleurs de vin avec leurs nuances
const wineColors: WineColors = {
  red: {
    name: 'Rouge',
    description: 'Vins rouges de différentes intensités et âges',
    color: '#8B0000',
    nuances: [
      { id: 'purple', name: 'Pourpre', color: '#4B0082', description: 'Vin rouge très jeune', age: 'Très jeune' },
      { id: 'ruby', name: 'Rubis', color: '#E0115F', description: 'Vin rouge jeune et vif', age: 'Jeune' },
      { id: 'garnet', name: 'Grenat', color: '#C41E3A', description: 'Vin rouge d\'âge moyen', age: 'Moyen' },
      { id: 'tawny', name: 'Tuilé', color: '#A52A2A', description: 'Vin rouge évolué', age: 'Évolué' },
      { id: 'mahogany', name: 'Acajou', color: '#800000', description: 'Vin rouge âgé', age: 'Âgé' }
    ]
  },
  white: {
    name: 'Blanc',
    description: 'Vins blancs de différentes intensités et âges',
    color: '#F5F5DC',
    nuances: [
      { id: 'pale_yellow', name: 'Jaune pâle', color: '#FFFFF0', description: 'Vin blanc très jeune', age: 'Très jeune' },
      { id: 'straw_yellow', name: 'Jaune paille', color: '#F0E68C', description: 'Vin blanc jeune', age: 'Jeune' },
      { id: 'gold', name: 'Doré', color: '#DAA520', description: 'Vin blanc d\'âge moyen', age: 'Moyen' },
      { id: 'amber', name: 'Ambré', color: '#D2B48C', description: 'Vin blanc évolué', age: 'Évolué' },
      { id: 'brown', name: 'Brun doré', color: '#B8860B', description: 'Vin blanc âgé', age: 'Âgé' }
    ]
  },
  rose: {
    name: 'Rosé',
    description: 'Vins rosés de différentes intensités',
    color: '#F8BBD0',
    nuances: [
      { id: 'pale_pink', name: 'Rose pâle', color: '#FFE4E1', description: 'Rosé très pâle', age: 'Jeune' },
      { id: 'salmon', name: 'Saumon', color: '#FF9E9E', description: 'Rosé saumoné', age: 'Jeune à moyen' },
      { id: 'raspberry', name: 'Framboise', color: '#FF69B4', description: 'Rosé vif', age: 'Moyen' },
      { id: 'coral', name: 'Corail', color: '#FF7F50', description: 'Rosé intense', age: 'Expressif' }
    ]
  },
  orange: {
    name: 'Orange',
    description: 'Vins blancs de macération (vins orange)',
    color: '#FF8C00',
    nuances: [
      { id: 'pale_orange', name: 'Orange pâle', color: '#FFDAB9', description: 'Vin orange léger', age: 'Jeune' },
      { id: 'medium_orange', name: 'Orange moyen', color: '#FFA07A', description: 'Vin orange d\'intensité moyenne', age: 'Moyen' },
      { id: 'deep_orange', name: 'Orange profond', color: '#FF8C00', description: 'Vin orange intense', age: 'Expressif' },
      { id: 'amber_orange', name: 'Ambre orangé', color: '#CD853F', description: 'Vin orange évolué', age: 'Évolué' }
    ]
  },
  sparkling: {
    name: 'Effervescent',
    description: 'Vins effervescents de différentes couleurs',
    color: '#E0FFFF',
    nuances: [
      { id: 'pale_sparkling', name: 'Effervescent pâle', color: '#F0FFFF', description: 'Effervescent très pâle aux reflets verts', age: 'Jeune' },
      { id: 'straw_sparkling', name: 'Effervescent doré', color: '#EEE8AA', description: 'Effervescent aux reflets dorés', age: 'Classique' },
      { id: 'rose_sparkling', name: 'Effervescent rosé', color: '#FFB6C1', description: 'Effervescent rosé', age: 'Variable' },
      { id: 'amber_sparkling', name: 'Effervescent ambré', color: '#FFDEAD', description: 'Effervescent évolué', age: 'Évolué' }
    ]
  }
};

const WineColorPicker: React.FC<WineColorPickerProps> = ({ value, onChange, onClose }) => {
  const [selectedMainColor, setSelectedMainColor] = useState<string>('');
  const [selectedNuance, setSelectedNuance] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);

  // Initialiser avec la valeur existante si disponible
  useEffect(() => {
    if (value) {
      // Trouver la catégorie principale de la nuance
      for (const [category, data] of Object.entries(wineColors)) {
        const foundNuance = data.nuances.find(nuance => nuance.id === value);
        if (foundNuance) {
          setSelectedMainColor(category);
          setSelectedNuance(value);
          break;
        }
      }
    }
  }, [value]);

  const handleOpenPicker = () => {
    setOpen(true);
  };

  const handleClosePicker = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSelectMainColor = (colorKey: string) => {
    setSelectedMainColor(colorKey);
    // Réinitialiser la nuance si on change de couleur principale
    if (colorKey !== selectedMainColor) {
      setSelectedNuance('');
    }
  };

  const handleSelectNuance = (nuanceId: string) => {
    setSelectedNuance(nuanceId);
  };

  const handleConfirm = () => {
    if (selectedNuance) {
      onChange(selectedNuance);
      handleClosePicker();
    }
  };

  // Trouver la couleur actuellement sélectionnée (pour affichage)
  const getSelectedColorInfo = (): SelectedColorInfo | null => {
    if (!value) return null;
    
    for (const category of Object.values(wineColors)) {
      const nuance = category.nuances.find(n => n.id === value);
      if (nuance) {
        return {
          mainColor: category.name,
          nuance: nuance
        };
      }
    }
    return null;
  };

  const selectedColorInfo = getSelectedColorInfo();

  // Rendu d'un verre de vin plus réaliste avec une couleur spécifique
  const renderRealisticWineGlass = (nuance: WineNuance, isSelected: boolean = false, onClick?: () => void) => {
    // CSS pour créer un verre de vin réaliste
    return (
      <Box 
        sx={{ 
          position: 'relative',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          '&:hover': {
            transform: 'scale(1.1)',
          },
          textAlign: 'center',
          p: 1
        }}
        onClick={onClick}
      >
        <Box sx={{ 
          position: 'relative', 
          width: '80px', 
          height: '120px', 
          margin: '0 auto',
          filter: isSelected ? 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' : 'none'
        }}>
          {/* Le pied du verre */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '30px',
            background: 'linear-gradient(to bottom, rgba(240,240,240,0.6), rgba(200,200,200,0.3))',
            borderBottomLeftRadius: '50%',
            borderBottomRightRadius: '50%',
            zIndex: 1
          }} />
          
          {/* Base du pied */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '35px',
            height: '5px',
            background: 'radial-gradient(ellipse at center, rgba(220,220,220,0.7), rgba(180,180,180,0.3))',
            borderRadius: '50%',
            zIndex: 0
          }} />
          
          {/* Tige du verre */}
          <Box sx={{
            position: 'absolute',
            bottom: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '10px',
            height: '20px',
            background: 'linear-gradient(to right, rgba(220,220,220,0.8), rgba(240,240,240,0.9), rgba(220,220,220,0.8))',
            zIndex: 1
          }} />
          
          {/* Bowl du verre - partie extérieure */}
          <Box sx={{
            position: 'absolute',
            bottom: '45px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '75px',
            borderRadius: '30px 30px 20px 20px / 60px 60px 5px 5px',
            background: 'linear-gradient(to right, rgba(240,240,240,0.2), rgba(255,255,255,0.5), rgba(240,240,240,0.2))',
            boxShadow: '0 0 2px rgba(255,255,255,0.3)',
            overflow: 'hidden',
            zIndex: 2
          }}>
            {/* Contenu du verre (vin) */}
            <Box sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '90%',
              backgroundColor: nuance.color,
              borderTopLeftRadius: '30px',
              borderTopRightRadius: '30px',
              opacity: 0.9,
              backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(255,255,255,0.1) 30%, rgba(0,0,0,0.05))',
              zIndex: 3
            }} />
            
            {/* Surface du vin avec effet de lumière */}
            <Box sx={{ 
              position: 'absolute',
              bottom: '67.5px', // 90% de la hauteur du verre
              left: 0,
              width: '100%',
              height: '3px',
              background: `linear-gradient(to right, ${nuance.color}80, ${nuance.color}FF, ${nuance.color}80)`,
              zIndex: 4,
              boxShadow: '0 0 5px rgba(255,255,255,0.3)'
            }} />
            
            {/* Reflet principal */}
            <Box sx={{ 
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '15px',
              height: '50px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '50%',
              transform: 'rotate(20deg)',
              zIndex: 5
            }} />
            
            {/* Reflet secondaire */}
            <Box sx={{ 
              position: 'absolute',
              top: '20px',
              right: '15px',
              width: '8px',
              height: '25px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '50%',
              transform: 'rotate(-20deg)',
              zIndex: 5
            }} />
          </Box>
          
          {/* Effet de brillance sur le bord du verre */}
          <Box sx={{
            position: 'absolute',
            bottom: '45px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '62px',
            height: '77px',
            borderRadius: '31px 31px 21px 21px / 61px 61px 6px 6px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: 1
          }} />
        </Box>
        
        {/* Nom de la nuance */}
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 1, 
            color: isSelected ? 'white' : 'text.secondary',
            fontWeight: isSelected ? 'bold' : 'normal',
          }}
        >
          {nuance.name}
        </Typography>
        
        {/* Description (âge) */}
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'center',
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.6)', 
          }}
        >
          {nuance.description}
        </Typography>
        
        {/* Marque de sélection */}
        {isSelected && (
          <CheckCircleIcon 
            color="success" 
            sx={{ 
              position: 'absolute', 
              top: -8, 
              right: -8, 
              backgroundColor: 'white', 
              borderRadius: '50%',
              zIndex: 10
            }}
          />
        )}
      </Box>
    );
  };

  // Bouton de sélection pour le choix initial
  const renderColorButton = (colorKey: string, colorData: WineColorCategory) => {
    const isSelected = selectedMainColor === colorKey;
    return (
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
          opacity: selectedMainColor && !isSelected ? 0.6 : 1,
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
          '&:hover': {
            opacity: 1,
            transform: 'scale(1.05)',
          }
        }}
        onClick={() => handleSelectMainColor(colorKey)}
      >
        <Box 
          sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            backgroundColor: colorData.color,
            border: isSelected ? '3px solid white' : '1px solid rgba(255,255,255,0.3)',
            boxShadow: isSelected ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Miniature du verre pour chaque type de vin */}
          <Box sx={{ 
            position: 'relative', 
            width: '30px', 
            height: '45px',
          }}>
            {/* Forme du verre simplifiée */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '25px',
              height: '35px',
              borderRadius: '12px 12px 5px 5px / 25px 25px 5px 5px',
              background: 'rgba(255,255,255,0.2)',
              overflow: 'hidden'
            }}>
              {/* Contenu simplifié */}
              <Box sx={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '80%',
                backgroundColor: 'inherit',
                backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(0,0,0,0.1))'
              }} />
            </Box>
            
            {/* Pied simplifié */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '10px',
              background: 'rgba(255,255,255,0.3)'
            }} />
          </Box>
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 1, 
            color: isSelected ? 'white' : 'text.secondary',
            fontWeight: isSelected ? 'bold' : 'normal',
          }}
        >
          {colorData.name}
        </Typography>
      </Box>
    );
  };

  // Bouton pour afficher la couleur de vin sélectionnée
  const renderSelectedColor = () => {
    if (!selectedColorInfo) {
      return (
        <Box 
          onClick={handleOpenPicker}
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.03)'
            }
          }}
        >
          <Box sx={{ 
            width: 30, 
            height: 30, 
            borderRadius: '50%', 
            bgcolor: 'rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <InfoOutlinedIcon fontSize="small" color="action" />
          </Box>
          <Typography color="text.secondary">
            Sélectionner une couleur de vin
          </Typography>
        </Box>
      );
    }

    return (
      <Box 
        onClick={handleOpenPicker}
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.03)'
          }
        }}
      >
        <Box sx={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          bgcolor: selectedColorInfo.nuance.color,
          border: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Mini verre pour l'aperçu */}
          <Box sx={{ 
            position: 'relative', 
            width: '20px', 
            height: '30px'
          }}>
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '22px',
              borderRadius: '8px 8px 4px 4px / 16px 16px 2px 2px',
              background: 'rgba(255,255,255,0.3)',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '80%',
                backgroundColor: 'inherit',
                backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(0,0,0,0.1))'
              }} />
            </Box>
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '5px',
              height: '8px',
              background: 'rgba(255,255,255,0.3)'
            }} />
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2">
            {selectedColorInfo.nuance.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Vin {selectedColorInfo.mainColor.toLowerCase()} • {selectedColorInfo.nuance.age}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <>
      {/* Bouton/affichage de la couleur sélectionnée */}
      {renderSelectedColor()}
      
      {/* Sélecteur en mode dialog */}
      <Dialog 
        open={open} 
        onClose={handleClosePicker}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(20,20,20,0.95) 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Sélectionnez la couleur du vin</Typography>
          <IconButton edge="end" color="inherit" onClick={handleClosePicker}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {/* Sélection des catégories principales */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4, flexWrap: 'wrap', gap: 3 }}>
            {Object.entries(wineColors).map(([colorKey, colorData]) => 
              renderColorButton(colorKey, colorData)
            )}
          </Box>
          
          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
          
          {/* Affichage des nuances si une couleur principale est sélectionnée */}
          {selectedMainColor && (
            <>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {wineColors[selectedMainColor].description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {wineColors[selectedMainColor].nuances.map((nuance) => (
                  <Box 
                    key={nuance.id} 
                    sx={{ 
                      display: 'flex',
                      width: { xs: '50%', sm: '25%' },
                      padding: 1
                    }}
                  >
                    <Fade in={true} timeout={500} style={{ width: '100%' }}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 0,
                          width: '100%',
                          borderRadius: 2,
                          bgcolor: selectedNuance === nuance.id 
                            ? 'rgba(255,255,255,0.15)' 
                            : 'rgba(255,255,255,0.05)',
                          transition: 'all 0.3s',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                          }
                        }}
                      >
                        {renderRealisticWineGlass(
                          nuance, 
                          selectedNuance === nuance.id,
                          () => handleSelectNuance(nuance.id)
                        )}
                      </Paper>
                    </Fade>
                  </Box>
                ))}
              </Grid>
              
              <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  onClick={handleClosePicker} 
                  color="inherit"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  Annuler
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleConfirm}
                  disabled={!selectedNuance}
                  sx={{ borderRadius: 2 }}
                >
                  Confirmer
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WineColorPicker;