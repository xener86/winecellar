'use client';

import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
} from '@mui/material';

import RestaurantIcon from '@mui/icons-material/Restaurant';
import SearchIcon from '@mui/icons-material/Search';
import Pairing from '@/components/Pairing';

import { FoodPairing, PairingMode, SourceMode, ApiKeys } from '@/utils/types';

interface FoodSearchTabProps {
  foodQuery: string;
  setFoodQuery: (query: string) => void;
  selectedWineType: string;
  setSelectedWineType: (type: string) => void;
  sourceMode: SourceMode;
  setSourceMode: (mode: SourceMode) => void;
  pairingMode: PairingMode;
  setPairingMode: (mode: PairingMode) => void;
  apiKeys: ApiKeys;
  apiProvider: keyof ApiKeys;
  pairingLoading: boolean;
  handleSearchByFood: () => void;
  filteredResults: FoodPairing[];
  handleLoadMoreResults: () => void;
  handleSavePairing: (pairing: FoodPairing) => void;
  handleRemovePairing: (id: string) => void;
  handleRatePairing: (id: string, rating: number) => void;
  userId?: string;
}

export default function FoodSearchTab({
  foodQuery,
  setFoodQuery,
  selectedWineType,
  setSelectedWineType,
  sourceMode,
  setSourceMode,
  pairingMode,
  setPairingMode,
  apiKeys,
  apiProvider,
  pairingLoading,
  handleSearchByFood,
  filteredResults,
  handleLoadMoreResults,
  handleSavePairing,
  handleRemovePairing,
  handleRatePairing,
  userId,
}: FoodSearchTabProps) {
  const handleWineTypeChange = (event: SelectChangeEvent) => {
    setSelectedWineType(event.target.value);
  };

  const handleSourceModeChange = (_: React.SyntheticEvent, newValue: string) => {
    setSourceMode(newValue as SourceMode);
  };

  const handlePairingModeChange = (_: React.SyntheticEvent, newValue: string) => {
    setPairingMode(newValue as PairingMode);
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
            onKeyPress={handleKeyPress}
            disabled={pairingLoading || !apiConfigured}
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
              disabled={pairingLoading || !apiConfigured}
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
            disabled={
              !foodQuery.trim() || 
              pairingLoading || 
              !apiConfigured
            }
            startIcon={pairingLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ height: { sm: 56 }, px: 4 }}
          >
            {pairingLoading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Tabs value={sourceMode} onChange={handleSourceModeChange}>
          <Tab value="all" label="Toutes les suggestions" />
          <Tab value="cellar" label="Ma cave" />
          <Tab value="store" label="À acheter" />
        </Tabs>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Tabs value={pairingMode} onChange={handlePairingModeChange}>
          <Tab value="all" label="Tous les accords" />
          <Tab value="classic" label="Classiques" />
          <Tab value="audacious" label="Audacieux" />
          <Tab value="merchant" label="Caviste" />
        </Tabs>
      </Box>

      {filteredResults.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {filteredResults.map((pairing, index) => {
              // S'assurer que wine est un objet valide avec les propriétés attendues
              const wine = typeof pairing.wine === 'string' ? null : pairing.wine;
              
              // Vérifier si cet accord est sauvegardé
              const isPairingSaved = pairing.saved || false;
              
              // Obtenir la note de l'utilisateur si disponible
              const userRating = pairing.rating || 0;
              
              return (
                <Grid component="div" sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }} key={index}>
                  <Pairing
                    wine={wine}
                    food={pairing.food}
                    mode="byFood"
                    apiConfig={{ apiProvider: apiProvider as string, apiKey: currentApiKey }}
                    userId={userId}
                    onSave={handleSavePairing}
                    onRemove={handleRemovePairing}
                    onRate={handleRatePairing}
                    saved={isPairingSaved}
                    userRating={userRating}
                  />
                </Grid>
              );
            })}
          </Grid>
          {filteredResults.length >= 10 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMoreResults}
                disabled={pairingLoading}
              >
                Charger plus de résultats
              </Button>
            </Box>
          )}
        </>
      ) : foodQuery && !pairingLoading ? (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ my: 8 }}>
          Aucun accord trouvé pour &ldquo;{foodQuery}&ldquo;. 
          Essayez avec un autre plat ou d&apos;autres critères de recherche.
        </Typography>
      ) : !foodQuery ? (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ my: 8 }}>
          Entrez le nom d&apos;un plat pour trouver des accords de vins.
        </Typography>
      ) : null}

      <Divider sx={{ my: 4 }} />

      <Typography variant="body2" color="text.secondary">
        Les suggestions sont générées par intelligence artificielle et peuvent varier. 
        Pour des conseils personnalisés, n&apos;hésitez pas à consulter un sommelier.
      </Typography>
    </Box>
  );
}