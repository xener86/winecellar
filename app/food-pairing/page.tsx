'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Tabs,
  Tab,
  Badge,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import WineBarIcon from '@mui/icons-material/WineBar';
import BookmarkIcon from '@mui/icons-material/Bookmark';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

import Navbar from '@/components/Navbar';
import FoodSearchTab from '@/components/tabs/FoodSearchTab';
import WinePairingService from '@/services/WinePairingService';

import {
  Bottle,
  FoodPairing,
  PairingMode,
  SourceMode,
  ApiKeys
} from '@/utils/types';

export default function FoodPairingPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ openai: '', mistral: '' });
  const [apiProvider, setApiProvider] = useState<'openai' | 'mistral'>('openai');

  const [foodQuery, setFoodQuery] = useState('');
  const [selectedWineType, setSelectedWineType] = useState('');
  // Utilisé pour stocker les bouteilles de la cave
  const [, setCellarWines] = useState<Bottle[]>([]);

  const [pairingMode] = useState<PairingMode>('all');
  const [pairingFilter] = useState<PairingMode>('all');
  const [sourceMode] = useState<SourceMode>('all');
  const [savedPairings, setSavedPairings] = useState<FoodPairing[]>([]);
  const [pairingResults, setPairingResults] = useState<FoodPairing[]>([]);
  const [pairingLoading, setPairingLoading] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  const filteredResults = pairingResults.filter((p) =>
    pairingFilter === 'all' ? true : p.pairing_type === pairingFilter
  );

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return setLoading(false);

      setUserData(authData.user);

      const { data: bottlesData } = await supabase
        .from('bottle')
        .select(`id, wine_id, position_id, status, wine:wine_id(*)`)
        .eq('status', 'in_stock')
        .eq('user_id', authData.user.id);

      const processedBottles = bottlesData?.map(b => ({
        ...b,
        wine: Array.isArray(b.wine) ? b.wine[0] : b.wine
      })) || [];

      setCellarWines(processedBottles);

      const { data: saved } = await supabase
        .from('food_pairing')
        .select(`*, wine:wine_id(*)`)
        .eq('user_id', authData.user.id)
        .eq('saved', true);

      const processedSaved = saved?.map(p => ({
        ...p,
        food: p.food || '',
        wine_id: p.wine_id ?? undefined,
        wine: Array.isArray(p.wine) ? p.wine[0] : p.wine,
      })) || [];

      setSavedPairings(processedSaved);

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key, default_ai_provider')
        .eq('user_id', authData.user.id)
        .single();

      if (prefs) {
        setApiKeys({
          openai: prefs.openai_api_key || '',
          mistral: prefs.mistral_api_key || '',
        });
        if (prefs.default_ai_provider) {
          setApiProvider(prefs.default_ai_provider);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setNotification({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByFood = async () => {
    if (!foodQuery.trim()) return;
    
    try {
      setPairingLoading(true);
      const results = await WinePairingService.findPairingsByFood(foodQuery, {
        apiKey: apiKeys[apiProvider],
        apiProvider,
        pairingMode,
      });
      setPairingResults(results);
    } catch (error) {
      console.error("Erreur lors de la recherche d'accords:", error);
      setNotification({
        open: true,
        message: "Erreur lors de la recherche d'accords",
        severity: "error"
      });
    } finally {
      setPairingLoading(false);
    }
  };

  const handleLoadMoreResults = () => {
    // Implémentation future pour charger plus de résultats
    console.log("Charger plus de résultats");
  };

  const handleSavePairing = async (pairing: FoodPairing) => {
    if (!userData?.id) return;
    try {
      await WinePairingService.savePairing(pairing, userData.id);
      setNotification({
        open: true,
        message: "Accord sauvegardé avec succès",
        severity: "success"
      });
      fetchUserData(); // Rafraîchir les données
    } catch {
      setNotification({
        open: true,
        message: "Erreur lors de la sauvegarde",
        severity: "error"
      });
    }
  };

  const handleRemovePairing = async (id: string) => {
    if (!userData?.id) return;
    try {
      await WinePairingService.removePairing(id, userData.id);
      setNotification({
        open: true,
        message: "Accord retiré des favoris",
        severity: "success"
      });
      fetchUserData(); // Rafraîchir les données
    } catch {
      setNotification({
        open: true,
        message: "Erreur lors de la suppression",
        severity: "error"
      });
    }
  };

  const handleRatePairing = async (id: string, rating: number) => {
    if (!userData?.id) return;
    try {
      await WinePairingService.ratePairing(id, rating, userData.id);
      setNotification({
        open: true,
        message: "Note enregistrée",
        severity: "success"
      });
      fetchUserData(); // Rafraîchir les données
    } catch {
      setNotification({
        open: true,
        message: "Erreur lors de l'enregistrement de la note",
        severity: "error"
      });
    }
  };

  // Cette fonction sera utilisée dans les onglets, même si elle n'est pas utilisée directement ici
  // const handlePairingFilterChange = (_: unknown, val: unknown) => {
  //   if (typeof val === 'string') {
  //     setPairingFilter(val as PairingMode);
  //   }
  // };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Typography variant="h4">Accords Mets & Vins</Typography>
          <Button component={Link} href="/settings" variant="outlined">
            Configuration API
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" sx={{ minHeight: '40vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper elevation={0} sx={{
            border: 1,
            borderColor: theme.palette.divider,
            borderRadius: 2,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white',
            overflow: 'hidden',
          }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabIndex} onChange={(_, idx) => setTabIndex(idx)} variant="fullWidth">
                <Tab icon={<SearchIcon />} label="Par plat" />
                <Tab icon={<WineBarIcon />} label="Par vin" />
                <Tab icon={
                  <Badge badgeContent={savedPairings.length} color="primary">
                    <BookmarkIcon />
                  </Badge>
                } label="Favoris" />
              </Tabs>
            </Box>
            <Box sx={{ p: { xs: 2, md: 6 } }}>
              {tabIndex === 0 && (
                <FoodSearchTab
                  foodQuery={foodQuery}
                  setFoodQuery={setFoodQuery}
                  selectedWineType={selectedWineType}
                  setSelectedWineType={setSelectedWineType}
                  sourceMode={sourceMode}
                  apiKeys={apiKeys}
                  apiProvider={apiProvider}
                  pairingLoading={pairingLoading}
                  handleSearchByFood={handleSearchByFood}
                  filteredResults={filteredResults}
                  handleLoadMoreResults={handleLoadMoreResults}
                  handleSavePairing={handleSavePairing}
                  handleRemovePairing={handleRemovePairing}
                  handleRatePairing={handleRatePairing}
                  userId={userData?.id}
                />
              )}
              {/* WineSearchTab & SavedPairingsTab similaires... */}
            </Box>
          </Paper>
        )}

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
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}