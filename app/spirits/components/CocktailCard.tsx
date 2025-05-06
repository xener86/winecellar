// app/spirits/components/CocktailCard.tsx

import React, { useState } from 'react';
import { 
  Card, CardContent, CardMedia, Box, Typography, 
  Chip, IconButton, Tooltip, useTheme, alpha, 
  Button, Rating, Divider
} from '@mui/material';
import { Link } from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { Cocktail, CocktailSuggestion } from '@/utils/types/cocktail.types';
import { Spirit } from '@/utils/types/spirit.types';

interface CocktailCardProps {
  cocktail: Cocktail | CocktailSuggestion;
  compact?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string, value: boolean) => void;
  availableSpirits?: Spirit[];
}

const CocktailCard: React.FC<CocktailCardProps> = ({ 
  cocktail, 
  compact = false,
  onEdit, 
  onDelete,
  onToggleFavorite,
  availableSpirits = []
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  
  // Vérifier si c'est une suggestion ou un cocktail enregistré
  const isSuggestion = !('id' in cocktail) || 'matchScore' in cocktail;
  
  // Traduire la catégorie en français
  const getCategoryLabel = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'classic': 'Classique',
      'modern': 'Moderne',
      'tiki': 'Tiki',
      'sour': 'Sour',
      'highball': 'Highball',
      'fizz': 'Fizz',
      'frozen': 'Glacé',
      'hot': 'Chaud',
      'punch': 'Punch',
      'martini': 'Martini',
      'other': 'Autre'
    };
    
    return categoryMap[category] || 'Autre';
  };
  
  // Traduire le type de verre en français
  const getGlassTypeLabel = (glassType: string): string => {
    const glassTypeMap: Record<string, string> = {
      'highball': 'Highball',
      'lowball': 'Tumbler',
      'martini': 'Martini',
      'coupe': 'Coupe',
      'flute': 'Flûte',
      'hurricane': 'Hurricane',
      'margarita': 'Margarita',
      'mug': 'Mug',
      'shot': 'Shot',
      'collins': 'Collins',
      'wine': 'Vin',
      'other': 'Autre'
    };
    
    return glassTypeMap[glassType] || 'Autre';
  };
  
  // Traduire la difficulté en français
  const getDifficultyLabel = (difficulty: string): string => {
    const difficultyMap: Record<string, string> = {
      'easy': 'Facile',
      'medium': 'Moyen',
      'hard': 'Difficile'
    };
    
    return difficultyMap[difficulty] || 'Moyen';
  };
  
  // Obtenir la couleur associée à la difficulté
  const getDifficultyColor = (difficulty: string): string => {
    const colorMap: Record<string, string> = {
      'easy': theme.palette.success.main,
      'medium': theme.palette.warning.main,
      'hard': theme.palette.error.main
    };
    
    return colorMap[difficulty] || theme.palette.warning.main;
  };
  
  // Vérifier si un ingrédient est disponible dans la collection
  const isIngredientAvailable = (ingredientName: string): boolean => {
    // Pour les suggestions, vérifier la propriété isAvailable
    if ('matchScore' in cocktail) {
      const ingredient = cocktail.ingredients.find(i => i.name === ingredientName);
      return ingredient ? ingredient.isAvailable : false;
    }
    
    // Pour les cocktails normaux, vérifier dans la liste des spiritueux disponibles
    return availableSpirits.some(spirit => {
      const ingredientLower = ingredientName.toLowerCase();
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
  };
  
  // Calculer le pourcentage d'ingrédients disponibles
  const getAvailabilityScore = (): number => {
    // Pour les suggestions, utiliser le matchScore
    if ('matchScore' in cocktail) {
      return cocktail.matchScore;
    }
    
    // Pour les cocktails normaux, calculer sur la base des spiritueux disponibles
    const totalIngredients = cocktail.ingredients.length;
    const availableCount = cocktail.ingredients.filter(
      ingredient => isIngredientAvailable(ingredient.name)
    ).length;
    
    return Math.round((availableCount / totalIngredients) * 100);
  };
  
  // Obtenir l'ingrédient principal (premier spiritueux de la liste)
  const getMainSpirit = (): string => {
    const mainIngredient = cocktail.ingredients.find(i => {
      const name = i.name.toLowerCase();
      return (
        name.includes('whisky') || 
        name.includes('whiskey') || 
        name.includes('rum') || 
        name.includes('rhum') || 
        name.includes('gin') || 
        name.includes('vodka') || 
        name.includes('tequila') || 
        name.includes('brandy') ||
        name.includes('cognac') ||
        name.includes('liqueur')
      );
    });
    
    return mainIngredient ? mainIngredient.name : cocktail.ingredients[0].name;
  };
  
  // Obtenir une couleur aléatoire stable pour le fond
  const getBackgroundColor = (): string => {
    const name = cocktail.name.toLowerCase();
    
    // Couleurs prédéfinies par type d'ingrédient principal
    if (name.includes('whisky') || name.includes('whiskey') || name.includes('bourbon')) {
      return '#ffbf69'; // Ambré
    } else if (name.includes('rum') || name.includes('rhum')) {
      return '#8d6e63'; // Brun
    } else if (name.includes('gin')) {
      return '#a7dbf5'; // Bleu clair
    } else if (name.includes('vodka')) {
      return '#e0e0e0'; // Gris clair
    } else if (name.includes('tequila')) {
      return '#fff176'; // Jaune
    } else if (name.includes('martini') || name.includes('manhattan')) {
      return '#e57373'; // Rouge clair
    } else {
      // Couleur basée sur le hash du nom
      let hash = 0;
      for (let i = 0; i < cocktail.name.length; i++) {
        hash = ((hash << 5) - hash) + cocktail.name.charCodeAt(i);
        hash = hash & hash;
      }
      
      // Palette de couleurs prédéfinies
      const colors = [
        '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
        '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
        '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
        '#ff5722', '#795548', '#9e9e9e', '#607d8b'
      ];
      
      return colors[Math.abs(hash) % colors.length];
    }
  };
  
  // Pour les affichages compacts (listes, grilles, etc.)
  if (compact) {
    const availabilityScore = getAvailabilityScore();
    
    return (
      <Card 
        sx={{ 
          display: 'flex', 
          height: 100, 
          borderRadius: 2,
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box 
          sx={{ 
            width: 8, 
            bgcolor: getDifficultyColor(cocktail.difficulty)
          }}
        />
        
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: 70,
            alignItems: 'center',
            bgcolor: alpha(getBackgroundColor(), isDarkMode ? 0.2 : 0.1)
          }}
        >
          <LocalBarIcon sx={{ color: getBackgroundColor(), fontSize: 30 }} />
          {isSuggestion && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {availabilityScore}%
            </Typography>
          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          flexGrow: 1, 
          p: 1.5
        }}>
          <Typography 
            variant="subtitle1" 
            component="div"
            sx={{ 
              fontWeight: 'medium',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}
          >
            {cocktail.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Chip 
              label={getCategoryLabel(cocktail.category)} 
              size="small"
              sx={{ 
                height: 20,
                fontSize: '0.7rem',
                bgcolor: alpha(getBackgroundColor(), isDarkMode ? 0.3 : 0.2),
                mr: 1
              }}
            />
            
            <Typography variant="caption" color="text.secondary">
              {getMainSpirit()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
            {!isSuggestion && 'rating' in cocktail && cocktail.rating && (
              <Rating value={cocktail.rating} readOnly size="small" sx={{ mr: 1 }} />
            )}
            
            {isSuggestion && (
              <Tooltip title={`${availabilityScore}% des ingrédients disponibles`}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {availabilityScore >= 75 ? (
                    <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                  ) : availabilityScore >= 50 ? (
                    <CheckCircleIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                  ) : (
                    <WarningIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                  )}
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {isHovered && !isSuggestion && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              display: 'flex',
              p: 0.5,
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: '0 8px 0 8px'
            }}
          >
            {onToggleFavorite && 'isFavorite' in cocktail && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleFavorite(cocktail.id, !cocktail.isFavorite);
                }}
                sx={{ color: 'white', p: 0.5 }}
              >
                {cocktail.isFavorite ? (
                  <FavoriteIcon fontSize="small" color="error" />
                ) : (
                  <FavoriteBorderIcon fontSize="small" />
                )}
              </IconButton>
            )}
            
            {onEdit && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit(cocktail.id);
                }}
                sx={{ color: 'white', p: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            
            {onDelete && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete(cocktail.id);
                }}
                sx={{ color: 'white', p: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
      </Card>
    );
  }

  // Affichage standard (carte complète)
  const availabilityScore = getAvailabilityScore();
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        position: 'relative',
        overflow: 'hidden'
      }}
      component={!isSuggestion ? Link : 'div'}
      href={!isSuggestion ? `/spirits/mixology/${(cocktail as Cocktail).id}` : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ position: 'relative' }}>
        {cocktail.image ? (
          <CardMedia
            component="img"
            height="160"
            image={cocktail.image}
            alt={cocktail.name}
          />
        ) : (
          <Box 
            sx={{ 
              height: 160, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              bgcolor: alpha(getBackgroundColor(), isDarkMode ? 0.2 : 0.1),
              p: 2
            }}
          >
            <LocalBarIcon sx={{ fontSize: 60, color: getBackgroundColor() }} />
          </Box>
        )}
        
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}
        >
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              fontWeight: 'bold'
            }}
          >
            {cocktail.name}
          </Typography>
          
          {!isSuggestion && 'isFavorite' in cocktail && cocktail.isFavorite && (
            <FavoriteIcon color="error" />
          )}
        </Box>
      </Box>
      
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <Chip 
          label={getCategoryLabel(cocktail.category)} 
          size="small"
          sx={{ 
            bgcolor: alpha('#000000', 0.7),
            color: 'white',
            fontWeight: 'medium'
          }}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {getGlassTypeLabel(cocktail.glassType)}
          </Typography>
          
          <Chip 
            label={getDifficultyLabel(cocktail.difficulty)} 
            size="small"
            sx={{ 
              bgcolor: alpha(getDifficultyColor(cocktail.difficulty), isDarkMode ? 0.2 : 0.1),
              color: getDifficultyColor(cocktail.difficulty),
              fontWeight: 'medium'
            }}
          />
        </Box>
        
        <Divider sx={{ mb: 1.5 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Ingrédients
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          {cocktail.ingredients.map((ingredient, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.5 
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: isIngredientAvailable(ingredient.name) ? 'text.primary' : 'text.disabled'
                }}
              >
                {isIngredientAvailable(ingredient.name) && (
                  <CheckCircleIcon 
                    fontSize="small" 
                    color="success" 
                    sx={{ mr: 0.5, fontSize: 16 }} 
                  />
                )}
                {ingredient.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {'amount' in ingredient ? `${ingredient.amount} ${ingredient.unit}` : ''}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {isSuggestion && (
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Disponibilité:
              </Typography>
              
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    height: 6, 
                    flexGrow: 1, 
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      width: `${availabilityScore}%`,
                      height: '100%',
                      bgcolor: availabilityScore >= 75 
                        ? theme.palette.success.main 
                        : availabilityScore >= 50 
                        ? theme.palette.warning.main 
                        : theme.palette.error.main
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {availabilityScore}%
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="outlined" 
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Voir la recette
            </Button>
          </Box>
        )}
        
        {!isSuggestion && 'rating' in cocktail && (
          <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {cocktail.rating ? (
              <Rating value={cocktail.rating} readOnly size="small" />
            ) : (
              <Typography variant="caption" color="text.secondary">
                Non noté
              </Typography>
            )}
            
            {'isCustom' in cocktail && cocktail.isCustom && (
              <Chip 
                label="Personnalisé" 
                size="small" 
                variant="outlined"
                color="secondary"
              />
            )}
          </Box>
        )}
      </CardContent>
      
      {isHovered && !isSuggestion && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex',
            p: 0.5,
            bgcolor: 'rgba(0,0,0,0.5)',
            borderRadius: '0 8px 0 8px'
          }}
        >
          {onToggleFavorite && 'isFavorite' in cocktail && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleFavorite(cocktail.id, !cocktail.isFavorite);
              }}
              sx={{ color: 'white', p: 0.5 }}
            >
              {cocktail.isFavorite ? (
                <FavoriteIcon fontSize="small" color="error" />
              ) : (
                <FavoriteBorderIcon fontSize="small" />
              )}
            </IconButton>
          )}
          
          {onEdit && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit(cocktail.id);
              }}
              sx={{ color: 'white', p: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          
          {onDelete && (
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(cocktail.id);
              }}
              sx={{ color: 'white', p: 0.5 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
    </Card>
  );
};

export default CocktailCard;