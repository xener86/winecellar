'use client';

import React from 'react';
import { Grid, Typography, Paper } from '@mui/material';
import { FoodPairing, WineObject, DBWine } from '@/utils/types';

interface PairingProps {
  pairings: FoodPairing[];
  wine: WineObject | DBWine | string | null;
  food?: string;
  compact?: boolean;
  mode?: 'byWine' | 'byFood';
  apiConfig?: { apiProvider: string; apiKey: string };
  userId?: string;
  onSave?: (pairing: FoodPairing) => void;
  onRemove?: (id: string) => void;
  onRate?: (id: string, rating: number) => void;
  saved?: boolean;
  userRating?: number;
}

export default function WinePairingSuggestions({ pairings }: PairingProps) {
  if (!pairings || pairings.length === 0) {
    return <Typography>Aucune suggestion trouvée.</Typography>;
  }

  return (
    <Grid container spacing={2}>
      {pairings.map((pairing, index) => {
        const wine = pairing.wine;

        // skip if wine is a string or null
        if (!wine || typeof wine === 'string') return null;

        return (
          <Grid key={index} sx={{ width: '100%' }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{wine.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {wine.region} - {wine.color} - {wine.vintage}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {pairing.explanation}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
