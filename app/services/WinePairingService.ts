import { supabase } from '@/utils/supabase';
import { DBWine, FoodPairing, WineRecommendation, CellarMatch } from '@/utils/types';

export interface PairingOptions {
  sourceMode?: 'all' | 'cellar' | 'store';
  wineType?: string;
  pairingMode?: 'all' | 'classic' | 'audacious' | 'heart' | 'merchant';
  apiProvider: 'openai' | 'mistral';
  apiKey: string;
  userId?: string;
  limit?: number;
  offset?: number;
  forceRefresh?: boolean;
}

// Interface pour les données de l'API
interface ApiWineResponse {
  wine_type?: string;
  grape?: string;
  characteristics?: string;
  explanation?: string;
  pairing_type?: 'classic' | 'audacious' | 'heart';
  food?: string;
}

const winePairingService = {
  findPairingsByFood: async (
    foodQuery: string,
    options: PairingOptions
  ): Promise<WineRecommendation[]> => {
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
      ? data.map((item: ApiWineResponse): WineRecommendation => ({
          wine_type: item.wine_type || 'Vin recommandé',
          grape: item.grape || '',
          characteristics: item.characteristics || '',
          explanation: item.explanation || 'Pas d\'explication fournie',
          pairing_type: item.pairing_type || 'classic',
          food: foodQuery
        }))
      : [];
  },

  findCellarMatches: async (
    foodQuery: string,
    wineRecommendations: WineRecommendation[],
    options: PairingOptions
  ): Promise<CellarMatch[]> => {
    if (!options.userId) {
      throw new Error('ID utilisateur requis pour cette opération');
    }
    
    console.log("Appel API cellar-match avec:", { 
      foodQuery, 
      recommendations: wineRecommendations.length,
      userId: options.userId 
    });
    
    try {
      // Vérifier que wineRecommendations contient des données
      if (!Array.isArray(wineRecommendations) || wineRecommendations.length === 0) {
        console.warn("Aucune recommandation fournie pour cellar-match");
        return [];
      }
      
      // Limiter le nombre de recommandations pour alléger la charge
      const limitedRecommendations = wineRecommendations.slice(0, 6);
      
      const res = await fetch('/api/pairings/cellar-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodQuery,
          wineRecommendations: limitedRecommendations,
          userId: options.userId,
          apiKey: options.apiKey,
          apiProvider: options.apiProvider,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Erreur API IA (cellar-match) : ${res.status}`, errorText);
        throw new Error(`Erreur API IA (cellar-match) : ${res.status}`);
      }

      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.warn("La réponse n'est pas un tableau:", data);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error("Erreur détaillée dans findCellarMatches:", error);
      throw error;
    }
  },

  findPairingsByWine: async (
    wine: string | DBWine,
    options: PairingOptions
  ): Promise<FoodPairing[]> => {
    try {      
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
        ? data.map((item, index): FoodPairing => {
            // Créer un objet DBWine valide
            const wineObject: DBWine = typeof wine === 'string'
              ? {
                  id: `manual-${index}`,
                  name: wine,
                  color: 'unknown',
                  vintage: 0,
                  domain: 'Manuel',
                  region: 'non précisé',
                  country: 'France',
                  appellation: 'N/A'
                }
              : wine;

            return {
              id: `wine-${typeof wine === 'string' ? wine : wine.id}-${index}`,
              food: item.food || 'Inconnu',
              wine_id: typeof wine === 'string' ? `manual-${index}` : wine.id,
              wine: wineObject,
              saved: false,
              rating: 0,
              explanation: item.explanation,
              pairing_type: item.pairing_type || 'classic',
            };
          })
        : [];
    } catch (error) {
      console.error("Erreur dans findPairingsByWine:", error);
      throw error;
    }
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