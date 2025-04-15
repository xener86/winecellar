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
import WineAgingCurve from '../components/WineAgingCurve'; // Assurez-vous que ce composant existe
import TastingRadarChart from '../components/TastingRadarChart'; // Assurez-vous que ce composant existe
// Import direct de l'instance préinitialisée - VÉRIFIEZ CE CHEMIN
import { supabase } from '../utils/supabase';
// VÉRIFIEZ CE CHEMIN - C'est une cause d'erreur fréquente si incorrect
import WineAIService from '../services/WineAIService';

// Constantes
const BORDER_RADIUS = 2;
const DEFAULT_MAX_TOKENS = 1000;
const DEFAULT_TEMPERATURE = 0.7;
const VALID_WINE_COLORS = ['red', 'white', 'rose', 'sparkling', 'fortified'] as const;
type ValidWineColor = typeof VALID_WINE_COLORS[number];


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
  potential_years?: number; // Rendu optionnel car l'IA ne le fournit pas toujours
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

// Interface WineData (utilisée pour l'état interne et l'API)
// Note: vintage peut être string ou null initialement, mais adaptWineData le force en number
export interface WineData {
  name: string;
  vintage?: number | string | null; // Permissif ici pour l'API
  region?: string | null;
  appellation?: string | null;
  subregion?: string | null;
  domain?: string | null;
  color?: string | null; // Permissif ici pour l'API
  alcohol_percentage?: number | null;
  price_estimate?: string | null;
  price_range?: string | null;
  style?: string | null;
  classification?: string | null;
  notes?: string | null;
  tasting_notes?: TastingNotes | null;
  taste_profile?: TasteProfile | null;
  aging?: AgingData | null;
  grapes?: string[] | null;
  pairings?: Pairing[] | null;
}

// Type pour les données après adaptation (vintage est number)
type AdaptedWineData = Omit<WineData, 'vintage' | 'color'> & {
    vintage: number; // Garanti d'être un nombre après adaptation
    color?: string | null; // Garde la flexibilité pour la couleur avant passage aux enfants
};


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
  // L'état principal utilise WineData (permissif), mais sera adapté avant usage si nécessaire
  const [wineData, setWineData] = useState<AdaptedWineData | null>(null);
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

  // Fonction pour afficher les notifications
  const showNotification = useCallback((message: string, severity: NotificationSeverity) => {
    setNotification({ open: true, message, severity });
  }, []);

  // Vérification de l'authentification
  const checkAuth = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return false; // Pas de session

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return false; // Pas d'utilisateur associé

      return true; // Authentifié
    } catch (error) {
      console.error('Erreur vérification auth:', error instanceof Error ? error.message : error);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // --- Fonctions de récupération et de normalisation ---

  // Récupération des préférences utilisateur
  const fetchUserPreferences = useCallback(async () => {
    const isAuth = await checkAuth();
     // Mettre à jour l'état d'authentification ici aussi
    setIsAuthenticated(isAuth);
    if (!isAuth) {
      console.log("Utilisateur non connecté, pas de préférences chargées.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key, default_ai_provider, ai_temperature, max_tokens')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefsError) {
        console.error('Erreur Supabase (récup préférences):', prefsError.message);
        // Ne pas forcément notifier l'utilisateur pour ça
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
      console.error('Erreur récupération préférences:', error instanceof Error ? error.message : error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendance checkAuth retirée pour éviter boucle potentielle si checkAuth change souvent

  useEffect(() => {
    // Exécute checkAuth une fois au montage pour l'état initial
    checkAuth().then(isAuth => setIsAuthenticated(isAuth));
    // Récupère les préférences ensuite
    fetchUserPreferences();
  }, [fetchUserPreferences, checkAuth]); // checkAuth est stable grâce à useCallback


  // Fonction pour normaliser la couleur du vin vers les types attendus ou null
  function normalizeWineColor(color: string | null | undefined): ValidWineColor | null {
    if (!color) return null;
    const lowerColor = color.toLowerCase().trim();

    if ((VALID_WINE_COLORS as readonly string[]).includes(lowerColor)) {
      return lowerColor as ValidWineColor;
    }

    // Mappages français -> anglais (simplifié)
    if (lowerColor.includes('rouge')) return 'red';
    if (lowerColor.includes('blanc')) return 'white';
    if (lowerColor.includes('rosé')) return 'rose';
    if (lowerColor.includes('mousseux') || lowerColor.includes('champagne') || lowerColor.includes('pétillant')) return 'sparkling';
    if (lowerColor.includes('fortifié') || lowerColor.includes('porto') || lowerColor.includes('xérès')) return 'fortified';

    return null; // Retourne null si non reconnu comme une couleur valide
  }

  // Fonction pour adapter les données reçues (surtout vintage)
  const adaptWineData = (data: WineData): AdaptedWineData => {
    let finalVintage: number;
    const currentYear = new Date().getFullYear();

    if (typeof data.vintage === 'number') {
      finalVintage = data.vintage;
    } else if (typeof data.vintage === 'string') {
      finalVintage = parseInt(data.vintage, 10);
      if (isNaN(finalVintage) || finalVintage < 1000 || finalVintage > currentYear + 5) {
        finalVintage = currentYear;
      }
    } else {
      finalVintage = currentYear; // Default pour null/undefined
    }

    // Retourne un objet où 'vintage' est garanti d'être un nombre
    // Les autres champs sont conservés tels quels depuis data
    return {
      ...data,
      vintage: finalVintage
    };
  };

  // --- Gestionnaires d'événements ---

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setErrorState("Veuillez entrer le nom d'un vin");
      return;
    }

    const apiKey = apiKeys[modelProvider];
    if (!apiKey) {
      setErrorState(`Clé API ${modelProvider === 'openai' ? 'OpenAI' : 'Mistral'} manquante. Veuillez la configurer.`);
      showNotification(`Clé API ${modelProvider === 'openai' ? 'OpenAI' : 'Mistral'} manquante`, "warning");
      setApiKeyDialogOpen(true); // Ouvre le dialogue de configuration
      return;
    }

    setIsLoading(true);
    setErrorState('');
    setWineData(null);

    try {
      const wineAIService = new WineAIService();
      const wineInfo = await wineAIService.getWineInfo(searchTerm, {
        apiProvider: modelProvider,
        apiKey,
        ...advancedOptions
      });

      if (!wineInfo) {
        throw new Error("Impossible d'obtenir les informations sur ce vin via l'IA.");
      }

      // Adapter les données (surtout vintage en nombre)
      const adaptedData = adaptWineData(wineInfo as unknown as WineData);

      setWineData(adaptedData); // Met à jour l'état avec les données adaptées
      setShowDialog(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la recherche";
      console.error("Erreur recherche IA:", error);
      setErrorState(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fonctions d'insertion (utilisent useCallback pour la stabilité) ---
  const insertGrapes = useCallback(async (wineId: string, grapes?: string[] | null) => {
    if (!grapes?.length) return;
    for (const grapeName of grapes) {
      if (!grapeName?.trim()) continue;
      try {
        const { data: existingGrape, error: selectError } = await supabase.from('grape').select('id').eq('name', grapeName).maybeSingle();
        if (selectError) throw selectError;

        let grapeId = existingGrape?.id;
        if (!grapeId) {
          const { data: newGrape, error: insertError } = await supabase.from('grape').insert({ name: grapeName }).select('id').single();
          if (insertError) throw insertError;
          grapeId = newGrape?.id;
        }

        if (grapeId) {
          const { error: linkError } = await supabase.from('wine_grape').upsert({ wine_id: wineId, grape_id: grapeId, percentage: null }, { onConflict: 'wine_id, grape_id' });
          if (linkError) console.warn(`Erreur lien cépage ${grapeName} (ignorée si duplication):`, linkError.message);
        }
      } catch (error) {
        console.error(`Erreur traitement cépage ${grapeName}:`, error instanceof Error ? error.message : error);
        // Ne pas bloquer tout le processus pour un cépage
      }
    }
  }, []);

  const insertTastingProfile = useCallback(async (wineId: string, profile?: TasteProfile | null) => {
    if (!profile) return;
    try {
      await supabase.from('tasting_profile').upsert({ wine_id: wineId, ...profile, ai_generated: true }, { onConflict: 'wine_id' });
    } catch (error) {
      console.error('Erreur sauvegarde profil dégustation:', error instanceof Error ? error.message : error);
    }
  }, []);

  const insertAgingData = useCallback(async (wineId: string, aging?: AgingData | null) => {
    if (!aging) return;
    try {
      await supabase.from('aging_data').upsert({ wine_id: wineId, ...aging, ai_generated: true }, { onConflict: 'wine_id' });
    } catch (error) {
      console.error('Erreur sauvegarde données vieillissement:', error instanceof Error ? error.message : error);
    }
  }, []);

  const insertPairings = useCallback(async (wineId: string, userId: string, pairings?: Pairing[] | null) => {
    if (!pairings?.length) return;
    const pairingsToInsert = pairings
      .filter(p => p?.food)
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
      // Tente d'insérer, ignore les conflits (suppose une contrainte unique sur wine_id, user_id, food)
      const { error } = await supabase.from('food_pairing').insert(pairingsToInsert);
       if (error && error.code !== '23505') { // 23505 = violation de contrainte unique
           throw error;
       }
    } catch (error) {
       console.error('Erreur sauvegarde accords:', error instanceof Error ? error.message : error);
    }
  }, []);

  const insertBottle = useCallback(async (wineId: string, userId: string) => {
    try {
      // Tente d'insérer, ignore si elle existe déjà (suppose contrainte unique sur wine_id, user_id ?)
      // Ajustez la logique si nécessaire (ex: incrémenter quantité)
      const { error } = await supabase.from('bottle').insert({
        wine_id: wineId,
        user_id: userId,
        status: 'in_stock',
        quantity: 1, // Ajout quantité
        purchase_date: new Date().toISOString().split('T')[0]
      });
      if (error && error.code !== '23505') {
        throw error;
      } else if (error?.code === '23505'){
         console.log(`Bouteille pour vin ${wineId} existe déjà pour cet utilisateur.`);
         // Optionnel : Mettre à jour la quantité ici si la bouteille existe déjà
      }
    } catch (error) {
       console.error('Erreur ajout bouteille:', error instanceof Error ? error.message : error);
    }
  }, []);
  // --- Fin des fonctions d'insertion ---

  // Ajout du vin à la BDD
  const handleAddWine = async () => {
    if (!wineData) {
      showNotification("Aucune donnée de vin à ajouter", "warning");
      return;
    }

    // Re-vérifier l'auth au cas où la session a expiré
    const isAuth = await checkAuth();
    if (!isAuth) {
      showNotification("Veuillez vous connecter pour ajouter un vin", "warning");
      router.push('/login');
      return;
    }
    setIsAuthenticated(true); // Assure que l'état est à jour

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non trouvé.");

      // 1. Insertion du vin principal
      const { data: wine, error: wineError } = await supabase
        .from('wine')
        .insert({
          name: wineData.name,
          vintage: wineData.vintage, // C'est maintenant un nombre
          region: wineData.region,
          appellation: wineData.appellation,
          domain: wineData.domain,
          color: normalizeWineColor(wineData.color ?? ''), // Normalise la couleur pour la BDD
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
      if (!wine?.id) throw new Error("La création du vin n'a pas retourné d'ID.");

      const wineId = wine.id;

      // 2. Insertions associées en parallèle
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
      const supabaseError = error as SupabaseError;
      let errorMessage = "Erreur lors de l'ajout du vin";
      if (supabaseError?.message) {
          errorMessage = `Erreur Supabase: ${supabaseError.message}`;
      } else if (error instanceof Error) {
          errorMessage = error.message;
      }
      showNotification(errorMessage, "error");
      console.error('Erreur majeure ajout vin:', error);
    } finally {
      setIsLoading(false);
      setShowDialog(false); // Ferme le dialogue même en cas d'erreur
    }
  };

  // Sauvegarde des clés API
  const handleSaveApiKeys = async () => {
    if (!isAuthenticated) {
      showNotification("Veuillez vous connecter pour sauvegarder vos préférences", "warning");
      router.push('/login');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

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
      const errorMessage = error instanceof Error ? error.message : "Erreur sauvegarde configuration API";
      showNotification(errorMessage, "error");
      console.error('Erreur sauvegarde clés API:', error);
    }
  };

  // Gestion touche Entrée pour recherche
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // --- Rendu JSX ---

  // Affichage chargement initial (vérification auth)
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

  // Rendu principal
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
          sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: BORDER_RADIUS }}
        >
          {/* Titre et Description */}
          <Typography variant="h4" component="h1" gutterBottom fontWeight={500}>
            Ajout de Vin avec IA
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Entrez simplement le nom d&apos;un vin pour récupérer automatiquement ses informations.
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
              <Typography variant="subtitle2" gutterBottom>Options avancées d&apos;IA</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {/* Temperature */}
                <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
                  <TextField
                    fullWidth label="Température" type="number"
                    InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 } }}
                    value={advancedOptions.temperature}
                    onChange={(e) => setAdvancedOptions({ ...advancedOptions, temperature: parseFloat(e.target.value) || 0 })}
                    helperText="Créativité (0.1-1)" size="small"
                  />
                </Box>
                {/* Max Tokens */}
                <Box sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
                  <TextField
                    fullWidth label="Tokens max" type="number"
                    value={advancedOptions.maxTokens}
                    onChange={(e) => setAdvancedOptions({ ...advancedOptions, maxTokens: parseInt(e.target.value) || 1000 })}
                    helperText="Longueur max. réponse" size="small"
                  />
                </Box>
                {/* Switches */}
                <Box sx={{ width: { xs: '100%', md: '48%' }, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                    <FormControlLabel control={<Switch size="small" checked={advancedOptions.enhanceTastingProfile} onChange={(e) => setAdvancedOptions({ ...advancedOptions, enhanceTastingProfile: e.target.checked })} />} label="Profil Dégust." sx={{ flexShrink: 0 }}/>
                    <FormControlLabel control={<Switch size="small" checked={advancedOptions.enhanceAgingData} onChange={(e) => setAdvancedOptions({ ...advancedOptions, enhanceAgingData: e.target.checked })} />} label="Vieillissem." sx={{ flexShrink: 0 }}/>
                    <FormControlLabel control={<Switch size="small" checked={advancedOptions.enhancePairings} onChange={(e) => setAdvancedOptions({ ...advancedOptions, enhancePairings: e.target.checked })} />} label="Accords" sx={{ flexShrink: 0 }}/>
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
              InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: BORDER_RADIUS } }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()} // On permet la recherche même si clé API manque (géré dans handleSearch)
              sx={{ alignSelf: 'flex-start', px: 4, py: 1.5, borderRadius: BORDER_RADIUS }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Rechercher'}
            </Button>
             {/* Affichage de l'état d'erreur */}
             {errorState && (
                 <Alert severity="error" sx={{ mt: 2, borderRadius: BORDER_RADIUS }}>{errorState}</Alert>
             )}
          </Box>

          {/* Section "Comment ça marche" */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Comment ça marche</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Card variant="outlined" sx={{ flex: '1 1 300px', height: '100%', borderRadius: BORDER_RADIUS }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><SearchIcon color="primary" sx={{ mr: 1 }} /><Typography variant="subtitle1">Recherchez</Typography></Box>
                  <Typography variant="body2" color="text.secondary">Entrez le nom et millésime. Plus de détails = meilleurs résultats.</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: '1 1 300px', height: '100%', borderRadius: BORDER_RADIUS }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><AutoAwesomeIcon color="primary" sx={{ mr: 1 }} /><Typography variant="subtitle1">IA en action</Typography></Box>
                  <Typography variant="body2" color="text.secondary">L&apos;IA trouve les infos : dégustation, vieillissement, accords.</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: '1 1 300px', height: '100%', borderRadius: BORDER_RADIUS }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><AddCircleOutlineIcon color="primary" sx={{ mr: 1 }} /><Typography variant="subtitle1">Ajoutez</Typography></Box>
                  <Typography variant="body2" color="text.secondary">Vérifiez et ajoutez à votre cave. Modifiable plus tard.</Typography>
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
              <Typography variant="h6" component="div">Fiche détaillée du vin</Typography>
              <Button onClick={() => setShowDialog(false)} color="inherit" sx={{ minWidth: 'auto', p: 1 }}><ClearIcon /></Button>
            </Box>
          </DialogTitle>

          {/* === CONTENU DIALOGUE (ASSUREZ-VOUS QUE LA BALISE FERMANTE EST BIEN LÀ) === */}
          <DialogContent dividers>
            {wineData && (
              <>
                {/* En-tête du vin */}
                <Box sx={{ mb: 3 }}>
                   <Typography variant="h5" gutterBottom>{wineData.name} ({wineData.vintage})</Typography> {/* vintage est number ici */}
                   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {/* Chip Couleur */}
                      {wineData.color && (
                         <Chip
                           icon={<WineBarIcon />}
                           label={wineData.color.charAt(0).toUpperCase() + wineData.color.slice(1)}
                           color="primary" // Garder primary ou ajuster selon couleur ?
                           sx={{
                            bgcolor: (() => {
                              const colorMap = { red: '#9A2A2A', white: '#DAA520', rose: '#FF69B4', sparkling: '#87CEEB', fortified: '#8B4513' };
                              const normalizedColorKey = normalizeWineColor(wineData.color);
                              // Utilise la couleur de la map si la clé est valide, sinon la couleur par défaut
                              return normalizedColorKey ? colorMap[normalizedColorKey] : '#666';
                            })(),
                              color: 'white'
                           }}
                         />
                      )}
                      {/* Autres Chips */}
                      <Chip icon={<CalendarMonthIcon />} label={`Millésime ${wineData.vintage}`} variant="outlined" />
                      {wineData.region && (<Chip icon={<LocationOnIcon />} label={wineData.region} variant="outlined" />)}
                      {wineData.alcohol_percentage && (<Chip icon={<PercentIcon />} label={`${wineData.alcohol_percentage}% vol`} variant="outlined" />)}
                      {wineData.domain && (<Chip icon={<PersonIcon />} label={wineData.domain} variant="outlined" />)}
                   </Box>
                   {/* Cépages */}
                   {wineData.grapes && wineData.grapes.length > 0 && (
                     <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                       <Typography variant="subtitle2" mr={1}>Cépages:</Typography>
                       {wineData.grapes.filter(g => g).map((grape, index) => (
                         <Chip key={index} icon={<GrassIcon />} label={grape} size="small" variant="outlined" color="success" />
                       ))}
                     </Box>
                   )}
                </Box>

                {/* Onglets */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                   <Box sx={{ display: 'flex', overflow: 'auto' }}>
                      {(['info', 'aging', 'tasting', 'pairing'] as const).map((tab) => (
                         <Button key={tab} onClick={() => setPreviewTabs(tab)}
                           sx={{ borderBottom: previewTabs === tab ? 2 : 0, borderColor: 'primary.main', borderRadius: 0, px: { xs: 2, sm: 4 }, py: 1, minWidth: 'auto', flexShrink: 0 }}>
                           {tab === 'info' ? 'Infos' : tab === 'aging' ? 'Vieillissement' : tab === 'tasting' ? 'Dégustation' : 'Accords'}
                         </Button>
                      ))}
                   </Box>
                </Box>

                {/* Contenu des onglets */}
                <Box sx={{ py: 2 }}>
                   {/* --- Onglet Info --- */}
                   {previewTabs === 'info' && (
                     <>
                       <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                         {/* Infos Générales */}
                         <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS }}>
                               <Typography variant="subtitle1" gutterBottom>Informations générales</Typography>
                               <Divider sx={{ mb: 2 }} />
                               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                 {[{label: 'Nom', value: wineData.name}, {label: 'Millésime', value: wineData.vintage}, {label: 'Couleur', value: wineData.color ? wineData.color.charAt(0).toUpperCase() + wineData.color.slice(1) : null}, {label: 'Degré d\'alcool', value: wineData.alcohol_percentage ? `${wineData.alcohol_percentage}%` : null}, {label: 'Style', value: wineData.style}, {label: 'Classification', value: wineData.classification}].map(item => item.value ? (<Box sx={{ width: { xs: '100%', sm: '45%' } }} key={item.label}><Typography variant="body2" color="text.secondary">{item.label}</Typography><Typography variant="body1">{item.value}</Typography></Box>) : null )}
                               </Box>
                            </Paper>
                         </Box>
                         {/* Origine */}
                         <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                             <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS }}>
                                <Typography variant="subtitle1" gutterBottom>Origine</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                  {[{label: 'Région', value: wineData.region}, {label: 'Sous-région', value: wineData.subregion}, {label: 'Appellation', value: wineData.appellation}, {label: 'Domaine', value: wineData.domain}, {label: 'Prix estimé', value: wineData.price_estimate || wineData.price_range}].map(item => item.value ? (<Box sx={{ width: { xs: '100%', sm: '45%' } }} key={item.label}><Typography variant="body2" color="text.secondary">{item.label}</Typography><Typography variant="body1">{item.value}</Typography></Box>) : null )}
                                </Box>
                             </Paper>
                         </Box>
                       </Box>
                       {/* Notes de Dégustation (texte) */}
                       <Box sx={{ mt: 3 }}>
                         <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS }}>
                            <Typography variant="subtitle1" gutterBottom>Notes de dégustation (IA)</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {wineData.tasting_notes ? (
                              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                <Box sx={{ width: { xs: '100%', md: '33.333%' } }}><Typography variant="body2" color="text.secondary" gutterBottom>Robe</Typography><Typography variant="body1" paragraph>{wineData.tasting_notes.appearance || '-'}</Typography></Box>
                                <Box sx={{ width: { xs: '100%', md: '33.333%' } }}><Typography variant="body2" color="text.secondary" gutterBottom>Nez</Typography><Typography variant="body1" paragraph>{wineData.tasting_notes.nose || '-'}</Typography></Box>
                                <Box sx={{ width: { xs: '100%', md: '33.333%' } }}><Typography variant="body2" color="text.secondary" gutterBottom>Bouche & Finale</Typography><Typography variant="body1" paragraph>{(wineData.tasting_notes.palate || '') + (wineData.tasting_notes.finish ? ` - ${wineData.tasting_notes.finish}` : '') || '-'}</Typography></Box>
                              </Box>
                            ) : ( <Typography variant="body1">{wineData.notes || 'Aucune note textuelle disponible'}</Typography> )}
                         </Paper>
                       </Box>
                     </>
                   )}

                   {/* --- Onglet Vieillissement --- */}
                   {previewTabs === 'aging' && (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                         {/* Courbe */}
                         <Box sx={{ width: { xs: '100%', md: '58.333%' } }}>

{/* Vérifie que wineData existe */}
{wineData && (
  <WineAgingCurve
    wine={{
      name: wineData.name,
      // --- CONSTRUCTION DE L'OBJET SPÉCIFIQUE ---
      // Inclure UNIQUEMENT les propriétés attendues par WineAgingCurve

      vintage: wineData.vintage, // C'est déjà un number

      color: normalizeWineColor(wineData.color) ?? undefined, // Convertit en type littéral ou undefined

      region: wineData.region === null ? undefined : wineData.region, // Convertit null en undefined

      // Ne pas inclure vintage_score car non disponible dans wineData
      // Ne PAS inclure appellation, subregion, domain, style, notes, etc.

    }}
    // Les autres props de WineAgingCurve sont ok
    height={300}
    showDetails={true}
  />
)}
                         </Box>
                         {/* Détails */}
                         <Box sx={{ width: { xs: '100%', md: '41.667%' } }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS, height: '100%' }}>
                               <Typography variant="subtitle1" gutterBottom>Potentiel de vieillissement</Typography>
                               <Divider sx={{ mb: 2 }} />
                               {wineData.aging ? (
                                  <Box>
                                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                        {[{label: 'Potentiel', value: wineData.aging.potential_years ? `${wineData.aging.potential_years} ans` : null}, {label: 'Phase', value: wineData.aging.current_phase ? {'youth': 'Jeunesse', 'development': 'Maturité', 'peak': 'Apogée', 'decline': 'Déclin'}[wineData.aging.current_phase] : null}, {label: 'Début apogée', value: wineData.aging.peak_start_year}, {label: 'Fin apogée', value: wineData.aging.peak_end_year}].map(item => item.value ? (<Box sx={{ width: { xs: '100%', sm: '45%' } }} key={item.label}><Typography variant="body2" color="text.secondary">{item.label}</Typography><Typography variant="body1">{item.value}</Typography></Box>) : null)}
                                     </Box>
                                     <Box sx={{ mt: 3, textAlign: 'center' }}><Chip color={wineData.aging.drink_now ? 'success' : 'info'} label={wineData.aging.drink_now ? 'Prêt à boire' : "Attendre"} sx={{ borderRadius: 10 }} size="small" /></Box>
                                     <Box sx={{ mt: 3 }}><Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: BORDER_RADIUS }}><Typography variant="body2">Estimations IA (conditions optimales).</Typography></Alert></Box>
                                  </Box>
                               ) : ( <Typography variant="body1" color="text.secondary" align="center">Données non disponibles</Typography> )}
                            </Paper>
                         </Box>
                      </Box>
                   )}

                   {/* --- Onglet Dégustation --- */}
                   {previewTabs === 'tasting' && (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                         {/* Radar */}
                         <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                         {wineData && (
  <TastingRadarChart
    wine={{
      // --- CONSTRUCTION DE L'OBJET SPÉCIFIQUE ---
      // Inclure UNIQUEMENT les propriétés définies dans le type 'Wine' de TastingRadarChart

      color: wineData.color ?? 'unknown', // Fournit une chaîne, gère null/undefined

      tasting_notes: wineData.tasting_notes === null ? undefined : wineData.tasting_notes, // Convertit null en undefined

      notes: wineData.notes === null ? undefined : wineData.notes, // Convertit null en undefined

      // NE PAS INCLURE : name, vintage, taste_profile, region, appellation, etc.
    }}
    // Les autres props de TastingRadarChart sont ok
    height={300}
    showTitle={true}
    // showFootnote={true} // Vous pouvez ajouter celle-ci si vous le souhaitez
  />
)}
                         </Box>
                         {/* Détails Caractéristiques */}
                         <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: BORDER_RADIUS }}>
                               <Typography variant="subtitle1" gutterBottom>Caractéristiques</Typography>
                               <Divider sx={{ mb: 2 }} />
                               {wineData.taste_profile ? (
                                  <Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
                                      {[{label: 'Corps', value: wineData.taste_profile.body}, {label: 'Acidité', value: wineData.taste_profile.acidity}, {label: 'Tanins', value: wineData.taste_profile.tannin}, {label: 'Douceur', value: wineData.taste_profile.sweetness}, {label: 'Fruité', value: wineData.taste_profile.fruitiness}, {label: 'Boisé', value: wineData.taste_profile.oak}].map(item => item.value ? (<Box sx={{ width: { xs: '100%', sm: '45%' } }} key={item.label}><Typography variant="body2" color="text.secondary">{item.label}</Typography><Rating value={item.value} readOnly max={5} size="small" /></Box>) : null)}
                                    </Box>
                                    {wineData.taste_profile.primary_flavors && wineData.taste_profile.primary_flavors.length > 0 && (
                                       <Box sx={{ mt: 2 }}>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>Arômes dominants</Typography>
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{wineData.taste_profile.primary_flavors.filter(f => f).map((flavor, index) => (<Chip key={index} label={flavor} size="small" variant="outlined" />))}</Box>
                                       </Box>
                                    )}
                                  </Box>
                               ) : ( <Typography variant="body1" color="text.secondary" align="center">Données non disponibles</Typography> )}
                            </Paper>
                         </Box>
                      </Box>
                   )}

                   {/* --- Onglet Accords --- */}
                   {/* Correction de la condition logique ici si nécessaire */}
                   {previewTabs === 'pairing' && (
                      <div>
                        <Typography variant="subtitle1" gutterBottom>Suggestions d&apos;accords mets-vins (IA)</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {wineData.pairings && wineData.pairings.length > 0 ? (
                           wineData.pairings.map((pairing, index) => (
                              <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: BORDER_RADIUS }}>
                                 <Typography variant="body1" fontWeight="medium">{pairing.food}</Typography>
                                 {pairing.explanation && <Typography variant="body2" color="text.secondary">{pairing.explanation}</Typography>}
                                 <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    {pairing.type && <Chip label={pairing.type} size="small" variant="outlined" />}
                                    {(pairing.strength ?? pairing.pairing_strength) && <Rating value={pairing.strength ?? pairing.pairing_strength} readOnly max={5} size="small" />}
                                 </Box>
                              </Paper>
                           ))
                        ) : ( <Typography variant="body1" color="text.secondary" align="center">Aucune suggestion d&apos;accord disponible.</Typography> )}
                      </div>
                   )}
                </Box>

                {/* Info sur les données IA */}
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: BORDER_RADIUS }}>
                     <Typography variant="body2">Informations générées par IA. Modifiables après ajout à la cave.</Typography>
                  </Alert>
                </Box>
              </>
            )}
          {/* === FIN DialogContent === */}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowDialog(false)} variant="outlined" sx={{ borderRadius: BORDER_RADIUS }}>Annuler</Button>
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
        <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)} PaperProps={{ sx: { borderRadius: BORDER_RADIUS } }}>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" component="div">Configuration IA</Typography>
              <Button onClick={() => setApiKeyDialogOpen(false)} color="inherit" sx={{ minWidth: 'auto', p: 1 }}><ClearIcon /></Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>Configurez les clés API (stockage sécurisé).</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Fournisseur IA par défaut</InputLabel>
              <Select value={modelProvider} onChange={(e) => setModelProvider(e.target.value as AIProvider)} sx={{ borderRadius: BORDER_RADIUS }} label="Fournisseur IA par défaut">
                <MenuItem value="openai">OpenAI (GPT)</MenuItem>
                <MenuItem value="mistral">Mistral AI</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Clé API OpenAI" value={apiKeys.openai} onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })} margin="normal" type="password" helperText="Requise si OpenAI sélectionné" sx={{ '& .MuiOutlinedInput-root': { borderRadius: BORDER_RADIUS } }} />
            <TextField fullWidth label="Clé API Mistral" value={apiKeys.mistral} onChange={(e) => setApiKeys({ ...apiKeys, mistral: e.target.value })} margin="normal" type="password" helperText="Requise si Mistral AI sélectionné" sx={{ '& .MuiOutlinedInput-root': { borderRadius: BORDER_RADIUS } }} />
            <Alert severity="info" sx={{ mt: 2, borderRadius: BORDER_RADIUS }}>
              Si erreurs de quota, essayez l&apos;autre. Clés sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI</a> ou <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer">Mistral AI</a>.
            </Alert>
            {!isAuthenticated && ( <Alert severity="warning" sx={{ mt: 2, borderRadius: BORDER_RADIUS }}><Typography variant="body2">Connectez-vous pour sauvegarder vos préférences.</Typography></Alert> )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApiKeyDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveApiKeys} variant="contained" disabled={!isAuthenticated}>{isAuthenticated ? 'Sauvegarder' : 'Connexion requise'}</Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={notification.severity} variant="filled" onClose={() => setNotification({ ...notification, open: false })} sx={{ borderRadius: BORDER_RADIUS }}>{notification.message}</Alert>
        </Snackbar>

        {/* Alerte pour utilisateur non connecté (persistante en haut) */}
        {!isAuthLoading && !isAuthenticated && (
          <Snackbar open={true} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert severity="info" variant="filled" sx={{ borderRadius: BORDER_RADIUS, width: '100%', maxWidth: '600px' }} action={<Button color="inherit" size="small" component={Link} href="/login">Se connecter</Button>}>
              Connectez-vous pour ajouter des vins à votre cave.
            </Alert>
          </Snackbar>
        )}
      </Container>
    </>
  );
}