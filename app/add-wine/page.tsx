'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Card,
  CardContent,
  Chip,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WineBarIcon from '@mui/icons-material/WineBar';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GrassIcon from '@mui/icons-material/Grass';
import PercentIcon from '@mui/icons-material/Percent';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import TuneIcon from '@mui/icons-material/Tune';
import PersonIcon from '@mui/icons-material/Person';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import WineAgingCurve from '../components/WineAgingCurve';
import TastingRadarChart from '../components/TastingRadarChart';
// Import direct de l'instance préinitialisée - CORRECTION CLÉ
import { supabase } from '../utils/supabase';
import WineAIService from '../services/WineAIService';

// Constantes
const BORDER_RADIUS = 2;
const DEFAULT_MAX_TOKENS = 1000;
const DEFAULT_TEMPERATURE = 0.7;

// Types
interface TastingNotes {
  appearance?: string;
  nose?: string;
  palate?: string;
  finish?: string;
}

interface TasteProfile {
  body?: number;
  acidity?: number;
  tannin?: number;
  sweetness?: number;
  fruitiness?: number;
  oak?: number;
  primary_flavors?: string[];
  complexity?: number;
  intensity?: number;
}

interface AgingData {
  potential_years: number;
  peak_start_year?: number;
  peak_end_year?: number;
  current_phase?: 'youth' | 'development' | 'peak' | 'decline';
  estimated_quality_now?: string;
  drink_now?: boolean;
}

interface Pairing {
  food: string;
  strength?: number;
  pairing_strength?: number;
  type?: string;
  explanation?: string;
}

export interface WineData {
  name: string;
  vintage?: number | string;
  region?: string;
  appellation?: string;
  subregion?: string;
  domain?: string;
  color?: 'red' | 'white' | 'rose' | 'sparkling' | 'fortified';
  alcohol_percentage?: number;
  price_estimate?: string;
  price_range?: string;
  style?: string;
  classification?: string;
  notes?: string;
  tasting_notes?: TastingNotes;
  taste_profile?: TasteProfile;
  aging?: AgingData;
  grapes?: string[];
  pairings?: Pairing[];
}

type NotificationSeverity = "success" | "error" | "warning" | "info";
type PreviewTab = 'info' | 'aging' | 'tasting' | 'pairing';
type AIProvider = 'openai' | 'mistral';

interface AdvancedOptions {
  temperature: number;
  maxTokens: number;
  enhanceTastingProfile: boolean;
  enhanceAgingData: boolean;
  enhancePairings: boolean;
}

interface APIKeys {
  openai: string;
  mistral: string;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
}

// Type pour les erreurs de Supabase
interface SupabaseError {
  code?: string;
  message: string;
}

export default function AddWinePage() {
  const router = useRouter();

  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState('');
  const [wineData, setWineData] = useState<WineData | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [modelProvider, setModelProvider] = useState<AIProvider>('openai');
  const [apiKeys, setApiKeys] = useState<APIKeys>({ openai: '', mistral: '' });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [previewTabs, setPreviewTabs] = useState<PreviewTab>('info');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    enhanceTastingProfile: true,
    enhanceAgingData: true,
    enhancePairings: true
  });

  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fonction pour afficher les notifications (factorisée)
  const showNotification = useCallback((message: string, severity: NotificationSeverity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  // Vérification de l'authentification (comme dans la page storage.tsx)
  const checkAuth = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error.message);
        setIsAuthenticated(false);
        return false;
      }
      
      if (!data.session) {
        console.log('Aucune session active');
        setIsAuthenticated(false);
        return false;
      }
      
      // Vérification supplémentaire avec getUser
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', userError?.message);
        setIsAuthenticated(false);
        return false;
      }
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Exception lors de la vérification de l\'authentification:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Fonction fetchUserPreferences définie avec useCallback
  const fetchUserPreferences = useCallback(async () => {
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        // Ne pas afficher d'erreur ici pour l'authentification
        console.log("Pas de préférences disponibles - utilisateur non connecté");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key, default_ai_provider, ai_temperature, max_tokens')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefsError) {
        console.error('Erreur Supabase lors de la récupération des préférences:', prefsError);
      }

      if (prefsData) {
        setApiKeys({
          openai: prefsData.openai_api_key || '',
          mistral: prefsData.mistral_api_key || ''
        });

        setModelProvider(prefsData.default_ai_provider === 'mistral' ? 'mistral' : 'openai');

        setAdvancedOptions(prev => ({
          ...prev,
          temperature: prefsData.ai_temperature ?? DEFAULT_TEMPERATURE,
          maxTokens: prefsData.max_tokens ?? DEFAULT_MAX_TOKENS
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      // Ne pas afficher de notification pour éviter de confondre l'utilisateur
    }
  }, [checkAuth]);

  useEffect(() => {
    fetchUserPreferences();
  }, [fetchUserPreferences]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setErrorState("Veuillez entrer le nom d'un vin");
      return;
    }

    setIsLoading(true);
    setErrorState('');
    setWineData(null);

    try {
      const apiKey = apiKeys[modelProvider];
      if (!apiKey) {
        throw new Error(`Clé API ${modelProvider === 'openai' ? 'OpenAI' : 'Mistral'} manquante`);
      }

      const wineAIService = new WineAIService();
      const wineInfo = await wineAIService.getWineInfo(searchTerm, {
        apiProvider: modelProvider,
        apiKey,
        ...advancedOptions
      });

      if (!wineInfo) {
        throw new Error("Impossible d'obtenir les informations sur ce vin");
      }

      setWineData(wineInfo);
      setShowDialog(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la recherche";
      setErrorState(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fonctions d'insertion factorisées ---
  const insertGrapes = useCallback(async (wineId: string, grapes?: string[]) => {
    if (!grapes?.length) return;

    for (const grapeName of grapes) {
      if (!grapeName?.trim()) continue;

      try {
        const { data: existingGrape } = await supabase
          .from('grape')
          .select('id')
          .eq('name', grapeName)
          .maybeSingle();

        let grapeId = existingGrape?.id;

        if (!grapeId) {
          const { data: newGrape, error: grapeError } = await supabase
            .from('grape')
            .insert({ name: grapeName })
            .select('id')
            .single();

          if (grapeError) {
            console.error(`Erreur création cépage ${grapeName}:`, grapeError);
            continue;
          }
          grapeId = newGrape?.id;
        }

        if (grapeId) {
          // Utiliser upsert pour éviter les erreurs de duplication si le lien existe déjà
          const { error: linkError } = await supabase.from('wine_grape').upsert({
            wine_id: wineId,
            grape_id: grapeId,
            percentage: null // Pas de pourcentage fourni par l'IA actuellement
          }, { onConflict: 'wine_id, grape_id' }); // Ignorer en cas de conflit

          if (linkError) {
             console.error(`Erreur lien cépage ${grapeName} (ID: ${grapeId}) au vin ${wineId}:`, linkError);
          }
        }
      } catch (error) {
        console.error(`Erreur non gérée pour le cépage ${grapeName}:`, error);
      }
    }
  }, []);

  const insertTastingProfile = useCallback(async (wineId: string, profile?: TasteProfile) => {
    if (!profile) return;
    try {
      // Utiliser upsert pour mettre à jour si existant ou insérer sinon
      await supabase.from('tasting_profile').upsert({
        wine_id: wineId,
        ...profile,
        ai_generated: true
      }, { onConflict: 'wine_id' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout/màj du profil de dégustation:', error);
    }
  }, []);

  const insertAgingData = useCallback(async (wineId: string, aging?: AgingData) => {
    if (!aging) return;
    try {
      // Utiliser upsert
      await supabase.from('aging_data').upsert({
        wine_id: wineId,
        ...aging,
        ai_generated: true
      }, { onConflict: 'wine_id' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout/màj des données de vieillissement:', error);
    }
  }, []);

  const insertPairings = useCallback(async (wineId: string, userId: string, pairings?: Pairing[]) => {
    if (!pairings?.length) return;
    const pairingsToInsert = pairings
      .filter(p => p?.food) // S'assurer que 'food' existe
      .map(pairing => ({
          wine_id: wineId,
          user_id: userId,
          food: pairing.food,
          pairing_strength: pairing.strength ?? pairing.pairing_strength ?? 3,
          pairing_type: pairing.type || 'classic',
          explanation: pairing.explanation,
          ai_generated: true
      }));

    if (pairingsToInsert.length === 0) return;

    try {
      // Insérer uniquement les nouveaux pairings
      await supabase.from('food_pairing').insert(pairingsToInsert);
    } catch (error) {
       // Ignorer les erreurs de duplication si une contrainte unique existe
       const supabaseError = error as SupabaseError;
       if (supabaseError.code !== '23505') {
           console.error('Erreur lors de l\'ajout des accords mets-vins:', error);
       }
    }
  }, []);

  const insertBottle = useCallback(async (wineId: string, userId: string) => {
    try {
      await supabase.from('bottle').insert({
        wine_id: wineId,
        user_id: userId,
        status: 'in_stock',
        purchase_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
       const supabaseError = error as SupabaseError;
       if (supabaseError.code !== '23505') { // Ignorer si la bouteille existe déjà
         console.error('Erreur lors de l\'ajout de la bouteille:', error);
       }
    }
  }, []);
  // --- Fin des fonctions d'insertion ---


  // Modifié pour utiliser les fonctions factorisées
  const handleAddWine = async () => {
    if (!wineData) {
      showNotification("Aucune donnée de vin à ajouter", "warning");
      return;
    }

    const isAuth = await checkAuth();
    if (!isAuth) {
      showNotification("Veuillez vous connecter pour ajouter un vin", "warning");
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Insertion du vin principal
      const { data: wine, error: wineError } = await supabase
        .from('wine')
        .insert({
          name: wineData.name,
          vintage: wineData.vintage,
          region: wineData.region,
          appellation: wineData.appellation,
          domain: wineData.domain,
          color: wineData.color,
          alcohol_percentage: wineData.alcohol_percentage,
          price_estimate: wineData.price_estimate || wineData.price_range,
          style: wineData.style,
          classification: wineData.classification,
          notes: wineData.notes ?? (wineData.tasting_notes ? JSON.stringify(wineData.tasting_notes) : null),
          user_id: user.id,
          ai_generated: true
        })
        .select('id')
        .single();

      if (wineError) throw wineError;
      if (!wine) throw new Error("La création du vin n'a pas retourné d'ID.");

      const wineId = wine.id;

      // Insertion des données associées en parallèle
      await Promise.all([
        insertGrapes(wineId, wineData.grapes),
        insertTastingProfile(wineId, wineData.taste_profile),
        insertAgingData(wineId, wineData.aging),
        insertPairings(wineId, user.id, wineData.pairings),
        insertBottle(wineId, user.id)
      ]);

      showNotification('Vin ajouté avec succès à votre cave !', 'success');
      setTimeout(() => router.push('/wines'), 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'ajout du vin";
      showNotification(errorMessage, "error");
      console.error('Erreur majeure lors de l\'ajout du vin:', error);
    } finally {
      setIsLoading(false);
      setShowDialog(false);
    }
  };


  const handleSaveApiKeys = async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      showNotification("Veuillez vous connecter pour sauvegarder vos préférences", "warning");
      router.push('/login');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showNotification('Utilisateur non connecté', 'error');
        return;
      }

      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        openai_api_key: apiKeys.openai,
        mistral_api_key: apiKeys.mistral,
        default_ai_provider: modelProvider,
        ai_temperature: advancedOptions.temperature,
        max_tokens: advancedOptions.maxTokens
      }, { onConflict: 'user_id' });

      if (error) throw error;

      setApiKeyDialogOpen(false);
      showNotification('Configuration API mise à jour', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      showNotification(errorMessage, "error");
      console.error('Erreur lors de la sauvegarde des clés API:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Si nous vérifions encore l'authentification, afficher un spinner
  if (isAuthLoading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  // --- Début du rendu JSX ---
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Bouton Retour */}
        <Button
          component={Link}
          href="/wines"
          sx={{ mb: 3, borderRadius: BORDER_RADIUS }}
          startIcon={<ArrowBackIcon />}
        >
          Retour à ma cave
        </Button>

        {/* Section Principale */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: BORDER_RADIUS
          }}
        >
          {/* Titre et Description */}
          <Typography variant="h4" component="h1" gutterBottom fontWeight={500}>
            Ajout de Vin avec IA
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Entrez simplement le nom d&apos;un vin pour récupérer automatiquement ses informations complètes.
            Notre IA analysera et enrichira les données pour vous fournir une fiche détaillée.
          </Typography>

          {/* Options IA */}
          <Box display="flex" alignItems="center" gap={1} my={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setApiKeyDialogOpen(true)}
              startIcon={<TuneIcon />}
              sx={{ borderRadius: BORDER_RADIUS }}
            >
              Configuration IA
            </Button>
            <Chip
              icon={modelProvider === 'openai' ? <AutoAwesomeIcon /> : <FlashOnIcon />}
              label={modelProvider === 'openai' ? 'OpenAI (GPT)' : 'Mistral AI'}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Button
              variant="text"
              size="small"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              endIcon={showAdvancedOptions ? <ClearIcon /> : <TuneIcon />}
            >
              {showAdvancedOptions ? 'Masquer les options' : 'Options avancées'}
            </Button>
          </Box>

          {/* Options Avancées IA (conditionnel) */}
          {showAdvancedOptions && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: BORDER_RADIUS }}>
              <Typography variant="subtitle2" gutterBottom>
                Options avancées d&apos;IA
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
                  <TextField
                    fullWidth
                    label="Température"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 } }}
                    value={advancedOptions.temperature}
                    onChange={(e) =>
                      setAdvancedOptions({
                        ...advancedOptions,
                        temperature: parseFloat(e.target.value) || 0
                      })
                    }
                    helperText="Créativité de l'IA (0.1-1)"
                    size="small"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
                  <TextField
                    fullWidth
                    label="Tokens max"
                    type="number"
                    value={advancedOptions.maxTokens}
                    onChange={(e) =>
                      setAdvancedOptions({
                        ...advancedOptions,
                        maxTokens: parseInt(e.target.value) || 1000
                      })
                    }
                    helperText="Longueur max. réponse"
                    size="small"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={advancedOptions.enhanceTastingProfile}
                          onChange={(e) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              enhanceTastingProfile: e.target.checked
                            })
                          }
                          size="small"
                        />
                      }
                      label="Profil Dégustation"
                       sx={{ flexShrink: 0 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={advancedOptions.enhanceAgingData}
                          onChange={(e) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              enhanceAgingData: e.target.checked
                            })
                          }
                          size="small"
                        />
                      }
                      label="Données Vieillissement"
                       sx={{ flexShrink: 0 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={advancedOptions.enhancePairings}
                          onChange={(e) =>
                            setAdvancedOptions({
                              ...advancedOptions,
                              enhancePairings: e.target.checked
                            })
                          }
                          size="small"
                        />
                      }
                      label="Accords Mets-Vins"
                       sx={{ flexShrink: 0 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          <Divider sx={{ mb: 4 }} />

          {/* Barre de Recherche */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 700 }}>
            <TextField
              fullWidth
              label="Rechercher un vin"
              placeholder="Ex: Château Margaux 2015, Dom Pérignon 2008..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: BORDER_RADIUS
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim() || !apiKeys[modelProvider]}
              sx={{
                alignSelf: 'flex-start',
                px: 4,
                py: 1.5,
                borderRadius: BORDER_RADIUS
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Rechercher'}
            </Button>
             {/* Affichage de l'état d'erreur */}
             {errorState && (
                 <Alert severity="error" sx={{ mt: 2, borderRadius: BORDER_RADIUS }}>
                     {errorState}
                 </Alert>
             )}
          </Box>

          {/* Section "Comment ça marche" */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Comment ça marche
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {/* Carte 1 */}
              <Card variant="outlined" sx={{ flex: '1 1 300px', height: '100%', borderRadius: BORDER_RADIUS }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SearchIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Recherchez un vin</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Entrez le nom du vin et son millésime. Notre IA peut identifier la plupart des vins connus, mais plus vous fournissez de détails, plus les résultats seront précis.
                  </Typography>
                </CardContent>
              </Card>
              
              {/* Carte 2 */}
              <Card variant="outlined" sx={{ flex: '1 1 300px', height: '100%', borderRadius: BORDER_RADIUS }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">IA en action</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Notre système interroge l&apos;IA pour trouver les informations détaillées sur votre vin, incluant profil de dégustation, potentiel de vieillissement et accords mets-vins.
                  </Typography>
                </CardContent>
              </Card>
              
              {/* Carte 3 */}
              <Card variant="outlined" sx={{ flex: '1 1 300px', height: '100%', borderRadius: BORDER_RADIUS }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AddCircleOutlineIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Ajout à votre cave</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Vérifiez les informations puis ajoutez le vin à votre collection. Toutes les données sont automatiquement sauvegardées et peuvent être modifiées ultérieurement.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Paper>

        {/* --- Dialogues --- */}
{/* Dialogue de prévisualisation des données */}
<Dialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          fullWidth
          maxWidth="lg"
          PaperProps={{ sx: { borderRadius: BORDER_RADIUS } }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" component="div">
                Fiche détaillée du vin
              </Typography>
              <Button onClick={() => setShowDialog(false)} color="inherit" sx={{ minWidth: 'auto', p: 1 }}>
                <ClearIcon />
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {wineData && (
              <>
                {/* En-tête du vin dans le dialogue */}
                <Box sx={{ mb: 3 }}>
                   <Typography variant="h5" gutterBottom>
                      {wineData.name} {wineData.vintage && `(${wineData.vintage})`}
                   </Typography>
                   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                     <Chip
                       icon={<WineBarIcon />}
                       label={wineData.color ? wineData.color.charAt(0).toUpperCase() + wineData.color.slice(1) : 'Inconnu'}
                       color="primary"
                       sx={{
                          bgcolor:
                            wineData.color === 'red' ? '#9A2A2A' :
                            wineData.color === 'white' ? '#DAA520' :
                            wineData.color === 'rose' ? '#FF69B4' :
                            wineData.color === 'sparkling' ? '#87CEEB' :
                            wineData.color === 'fortified' ? '#8B4513' : '#666',
                          color: 'white'
                       }}
                     />
                     {wineData.vintage && (<Chip icon={<CalendarMonthIcon />} label={`Millésime ${wineData.vintage}`} variant="outlined" />)}
                     {wineData.region && (<Chip icon={<LocationOnIcon />} label={wineData.region} variant="outlined" />)}
                     {wineData.alcohol_percentage && (<Chip icon={<PercentIcon />} label={`${wineData.alcohol_percentage}% vol`} variant="outlined" />)}
                     {wineData.domain && (<Chip icon={<PersonIcon />} label={wineData.domain} variant="outlined" />)}
                   </Box>
                   {wineData.grapes && wineData.grapes.length > 0 && (
                     <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                       <Typography variant="subtitle2" mr={1}>Cépages:</Typography>
                       {wineData.grapes.filter(g => g).map((grape, index) => (
                         <Chip key={index} icon={<GrassIcon />} label={grape} size="small" variant="outlined" color="success" />
                       ))}
                     </Box>
                   )}
                </Box>

                {/* Onglets du dialogue */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                   <Box sx={{ display: 'flex', overflow: 'auto' }}>
                      {(['info', 'aging', 'tasting', 'pairing'] as const).map((tab) => (
                         <Button
                            key={tab}
                            onClick={() => setPreviewTabs(tab)}
                            sx={{
                               borderBottom: previewTabs === tab ? 2 : 0,
                               borderColor: 'primary.main',
                               borderRadius: 0,
                               px: { xs: 2, sm: 4 },
                               py: 1,
                               minWidth: 'auto',
                               flexShrink: 0
                            }}
                         >
                            {tab === 'info' ? 'Infos' : tab === 'aging' ? 'Vieillissement' : tab === 'tasting' ? 'Dégustation' : 'Accords'}
                         </Button>
                      ))}
                   </Box>
                </Box>

                {/* Contenu des onglets */}
                <Box sx={{ py: 2 }}>
                   {previewTabs === 'info' && (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        {/* Section Infos Générales */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                           <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS }}>
                              <Typography variant="subtitle1" gutterBottom>Informations générales</Typography>
                              <Divider sx={{ mb: 2 }} />
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                {[{label: 'Nom', value: wineData.name},
                                 {label: 'Millésime', value: wineData.vintage},
                                 {label: 'Couleur', value: wineData.color?.charAt(0).toUpperCase() + wineData.color?.slice(1)},
                                 {label: 'Degré d\'alcool', value: wineData.alcohol_percentage ? `${wineData.alcohol_percentage}%` : null},
                                 {label: 'Style', value: wineData.style},
                                 {label: 'Classification', value: wineData.classification}].map(item => item.value ? (
                                    <Box sx={{ width: { xs: '100%', sm: '45%' } }} key={item.label}>
                                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                      <Typography variant="body1">{item.value}</Typography>
                                    </Box>
                                 ) : null )}
                              </Box>
                           </Paper>
                        </Box>
                        {/* Section Origine */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS }}>
                               <Typography variant="subtitle1" gutterBottom>Origine</Typography>
                               <Divider sx={{ mb: 2 }} />
                               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                 {[{label: 'Région', value: wineData.region},
                                  {label: 'Sous-région', value: wineData.subregion},
                                  {label: 'Appellation', value: wineData.appellation},
                                  {label: 'Domaine', value: wineData.domain},
                                  {label: 'Prix estimé', value: wineData.price_estimate || wineData.price_range}].map(item => item.value ? (
                                     <Box sx={{ width: { xs: '100%', sm: '45%' } }} key={item.label}>
                                       <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                       <Typography variant="body1">{item.value}</Typography>
                                     </Box>
                                  ) : null )}
                               </Box>
                            </Paper>
                        </Box>
                      </Box>
                   )}
                   {previewTabs === 'info' && (
                      <Box sx={{ mt: 3 }}>
                        {/* Section Notes de Dégustation */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS }}>
                           <Typography variant="subtitle1" gutterBottom>Notes de dégustation (IA)</Typography>
                           <Divider sx={{ mb: 2 }} />
                           {wineData.tasting_notes ? (
                             <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                               <Box sx={{ width: { xs: '100%', md: '33.333%' } }}>
                                 <Typography variant="body2" color="text.secondary" gutterBottom>Robe</Typography>
                                 <Typography variant="body1" paragraph>{wineData.tasting_notes.appearance || '-'}</Typography>
                               </Box>
                               <Box sx={{ width: { xs: '100%', md: '33.333%' } }}>
                                 <Typography variant="body2" color="text.secondary" gutterBottom>Nez</Typography>
                                 <Typography variant="body1" paragraph>{wineData.tasting_notes.nose || '-'}</Typography>
                               </Box>
                               <Box sx={{ width: { xs: '100%', md: '33.333%' } }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>Bouche & Finale</Typography>
                                  <Typography variant="body1" paragraph>
                                     {(wineData.tasting_notes.palate || '') + (wineData.tasting_notes.finish ? ` - ${wineData.tasting_notes.finish}` : '') || '-'}
                                  </Typography>
                               </Box>
                             </Box>
                           ) : (
                             <Typography variant="body1">{wineData.notes || 'Aucune note de dégustation disponible'}</Typography>
                           )}
                        </Paper>
                      </Box>
                   )}
                   {previewTabs === 'aging' && (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                         <Box sx={{ width: { xs: '100%', md: '58.333%' } }}>
                            <WineAgingCurve wine={wineData} height={300} showDetails={true} />
                         </Box>
                         <Box sx={{ width: { xs: '100%', md: '41.667%' } }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS, height: '100%' }}>
                               <Typography variant="subtitle1" gutterBottom>Potentiel de vieillissement</Typography>
                               <Divider sx={{ mb: 2 }} />
                               {wineData.aging ? (
                                  <Box>
                                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                        {[{label: 'Potentiel total', value: wineData.aging.potential_years ? `${wineData.aging.potential_years} ans` : null},
                                         {label: 'Phase actuelle', value: wineData.aging.current_phase ? {
                                             'youth': 'Jeunesse', 'development': 'Maturité', 'peak': 'Apogée', 'decline': 'Déclin'
                                         }[wineData.aging.current_phase] : null},
                                         {label: 'Début d&apos;apogée', value: wineData.aging.peak_start_year},
                                         {label: 'Fin d&apos;apogée', value: wineData.aging.peak_end_year}].map(item => item.value ? (
                                            <Box sx={{ width: { xs: '100%', sm: '45%' } }} key={item.label}>
                                               <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                               <Typography variant="body1">{item.value}</Typography>
                                            </Box>
                                         ): null)}
                                     </Box>
                                     <Box sx={{ mt: 3, textAlign: 'center' }}>
                                        <Chip
                                           color={wineData.aging.drink_now ? 'success' : 'info'}
                                           label={wineData.aging.drink_now ? 'Prêt à boire' : "Attendre"}
                                           sx={{ borderRadius: 10 }}
                                           size="small"
                                        />
                                     </Box>
                                     <Box sx={{ mt: 3 }}>
                                        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: BORDER_RADIUS }}>
                                            <Typography variant="body2">Estimations basées sur l&apos;IA et des conditions optimales.</Typography>
                                        </Alert>
                                     </Box>
                                  </Box>
                               ) : (
                                  <Typography variant="body1" color="text.secondary" align="center">Données non disponibles</Typography>
                               )}
                            </Paper>
                         </Box>
                      </Box>
                   )}
                   {previewTabs === 'tasting' && (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                         <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <TastingRadarChart wine={wineData} height={300} showTitle={true} />
                         </Box>
                         <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS }}>
                               <Typography variant="subtitle1" gutterBottom>Caractéristiques organoleptiques</Typography>
                               <Divider sx={{ mb: 2 }} />
                               {wineData.taste_profile ? (
                                  <Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                      {[{label: 'Corps', value: wineData.taste_profile.body},
                                       {label: 'Acidité', value: wineData.taste_profile.acidity},
                                       {label: 'Tanins', value: wineData.taste_profile.tannin},
                                       {label: 'Douceur', value: wineData.taste_profile.sweetness},
                                       {label: 'Fruité', value: wineData.taste_profile.fruitiness},
                                       {label: 'Boisé', value: wineData.taste_profile.oak}].map(item => item.value ? (
                                          <Box sx={{ width: { xs: '100%', sm: '45%' } }} key={item.label}>
                                             <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                             <Rating value={item.value} readOnly max={5} size="small" />
                                          </Box>
                                       ): null)}
                                    </Box>
                                    {wineData.taste_profile.primary_flavors && wineData.taste_profile.primary_flavors.length > 0 && (
                                       <Box sx={{ mt: 2 }}>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>Arômes dominants</Typography>
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {wineData.taste_profile.primary_flavors.filter(f => f).map((flavor, index) => (
                                              <Chip key={index} label={flavor} size="small" variant="outlined" />
                                            ))}
                                          </Box>
                                       </Box>
                                    )}
                                  </Box>
                               ) : (
                                  <Typography variant="body1" color="text.secondary" align="center">Données non disponibles</Typography>
                               )}
                            </Paper>
                         </Box>
                      </Box>
                   )}
                   {previewTabs === 'pairing' && (
                     <div>
                        <Typography variant="subtitle1" gutterBottom>Suggestions d&apos;accords mets-vins (IA)</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {wineData?.pairings && wineData.pairings.length > 0 ? (
                           wineData.pairings.map((pairing, index) => (
                              <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: BORDER_RADIUS }}>
                                 <Typography variant="body1" fontWeight="medium">{pairing.food}</Typography>
                                 {pairing.explanation && <Typography variant="body2" color="text.secondary">{pairing.explanation}</Typography>}
                                 <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    {pairing.type && <Chip label={pairing.type} size="small" variant="outlined" />}
                                    {(pairing.strength ?? pairing.pairing_strength) &&
                                      <Rating value={pairing.strength ?? pairing.pairing_strength} readOnly max={5} size="small" />
                                    }
                                 </Box>
                              </Paper>
                           ))
                        ) : (
                           <Typography variant="body1" color="text.secondary" align="center">Aucune suggestion d&apos;accord disponible.</Typography>
                        )}
                     </div>
                   )}
                </Box>

                 {/* Info sur les données IA */}
                 <Box sx={{ mt: 2 }}>
                    <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: BORDER_RADIUS }}>
                       <Typography variant="body2">
                          Informations générées par IA. Vous pourrez modifier ces données après l&apos;ajout du vin à votre cave.
                       </Typography>
                    </Alert>
                 </Box>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowDialog(false)} variant="outlined" sx={{ borderRadius: BORDER_RADIUS }}>
              Annuler
            </Button>
            <Button
              onClick={handleAddWine}
              variant="contained"
              disabled={isLoading || !wineData || !isAuthenticated}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
              sx={{ borderRadius: BORDER_RADIUS }}
            >
              {isAuthenticated ? 'Ajouter à ma cave' : 'Connexion requise'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialogue de configuration des API */}
        <Dialog
          open={apiKeyDialogOpen}
          onClose={() => setApiKeyDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: BORDER_RADIUS } }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" component="div">Configuration des API IA</Typography>
              <Button onClick={() => setApiKeyDialogOpen(false)} color="inherit" sx={{ minWidth: 'auto', p: 1 }}>
                <ClearIcon />
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
              Configurez les clés API pour les différents fournisseurs. Elles seront stockées de manière sécurisée.
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Fournisseur d&apos;IA par défaut</InputLabel>
              <Select
                value={modelProvider}
                onChange={(e) => setModelProvider(e.target.value as 'openai' | 'mistral')}
                sx={{ borderRadius: BORDER_RADIUS }}
                label="Fournisseur d'IA par défaut"
              >
                <MenuItem value="openai">OpenAI (GPT)</MenuItem>
                <MenuItem value="mistral">Mistral AI</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Clé API OpenAI"
              value={apiKeys.openai}
              onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
              margin="normal"
              type="password"
              helperText="Requise si OpenAI est sélectionné"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: BORDER_RADIUS } }}
            />
            <TextField
              fullWidth
              label="Clé API Mistral"
              value={apiKeys.mistral}
              onChange={(e) => setApiKeys({ ...apiKeys, mistral: e.target.value })}
              margin="normal"
              type="password"
              helperText="Requise si Mistral AI est sélectionné"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: BORDER_RADIUS } }}
            />
            <Alert severity="info" sx={{ mt: 2, borderRadius: BORDER_RADIUS }}>
              Si vous rencontrez des erreurs de quota, essayez l&apos;autre fournisseur. Obtenez vos clés sur{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI</a> ou{' '}
              <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer">Mistral AI</a>.
            </Alert>
            
            {/* Message pour utilisateur non connecté */}
            {!isAuthenticated && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: BORDER_RADIUS }}>
                <Typography variant="body2">
                  Vous n&apos;êtes pas connecté. Vous devrez vous connecter pour sauvegarder vos préférences.
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApiKeyDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleSaveApiKeys} 
              variant="contained"
              disabled={!isAuthenticated}
            >
              {isAuthenticated ? 'Sauvegarder' : 'Connexion requise'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={notification.severity}
            variant="filled"
            onClose={() => setNotification({ ...notification, open: false })}
            sx={{ borderRadius: BORDER_RADIUS }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Alerte pour utilisateur non connecté */}
        {!isAuthenticated && (
          <Snackbar
            open={true}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              severity="info"
              variant="filled"
              sx={{ borderRadius: BORDER_RADIUS, width: '100%', maxWidth: '600px' }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  component={Link}
                  href="/login"
                >
                  Se connecter
                </Button>
              }
            >
              Vous n&apos;êtes pas connecté. Connectez-vous pour pouvoir ajouter des vins à votre cave.
            </Alert>
          </Snackbar>
        )}
      </Container>
    </>
  );
}