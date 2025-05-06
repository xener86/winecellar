// app/spirits/mixology/[id]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, CircularProgress, 
  Button, useTheme, alpha, Chip, Divider, 
  Grid, Rating, List, ListItem, ListItemIcon, 
  ListItemText, IconButton, Alert, Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import LiquorIcon from '@mui/icons-material/Liquor';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import InfoIcon from '@mui/icons-material/Info';
import ShareIcon from '@mui/icons-material/Share';
import PrintIcon from '@mui/icons-material/Print';
import Navbar from '@/components/Navbar';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMixologyData } from '../../hooks/useMixologyData';
import { useSpiritData } from '../../hooks/useSpiritData';
import { useNotifications } from '@/hooks/useNotifications';

// Types pour les paramètres de la page
interface PageProps {
  params: {
    id: string;
  };
}

export default function CocktailDetailsPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { 
    cocktails, 
    selectedCocktail, 
    setSelectedCocktail,
    loading: cocktailLoading, 
    fetchCocktails,
    updateCocktail,
    deleteCocktail
  } = useMixologyData();
  
  const { 
    spirits, 
    loading: spiritsLoading 
  } = useSpiritData();
  
  const { showNotification } = useNotifications();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Récupérer les détails du cocktail
  useEffect(() => {
    const loadCocktail = async () => {
      // Vérifier si les cocktails sont déjà chargés
      if (cocktails.length > 0) {
        const foundCocktail = cocktails.find(c => c.id === id);
        if (foundCocktail) {
          setSelectedCocktail(foundCocktail);
          return;
        }
      }
      
      // Si non, charger tous les cocktails
      await fetchCocktails();
    };
    
    loadCocktail();
  }, [id, cocktails, fetchCocktails, setSelectedCocktail]);
  
  // Gérer la mise à jour des favoris
  const handleToggleFavorite = async () => {
    if (!selectedCocktail) return;
    
    try {
      const success = await updateCocktail(id, { 
        isFavorite: !selectedCocktail.isFavorite 
      });
      
      if (success) {
        showNotification(
          selectedCocktail.isFavorite 
            ? 'Cocktail retiré des favoris' 
            : 'Cocktail ajouté aux favoris',
          'success'
        );
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour des favoris');
      console.error('Erreur toggle favoris:', err);
    }
  };
  
  // Gérer la suppression du cocktail
  const handleDelete = async () => {
    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cocktail ?')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const success = await deleteCocktail(id);
      
      if (success) {
        showNotification('Cocktail supprimé avec succès', 'success');
        router.push('/spirits/mixology');
      } else {
        throw new Error('Erreur lors de la suppression du cocktail');
      }
    } catch (err) {
      setError('Erreur lors de la suppression du cocktail');
      console.error('Erreur suppression cocktail:', err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Imprimer la recette
  const handlePrint = () => {
    window.print();
  };
  
  // Vérifier si un ingrédient est disponible dans la collection
  const isIngredientAvailable = (ingredientName: string): boolean => {
    // Vérifier dans la liste des spiritueux disponibles
    return spirits.some(spirit => {
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
  
  // Traduire la méthode de préparation en français
  const getPreparationMethodLabel = (method: string): string => {
    const methodMap: Record<string, string> = {
      'shaken': 'Shaker',
      'stirred': 'Mélanger à la cuillère',
      'built': 'Construire dans le verre',
      'blended': 'Mixer',
      'layered': 'Superposer',
      'muddled': 'Piler',
      'hot-build': 'Construire à chaud',
      'other': 'Autre'
    };
    
    return methodMap[method] || 'Autre';
  };
  
  // Traduire la difficulté en français
  const getDifficultyLabel = (difficulty: string): string => {
    const difficultyMap: Record<string, string> = {
      'easy': 'Facile',
      'medium': 'Moyenne',
      'hard': 'Difficile'
    };
    
    return difficultyMap[difficulty] || 'Moyenne';
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
  
  // Afficher un écran de chargement
  if (cocktailLoading || !selectedCocktail) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }
  
  // Obtenir une couleur de fond basée sur le nom du cocktail pour l'en-tête
  const getBackgroundColor = (): string => {
    const name = selectedCocktail.name.toLowerCase();
    
    // Fonction pour obtenir une couleur basée sur une chaîne
    const stringToColor = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const colors = [
        '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
        '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
        '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
        '#ff5722', '#795548', '#9e9e9e', '#607d8b'
      ];
      
      return colors[Math.abs(hash) % colors.length];
    };
    
    return stringToColor(name);
  };
  
  // Obtenir l'ingrédient principal (premier spiritueux de la liste)
  const getMainSpirit = (): string => {
    const mainIngredient = selectedCocktail.ingredients.find(i => {
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
    
    return mainIngredient ? mainIngredient.name : selectedCocktail.ingredients[0]?.name || '';
  };
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Breadcrumbs />
        
        {/* En-tête avec boutons d'action */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={3}
          className="no-print" // Ne pas imprimer cette partie
        >
          <Button
            component={Link}
            href="/spirits/mixology"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2 }}
          >
            Retour
          </Button>
          
          <Box display="flex" gap={1}>
            <IconButton
              color="primary"
              onClick={handleToggleFavorite}
              title={selectedCocktail.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              {selectedCocktail.isFavorite ? 
                <FavoriteIcon color="error" /> : 
                <FavoriteBorderIcon />
              }
            </IconButton>
            
            <IconButton
              color="primary"
              component={Link}
              href={`/spirits/mixology/edit/${id}`}
              title="Modifier"
            >
              <EditIcon />
            </IconButton>
            
            <IconButton
              color="primary"
              onClick={handlePrint}
              title="Imprimer la recette"
            >
              <PrintIcon />
            </IconButton>
            
            <IconButton
              color="error"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Supprimer"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Affichage des erreurs */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} className="no-print">
            {error}
          </Alert>
        )}
        
        {/* En-tête du cocktail */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 0, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
            overflow: 'hidden',
            mb: 3
          }}
        >
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              minHeight: '200px'
            }}
          >
            {/* Image du cocktail ou placeholder */}
            <Box 
              sx={{ 
                width: { xs: '100%', md: '30%' },
                minHeight: '200px',
                bgcolor: alpha(getBackgroundColor(), isDarkMode ? 0.2 : 0.1),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {selectedCocktail.image ? (
                <Box 
                  component="img"
                  src={selectedCocktail.image}
                  alt={selectedCocktail.name}
                  sx={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <LiquorIcon 
                  sx={{ 
                    fontSize: 80, 
                    color: getBackgroundColor() 
                  }} 
                />
              )}
              
              {/* Badge de difficulté */}
              <Chip
                label={getDifficultyLabel(selectedCocktail.difficulty)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: alpha(getDifficultyColor(selectedCocktail.difficulty), 0.8),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
            
            {/* Informations du cocktail */}
            <Box 
              sx={{ 
                width: { xs: '100%', md: '70%' },
                p: 3,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                {selectedCocktail.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={getCategoryLabel(selectedCocktail.category)}
                  sx={{ 
                    bgcolor: alpha(getBackgroundColor(), isDarkMode ? 0.2 : 0.1),
                    fontWeight: 'medium'
                  }}
                />
                
                <Chip 
                  label={getGlassTypeLabel(selectedCocktail.glassType)}
                  variant="outlined"
                />
                
                <Chip 
                  label={getPreparationMethodLabel(selectedCocktail.preparationMethod || 'built')}
                  variant="outlined"
                />
                
                {selectedCocktail.isCustom && (
                  <Chip 
                    label="Personnalisé"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  <strong>Spiritueux principal:</strong> {getMainSpirit()}
                </Typography>
                
                {selectedCocktail.garnish && (
                  <Typography variant="body1" color="text.secondary">
                    <strong>Garniture:</strong> {selectedCocktail.garnish}
                  </Typography>
                )}
              </Box>
              
              {selectedCocktail.rating && (
                <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" mr={1}>
                    Note:
                  </Typography>
                  <Rating 
                    value={selectedCocktail.rating}
                    readOnly
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
        
        {/* Contenu principal */}
        <Grid container spacing={3}>
          {/* Colonne gauche: Ingrédients */}
          <Grid component="div" sx={{ width: { xs: '100%', md: '40%' } }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
                height: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Ingrédients
              </Typography>
              
              <List>
                {selectedCocktail.ingredients.map((ingredient, index) => (
                  <ListItem 
                    key={ingredient.id || index}
                    sx={{ px: 0 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {isIngredientAvailable(ingredient.name) ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CheckCircleIcon color="disabled" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={ingredient.name}
                      secondary={`${ingredient.amount} ${ingredient.unit}${ingredient.isOptional ? ' (optionnel)' : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
              
              {selectedCocktail.ingredients.some(i => !isIngredientAvailable(i.name)) && (
                <Alert 
                  severity="info" 
                  sx={{ mt: 2 }}
                  className="no-print"
                >
                  Certains ingrédients ne sont pas dans votre collection.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          {/* Colonne droite: Préparation */}
          <Grid component="div" sx={{ width: { xs: '100%', md: '60%' } }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
                mb: 3
              }}
            >
              <Typography variant="h6" gutterBottom>
                Préparation
              </Typography>
              
              <Box sx={{ whiteSpace: 'pre-line' }}>
                {selectedCocktail.preparation.split('\n').map((step, i) => (
                  <Typography key={i} paragraph>
                    {step}
                  </Typography>
                ))}
              </Box>
            </Paper>
            
            {/* Notes additionnelles */}
            {selectedCocktail.notes && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
                  mb: 3
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Notes additionnelles
                </Typography>
                
                <Typography paragraph>
                  {selectedCocktail.notes}
                </Typography>
              </Paper>
            )}
            
            {/* Tags */}
            {selectedCocktail.tags && selectedCocktail.tags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedCocktail.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
        
        {/* Styles pour l'impression */}
        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              color: black;
              background: white;
            }
            
            @page {
              size: A4;
              margin: 1.5cm;
            }
            
            h1 {
              font-size: 24pt !important;
            }
            
            h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
          }
        `}</style>
      </Container>
    </>
  );
}