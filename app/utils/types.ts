export interface DBWine {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
  country: string; // ✅ Ajoute cette ligne
}

export interface Bottle {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  wine?: DBWine;
}

export type PairingMode = 'all' | 'classic' | 'audacious' | 'merchant';
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
  apiKey: string; // ✅ une seule clé (openai OU mistral)
  apiProvider: keyof ApiKeys; // "openai" | "mistral"
}