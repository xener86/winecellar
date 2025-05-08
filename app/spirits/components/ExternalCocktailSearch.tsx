// app/spirits/components/ExternalCocktailSearch.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Tab,
  Tabs,
  Alert,
  Chip,
  useTheme,
  Snackbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CocktailCard from './CocktailCard';
import { Cocktail } from '@/utils/types/cocktail.types';
import { Spirit } from '@/utils/types/spirit.types';

// Catégories disponibles dans TheCocktailDB
const AVAILABLE_CATEGORIES = [
  { value: 'Ordinary_Drink', label: 'Classique' },
  { value: 'Cocktail', label: 'Cocktail' },
  { value: 'Shake', label: 'Shakes' },
  { value: 'Shot', label: 'Shots' },
  { value: 'Coffee_/_Tea', label: 'Café/Thé' },
  { value: 'Homemade_Liqueur', label: 'Liqueurs maison' },
  { value: 'Punch_/_Party_Drink', label: 'Punch/Fête' },
  { value: 'Beer', label: 'Bière' },
  { value: 'Soft_Drink', label: 'Sans alcool' }
];

// Ingrédients populaires
const POPULAR_INGREDIENTS = [
  { value: 'Vodka', label: 'Vodka' },
  { value: 'Gin', label: 'Gin' },
  { value: 'Rum', label: 'Rhum' },
  { value: 'Tequila', label: 'Tequila' },
  { value: 'Whiskey', label: 'Whiskey' },
  { value: 'Brandy', label: 'Brandy' },
  { value: 'Triple_Sec', label: 'Triple Sec' },
  { value: 'Vermouth', label: 'Vermouth' },
  { value: 'Lime_Juice', label: 'Jus de citron vert' },
  { value: 'Lemon_Juice', label: 'Jus de citron' },
  { value: 'Orange_Juice', label: 'Jus d\'orange' },
];

interface ExternalCocktailSearchProps {
  onImport?: (cocktail: Cocktail) => void;
  availableSpirits?: Spirit[]; // Type correct pour les spiritueux disponibles
}

const ExternalCocktailSearch: React.FC<ExternalCocktailSearchProps> = ({
  onImport,
  availableSpirits = []
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Cocktail[]>([]);
  const [randomCocktails, setRandomCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Charger des cocktails aléatoires au chargement
  useEffect(() => {
    fetchRandomCocktails();
  }, []);
  
  // Effectuer une recherche par nom
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cocktails/external?action=search&query=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
      setActiveTab(1); // Passer à l'onglet des résultats
    } catch (error) {
      console.error('Erreur recherche:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };
  
  // Rechercher par catégorie
  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setSelectedIngredient(null);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cocktails/external?action=category&category=${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
      setActiveTab(1); // Passer à l'onglet des résultats
    } catch (error) {
      console.error('Erreur recherche par catégorie:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la recherche par catégorie');
    } finally {
      setLoading(false);
    }
  };
  
  // Rechercher par ingrédient
  const handleIngredientSelect = async (ingredient: string) => {
    setSelectedIngredient(ingredient);
    setSelectedCategory(null);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cocktails/external?action=ingredient&ingredient=${encodeURIComponent(ingredient)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
      setActiveTab(1); // Passer à l'onglet des résultats
    } catch (error) {
      console.error('Erreur recherche par ingrédient:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la recherche par ingrédient');
    } finally {
      setLoading(false);
    }
  };
  
  // Récupérer des cocktails aléatoires
  const fetchRandomCocktails = async (count = 6) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cocktails/external?action=random&count=${count}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      setRandomCocktails(data);
    } catch (error) {
      console.error('Erreur récupération cocktails aléatoires:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la récupération des cocktails aléatoires');
    } finally {
      setLoading(false);
    }
  };
  
  // Importer un cocktail
  const handleImport = async (cocktail: Cocktail) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cocktails/external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'import',
          cocktailId: cocktail.id
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Afficher une notification de succès
      setNotification({
        open: true,
        message: `Cocktail "${cocktail.name}" importé avec succès`,
        severity: 'success'
      });
      
      // Appeler le callback onImport si fourni
      if (onImport) {
        onImport(data);
      }
    } catch (error) {
      console.error('Erreur import:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'importation');
      
      // Afficher une notification d'erreur
      setNotification({
        open: true,
        message: `Erreur lors de l'importation de "${cocktail.name}"`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Afficher les résultats en fonction de l'onglet actif
  const renderResults = () => {
    // Si chargement en cours
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    // Si erreur
    if (error) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      );
    }
    
    // En fonction de l'onglet actif
    switch (activeTab) {
      case 0: // Suggestions
        return randomCocktails.length > 0 ? (
          <Grid container spacing={2}>
            {randomCocktails.map(cocktail => (
              <Grid component="div" key={cocktail.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                <CocktailCard 
                  cocktail={cocktail} 
                  availableSpirits={availableSpirits}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<ImportExportIcon />}
                  onClick={() => handleImport(cocktail)}
                  sx={{ mt: 1, borderRadius: 2 }}
                >
                  Importer
                </Button>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Aucun cocktail aléatoire disponible. Essayez de rafraîchir.
          </Typography>
        );
        
      case 1: // Résultats de recherche
        return searchResults.length > 0 ? (
          <Grid container spacing={2}>
            {searchResults.map(cocktail => (
              <Grid component="div" key={cocktail.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                <CocktailCard 
                  cocktail={cocktail} 
                  availableSpirits={availableSpirits}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<ImportExportIcon />}
                  onClick={() => handleImport(cocktail)}
                  sx={{ mt: 1, borderRadius: 2 }}
                >
                  Importer
                </Button>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Aucun résultat trouvé. Essayez une autre recherche.
          </Typography>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box>
      <Paper
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          mb: 3,
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Recherche de cocktails
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Rechercher un cocktail"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={!searchTerm.trim() || loading}
            sx={{ minWidth: 120, height: 56, borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Rechercher'}
          </Button>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Catégories populaires
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {AVAILABLE_CATEGORIES.map((category) => (
              <Chip
                key={category.value}
                label={category.label}
                onClick={() => handleCategorySelect(category.value)}
                color={selectedCategory === category.value ? 'primary' : 'default'}
                variant={selectedCategory === category.value ? 'filled' : 'outlined'}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
        
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Ingrédients populaires
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {POPULAR_INGREDIENTS.map((ingredient) => (
              <Chip
                key={ingredient.value}
                label={ingredient.label}
                onClick={() => handleIngredientSelect(ingredient.value)}
                color={selectedIngredient === ingredient.value ? 'secondary' : 'default'}
                variant={selectedIngredient === ingredient.value ? 'filled' : 'outlined'}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
      </Paper>
      
      {/* Contenu principal avec les cocktails */}
      <Paper
        elevation={0}
        sx={{ 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_e, val) => setActiveTab(val)}
            sx={{ px: 2 }}
          >
            <Tab label="Suggestions" />
            <Tab 
              label="Résultats de recherche" 
              disabled={searchResults.length === 0} 
            />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ShuffleIcon />}
                onClick={() => fetchRandomCocktails()}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Nouveaux aléatoires
              </Button>
            </Box>
          )}
          
          {renderResults()}
        </Box>
      </Paper>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExternalCocktailSearch;