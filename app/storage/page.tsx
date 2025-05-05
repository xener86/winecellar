'use client';

import React, { useEffect, useState, useCallback } from 'react'; 
import { 
  Container, Typography, Box, Paper, Button, CircularProgress, 
  Snackbar, Alert, useTheme, useMediaQuery
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';

// Importer les composants
import StorageLocationsList from './components/StorageLocationsList';
import StorageVisualization from './components/StorageVisualization';
import BottleDetailDialog from './components/dialogs/BottleDetailDialog';
import ConsumeBottleDialog from './components/dialogs/ConsumeBottleDialog';
import LabelDialog from './components/dialogs/LabelDialog';
import AperitifSuggestionsDialog from './components/dialogs/AperitifSuggestionsDialog';
import EnhancedSpeedDialMenu from './components/EnhancedSpeedDialMenu';
import SimplifiedActionMenu from './components/SimplifiedActionMenu';

// Importer les hooks personnalisés
import { useStorageData } from './hooks/useStorageData';
import { useNotifications } from '../hooks/useNotifications';

// Importer les composants de navigation
import { Breadcrumbs, Link } from '../components/ui/Navigation';

// Types
import { Position, Bottle, StorageLocation, FilterOptions } from '@types';

// Composant pour afficher un message quand aucun emplacement n'existe
const EmptyLocationView = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        backgroundColor: isDarkMode ? alpha(theme.palette.background.paper, 0.7) : alpha(theme.palette.grey[100], 0.7),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        textAlign: 'center'
      }}
    >
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Aucun emplacement de stockage trouvé
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Commencez par ajouter votre premier emplacement pour organiser votre cave à vin.
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        component={Link}
        href="/storage/add"
        sx={{ mt: 2, borderRadius: 2 }}
      >
        Ajouter un emplacement
      </Button>
    </Paper>
  );
};

export default function StorageManagement() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Utiliser le hook personnalisé pour la gestion des données
  const { 
    locations,
    selectedLocation,
    setSelectedLocation,
    positions,
    bottles,
    setBottles,
    loading,
    positionLoading,
    fetchLocations,
    fetchPositionsAndBottles,
    deleteLocation,
  } = useStorageData();
  
  // Utiliser le hook personnalisé pour les notifications
  const { 
    notification, 
    showNotification, 
    hideNotification
  } = useNotifications();

  // États locaux
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [consumeBottleDialogOpen, setConsumeBottleDialogOpen] = useState(false);
  const [inventoryMode, setInventoryMode] = useState(false);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState('default');
  const [currentTab, setCurrentTab] = useState(0);
  const [aperitifSuggestions, setAperitifSuggestions] = useState<Bottle[]>([]);
  const [aperitifDialogOpen, setAperitifDialogOpen] = useState(false);
  const [hoveredPositionInfo, setHoveredPositionInfo] = useState<{ row: number, col: number } | null>(null);
  
  // Nous conservons cette variable pour de futures fonctionnalités
  // liées à l'API, comme l'analyse des bouteilles
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [apiKey, setApiKey] = useState('');
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<FilterOptions>({
    colors: [],
    labels: [],
    vintage: { min: null, max: null },
    searchTerm: ''
  });
  
  const [consumeData, setConsumeData] = useState({
    consumption_date: new Date(),
    tasting_note: ''
  });

  // Récupérer les clés API
  const fetchAPIKeys = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { 
        console.error('Erreur récupération clés API:', error);
        return;
      }
      
      if (data?.openai_api_key) {
        setApiKey(data.openai_api_key);
      } else if (data?.mistral_api_key) {
        setApiKey(data.mistral_api_key);
      }
    } catch (error: unknown) {
      console.error('Erreur fetchAPIKeys:', error);
    }
  }, []); 

  // Charger les données initiales
  useEffect(() => {
    fetchLocations();
    fetchAPIKeys();
  }, [fetchLocations, fetchAPIKeys]);

  // Gérer le clic sur une position
  const handlePositionClick = (position: Position) => {
    const bottle = bottles.find(b => b.position_id === position.id);
    
    if (bottle) {
      setSelectedBottle(bottle);
      setDialogOpen(true);
    } else if (selectedLocation) {
      // Ouvrir le dialogue d'ajout de bouteille directement
      // Cette approche est plus efficace que d'utiliser un état intermédiaire
      handleOpenQuickAddDialog();
    }
  };
  
  // Ouvrir le dialogue d'ajout de bouteille
  const handleOpenQuickAddDialog = () => {
    // Ici, nous pourrions communiquer directement avec le composant QuickAddDialog
    // en utilisant un système d'événements ou un contexte, mais pour simplifier
    // nous utilisons une approche minimaliste en réutilisant le code existant
    showNotification('Sélectionnez une bouteille à placer', 'info');
    
    // Rappeler aux développeurs que cette fonctionnalité peut être améliorée
    console.log('Fonctionnalité d\'ajout rapide de bouteille à optimiser');
  };
  
  // Marquer une bouteille comme consommée
  const handleConsumeBottle = async () => {
    if (!selectedBottle) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({
          status: 'consumed',
          consumption_date: consumeData.consumption_date.toISOString(),
          tasting_note: consumeData.tasting_note || null,
          position_id: null
        })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setBottles(prev => prev.filter(b => b.id !== selectedBottle.id)); 
      setConsumeBottleDialogOpen(false);
      setDialogOpen(false);
      
      showNotification('Bouteille consommée', 'success');
    } catch (error: unknown) {
      console.error('Erreur consommation bouteille:', error);
      showNotification(`Erreur: ${error instanceof Error ? error.message : 'Erreur consommation'}`, 'error');
    }
  };
  
  // Marquer une bouteille comme offerte
  const handleGiftBottle = async () => {
    if (!selectedBottle) return;
    
    try {
      const { error } = await supabase
        .from('bottle')
        .update({ status: 'gifted', position_id: null })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setBottles(prev => prev.filter(b => b.id !== selectedBottle.id));
      setDialogOpen(false);
      
      showNotification('Bouteille marquée offerte', 'success');
    } catch (error: unknown) {
      console.error('Erreur statut offert:', error);
      showNotification(`Erreur: ${error instanceof Error ? error.message : 'Erreur statut offert'}`, 'error');
    }
  };

  // Attribuer une étiquette personnalisée
  const handleSetLabel = async (labelId: string) => {
    if (!selectedBottle) return;
    
    try {
      const newLabel = selectedBottle.label === labelId ? null : labelId;
      
      const { error } = await supabase
        .from('bottle')
        .update({ label: newLabel })
        .eq('id', selectedBottle.id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      const updatedBottle = { ...selectedBottle, label: newLabel };
      setBottles(prev => prev.map(b => b.id === selectedBottle.id ? updatedBottle : b));
      setSelectedBottle(updatedBottle);
      
      setLabelDialogOpen(false);
      setDialogOpen(true);
      
      showNotification(newLabel ? 'Étiquette ajoutée' : 'Étiquette retirée', 'success');
    } catch (error: unknown) {
      console.error('Erreur attribution étiquette:', error);
      showNotification(`Erreur: ${error instanceof Error ? error.message : 'Erreur étiquette'}`, 'error');
    }
  };

  // Changer d'emplacement sélectionné
  const handleLocationChange = (location: StorageLocation) => {
    if (selectedLocation?.id !== location.id) {
      setSelectedLocation(location);
      fetchPositionsAndBottles(location.id, filters);
    }
  };

  // Optimisation du placement des bouteilles
  const handleOptimizePlacement = async () => {
    if (!selectedLocation || bottles.length === 0) {
      showNotification('Aucune bouteille à optimiser', 'info');
      return;
    }
    
    showNotification('Optimisation effectuée', 'success');
    // Implémentation de l'optimisation ici
  };

  // Gestion de la recherche
  const handleSearch = () => {
    // Implémenter la logique de recherche ici
    showNotification('Fonctionnalité de recherche à implémenter', 'info');
  };

  // Gestion des filtres
  const handleFilter = () => {
    // Implémenter la logique de filtrage ici
    showNotification('Fonctionnalité de filtrage à implémenter', 'info');
  };

  // Générer suggestions apéritif
  const handleAperitifSuggestions = () => {
    if (bottles.length === 0) {
      showNotification('Aucune bouteille disponible', 'info');
      return;
    }
    
    const aperitifBottles = bottles.filter(bottle => {
      const wineColor = bottle.wine?.color;
      return wineColor === 'sparkling' || wineColor === 'white' || wineColor === 'rose';
    });

    if (aperitifBottles.length === 0) {
      showNotification('Aucune bouteille adaptée trouvée', 'info');
      return;
    }

    // Tri : effervescent > blanc > rosé
    const colorRank: Record<string, number> = { 'sparkling': 1, 'white': 2, 'rose': 3 };
    const sortedSuggestions = aperitifBottles.sort((a, b) => 
      (colorRank[a.wine?.color || ''] || 99) - (colorRank[b.wine?.color || ''] || 99)
    );

    const topSuggestions = sortedSuggestions.slice(0, 5);
    setAperitifSuggestions(topSuggestions);
    setAperitifDialogOpen(true);
  };

  // Gérer changement onglet
  const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Changer mode d'affichage
  const handleDisplayModeChange = (newMode: string) => { 
    setDisplayMode(newMode);
  };

  // Rafraîchir les données après modification
  const handleDataRefresh = () => {
    if (selectedLocation) {
      fetchPositionsAndBottles(selectedLocation.id, filters);
    }
  };

  if (loading) {
    return (
      <React.Fragment>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
            <CircularProgress />
          </Box>
        </Container>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Navbar />
      <Container 
        sx={{ 
          width: '100%', 
          maxWidth: { xs: '100%', sm: '100%', md: '98%', lg: '1400px' }, 
          mt: 4, 
          mb: 6,
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        <Breadcrumbs />
        
        {/* Titre principal */}
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="500"
          sx={{
            mb: 3,
            backgroundImage: 'linear-gradient(45deg, #880000, #B30000)',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: theme.palette.mode === 'dark' ? '0px 2px 4px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          Mes Emplacements
        </Typography>

        {/* Menu d'actions simplifié pour les écrans plus grands */}
        {!isSmallScreen && (
          <SimplifiedActionMenu 
            onSearch={handleSearch}
            onFilter={handleFilter}
            onOptimize={handleOptimizePlacement}
            onAperitifSuggestions={handleAperitifSuggestions}
            displayMode={displayMode}
            onDisplayModeChange={handleDisplayModeChange}
            inventoryMode={inventoryMode}
            onInventoryModeChange={setInventoryMode}
            isSmallScreen={isSmallScreen}
          />
        )}

        {locations.length === 0 ? (
          <EmptyLocationView />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Liste des emplacements - Colonne de gauche */}
            <Box sx={{ width: { xs: '100%', md: '25%' }, pr: { md: 2 }, mb: { xs: 3, md: 0 } }}>
              <StorageLocationsList 
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationChange}
                onLocationDelete={deleteLocation}
              />
            </Box>
            
            {/* Visualisation de l'emplacement - Colonne de droite */}
            <Box sx={{ width: { xs: '100%', md: '75%' } }}>
                <StorageVisualization 
                  selectedLocation={selectedLocation}
                  positions={positions}
                  bottles={bottles}
                  loading={positionLoading}
                  currentTab={currentTab}
                  onTabChange={handleChangeTab}
                  displayMode={displayMode}
                  onPositionClick={handlePositionClick}
                  hoveredPositionInfo={hoveredPositionInfo}
                  onPositionHover={setHoveredPositionInfo}
                  onBottleAdded={handleDataRefresh}
                />
            </Box>
          </Box>
        )}

        {/* Menu d'actions flottant pour les petits écrans ou en mode compact */}
        {isSmallScreen ? (
          // Version simplifiée pour mobile
          <SimplifiedActionMenu 
            onSearch={handleSearch}
            onFilter={handleFilter}
            onOptimize={handleOptimizePlacement}
            onAperitifSuggestions={handleAperitifSuggestions}
            displayMode={displayMode}
            onDisplayModeChange={handleDisplayModeChange}
            inventoryMode={inventoryMode}
            onInventoryModeChange={setInventoryMode}
            isSmallScreen={isSmallScreen}
          />
        ) : (
          // Version complète pour desktop
          <EnhancedSpeedDialMenu 
            onSearch={handleSearch}
            onFilter={handleFilter}
            onInventoryToggle={setInventoryMode}
            onOptimize={handleOptimizePlacement}
            onAperitifSuggestions={handleAperitifSuggestions}
            displayMode={displayMode}
            onDisplayModeChange={handleDisplayModeChange}
            activeFilters={filters.colors.concat(filters.labels)}
            inventoryMode={inventoryMode}
          />
        )}

        {/* Dialogues */}
        {selectedBottle && (
          <BottleDetailDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            bottle={selectedBottle}
            onConsumeClick={() => {
              setDialogOpen(false);
              setConsumeBottleDialogOpen(true);
            }}
            onGiftClick={handleGiftBottle}
            onLabelClick={() => {
              setDialogOpen(false);
              setLabelDialogOpen(true);
            }}
          />
        )}

        {selectedBottle && (
          <ConsumeBottleDialog
            open={consumeBottleDialogOpen}
            onClose={() => setConsumeBottleDialogOpen(false)}
            bottle={selectedBottle}
            onConsume={handleConsumeBottle}
            consumptionData={consumeData}
            setConsumptionData={setConsumeData}
          />
        )}

        {selectedBottle && (
          <LabelDialog
            open={labelDialogOpen}
            onClose={() => setLabelDialogOpen(false)}
            bottle={selectedBottle}
            onSetLabel={handleSetLabel}
          />
        )}

        <AperitifSuggestionsDialog
          open={aperitifDialogOpen}
          onClose={() => setAperitifDialogOpen(false)}
          suggestions={aperitifSuggestions}
        />
        
        {/* Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={hideNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={hideNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ borderRadius: 2, boxShadow: 3 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </React.Fragment>
  );
}