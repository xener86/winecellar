import { supabase } from '@/utils/supabase';
import { DBWine, FoodPairing } from '@/utils/types';

export interface PairingOptions {
  sourceMode?: 'all' | 'cellar' | 'store';
  wineType?: string;
  pairingMode?: 'all' | 'classic' | 'audacious' | 'merchant';
  apiProvider: 'openai' | 'mistral';
  apiKey: string;
  userId?: string;
  limit?: number;
  offset?: number;
  forceRefresh?: boolean;
}

const winePairingService = {
  findPairingsByFood: async (
    foodQuery: string,
    options: PairingOptions
  ): Promise<FoodPairing[]> => {
    const res = await fetch('/api/pairings/food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foodQuery,
        apiKey: options.apiKey,
        apiProvider: options.apiProvider,
        pairingMode: options.pairingMode,
      }),
    });

    if (!res.ok) {
      throw new Error(`Erreur API IA (food) : ${res.status}`);
    }

    const data = await res.json();

    return Array.isArray(data)
      ? data.map((item, index): FoodPairing => ({
          id: `food-${foodQuery}-${index}`,
          food: foodQuery,
          wine_id: `ia-wine-${index}`, // ✅ string
          wine: {
            id: `ia-wine-${index}`, // ✅ string
            name: item.wine,
            color: 'unknown',
            vintage: 0, // ✅ still number
            domain: 'IA générée',
            region: 'inconnu',
            country: 'France',
            appellation: 'N/A',
            alcohol_percentage: 0,
          },
          saved: false,
          user_rating: null,
          explanation: item.explanation,
          pairing_type: item.pairing_type || 'classic',
        }))
      : [];
  },

  findPairingsByWine: async (
    wine: string | DBWine,
    options: PairingOptions
  ): Promise<FoodPairing[]> => {
    const res = await fetch('/api/pairings/wine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wine,
        apiKey: options.apiKey,
        apiProvider: options.apiProvider,
        pairingMode: options.pairingMode,
        wineType: options.wineType,
      }),
    });

    if (!res.ok) {
      throw new Error(`Erreur API IA (wine) : ${res.status}`);
    }

    const data = await res.json();

    return Array.isArray(data)
      ? data.map((item, index): FoodPairing => ({
          id: `wine-${typeof wine === 'string' ? wine : wine.id}-${index}`,
          food: item.food || 'Inconnu',
          wine_id: typeof wine === 'string' ? `manual-${index}` : wine.id,
          wine:
            typeof wine === 'string'
              ? {
                  id: `manual-${index}`,
                  name: wine,
                  color: 'unknown',
                  vintage: 0,
                  domain: 'Manuel',
                  region: 'non précisé',
                  country: 'France',
                  appellation: 'N/A',
                  alcohol_percentage: 0,
                }
              : wine,
          saved: false,
          user_rating: null,
          explanation: item.explanation,
          pairing_type: item.pairing_type || 'classic',
        }))
      : [];
  },

  savePairing: async (
    pairing: FoodPairing,
    userId: string
  ): Promise<FoodPairing> => {
    const { data, error } = await supabase
      .from('food_pairing')
      .upsert([{ ...pairing, user_id: userId, saved: true }])
      .select('*, wine:wine_id(*)')
      .single();

    if (error) {
      throw new Error('Erreur lors de la sauvegarde');
    }

    return {
      ...data,
      wine: Array.isArray(data.wine) ? data.wine[0] : data.wine || pairing.wine,
    };
  },

  removePairing: async (
    pairingId: string,
    userId: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('food_pairing')
      .update({ saved: false })
      .eq('id', pairingId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Erreur lors de la suppression');
    }
  },

  ratePairing: async (
    pairingId: string,
    rating: number,
    userId: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('food_pairing')
      .update({ user_rating: rating })
      .eq('id', pairingId)
      .eq('user_id', userId);

    if (error) {
      throw new Error("Erreur lors de l'enregistrement de la note");
    }
  },
};

export default winePairingService;
