// app/utils/types/spirit.types.ts

/**
 * Types pour le module de gestion des spiritueux
 */

// Types de spiritueux disponibles
export type SpiritType = 'whisky' | 'rum' | 'gin' | 'vodka' | 'tequila' | 'brandy' | 'liqueur' | 'other';

// Niveau de remplissage de la bouteille
export type FillLevel = 'full' | 'threeFourths' | 'half' | 'oneFourth' | 'empty';

// Pays d'origine populaires pour les spiritueux (extensible)
export type SpiritCountry = 
  'france' | 'scotland' | 'ireland' | 'usa' | 'canada' | 'japan' | 
  'mexico' | 'cuba' | 'jamaica' | 'barbados' | 'other';

/**
 * Interface principale pour un spiritueux
 */
export interface Spirit {
  id: string;
  name: string;
  type: SpiritType;
  subType: string | null;
  abv: number; // Alcohol By Volume (%)
  volume: number; // Volume en ml
  origin: {
    country: string;
    region: string | null;
    distillery: string | null;
  };
  age: number | null; // Âge en années
  vintage: number | null; // Année de distillation
  details: {
    color: string | null;
    finish: string | null; // Type de fût pour la finition
    tastingNotes: string[] | null; // Notes de dégustation
    ingredients: string[] | null; // Ingrédients principaux
  };
  acquisition: {
    date: string; // Format ISO
    price: number | null;
    store: string | null;
  };
  storage: {
    locationId: string | null;
    position: {
      id: string | null;
      row: number | null;
      column: number | null;
    };
    fillLevel: FillLevel;
  };
  bottleImage: string | null;
  notes: string | null;
  customTags: string[] | null;
  userId: string; // ID de l'utilisateur propriétaire
  createdAt: string; // Format ISO
  updatedAt: string; // Format ISO
}

/**
 * Interface pour les emplacements de stockage spécifiques aux spiritueux
 * Étend le type StorageLocation existant
 */
export interface SpiritStorageLocation {
  id: string;
  name: string;
  type: 'bar' | 'cabinet' | 'display' | 'cellar' | 'other';
  layout: 'grid' | 'shelf' | 'custom';
  rowCount: number | null;
  columnCount: number | null;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour les positions des spiritueux dans un emplacement de stockage
 */
export interface SpiritPosition {
  id: string;
  storageLocationId: string;
  rowPosition: number;
  columnPosition: number;
  spiritId: string | null; // ID du spiritueux à cette position
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour une version simplifiée du spiritueux (liste, aperçu, etc.)
 */
export interface SpiritSummary {
  id: string;
  name: string;
  type: SpiritType;
  abv: number;
  age: number | null;
  distillery: string | null;
  country: string;
  bottleImage: string | null;
  fillLevel: FillLevel;
}

/**
 * Interface pour les filtres de recherche des spiritueux
 */
export interface SpiritFilter {
  types?: SpiritType[];
  countries?: string[];
  ageMin?: number;
  ageMax?: number;
  abvMin?: number;
  abvMax?: number;
  searchTerm?: string;
  tags?: string[];
}