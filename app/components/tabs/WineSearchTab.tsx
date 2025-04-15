'use client';

import { Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import WinePairingService from '@/services/WinePairingService';
import Pairing from '../Pairing';
import { DBWine, FoodPairing, PairingOptions } from '@/utils/types';

export default function WineSearchTab() {
  const { user } = useUser();
  const [selectedWine] = useState<DBWine | null>(null);
  const [pairings, setPairings] = useState<FoodPairing[]>([]);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchPairings = async () => {
      if (!selectedWine?.id) return;
      const options: PairingOptions = {
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY as string,
        apiProvider: 'openai',
      };    
      const results = await WinePairingService.findPairingsByWine(selectedWine, options);
      setPairings(results);
    };

    fetchPairings();
  }, [selectedWine]);

  return (
    <Grid container spacing={2}>
      {pairings.map((pairing, index) => (
        <Grid component="div" key={index} sx={{ width: '100%' }}>
          <Pairing
            wine={pairing.wine as DBWine}
            food={pairing.food}
            compact={false}
            mode="byWine"
            apiConfig={{
              apiProvider: 'openai',
              apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY as string,
            }}
            userId={user?.id}
            onSave={(p) => console.log('Saved pairing', p)}
            onRemove={(id) => console.log('Removed pairing', id)}
            onRate={(id, rating) => {
              setUserRating(rating);
              console.log(`Rated pairing ${id} with ${rating} stars`);
            }}
            saved={false}
            userRating={userRating}
          />
        </Grid>
      ))}
    </Grid>
  );
}
