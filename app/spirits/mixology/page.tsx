// app/spirits/mixology/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Button, 
  Paper, CircularProgress, Tabs, Tab, 
  TextField, InputAdornment, IconButton, Alert,
  Chip, Snackbar, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ImportExportIcon from '@mui/icons-material/ImportExport'; // Ajout de l'icône d'importation
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Breadcrumbs } from '@/components/ui/Navigation';
import { useMixologyData } from '../hooks/useMixologyData';
import { useSpiritData } from '../hooks/useSpiritData';
import { useNotifications } from '@/hooks/useNotifications';
import CocktailCard from '../components/CocktailCard';

export default function MixologyPage() {
  const router = useRouter();
  const theme = useTheme();
  
  const { 
    cocktails, 
    suggestions,
    loading: cocktailLoading, 
    generateSuggestions,
    deleteCocktail,
    updateCocktail
  } = useMixologyData();
  
  const { 
    spirits, 
    loading: spiritLoading 
  } = useSpiritData();
  
  const { notification, showNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredCocktails, setFilteredCocktails] = useState(cocktails);
  
  // Générer des suggestions basées sur la collection
  useEffect(() => {
    if (activeTab === 0 && !cocktailLoading && spirits.length > 0) {
      generateSuggestions(spirits);
    }
  }, [activeTab, cocktailLoading, spirits, generateSuggestions]);
  
  // Filtrer les cocktails lors de la recherche
  useEffect(() => {
    if (searchTerm) {
      setIsFiltering(true);
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filtered = cocktails.filter(cocktail => {
        // Recherche dans le nom
        if (cocktail.name.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
        
        // Recherche dans les ingrédients
        if (cocktail.ingredients.some(ingredient => 
          ingredient.name.toLowerCase().includes(lowerSearchTerm)
        )) {
          return true;
        }
        
        // Recherche dans la catégorie
        if (cocktail.category.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
        
        // Recherche dans les tags
        if (cocktail.tags && cocktail.tags.some(tag => 
          tag.toLowerCase().includes(lowerSearchTerm)
        )) {
          return true;
        }
        
        return false;
      });
      
      setFilteredCocktails(filtered);
    } else {
      setIsFiltering(false);
      setFilteredCocktails(cocktails);
    }
  }, [searchTerm, cocktails]);
  
  // Gérer la suppression d'un cocktail
  const handleDelete = async (id: string) => {
    const success = await deleteCocktail(id);
    if (success) {
      showNotification('Cocktail supprimé avec succès', 'success');
    }
  };
  
  // Gérer la modification d'un cocktail
  const handleEdit = (id: string) => {
    router.push(`/spirits/mixology/edit/${id}`);
  };
  
  // Gérer le changement de favoris
  const handleToggleFavorite = async (id: string, value: boolean) => {
    const success = await updateCocktail(id, { isFavorite: value });
    if (success) {
      showNotification(
        value ? 'Cocktail ajouté aux favoris' : 'Cocktail retiré des favoris', 
        'success'
      );
    }
  };
  
  // Contenu de chargement
  if (cocktailLoading && spiritLoading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Breadcrumbs />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Mixologie
          </Typography>
          
          <Box>
            {/* Ajout du bouton d'importation à côté du bouton de création */}
            <Button
              component={Link}
              href="/spirits/mixology/import"
              variant="outlined"
              startIcon={<ImportExportIcon />}
              sx={{ borderRadius: 2, mr: 2 }}
            >
              Importer des recettes
            </Button>
            
            <Button
              component={Link}
              href="/spirits/mixology/create"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2 }}
            >
              Créer un cocktail
            </Button>
          </Box>
        </Box>
        
        {spirits.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Ajoutez des spiritueux à votre collection pour obtenir des suggestions de cocktails.
          </Alert>
        ) : null}
        
        {/* Contenu principal */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={(_e, val) => setActiveTab(val)}
              sx={{ px: 2 }}
            >
              <Tab label="Suggestions" />
              <Tab label="Mes Cocktails" />
              <Tab label="Favoris" />
            </Tabs>
          </Box>
          
          {/* Barre de recherche */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              placeholder="Rechercher un cocktail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Box sx={{ fontSize: 14, fontWeight: 'medium' }}>
                        Effacer
                      </Box>
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
              sx={{ mb: activeTab !== 0 ? 0 : 2 }}
            />
            
            {activeTab === 0 && (
              <Typography variant="body2" color="text.secondary">
                Suggestions basées sur votre collection de spiritueux
              </Typography>
            )}
          </Box>
          
          {/* Onglet Suggestions */}
          {activeTab === 0 && (
            <Box p={3}>
              {isFiltering ? (
                // Affichage des résultats de recherche dans les suggestions
                filteredCocktails.length > 0 ? (
                  <>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        Résultats pour &quot;{searchTerm}&quot;
                      </Typography>
                      <Chip 
                        label={filteredCocktails.length} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      {filteredCocktails.map(cocktail => (
                        <Grid component="div" key={cocktail.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                          <CocktailCard 
                            cocktail={cocktail} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleFavorite={handleToggleFavorite}
                            availableSpirits={spirits}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucun résultat trouvé pour &quot;{searchTerm}&quot;
                    </Typography>
                  </Box>
                )
              ) : (
                // Affichage normal des suggestions
                suggestions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LocalBarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Aucune suggestion disponible
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Ajoutez plus de spiritueux à votre collection pour obtenir des suggestions de cocktails !
                    </Typography>
                    
                    {/* Ajout du bouton d'importation dans l'affichage vide des suggestions */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <Button 
                        component={Link}
                        href="/spirits/add"
                        variant="contained" 
                        startIcon={<AddIcon />}
                      >
                        Ajouter un spiritueux
                      </Button>
                      
                      <Button 
                        component={Link}
                        href="/spirits/mixology/import"
                        variant="outlined" 
                        startIcon={<ImportExportIcon />}
                      >
                        Importer des recettes
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Top suggestions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cocktails que vous pouvez réaliser avec votre collection
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      {suggestions.slice(0, 6).map((suggestion, index) => (
                        <Grid component="div" key={index} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                          <CocktailCard 
                            cocktail={suggestion} 
                            availableSpirits={spirits}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )
              )}
            </Box>
          )}
          
          {/* Onglet Mes Cocktails */}
          {activeTab === 1 && (
            <Box p={3}>
              {isFiltering ? (
                // Affichage des résultats de recherche dans mes cocktails
                filteredCocktails.length > 0 ? (
                  <>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        Résultats pour &quot;{searchTerm}&quot;
                      </Typography>
                      <Chip 
                        label={filteredCocktails.length} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      {filteredCocktails.map(cocktail => (
                        <Grid component="div" key={cocktail.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                          <CocktailCard 
                            cocktail={cocktail} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleFavorite={handleToggleFavorite}
                            availableSpirits={spirits}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucun résultat trouvé pour &quot;{searchTerm}&quot;
                    </Typography>
                  </Box>
                )
              ) : (
                // Affichage normal des cocktails
                cocktails.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LocalBarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Vous n&apos;avez pas encore créé de cocktails
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Créez votre premier cocktail pour commencer votre collection !
                    </Typography>
                    
                    {/* Ajout des boutons de création et d'importation */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                      <Button 
                        component={Link}
                        href="/spirits/mixology/create"
                        variant="contained" 
                        startIcon={<AddIcon />}
                      >
                        Créer un cocktail
                      </Button>
                      
                      <Button 
                        component={Link}
                        href="/spirits/mixology/import"
                        variant="outlined" 
                        startIcon={<ImportExportIcon />}
                      >
                        Importer des recettes
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {cocktails.map(cocktail => (
                      <Grid component="div" key={cocktail.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                        <CocktailCard 
                          cocktail={cocktail} 
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleFavorite={handleToggleFavorite}
                          availableSpirits={spirits}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )
              )}
            </Box>
          )}
          
          {/* Onglet Favoris */}
          {activeTab === 2 && (
            <Box p={3}>
              {isFiltering ? (
                // Affichage des résultats de recherche dans les favoris
                filteredCocktails.filter(c => c.isFavorite).length > 0 ? (
                  <>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        Résultats pour &quot;{searchTerm}&quot; dans les favoris
                      </Typography>
                      <Chip 
                        label={filteredCocktails.filter(c => c.isFavorite).length} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      {filteredCocktails
                        .filter(c => c.isFavorite)
                        .map(cocktail => (
                          <Grid component="div" key={cocktail.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                            <CocktailCard 
                              cocktail={cocktail} 
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onToggleFavorite={handleToggleFavorite}
                              availableSpirits={spirits}
                            />
                          </Grid>
                        ))
                      }
                    </Grid>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Aucun favori trouvé pour &quot;{searchTerm}&quot;
                    </Typography>
                  </Box>
                )
              ) : (
                // Affichage normal des favoris
                cocktails.filter(c => c.isFavorite).length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <FavoriteIcon sx={{ fontSize: 48, color: theme.palette.error.main, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Vous n&apos;avez pas encore de cocktails favoris
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Marquez des cocktails comme favoris pour les retrouver facilement ici !
                    </Typography>
                    
                    {/* Suggestion d'importation pour les favoris */}
                    <Button 
                      component={Link}
                      href="/spirits/mixology/import"
                      variant="outlined" 
                      startIcon={<ImportExportIcon />}
                      sx={{ mt: 1 }}
                    >
                      Découvrir de nouvelles recettes
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {cocktails
                      .filter(c => c.isFavorite)
                      .map(cocktail => (
                        <Grid component="div" key={cocktail.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                          <CocktailCard 
                            cocktail={cocktail} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleFavorite={handleToggleFavorite}
                            availableSpirits={spirits}
                          />
                        </Grid>
                      ))
                    }
                  </Grid>
                )
              )}
            </Box>
          )}
        </Paper>
      </Container>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => {}}
      >
        <Alert 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}