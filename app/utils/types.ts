// app/utils/types.ts
// Fichier existant avec ajout des types pour le gestionnaire de bouteilles

// ---------------------------------------------
// Domaine : Vins
// ---------------------------------------------

export interface Wine {
  id: string;
  name: string;
  color: 'red' | 'white' | 'rose' | 'sparkling' | 'fortified';
  vintage: number | null;
  region: string | null;
  country?: string;
  domain: string | null;
  appellation: string | null;
  grapes?: string[];
  alcohol_percentage: number | null;
}

export interface DBWine {
  id: string;
  name: string;
  color?: string;
  vintage?: number;
  domain?: string;
  region?: string;
  appellation?: string;
  country?: string;
}

// Alias pour supporter la rétrocompatibilité
export type WineObject = DBWine;

// ---------------------------------------------
// Domaine : Bouteilles
// ---------------------------------------------

// Correction de l'interface Bottle
export interface Bottle {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  acquisition_date: string | null;
  consumption_date: string | null;
  tasting_note: string | null;
  note?: number;
  comment?: string;
  label?: string | null; // Modification ici: accepter null en plus de undefined
  quantity?: number;
  wine?: Wine;
  position?: Position;
  crate_id?: string | null; // Ajout pour le gestionnaire de bouteilles
}

export interface BottleMatch {
  bottle_id: string;
  wine_id: string;
  wine: DBWine;
  match_quality: 'perfect' | 'good' | 'alternative';
  explanation: string;
}

// ---------------------------------------------
// Domaine : Emplacements / Caves
// ---------------------------------------------

export interface Position {
  id: string;
  storage_location_id: string;
  row_position: number;
  column_position: number;
  qr_code: string | null;
}

export interface StorageLocation {
  id: string;
  name: string;
  type: string;
  row_count: number | null;
  column_count: number | null;
  description?: string;
}

// ---------------------------------------------
// Domaine : AI / Recommandations
// ---------------------------------------------

export interface WineRecommendation {
  wine_type: string;
  grape?: string;
  characteristics?: string;
  pairing_type: 'classic' | 'audacious' | 'heart'; // Obligatoire maintenant
  explanation?: string; // Ajout pour WineRecommendations
  food?: string; // Ajout pour la compatibilité avec WinePairingService
}

export interface CellarMatch {
  recommendation: WineRecommendation;
  matches: BottleMatch[];
}

export interface WineAgingInfo {
  current_phase?: string;
  drink_now?: boolean;
  peak_start_year?: number;
  peak_end_year?: number;
  best_before?: string;
  ideal_consumption_window?: string;
}

// ---------------------------------------------
// Domaine : API et Configuration
// ---------------------------------------------

export interface ApiKeys {
  openai: string;
  mistral: string;
  [key: string]: string;
}

export interface PairingOptions {
  apiKey: string;
  apiProvider: "openai" | "mistral";
}

// ---------------------------------------------
// Domaine : Modes d'affichage et filtres
// ---------------------------------------------

export type PairingMode = 'all' | 'classic' | 'audacious' | 'merchant' | 'heart';
export type SourceMode = 'all' | 'cellar' | 'store';

// ---------------------------------------------
// Domaine : Accords Mets & Vins
// ---------------------------------------------

export interface FoodPairing {
  id?: string;
  food: string;
  wine_id?: string;
  pairing_type: 'classic' | 'audacious' | 'heart';
  wine: DBWine;
  saved?: boolean;
  rating?: number;
  user_rating?: number; // Ajout pour compatibilité avec le composant
  explanation?: string; // Ajout pour le composant WinePairingSuggestions
}

export interface Pairing {
  id: string;
  food: string;
  wine_id: string;
  pairing_type: 'classic' | 'audacious' | 'heart';
}

// ---------------------------------------------
// Domaine : Interface Utilisateur / UI
// ---------------------------------------------

export interface FilterOptions {
  colors: string[];
  labels: string[];
  vintage: { min: number | null; max: number | null };
  searchTerm: string;
}

export interface CustomLabel {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export interface ServiceTemperature {
  range: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}

export interface Notification {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// ---------------------------------------------
// Domaine : Gestionnaire de bouteilles
// ---------------------------------------------

// Interface pour les données de vin utilisées dans le gestionnaire de bouteilles
export interface WineData {
  name: string;
  vintage: number | null;
  region: string;
  appellation: string;
  domain: string;
  color: string;
  alcohol_percentage: number | null;
  grapes: string[];
  notes: string;
}

// Interface pour les informations de couleur du vin
export interface WineColorInfo {
  label: string;
  bgColor: string;
  textColor: string;
}

// Props communes pour les composants d'onglets du gestionnaire de bouteilles
export interface CommonTabProps {
  position: Position | null;
  apiKey?: string;
  onSuccess: () => void;
  showNotification: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

// Props pour le composant principal du gestionnaire de bouteilles
export interface BottleManagerProps {
  open: boolean;
  onClose: () => void;
  position: Position | null;
  onBottleAdded: () => void;
  apiKey?: string;
}