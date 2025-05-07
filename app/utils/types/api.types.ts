// app/utils/types/api.types.ts

import { Spirit, SpiritType } from './spirit.types';
import { Cocktail, CocktailCategory } from './cocktail.types';

// Types pour les requêtes API

/**
 * Interface pour la recherche IA de spiritueux
 */
export interface SpiritAISearchRequest {
  searchTerm: string;
  apiKey: string;
  apiProvider: 'openai' | 'mistral';
  language?: 'fr' | 'en';
}

/**
 * Interface pour la suggestion de cocktail
 */
export interface CocktailSuggestionRequest {
  mainSpirit: string | SpiritType;
  availableSpirits: SpiritSummary[];
  apiKey: string;
  existing?: Partial<Cocktail>;
}

/**
 * Interface simplifiée d'un spiritueux pour les API
 */
export interface SpiritSummary {
  id: string;
  name: string;
  type: SpiritType;
}

/**
 * Interface pour la mise à jour d'un spiritueux
 */
export interface SpiritUpdateRequest {
  id: string;
  updates: Partial<Omit<Spirit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Interface pour la création d'un cocktail
 */
export interface CocktailCreateRequest {
  cocktail: Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
}

/**
 * Interface pour la mise à jour d'un cocktail
 */
export interface CocktailUpdateRequest {
  id: string;
  updates: Partial<Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Interface pour la recherche de cocktails
 */
export interface CocktailSearchRequest {
  searchTerm?: string;
  categories?: CocktailCategory[];
  ingredients?: string[];
  difficulty?: ('easy' | 'medium' | 'hard')[];
  availableOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Interface pour la réponse de recherche de cocktails
 */
export interface CocktailSearchResponse {
  cocktails: Cocktail[];
  total: number;
  hasMore: boolean;
}

/**
 * Interface pour les préférences utilisateur
 */
export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  openaiApiKey?: string;
  mistralApiKey?: string;
  displayMode: 'grid' | 'list';
  temperatureUnit: 'celsius' | 'fahrenheit';
  createdAt: string;
  updatedAt: string;
}