// app/spirits/components/IngredientSelector.tsx

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  useTheme,
  alpha,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Spirit } from '@/utils/types/spirit.types';
import { CocktailIngredient, MeasurementUnit } from '@/utils/types/cocktail.types';

interface IngredientSelectorProps {
  selectedIngredients: CocktailIngredient[];
  availableSpirits: Spirit[];
  onChange: (ingredients: CocktailIngredient[]) => void;
}

// Unités de mesure disponibles avec leur label
const measurementUnits: { value: MeasurementUnit; label: string }[] = [
  { value: 'ml', label: 'ml' },
  { value: 'cl', label: 'cl' },
  { value: 'oz', label: 'oz' },
  { value: 'dash', label: 'dash' },
  { value: 'drop', label: 'goutte(s)' },
  { value: 'part', label: 'part(s)' },
  { value: 'barspoon', label: 'cuillère(s) à bar' },
  { value: 'splash', label: 'splash' },
  { value: 'pinch', label: 'pincée(s)' },
  { value: 'piece', label: 'pièce(s)' }
];

const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  selectedIngredients,
  availableSpirits,
  onChange
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [newIngredient, setNewIngredient] = useState<Partial<CocktailIngredient>>({
    name: '',
    amount: 0,
    unit: 'ml',
    isOptional: false,
    substitute: ''
  });
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  
  // Générer un ID unique pour un nouvel ingrédient
  const generateIngredientId = (): string => {
    return `ingredient_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };
  
  // Réinitialiser le nouvel ingrédient
  const resetNewIngredient = () => {
    setNewIngredient({
      name: '',
      amount: 0,
      unit: 'ml',
      isOptional: false,
      substitute: ''
    });
  };
  
  // Ajouter un nouvel ingrédient
  const handleAddIngredient = () => {
    if (!newIngredient.name || newIngredient.amount === undefined) return;
    
    // Vérifier si c'est un spiritueux de la collection
    let spiritId: string | undefined = undefined;
    
    if (availableSpirits.length > 0) {
      const matchingSpirit = availableSpirits.find(spirit => {
        const ingredientLower = newIngredient.name?.toLowerCase() || '';
        const spiritNameLower = spirit.name.toLowerCase();
        const spiritTypeLower = spirit.type.toLowerCase();
        
        return (
          ingredientLower.includes(spiritNameLower) || 
          ingredientLower.includes(spiritTypeLower) ||
          // Vérifications spécifiques par type
          (spiritTypeLower === 'whisky' && (
            ingredientLower.includes('whisky') || 
            ingredientLower.includes('whiskey') || 
            ingredientLower.includes('bourbon') || 
            ingredientLower.includes('scotch')
          )) ||
          (spiritTypeLower === 'rum' && (
            ingredientLower.includes('rhum') || 
            ingredientLower.includes('rum')
          )) ||
          (spiritTypeLower === 'gin' && ingredientLower.includes('gin')) ||
          (spiritTypeLower === 'vodka' && ingredientLower.includes('vodka')) ||
          (spiritTypeLower === 'tequila' && (
            ingredientLower.includes('tequila') || 
            ingredientLower.includes('mezcal')
          )) ||
          (spiritTypeLower === 'brandy' && (
            ingredientLower.includes('brandy') || 
            ingredientLower.includes('cognac') || 
            ingredientLower.includes('armagnac')
          ))
        );
      });
      
      if (matchingSpirit) {
        spiritId = matchingSpirit.id;
      }
    }
    
    const ingredient: CocktailIngredient = {
      id: generateIngredientId(),
      name: newIngredient.name || '',
      amount: newIngredient.amount || 0,
      unit: newIngredient.unit as MeasurementUnit || 'ml',
      isOptional: newIngredient.isOptional || false,
      substitute: newIngredient.substitute || undefined,
      spiritId
    };
    
    onChange([...selectedIngredients, ingredient]);
    resetNewIngredient();
  };
  
  // Supprimer un ingrédient
  const handleRemoveIngredient = (id: string) => {
    onChange(selectedIngredients.filter(i => i.id !== id));
  };
  
  // Mettre à jour un ingrédient
  const handleUpdateIngredient = (index: number, field: keyof CocktailIngredient, value: string | number | boolean) => {
    const updatedIngredients = [...selectedIngredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value
    };
    
    // Si c'est le nom qui a changé, vérifier si c'est un spiritueux de la collection
    if (field === 'name' && availableSpirits.length > 0) {
      const matchingSpirit = availableSpirits.find(spirit => {
        const ingredientLower = (value as string).toLowerCase();
        const spiritNameLower = spirit.name.toLowerCase();
        const spiritTypeLower = spirit.type.toLowerCase();
        
        return (
          ingredientLower.includes(spiritNameLower) || 
          ingredientLower.includes(spiritTypeLower) ||
          // Vérifications spécifiques par type
          (spiritTypeLower === 'whisky' && (
            ingredientLower.includes('whisky') || 
            ingredientLower.includes('whiskey') || 
            ingredientLower.includes('bourbon') || 
            ingredientLower.includes('scotch')
          )) ||
          (spiritTypeLower === 'rum' && (
            ingredientLower.includes('rhum') || 
            ingredientLower.includes('rum')
          )) ||
          (spiritTypeLower === 'gin' && ingredientLower.includes('gin')) ||
          (spiritTypeLower === 'vodka' && ingredientLower.includes('vodka')) ||
          (spiritTypeLower === 'tequila' && (
            ingredientLower.includes('tequila') || 
            ingredientLower.includes('mezcal')
          )) ||
          (spiritTypeLower === 'brandy' && (
            ingredientLower.includes('brandy') || 
            ingredientLower.includes('cognac') || 
            ingredientLower.includes('armagnac')
          ))
        );
      });
      
      updatedIngredients[index].spiritId = matchingSpirit ? matchingSpirit.id : undefined;
    }
    
    onChange(updatedIngredients);
  };
  
  // Déterminer si un ingrédient est un spiritueux
  const isSpirit = (name: string): boolean => {
    const lowerName = name.toLowerCase();
    return (
      lowerName.includes('whisky') || 
      lowerName.includes('whiskey') || 
      lowerName.includes('rum') || 
      lowerName.includes('rhum') || 
      lowerName.includes('gin') || 
      lowerName.includes('vodka') || 
      lowerName.includes('tequila') || 
      lowerName.includes('brandy') ||
      lowerName.includes('cognac') ||
      lowerName.includes('liqueur') ||
      lowerName.includes('spirit')
    );
  };
  
  // Réordonner les ingrédients par glisser-déposer
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (index: number) => {
    setDropIndex(index);
  };
  
  const handleDragEnd = () => {
    if (draggedIndex !== null && dropIndex !== null && draggedIndex !== dropIndex) {
      const updatedIngredients = [...selectedIngredients];
      const [draggedItem] = updatedIngredients.splice(draggedIndex, 1);
      updatedIngredients.splice(dropIndex, 0, draggedItem);
      onChange(updatedIngredients);
    }
    
    setDraggedIndex(null);
    setDropIndex(null);
  };

  // Gérer les changements des selects
  const handleSelectChange = (e: SelectChangeEvent<MeasurementUnit>, index?: number) => {
    const { value } = e.target;
    
    if (index !== undefined) {
      // Mettre à jour un ingrédient existant
      handleUpdateIngredient(index, 'unit', value as MeasurementUnit);
    } else {
      // Mettre à jour le nouvel ingrédient
      setNewIngredient({ 
        ...newIngredient, 
        unit: value as MeasurementUnit
      });
    }
  };
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Ingrédients
      </Typography>
      
      {/* Formulaire pour ajouter un nouvel ingrédient */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          mb: 2,
          borderRadius: 2,
          bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.2) : alpha(theme.palette.background.paper, 0.8)
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid component="div" sx={{ width: { xs: '100%', sm: '40%' } }}>
            <TextField
              fullWidth
              label="Nom de l'ingrédient"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              placeholder="Ex: Gin, Jus de citron, Sirop de sucre..."
            />
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '50%', sm: '20%' } }}>
            <TextField
              fullWidth
              label="Quantité"
              type="number"
              value={newIngredient.amount === 0 ? '' : newIngredient.amount}
              onChange={(e) => setNewIngredient({ 
                ...newIngredient, 
                amount: e.target.value === '' ? 0 : parseFloat(e.target.value) 
              })}
              InputProps={{ inputProps: { min: 0, step: 0.25 } }}
            />
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '50%', sm: '20%' } }}>
            <FormControl fullWidth>
              <InputLabel>Unité</InputLabel>
              <Select
                value={newIngredient.unit as MeasurementUnit}
                label="Unité"
                onChange={(e) => handleSelectChange(e)}
              >
                {measurementUnits.map((unit) => (
                  <MenuItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid component="div" sx={{ width: { xs: '100%', sm: '20%' } }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddIngredient}
              disabled={!newIngredient.name || newIngredient.amount === undefined}
              sx={{ height: 56, borderRadius: 2 }}
            >
              Ajouter
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Liste des ingrédients sélectionnés */}
      <Paper 
        variant="outlined" 
        sx={{ 
          borderRadius: 2,
          mb: 2,
          ...(selectedIngredients.length === 0 && {
            p: 3,
            textAlign: 'center'
          })
        }}
      >
        {selectedIngredients.length === 0 ? (
          <Typography color="text.secondary">
            Aucun ingrédient ajouté
          </Typography>
        ) : (
          <List disablePadding>
            {selectedIngredients.map((ingredient, index) => (
              <React.Fragment key={ingredient.id}>
                <ListItem
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={() => handleDragOver(index)}
                  onDragEnd={handleDragEnd}
                  sx={{
                    cursor: 'move',
                    bgcolor: draggedIndex === index
                      ? alpha(theme.palette.primary.main, 0.1)
                      : dropIndex === index
                      ? alpha(theme.palette.primary.main, 0.05)
                      : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.1)
                    }
                  }}
                >
                  <DragIndicatorIcon 
                    sx={{ 
                      mr: 1, 
                      color: 'text.secondary',
                      cursor: 'grab'
                    }} 
                  />
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          value={ingredient.name}
                          onChange={(e) => handleUpdateIngredient(index, 'name', e.target.value)}
                          variant="standard"
                          fullWidth
                          sx={{ mr: 2 }}
                        />
                        
                        {ingredient.spiritId && (
                          <Chip 
                            size="small" 
                            label="Collection" 
                            color="primary" 
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                        )}
                        
                        {isSpirit(ingredient.name) && !ingredient.spiritId && (
                          <Chip 
                            size="small" 
                            label="Spiritueux" 
                            color="secondary" 
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <TextField
                          value={ingredient.amount}
                          onChange={(e) => handleUpdateIngredient(
                            index, 
                            'amount', 
                            e.target.value === '' ? 0 : parseFloat(e.target.value)
                          )}
                          type="number"
                          variant="standard"
                          InputProps={{ inputProps: { min: 0, step: 0.25 } }}
                          sx={{ width: 60, mr: 1 }}
                        />
                        
                        <FormControl variant="standard" sx={{ minWidth: 80, mr: 2 }}>
                          <Select
                            value={ingredient.unit}
                            onChange={(e) => handleSelectChange(e as SelectChangeEvent<MeasurementUnit>, index)}
                          >
                            {measurementUnits.map((unit) => (
                              <MenuItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        <Chip
                          label="Optionnel"
                          size="small"
                          variant={ingredient.isOptional ? "filled" : "outlined"}
                          color="primary"
                          onClick={() => handleUpdateIngredient(index, 'isOptional', !ingredient.isOptional)}
                          sx={{ mr: 1 }}
                        />
                      </Box>
                    }
                  />
                  
                  <IconButton 
                    edge="end" 
                    onClick={() => handleRemoveIngredient(ingredient.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
                {index < selectedIngredients.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      {selectedIngredients.length > 0 && (
        <Box 
          sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: isDarkMode ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}
        >
          <Typography variant="body2" color="info.main">
            <strong>Astuce</strong>: Glissez-déposez pour réorganiser les ingrédients. Les ingrédients principaux doivent être en premier.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default IngredientSelector;