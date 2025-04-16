export interface DBWine {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
  country: string;
}

export interface Bottle {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  wine?: DBWine;
}

export type PairingMode = 'all' | 'classic' | 'audacious' | 'heart' | 'merchant';
export type SourceMode = 'all' | 'cellar' | 'store';

export interface FoodPairing {
  id?: string;
  food: string;
  wine_id?: string;
  wine_type?: string | null;
  pairing_strength?: number | null;
  pairing_type?: string | null;
  explanation?: string;
  user_rating?: number | null;
  user_id?: string;
  saved?: boolean;
  wine?: DBWine | string | null;
}

export interface WineRecommendation {
  id: string;
  food: string;
  wine_type: string;
  grape: string;
  characteristics: string;
  explanation: string;
  pairing_type: 'classic' | 'audacious' | 'heart' | 'merchant';
  wine?: DBWine; // Ajout pour permettre l'inclusion d'un objet vin
}

export interface BottleMatch {
  bottle_id: string;
  wine_id: string;
  match_quality: 'perfect' | 'good' | 'alternative';
  explanation: string;
  wine?: DBWine; // Ajout du champ wine pour stocker les données du vin
}

export interface CellarMatch {
  recommendation: WineRecommendation;
  matches: BottleMatch[];
}

export interface ApiKeys {
  openai: string;
  mistral: string;
}

export type WineObject = {
  id: string;
  name: string;
  color: string;
  vintage: number;
  domain: string;
  region: string;
  appellation: string;
  alcohol_percentage: number;
  country: string;
};

export interface PairingOptions {
  apiKey: string;
  apiProvider: keyof ApiKeys; // "openai" | "mistral"
  sourceMode?: 'all' | 'cellar' | 'store';
  wineType?: string;
  pairingMode?: PairingMode;
  userId?: string;
}