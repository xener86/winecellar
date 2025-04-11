'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid as MuiGrid,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WineBarIcon from '@mui/icons-material/WineBar';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import { supabase } from '../utils/supabase';
import winePairingService from '../services/WinePairingService';
import WinePairingSuggestions from '../components/WinePairingSuggestions';

/* ------------------------------------------------------------------
   Types et interfaces
   ------------------------------------------------------------------ */

// Représente un vin (en BDD : table wine)
interface Wine {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
}

// Représente une bouteille (en BDD : table bottle), incluant le vin associé
interface Bottle {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  wine?: Wine;
}

// Représente un accord mets-vin (en BDD : table food_pairing)
interface FoodPairing {
  id?: string;
  food: string;
  wine_id?: string;
  wine_type?: string;
  pairing_strength?: number;
  pairing_type?: string;   // ← IMPORTANT : propriété existante pour le filtrage
  explanation?: string;
  user_rating?: number;
  saved?: boolean;
  wine?: Wine | string;    // Peut être juste un nom de vin, ou l\u2019objet Wine
}


// Type pour les notifications
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

// Type pour les clés API
interface ApiKeys {
  openai: string;
  mistral: string;
}

/**
 * Types de vin pour les sélecteurs et la visualisation
 */
const wineTypes = [
  { value: 'red_light', label: 'Rouge léger', color: '#C62828' },
  { value: 'red_medium', label: 'Rouge moyenne structure', color: '#8B0000' },
  { value: 'red_full', label: 'Rouge puissant', color: '#7B1FA2' },
  { value: 'white_dry', label: 'Blanc sec', color: '#FFF59D' },
  { value: 'white_sweet', label: 'Blanc moelleux', color: '#FFD54F' },
  { value: 'rose', label: 'Rosé', color: '#F8BBD0' },
  { value: 'sparkling', label: 'Effervescent', color: '#81D4FA' },
  { value: 'fortified', label: 'Vin fortifié', color: '#8D6E63' },
];

// Plats populaires pour l\u2019autocomplétion
const popularDishes = [
  'Bœuf bourguignon', 'Coq au vin', 'Blanquette de veau',
  'Plateau de fruits de mer', 'Huîtres', 'Saumon grillé',
  'Risotto aux champignons', 'Pâtes à la carbonara', 'Pizza margherita',
  'Charcuterie', 'Fromages affinés', 'Ratatouille',
  'Poulet rôti', 'Curry thaï', 'Paella',
  'Sushi', 'Canard à l\'orange', 'Magret de canard',
  'Chili con carne', 'Tarte au citron', 'Chocolat'
];


export default function FoodPairingPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  /* ------------------------------------------------------------------
     États locaux
     ------------------------------------------------------------------ */
  const [loading, setLoading] = useState<boolean>(true); // Initialiser à true
  const [pairingLoading, setPairingLoading] = useState<boolean>(false);   // Chargement de la recherche d\u2019accords

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [pairingMode, setPairingMode] = useState<string>('all');      // 'all', 'classic', 'audacious', 'merchant'
  const [pairingFilter, setPairingFilter] = useState<string>('all');  // Filtre d\u2019affichage des résultats
  const [sourceMode, setSourceMode] = useState<string>('all');        // 'all', 'cellar', 'store'
  const [foodQuery, setFoodQuery] = useState<string>('');             // Recherche par plat
  const [wineQuery, setWineQuery] = useState<string>('');             // Recherche par nom de vin (pas dans la cave)
  const [selectedWineType, setSelectedWineType] = useState<string>('');// Type de vin sélectionné (optionnel)
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);// Vin précis sélectionné depuis la cave
  const [cellarWines, setCellarWines] = useState<Bottle[]>([]);       // Vins de la cave
  const [savedPairings, setSavedPairings] = useState<FoodPairing[]>([]);      // Accords favoris
  const [pairingResults, setPairingResults] = useState<FoodPairing[]>([]);    // Résultats de recherche

  const [userData, setUserData] = useState<User | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Choix du provider IA (OpenAI ou Mistral)
  const [apiProvider, setApiProvider] = useState<'openai' | 'mistral'>('openai');
  // Clés API stockées (OpenAI, Mistral)
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    mistral: '',
  });

  /* ------------------------------------------------------------------
     Mémos et calculs dérivés
     ------------------------------------------------------------------ */

  // Filtrer les résultats selon le type d\u2019accord sélectionné
  const filteredResults: FoodPairing[] = pairingResults.filter((pairing) => {
    // Si 'all', on n\u2019exclut rien
    if (pairingFilter === 'all') return true;
    // Sinon, on compare la propriété 'pairing_type' à la valeur du filtre
    return pairing.pairing_type === pairingFilter;
  });

  // Filtrer les favoris de la même façon
  const filteredSavedPairings: FoodPairing[] = savedPairings.filter((pairing) => {
    if (pairingFilter === 'all') return true;
    return pairing.pairing_type === pairingFilter;
  });

  /* ------------------------------------------------------------------
     useEffect : récupérer les données de l\u2019utilisateur, la cave, etc.
     ------------------------------------------------------------------ */
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Vérifier l\u2019authentification
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        // Utilisateur non connecté
        setLoading(false);
        return;
      }

      setUserData(authData.user);

      // Récupérer les bouteilles en stock dans la cave
      const { data: bottlesData, error: bottlesError } = await supabase
        .from('bottle')
        .select(`
          id,
          wine_id,
          position_id,
          status,
          wine:wine_id (
            id,
            name,
            color,
            vintage,
            domain,
            region,
            appellation,
            alcohol_percentage
          )
        `)
        .eq('status', 'in_stock')
        .eq('user_id', authData.user.id);

      if (bottlesError) throw bottlesError;
      // Vérifier que le champ "wine" est bien un objet unique et pas un tableau
      // Si Supabase retourne un objet unique, pas de souci.
      // Sinon, ajustez votre schéma de jointure.
      setCellarWines(bottlesData || []);

      // Récupérer les accords sauvegardés
      const { data: pairingsData, error: pairingsError } = await supabase
        .from('food_pairing')
        .select(`
          id,
          food,
          wine_id,
          wine_type,
          pairing_strength,
          pairing_type,
          explanation,
          user_rating,
          saved,
          wine:wine_id (
            id,
            name,
            color,
            vintage,
            domain,
            region,
            appellation
          )
        `)
        .eq('user_id', authData.user.id)
        .eq('saved', true);

      if (pairingsError) throw pairingsError;
      setSavedPairings(pairingsData || []);

      // Récupérer les clés API si vous les stockez en table user_preferences
      const { data: prefsData } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key, default_ai_provider')
        .eq('user_id', authData.user.id)
        .single();

      if (prefsData) {
        setApiKeys({
          openai: prefsData.openai_api_key || '',
          mistral: prefsData.mistral_api_key || '',
        });

        if (prefsData.default_ai_provider) {
          setApiProvider(prefsData.default_ai_provider as 'openai' | 'mistral');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------
     Gestion du changement d\u2019onglet
     ------------------------------------------------------------------ */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);

    // Réinitialiser certains champs à chaque changement d\u2019onglet
    setFoodQuery('');
    setWineQuery('');
    setSelectedWineType('');
    setSelectedWine(null);
    setPairingResults([]);
    setPairingFilter('all');
  };

  /* ------------------------------------------------------------------
     Gestion du mode d\u2019accord (classic, audacious, etc.)
     ------------------------------------------------------------------ */
  const handlePairingModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: string | null
  ) => {
    if (newMode !== null) {
      setPairingMode(newMode);
    }
  };

  /* ------------------------------------------------------------------
     Gestion du filtre d\u2019affichage (classic, audacious, etc.)
     ------------------------------------------------------------------ */
  const handlePairingFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    if (newFilter !== null) {
      setPairingFilter(newFilter);
    }
  };

  /* ------------------------------------------------------------------
     Gestion du filtre source (all, cellar, store)
     ------------------------------------------------------------------ */
  const handleSourceModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: string | null
  ) => {
    if (newMode !== null) {
      setSourceMode(newMode);
    }
  };

  /* ------------------------------------------------------------------
     Recherches d\u2019accords
     ------------------------------------------------------------------ */
  const handleSearchByFood = async () => {
    if (!foodQuery.trim()) return;

    setPairingLoading(true);
    setPairingResults([]);
    setPairingFilter('all');

    try {
      // Vérifier si une clé API existe
      const apiKey = apiProvider === 'openai' ? apiKeys.openai : apiKeys.mistral;
      if (!apiKey) {
        throw new Error(
          `Aucune clé API ${
            apiProvider === 'openai' ? 'OpenAI' : 'Mistral'
          } configurée`
        );
      }

      // Appel au service
      const results = await winePairingService.findPairingsByFood(foodQuery, {
        sourceMode,
        pairingMode,
        apiProvider,
        apiKey,
        userId: userData?.id,
        limit: 4,
        forceRefresh: false,
      });

      setPairingResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'accords par plat :', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error',
      });
    } finally {
      setPairingLoading(false);
    }
  };

  const handleSearchByWine = async () => {
    if (!selectedWine && !wineQuery.trim()) return;

    setPairingLoading(true);
    setPairingResults([]);
    setPairingFilter('all');

    try {
      // Vérifier si une clé API existe
      const apiKey = apiProvider === 'openai' ? apiKeys.openai : apiKeys.mistral;
      if (!apiKey) {
        throw new Error(
          `Aucune clé API ${
            apiProvider === 'openai' ? 'OpenAI' : 'Mistral'
          } configurée`
        );
      }

      let results: FoodPairing[] = [];

      if (selectedWine) {
        // Rechercher par vin précis (issu de la cave)
        results = await winePairingService.findPairingsByWine(selectedWine, {
          pairingMode,
          apiProvider,
          apiKey,
          userId: userData?.id,
          limit: 4,
          forceRefresh: false,
        });
      } else {
        // Rechercher par nom/type de vin générique
        results = await winePairingService.findPairingsByWine(wineQuery, {
          wineType: selectedWineType,
          pairingMode,
          apiProvider,
          apiKey,
          userId: userData?.id,
          limit: 4,
          forceRefresh: false,
        });
      }

      setPairingResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'accords par vin :', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error',
      });
    } finally {
      setPairingLoading(false);
    }
  };

  /**
   * Charger plus de résultats (pagination)
   */
  const handleLoadMoreResults = async () => {
    setPairingLoading(true);

    try {
      const apiKey = apiProvider === 'openai' ? apiKeys.openai : apiKeys.mistral;
      if (!apiKey) {
        throw new Error(
          `Aucune clé API ${
            apiProvider === 'openai' ? 'OpenAI' : 'Mistral'
          } configurée`
        );
      }

      let moreResults: FoodPairing[] = [];

      if (selectedWine) {
        // Charger la page suivante en mode vin précis
        moreResults = await winePairingService.findPairingsByWine(selectedWine, {
          pairingMode,
          apiProvider,
          apiKey,
          userId: userData?.id,
          limit: 4,
          offset: pairingResults.length, // Démarrer à la suite
          forceRefresh: true,
        });
      } else if (foodQuery.trim()) {
        // Charger la page suivante en mode plat
        moreResults = await winePairingService.findPairingsByFood(foodQuery, {
          sourceMode,
          pairingMode,
          apiProvider,
          apiKey,
          userId: userData?.id,
          limit: 4,
          offset: pairingResults.length,
          forceRefresh: true,
        });
      } else {
        // Charger la page suivante en mode vin générique
        moreResults = await winePairingService.findPairingsByWine(wineQuery, {
          wineType: selectedWineType,
          pairingMode,
          apiProvider,
          apiKey,
          userId: userData?.id,
          limit: 4,
          offset: pairingResults.length,
          forceRefresh: true,
        });
      }

      setPairingResults([...pairingResults, ...moreResults]);
    } catch (error) {
      console.error('Erreur lors du chargement de plus de résultats:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error',
      });
    } finally {
      setPairingLoading(false);
    }
  };

  /* ------------------------------------------------------------------
     Sauvegarde / suppression / notation des accords
     ------------------------------------------------------------------ */
  const handleSavePairing = async (pairing: FoodPairing) => {
    try {
      if (!userData) {
        throw new Error('Vous devez être connecté pour sauvegarder un accord');
      }

      const savedPairing = await winePairingService.savePairing(
        pairing,
        userData.id
      );

      // Mettre à jour la liste des favoris
      setSavedPairings((prev) => [...prev, savedPairing]);

      // Mettre à jour le statut dans la liste des résultats
      setPairingResults((prev) =>
        prev.map((p) => {
          // Soit c\u2019est le même accord => on met l\u2019ID et saved à true
          if (
            (p.id && p.id === pairing.id) ||
            (p.food === pairing.food && p.wine_id === pairing.wine_id)
          ) {
            return { ...p, id: savedPairing.id, saved: true };
          }
          // Sinon on ne touche pas
          return p;
        })
      );

      setNotification({
        open: true,
        message: 'Accord sauvegardé avec succès',
        severity: 'success',
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'accord:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error',
      });
    }
  };

  const handleRemovePairing = async (pairingId: string) => {
    try {
      if (!userData) {
        throw new Error('Vous devez être connecté pour supprimer un accord');
      }

      await winePairingService.removePairing(pairingId, userData.id);

      // Mettre à jour la liste des favoris
      setSavedPairings((prev) => prev.filter((p) => p.id !== pairingId));

      // Mettre à jour le statut dans la liste des résultats
      setPairingResults((prev) =>
        prev.map((p) => {
          if (p.id === pairingId) {
            return { ...p, id: undefined, saved: false };
          }
          return p;
        })
      );

      setNotification({
        open: true,
        message: 'Accord supprimé avec succès',
        severity: 'success',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'accord:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error',
      });
    }
  };

  const handleRatePairing = async (pairingId: string, rating: number) => {
    try {
      if (!userData) {
        throw new Error('Vous devez être connecté pour évaluer un accord');
      }

      await winePairingService.ratePairing(pairingId, rating, userData.id);

      // Mettre à jour la liste des favoris
      setSavedPairings((prev) =>
        prev.map((p) => (p.id === pairingId ? { ...p, user_rating: rating } : p))
      );

      // Mettre à jour la liste des résultats
      setPairingResults((prev) =>
        prev.map((p) => (p.id === pairingId ? { ...p, user_rating: rating } : p))
      );

      setNotification({
        open: true,
        message: 'Évaluation enregistrée',
        severity: 'success',
      });
    } catch (error) {
      console.error("Erreur lors de l\'évaluation de l\'accord:", error);
      setNotification({
        open: true,
        message: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
        severity: 'error',
      });
    }
  };

  /* ------------------------------------------------------------------
     Fonctions utilitaires : couleurs de vin
     ------------------------------------------------------------------ */
  const getWineColor = (color: string) => {
    switch (color) {
      case 'red':
        return '#8B0000';
      case 'white':
        return '#F5F5DC';
      case 'rose':
        return '#F8BBD0';
      case 'sparkling':
        return '#81D4FA';
      case 'fortified':
        return '#8D6E63';
      default:
        return '#607D8B';
    }
  };

  /* ------------------------------------------------------------------
     Rendu de l\u2019onglet « Rechercher par plat »
     ------------------------------------------------------------------ */
  const renderSearchByFoodTab = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 6 }}>
        <MuiGrid container spacing={3}>
          {/* Champ de saisie du plat */}
          <MuiGrid xs={12} md={8}>
            <Autocomplete
              freeSolo
              options={popularDishes}
              value={foodQuery}
              onChange={(_event, newValue) => {
                setFoodQuery(newValue || '');
              }}
              onInputChange={(_event, newInputValue) => {
                setFoodQuery(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Plat ou ingrédient"
                  placeholder="Ex: Bœuf bourguignon, Saumon grillé..."
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <RestaurantIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              )}
            />
          </MuiGrid>

          {/* Sélection optionnelle d\u2019un type de vin */}
          <MuiGrid xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="wine-type-select-label">Type de vin (optionnel)</InputLabel>
              <Select
                labelId="wine-type-select-label"
                value={selectedWineType}
                label="Type de vin (optionnel)"
                onChange={(e) => setSelectedWineType(e.target.value)}
                disabled={sourceMode === 'cellar'} // Si on est en mode cave seulement, on n\u2019utilise pas ce champ
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">Tous types de vins</MenuItem>
                {wineTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: type.color,
                          mr: 1,
                        }}
                      />
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MuiGrid>

          {/* Boutons de contrôle et options */}
          <MuiGrid xs={12}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, mt: 2 }}>
              {/* Sélection du type d\u2019accord : all / classic / audacious / merchant */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                Type d&apos;accord
                </Typography>
                <ToggleButtonGroup
                  value={pairingMode}
                  exclusive
                  onChange={handlePairingModeChange}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    '& .MuiToggleButton-root': {
                      borderRadius: 0,
                      '&:first-of-type': {
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                      },
                      '&:last-of-type': {
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8,
                      },
                    },
                  }}
                >
                  <ToggleButton value="all">
                    <Tooltip title="Tous les types d\u2019accords">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalBarIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Tous</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="classic">
                    <Tooltip title="Accords classiques et sûrs">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VerifiedIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Classiques</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="audacious">
                    <Tooltip title="Accords osés et originaux">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmojiObjectsIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Audacieux</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="merchant">
                    <Tooltip title="Vins à découvrir chez votre caviste">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StorefrontIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Caviste</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Sélection de la source : all / cellar / store */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Source des vins
                </Typography>
                <ToggleButtonGroup
                  value={sourceMode}
                  exclusive
                  onChange={handleSourceModeChange}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    '& .MuiToggleButton-root': {
                      borderRadius: 0,
                      '&:first-of-type': {
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                      },
                      '&:last-of-type': {
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8,
                      },
                    },
                  }}
                >
                  <ToggleButton value="all">
                    <Tooltip title="Toutes sources de vins">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalBarIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Tous</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="cellar" disabled={cellarWines.length === 0}>
                    <Tooltip title="Vins de ma cave">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WineBarIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Ma cave</Typography>
                        <Badge
                          badgeContent={cellarWines.length}
                          color="primary"
                          sx={{
                            ml: 1,
                            '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 },
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="store">
                    <Tooltip title="Vins à acheter">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StorefrontIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Caviste</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </MuiGrid>

          {/* Bouton de recherche */}
          <MuiGrid xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={pairingLoading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
              onClick={handleSearchByFood}
              disabled={
                pairingLoading ||
                !foodQuery.trim() ||
                (!apiKeys.openai && !apiKeys.mistral)
              }
              sx={{ mt: 2, height: 56, borderRadius: 2 }}
            >
              Rechercher des accords
            </Button>
            {!apiKeys.openai && !apiKeys.mistral && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                Vous devez configurer au moins une clé API dans les paramètres pour utiliser cette
                fonctionnalité.
              </Alert>
            )}
          </MuiGrid>
        </MuiGrid>
      </Box>

      {/* Résultats */}
      {pairingLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, mb: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 4 }}>
            Recherche des accords parfaits...
          </Typography>
        </Box>
      ) : pairingResults.length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ mr: 1 }} />
            Résultats pour : {foodQuery}
          </Typography>

          {/* Contrôles de filtrage */}
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '16px', p: 0.5 }}>
              <ToggleButtonGroup
                value={pairingFilter}
                exclusive
                onChange={handlePairingFilterChange}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: 0,
                    '&:first-of-type': {
                      borderTopLeftRadius: 16,
                      borderBottomLeftRadius: 16,
                    },
                    '&:last-of-type': {
                      borderTopRightRadius: 16,
                      borderBottomRightRadius: 16,
                    },
                  },
                }}
              >
                <ToggleButton value="all">
                  <Tooltip title="Tous les types">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <LocalBarIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Tous</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="classic">
                  <Tooltip title="Accords classiques">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <VerifiedIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Classiques</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="audacious">
                  <Tooltip title="Accords audacieux">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <EmojiObjectsIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Audacieux</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="merchant">
                  <Tooltip title="Suggestions caviste">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <StorefrontIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Caviste</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Liste des résultats filtrés */}
          {filteredResults.length > 0 ? (
            <MuiGrid container spacing={3}>
              {filteredResults.map((pairing, index) => {
                const preparedWine =
                  typeof pairing.wine === 'string'
                    ? {
                        // Si wine est juste une string => on construit un mini-objet
                        name: pairing.wine,
                        color: pairing.wine_type
                          ? pairing.wine_type.split('_')[0]
                          : 'red', // Suppose que s'il n'y a pas d'infos, on met rouge par défaut
                        // On place l'explication ici pour la transmettre au composant
                        explanation: pairing.explanation,
                        id: 'temp',
                        vintage: null,
                        domain: null,
                        region: null,
                        appellation: null,
                        alcohol_percentage: null,
                      }
                    : {
                        ...pairing.wine,
                        // wine est déjà un objet complet
                        explanation: pairing.explanation,
                      };

                return (
                  <MuiGrid xs={12} md={6} key={index}>
                    <WinePairingSuggestions
                      wine={preparedWine}
                      food={pairing.food}
                      mode="byFood"
                      compact={false}
                      apiConfig={{
                        apiProvider,
                        apiKey: apiKeys[apiProvider],
                      }}
                      userId={userData?.id}
                      onSave={handleSavePairing}
                      onRemove={handleRemovePairing}
                      onRate={handleRatePairing}
                      saved={pairing.saved}
                      userRating={pairing.user_rating}
                    />
                  </MuiGrid>
                );
              })}
            </MuiGrid>
          ) : (
            <Box sx={{ textAlign: 'center', my: 8 }}>
              <Typography variant="body1" color="text.secondary">
                Aucun accord de type « {pairingFilter} » disponible pour cette recherche.
              </Typography>
              <Button
                variant="text"
                onClick={() => setPairingFilter('all')}
                startIcon={<FilterAltOffIcon />}
                sx={{ mt: 2 }}
              >
                Afficher tous les résultats
              </Button>
            </Box>
          )}

          {/* Bouton « Plus de suggestions » */}
          {filteredResults.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleLoadMoreResults}
                disabled={pairingLoading}
                sx={{ borderRadius: 2 }}
              >
                Plus de suggestions
              </Button>
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );

  /* ------------------------------------------------------------------
     Rendu de l'onglet « Rechercher par vin »
     ------------------------------------------------------------------ */
  const renderSearchByWineTab = () => (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 6 }}>
        <MuiGrid container spacing={3}>
          {/* Sélecteur d'un vin de la cave */}
          <MuiGrid xs={12} md={cellarWines.length > 0 ? 8 : 12}>
            <FormControl fullWidth>
              <InputLabel id="wine-select-label">Sélectionnez un vin de votre cave</InputLabel>
              <Select
                labelId="wine-select-label"
                value={selectedWine ? selectedWine.id : ''}
                label="Sélectionnez un vin de votre cave"
                onChange={(e) => {
                  const wineId = e.target.value as string;
                  const foundBottle = cellarWines.find((b) => b.wine?.id === wineId);
                  const wine = foundBottle?.wine || null;
                  setSelectedWine(wine);
                  setWineQuery('');
                  setSelectedWineType('');
                }}
                disabled={cellarWines.length === 0}
                sx={{ borderRadius: 2 }}
                renderValue={(selected) => {
                  const found = cellarWines.find((b) => b.wine?.id === selected)?.wine;
                  if (!found) return 'Sélectionnez un vin';
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: getWineColor(found.color),
                          mr: 1,
                        }}
                      />
                      {found.name}
                      {found.vintage ? ` (${found.vintage})` : ''}
                    </Box>
                  );
                }}
              >
                {cellarWines.map((bottle) => {
                  if (!bottle.wine) return null;
                  return (
                    <MenuItem key={bottle.wine.id} value={bottle.wine.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: getWineColor(bottle.wine.color),
                            mr: 1,
                          }}
                        />
                        {bottle.wine.name} {bottle.wine.vintage ? `(${bottle.wine.vintage})` : ''}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ou
            </Typography>

            {/* Saisie libre d'un vin non présent dans la cave */}
            <TextField
              fullWidth
              label="Saisissez un vin qui n'est pas dans votre cave"
              placeholder="Ex: Chablis, Barolo, Champagne..."
              value={wineQuery}
              onChange={(e) => {
                setWineQuery(e.target.value);
                setSelectedWine(null);
              }}
              sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: <WineBarIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </MuiGrid>

          {/* Sélection d'un type de vin, si aucun vin précis n'est choisi */}
          {!selectedWine && (
            <MuiGrid xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="wine-type-select-label-2">Type de vin</InputLabel>
                <Select
                  labelId="wine-type-select-label-2"
                  value={selectedWineType}
                  label="Type de vin"
                  onChange={(e) => setSelectedWineType(e.target.value)}
                  disabled={!wineQuery}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Sélectionnez un type</MenuItem>
                  {wineTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: type.color,
                            mr: 1,
                          }}
                        />
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MuiGrid>
          )}

          {/* Type d'accord + Choix de l'IA */}
          <MuiGrid xs={12}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                   Type d&apos;accord
                </Typography>
                <ToggleButtonGroup
                  value={pairingMode}
                  exclusive
                  onChange={handlePairingModeChange}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: 0,
                      '&:first-of-type': {
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                      },
                      '&:last-of-type': {
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8,
                      },
                    },
                  }}
                >
                  <ToggleButton value="all">
                    <Tooltip title="Tous les types d'accords">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalBarIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Tous</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="classic">
                    <Tooltip title="Accords classiques et sûrs">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VerifiedIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Classiques</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="audacious">
                    <Tooltip title="Accords osés et originaux">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmojiObjectsIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Audacieux</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="merchant">
                    <Tooltip title="Suggestions premium">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StorefrontIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Premium</Typography>
                      </Box>
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  IA à utiliser
                </Typography>
                <ToggleButtonGroup
                  value={apiProvider}
                  exclusive
                  onChange={(e, val) => val && setApiProvider(val as 'openai' | 'mistral')}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: 0,
                      '&:first-of-type': {
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                      },
                      '&:last-of-type': {
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8,
                      },
                    },
                  }}
                >
                  <ToggleButton value="openai" disabled={!apiKeys.openai}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AutoAwesomeIcon sx={{ mr: 0.5 }} />
                      <Typography variant="body2">OpenAI</Typography>
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="mistral" disabled={!apiKeys.mistral}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FlashOnIcon sx={{ mr: 0.5 }} />
                      <Typography variant="body2">Mistral</Typography>
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </MuiGrid>

          {/* Bouton de recherche */}
          <MuiGrid xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={pairingLoading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
              onClick={handleSearchByWine}
              disabled={
                pairingLoading ||
                (!selectedWine && !wineQuery.trim()) ||
                (!apiKeys.openai && !apiKeys.mistral)
              }
              sx={{ mt: 2, height: 56, borderRadius: 2 }}
            >
              Rechercher des accords
            </Button>
            {!apiKeys.openai && !apiKeys.mistral && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                Vous devez configurer au moins une clé API dans les paramètres pour utiliser cette
                fonctionnalité.
              </Alert>
            )}
          </MuiGrid>
        </MuiGrid>
      </Box>

      {/* Résultats */}
      {pairingLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, mb: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 4 }}>
            Recherche des plats adaptés...
          </Typography>
        </Box>
      ) : pairingResults.length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ mr: 1 }} />
            {`Résultats pour : ${selectedWine ? selectedWine.name : wineQuery}`}
          </Typography>

          {/* Contrôles de filtrage */}
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 16, p: 0.5 }}>
              <ToggleButtonGroup
                value={pairingFilter}
                exclusive
                onChange={handlePairingFilterChange}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: 0,
                    '&:first-of-type': {
                      borderTopLeftRadius: 16,
                      borderBottomLeftRadius: 16,
                    },
                    '&:last-of-type': {
                      borderTopRightRadius: 16,
                      borderBottomRightRadius: 16,
                    },
                  },
                }}
              >
                <ToggleButton value="all">
                  <Tooltip title="Tous les types">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <LocalBarIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Tous</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="classic">
                  <Tooltip title="Accords classiques">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <VerifiedIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Classiques</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="audacious">
                  <Tooltip title="Accords audacieux">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <EmojiObjectsIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Audacieux</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="merchant">
                  <Tooltip title="Suggestions premium">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <StorefrontIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Premium</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Liste des résultats filtrés */}
          {filteredResults.length > 0 ? (
            <MuiGrid container spacing={3}>
              {filteredResults.map((pairing, index) => (
                <MuiGrid xs={12} md={6} key={index}>
                  <WinePairingSuggestions
                    wine={selectedWine || pairing.wine}
                    food={pairing.food}
                    mode="byWine"
                    compact={false}
                    apiConfig={{
                      apiProvider,
                      apiKey: apiKeys[apiProvider],
                    }}
                    userId={userData?.id}
                    onSave={handleSavePairing}
                    onRemove={handleRemovePairing}
                    onRate={handleRatePairing}
                    saved={pairing.saved}
                    userRating={pairing.user_rating}
                  />
                </MuiGrid>
              ))}
            </MuiGrid>
          ) : (
            <Box sx={{ textAlign: 'center', my: 8 }}>
              <Typography variant="body1" color="text.secondary">
                Aucun accord de type « {pairingFilter} » disponible pour cette recherche.
              </Typography>
              <Button
                variant="text"
                onClick={() => setPairingFilter('all')}
                startIcon={<FilterAltOffIcon />}
                sx={{ mt: 2 }}
              >
                Afficher tous les résultats
              </Button>
            </Box>
          )}

          {/* Bouton « Plus de suggestions » */}
          {filteredResults.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleLoadMoreResults}
                disabled={pairingLoading}
                sx={{ borderRadius: 2 }}
              >
                Plus de suggestions
              </Button>
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );

  /* ------------------------------------------------------------------
     Rendu de l'onglet « Favoris »
     ------------------------------------------------------------------ */
  const renderSavedPairingsTab = () => (
    <Box sx={{ width: '100%' }}>
      {savedPairings.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Aucun accord sauvegardé
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Commencez par rechercher des accords mets-vins et sauvegardez vos préférés.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => setTabIndex(0)}
              startIcon={<SearchIcon />}
              sx={{ borderRadius: 2, mr: 2 }}
            >
              Rechercher par plat
            </Button>
            <Button
              variant="outlined"
              onClick={() => setTabIndex(1)}
              startIcon={<WineBarIcon />}
              sx={{ borderRadius: 2 }}
            >
              Rechercher par vin
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BookmarkIcon sx={{ mr: 1 }} />
            Vos accords mets-vins sauvegardés
          </Typography>

          {/* Contrôles de filtrage */}
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 16, p: 0.5 }}>
              <ToggleButtonGroup
                value={pairingFilter}
                exclusive
                onChange={handlePairingFilterChange}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: 0,
                    '&:first-of-type': {
                      borderTopLeftRadius: 16,
                      borderBottomLeftRadius: 16,
                    },
                    '&:last-of-type': {
                      borderTopRightRadius: 16,
                      borderBottomRightRadius: 16,
                    },
                  },
                }}
              >
                <ToggleButton value="all">
                  <Tooltip title="Tous les types">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <LocalBarIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Tous</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="classic">
                  <Tooltip title="Accords classiques">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <VerifiedIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Classiques</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="audacious">
                  <Tooltip title="Accords audacieux">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <EmojiObjectsIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Audacieux</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="merchant">
                  <Tooltip title="Suggestions caviste">
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                      <StorefrontIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2">Premium</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Liste des favoris filtrés */}
          {filteredSavedPairings.length > 0 ? (
            <MuiGrid container spacing={3}>
              {filteredSavedPairings.map((pairing) => (
                <MuiGrid xs={12} md={6} key={pairing.id}>
                  <WinePairingSuggestions
                    wine={pairing.wine}
                    food={pairing.food}
                    mode={pairing.wine_id ? 'byFood' : 'byWine'}
                    compact={false}
                    apiConfig={{
                      apiProvider,
                      apiKey: apiKeys[apiProvider],
                    }}
                    userId={userData?.id}
                    onSave={handleSavePairing}
                    onRemove={handleRemovePairing}
                    onRate={handleRatePairing}
                    saved
                    userRating={pairing.user_rating}
                  />
                </MuiGrid>
              ))}
            </MuiGrid>
          ) : (
            <Box sx={{ textAlign: 'center', my: 8 }}>
              <Typography variant="body1" color="text.secondary">
                Aucun accord sauvegardé de type « {pairingFilter} ».
              </Typography>
              <Button
                variant="text"
                onClick={() => setPairingFilter('all')}
                startIcon={<FilterAltOffIcon />}
                sx={{ mt: 2 }}
              >
                Afficher tous les favoris
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  /* ------------------------------------------------------------------
     Rendu principal
     ------------------------------------------------------------------ */
     return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
          {/* Box avec Titre et Bouton Config (reste inchangé) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
            <Typography variant="h4" component="h1" fontWeight={500}>
              Accords Mets & Vins
            </Typography>
            <Button component={Link} href="/settings" variant="outlined" sx={{ borderRadius: 2 }}>
              Configuration API
            </Button>
          </Box>
    
          {/* === DÉBUT DE LA MODIFICATION POUR LE LOADING === */}
          {/* Affiche un spinner si loading est true */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '40vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            // Sinon (loading est false), affiche le contenu normal
            <>
              {/* Paper d'introduction (inchangé, mais maintenant dans le else) */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: 1,
                  borderColor: theme.palette.divider,
                  borderRadius: 2,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
                  mb: 3,
                }}
              >
                <Typography variant="body1" paragraph>
                  Découvrez les accords parfaits entre vos vins et vos plats préférés. Recherchez par plat
                  pour trouver le vin idéal, ou par vin pour trouver les plats qui le sublimeront. Notre IA
                  vous guide dans vos découvertes gastronomiques.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 4 }}>
                  <Chip icon={<VerifiedIcon />} label="Accords classiques" color="success" variant="outlined"/>
                  <Chip icon={<EmojiObjectsIcon />} label="Accords audacieux" color="secondary" variant="outlined"/>
                  <Chip icon={<StorefrontIcon />} label="Suggestions premium" color="info" variant="outlined" />
                  <Chip icon={<StarBorderIcon />} label="Évaluez vos combinaisons" color="default" variant="outlined" />
                </Box>
              </Paper>
    
              {/* Paper principal avec les onglets (inchangé, mais maintenant dans le else) */}
              <Paper
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: theme.palette.divider,
                  borderRadius: 2,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
                  overflow: 'hidden',
                }}
              >
                {/* Onglets */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ '& .MuiTab-root': { py: 2 } }}
                  >
                    <Tab icon={<RestaurantIcon />} label="Rechercher par plat" id="tab-0" aria-controls="tabpanel-0" />
                    <Tab icon={<WineBarIcon />} label="Rechercher par vin" id="tab-1" aria-controls="tabpanel-1" />
                    <Tab icon={ <Badge badgeContent={savedPairings.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 },}}><BookmarkIcon /></Badge>} label="Favoris" id="tab-2" aria-controls="tabpanel-2" />
                  </Tabs>
                </Box>
    
                {/* Contenu des onglets */}
                <Box sx={{ p: { xs: 2, md: 6 } }}>
                  <div role="tabpanel" hidden={tabIndex !== 0} id="tabpanel-0" aria-labelledby="tab-0">{tabIndex === 0 && renderSearchByFoodTab()}</div>
                  <div role="tabpanel" hidden={tabIndex !== 1} id="tabpanel-1" aria-labelledby="tab-1">{tabIndex === 1 && renderSearchByWineTab()}</div>
                  <div role="tabpanel" hidden={tabIndex !== 2} id="tabpanel-2" aria-labelledby="tab-2">{tabIndex === 2 && renderSavedPairingsTab()}</div>
                </Box>
              </Paper>
            </>
          )}
          {/* === FIN DE LA MODIFICATION POUR LE LOADING === */}
    
    
          {/* Snackbar (reste en dehors de la condition de chargement) */}
          <Snackbar
            open={notification.open}
            autoHideDuration={5000}
            onClose={() => setNotification({ ...notification, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setNotification({ ...notification, open: false })}
              severity={notification.severity}
              variant="filled"
              sx={{ borderRadius: 2, boxShadow: 3 }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </Container>
      </>
    );
  }