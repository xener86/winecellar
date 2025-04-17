// File: app/storage/types.ts

// Types d'emplacements
export interface StorageLocation {
  id: string;
  name: string;
  type: string;
  row_count: number | null;
  column_count: number | null;
}

// Positions dans un emplacement
export interface Position {
  id: string;
  storage_location_id: string;
  row_position: number;
  column_position: number;
  qr_code: string | null;
}

// Informations sur le vin
export interface Wine {
  id: string;
  name: string;
  color: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
}

// Bouteille
export interface Bottle {
  id: string;
  wine_id: string;
  position_id: string | null;
  status: string;
  acquisition_date: string | null;
  consumption_date: string | null;
  tasting_note: string | null;
  wine?: Wine;
  position?: Position;
  label?: string;
}

// Options de filtrage
export interface FilterOptions {
  colors: string[];
  labels: string[];
  vintage: { min: number | null; max: number | null };
  searchTerm: string;
}

// Étiquette personnalisée
export interface CustomLabel {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

// Température de service
export interface ServiceTemperature {
  range: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}

// Type de notification
export interface Notification {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}