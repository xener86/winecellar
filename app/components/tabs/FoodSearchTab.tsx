'use client';

import React from 'react';
import { Dispatch, SetStateAction } from 'react';

import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  CircularProgress,
} from '@mui/material';

import Pairing from '../Pairing';
import { FoodPairing, DBWine, ApiKeys, SourceMode } from '@/utils/types';

interface FoodSearchTabProps {
  foodQuery: string;
  setFoodQuery: (value: string) => void;
  apiKeys: ApiKeys;
  apiProvider: 'openai' | 'mistral';
  pairingLoading: boolean;
  handleSearchByFood: () => void;
  filteredResults: FoodPairing[];
  handleLoadMoreResults: () => void;
  sourceMode: SourceMode;
  handleSavePairing: (pairing: FoodPairing) => void;
  handleRemovePairing: (id: string) => void;
  handleRatePairing: (id: string, rating: number) => void;
  selectedWineType: string;
  setSelectedWineType: Dispatch<SetStateAction<string>>;
  userId?: string;
}

const FoodSearchTab: React.FC<FoodSearchTabProps> = ({
  foodQuery,
  setFoodQuery,
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
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Quel plat souhaitez-vous accorder ?"
          value={foodQuery}
          onChange={(e) => setFoodQuery(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearchByFood}
          disabled={!foodQuery.trim()}
        >
          Rechercher
        </Button>
      </Box>

      {pairingLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!pairingLoading && filteredResults.length === 0 && (
        <Typography variant="body1" sx={{ mt: 4 }}>
          Aucun résultat pour le moment.
        </Typography>
      )}

<Grid container spacing={3} sx={{ mt: 1 }}>
  {filteredResults.map((pairing, idx) => {
    const wine = pairing.wine as DBWine;
    return (
      <Grid component="div" key={idx} sx={{ width: { xs: '100%', md: '50%' } }}>
        <Pairing
          wine={wine}
          food={pairing.food}
          mode="byFood"
          compact={false}
          apiConfig={{ 
            apiProvider,
            apiKey: apiKeys[apiProvider]
          }}
          userId={userId}
          onSave={handleSavePairing}
          onRemove={handleRemovePairing}
          onRate={handleRatePairing}
          saved={pairing.saved}
          userRating={pairing.user_rating ?? undefined}
        />
      </Grid>
    );
  })}
</Grid>


      {filteredResults.length > 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="outlined" onClick={handleLoadMoreResults}>
            Charger plus de résultats
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FoodSearchTab;
