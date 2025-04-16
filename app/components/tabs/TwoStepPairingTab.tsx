'use client';

import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';

import RestaurantIcon from '@mui/icons-material/Restaurant';
import SearchIcon from '@mui/icons-material/Search';

import WineRecommendations from '@/components/WineRecommendations';
import CellarMatches from '@/components/CellarMatches';

import {
  FoodPairing,
  WineRecommendation,
  CellarMatch,
  SourceMode,
  PairingMode,
} from '@/utils/types';

interface TwoStepPairingTabProps {
  foodQuery: string;
  setFoodQuery: (query: string) => void;
  selectedWineType: string;
  setSelectedWineType: (type: string) => void;
  pairingMode: PairingMode;
  sourceMode: SourceMode;
  apiKeys: { openai: string; mistral: string };
  apiProvider: 'openai' | 'mistral';
  userId?: string;

  handleSearchByFood: () => void;
  findCellarMatches: () => void;

  wineRecommendations: WineRecommendation[];
  cellarMatches: CellarMatch[];
  recommendationsLoading: boolean;
  cellarMatchesLoading: boolean;
  showCellarMatches: boolean;

  handleSavePairing: (pairing: FoodPairing) => void;
  handleRemovePairing: (id: string) => void;
  handleRatePairing: (id: string, rating: number) => void;
  savedPairings: FoodPairing[];
}

export default function TwoStepPairingTab({
  foodQuery,
  setFoodQuery,
  selectedWineType,
  setSelectedWineType,
  apiKeys,
  apiProvider,
  userId,
  handleSearchByFood,
  findCellarMatches,
  wineRecommendations,
  cellarMatches,
  recommendationsLoading,
  cellarMatchesLoading,
  showCellarMatches,
  handleSavePairing,
  handleRemovePairing,
  handleRatePairing,
  savedPairings,
}: TwoStepPairingTabProps) {
  const handleWineTypeChange = (event: SelectChangeEvent) => {
    setSelectedWineType(event.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchByFood();
    }
  };

  const currentApiKey = apiKeys[apiProvider];
  const apiConfigured = !!currentApiKey;

  return (
    <Box>
      {!apiConfigured && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Vous devez configurer une clé API pour utiliser cette fonctionnalité.
          Rendez-vous dans les paramètres pour ajouter votre clé.
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quel est votre plat ?
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Ex: Homard grillé, Bœuf bourguignon..."
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={recommendationsLoading || !apiConfigured}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <RestaurantIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel id="wine-type-select-label">Type de vin</InputLabel>
            <Select
              labelId="wine-type-select-label"
              value={selectedWineType}
              onChange={handleWineTypeChange}
              disabled={recommendationsLoading || !apiConfigured}
              label="Type de vin"
            >
              <MenuItem value="">Tous les types</MenuItem>
              <MenuItem value="red">Rouge</MenuItem>
              <MenuItem value="white">Blanc</MenuItem>
              <MenuItem value="rose">Rosé</MenuItem>
              <MenuItem value="sparkling">Effervescent</MenuItem>
              <MenuItem value="sweet">Moelleux/Liquoreux</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSearchByFood}
            disabled={!foodQuery.trim() || recommendationsLoading || !apiConfigured}
            startIcon={recommendationsLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ height: { sm: 56 }, px: 4 }}
          >
            {recommendationsLoading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </Box>
      </Box>

      {wineRecommendations.length > 0 && !showCellarMatches && (
        <WineRecommendations
          recommendations={wineRecommendations}
          foodQuery={foodQuery}
          onCheckCellar={findCellarMatches}
          loading={cellarMatchesLoading}
        />
      )}

      {showCellarMatches && (
        <CellarMatches
          matches={cellarMatches}
          foodQuery={foodQuery}
          userId={userId}
          onSave={handleSavePairing}
          onRemove={handleRemovePairing}
          onRate={handleRatePairing}
          savedPairings={savedPairings}
        />
      )}
    </Box>
  );
}
