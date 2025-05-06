// app/utils/types/cocktail.types.ts

/**
 * Types pour le module de mixologie
 */

import { Spirit } from './spirit.types';

// Type de verre à cocktail
export type GlassType = 
  'highball' | 'lowball' | 'martini' | 'coupe' | 
  'flute' | 'hurricane' | 'margarita' | 'mug' | 
  'shot' | 'collins' | 'wine' | 'other';

// Catégories de cocktails
export type CocktailCategory = 
  'classic' | 'modern' | 'tiki' | 'sour' | 
  'highball' | 'fizz' | 'frozen' | 'hot' | 
  'punch' | 'martini' | 'other';

// Méthode de préparation
export type PreparationMethod = 
  'shaken' | 'stirred' | 'built' | 'blended' | 
  'layered' | 'muddled' | 'hot-build' | 'other';

// Unités de mesure pour les ingrédients
export type MeasurementUnit = 
  'ml' | 'cl' | 'oz' | 'dash' | 'drop' | 
  'part' | 'barspoon' | 'splash' | 'pinch' | 'piece';

/**
 * Interface pour un ingrédient de cocktail
 */
export interface CocktailIngredient {
  id: string;
  spiritId?: string; // ID de référence à un spiritueux de la collection
  name: string;
  amount: number;
  unit: MeasurementUnit;
  isOptional: boolean;
  substitute?: string; // Alternative possible
}

/**
 * Interface principale pour un cocktail
 */
export interface Cocktail {
  id: string;
  name: string;
  category: CocktailCategory;
  glassType: GlassType;
  ingredients: CocktailIngredient[];
  garnish: string | null;
  preparation: string;
  preparationMethod: PreparationMethod;
  image: string | null;
  isCustom: boolean; // Indique si c'est une création personnelle
  isFavorite: boolean;
  notes: string | null;
  tags: string[] | null;
  rating: number | null; // Note sur 5
  difficulty: 'easy' | 'medium' | 'hard';
  userId: string; // ID de l'utilisateur propriétaire
  createdAt: string; // Format ISO
  updatedAt: string; // Format ISO
}

/**
 * Interface pour les suggestions de cocktails
 */
export interface CocktailSuggestion {
  id?: string;
  name: string;
  category: CocktailCategory;
  ingredients: {
    name: string;
    amount: number;
    unit: MeasurementUnit;
    isAvailable: boolean; // Indique si l'ingrédient est disponible dans la collection
  }[];
  preparation: string;
  glassType: GlassType;
  difficulty: 'easy' | 'medium' | 'hard';
  matchScore: number; // Score de correspondance avec la collection (0-100)
}

/**
 * Interface pour une version simplifiée du cocktail (liste, aperçu, etc.)
 */
export interface CocktailSummary {
  id: string;
  name: string;
  category: CocktailCategory;
  mainSpirit: string;
  ingredients: number; // Nombre d'ingrédients
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number | null;
  image: string | null;
  isFavorite: boolean;
}

/**
 * Interface pour les filtres de recherche des cocktails
 */
export interface CocktailFilter {
  categories?: CocktailCategory[];
  spiritTypes?: string[];
  ingredients?: string[];
  difficulty?: ('easy' | 'medium' | 'hard')[];
  rating?: number;
  availableOnly?: boolean; // Filtrer uniquement les cocktails réalisables avec la collection
  searchTerm?: string;
  tags?: string[];
}