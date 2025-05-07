// app/spirits/hooks/useSpiritData.ts

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Spirit, SpiritFilter, SpiritStorageLocation } from '@/utils/types/spirit.types';
import { useNotifications } from '@/hooks/useNotifications';

// Interfaces pour les données en snake_case provenant de Supabase
interface DbSpirit {
  id: string;
  name: string;
  type: string;
  sub_type: string | null;
  abv: number;
  volume: number | null;
  origin: {
    country: string;
    region: string | null;
    distillery: string | null;
  };
  age: number | null;
  vintage: number | null;
  details: {
    color: string | null;
    finish: string | null;
    tastingNotes: string[] | null;
    ingredients: string[] | null;
  };
  acquisition: {
    date: string | null;
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
    fillLevel: string;
  };
  bottle_image: string | null;
  notes: string | null;
  custom_tags: string[] | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface DbStorageLocation {
  id: string;
  name: string;
  type: string;
  layout: string;
  row_count: number | null;
  column_count: number | null;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Interface pour les mises à jour en snake_case
interface DbSpiritUpdates {
  name?: string;
  type?: string;
  sub_type?: string | null;
  abv?: number;
  volume?: number | null;
  origin?: object;
  age?: number | null;
  vintage?: number | null;
  details?: object;
  acquisition?: object;
  storage?: object;
  bottle_image?: string | null;
  notes?: string | null;
  custom_tags?: string[] | null;
  updated_at: string;
}

/**
 * Hook personnalisé pour gérer les données des spiritueux
 */
export const useSpiritData = () => {
  const router = useRouter();
  const { showNotification } = useNotifications();
  
  // États
  const [spirits, setSpirits] = useState<Spirit[]>([]);
  const [storageLocations, setStorageLocations] = useState<SpiritStorageLocation[]>([]);
  const [selectedSpirit, setSelectedSpirit] = useState<Spirit | null>(null);
  const [loading, setLoading] = useState(true);
  const [spiritLoading, setSpiritLoading] = useState(false);
  
  /**
   * Récupère la liste des spiritueux de l'utilisateur
   * @param filter Options de filtrage
   */
  const fetchSpirits = useCallback(async (filter?: SpiritFilter) => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        setLoading(false);
        return;
      }

      // Construire la requête de base
      let query = supabase
        .from('spirits')
        .select('*')
        .eq('user_id', user.id); // Utilisation de snake_case
      
      // Appliquer les filtres si présents
      if (filter) {
        if (filter.types && filter.types.length > 0) {
          query = query.in('type', filter.types);
        }
        
        if (filter.countries && filter.countries.length > 0) {
          query = query.in('origin->>country', filter.countries);
        }
        
        if (filter.ageMin !== undefined) {
          query = query.gte('age', filter.ageMin);
        }
        
        if (filter.ageMax !== undefined) {
          query = query.lte('age', filter.ageMax);
        }
        
        if (filter.abvMin !== undefined) {
          query = query.gte('abv', filter.abvMin);
        }
        
        if (filter.abvMax !== undefined) {
          query = query.lte('abv', filter.abvMax);
        }
        
        if (filter.searchTerm) {
          query = query.or(
            `name.ilike.%${filter.searchTerm}%,sub_type.ilike.%${filter.searchTerm}%,origin->>distillery.ilike.%${filter.searchTerm}%`
          );
        }
        
        if (filter.tags && filter.tags.length > 0) {
          // Recherche sur un tableau de tags
          query = query.contains('custom_tags', filter.tags);
        }
      }
      
      // Utiliser la syntaxe correcte pour l'ordre
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Convertir les données de snake_case à camelCase
      const typedSpirits: Spirit[] = (data || []).map((item: DbSpirit) => {
        // Convertir les objets JSON qui sont stockés comme chaînes
        let origin = item.origin;
        let details = item.details;
        let acquisition = item.acquisition;
        let storage = item.storage;
        
        if (typeof origin === 'string') origin = JSON.parse(origin);
        if (typeof details === 'string') details = JSON.parse(details);
        if (typeof acquisition === 'string') acquisition = JSON.parse(acquisition);
        if (typeof storage === 'string') storage = JSON.parse(storage);
        
        // S'assurer que toutes les propriétés correspondent exactement au type Spirit
        return {
          id: item.id,
          name: item.name,
          type: item.type as Spirit['type'],
          subType: item.sub_type,
          // Garantir que volume est un nombre (utiliser 0 comme valeur par défaut si null)
          abv: item.abv,
          volume: item.volume ?? 0,
          origin,
          age: item.age,
          vintage: item.vintage,
          details,
          acquisition,
          storage,
          bottleImage: item.bottle_image,
          notes: item.notes,
          customTags: item.custom_tags,
          userId: item.user_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        };
      });
      
      setSpirits(typedSpirits);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Exception fetchSpirits:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement spiritueux'}`,
        'error'
      );
      setLoading(false);
    }
  }, [router, showNotification]);

  /**
   * Récupère les emplacements de stockage des spiritueux
   */
  const fetchStorageLocations = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('spirit_storage_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Convertir les données de snake_case à camelCase
      const typedLocations: SpiritStorageLocation[] = (data || []).map((item: DbStorageLocation) => {
        return {
          id: item.id,
          name: item.name,
          type: item.type as SpiritStorageLocation['type'],
          layout: item.layout as SpiritStorageLocation['layout'],
          rowCount: item.row_count,
          columnCount: item.column_count,
          description: item.description,
          userId: item.user_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        };
      });
      
      setStorageLocations(typedLocations);
    } catch (error: unknown) {
      console.error('Exception fetchStorageLocations:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement emplacements'}`,
        'error'
      );
    }
  }, [router, showNotification]);

  /**
   * Ajoute un nouveau spiritueux
   * @param spirit Données du spiritueux à ajouter
   */
  const addSpirit = async (spirit: Omit<Spirit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    setSpiritLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        setSpiritLoading(false);
        return null;
      }
      
      const now = new Date().toISOString();
      
      // Convertir de camelCase à snake_case pour la base de données
      const processedSpirit = {
        name: spirit.name,
        type: spirit.type,
        sub_type: spirit.subType,
        abv: spirit.abv,
        volume: spirit.volume,
        origin: spirit.origin,
        age: spirit.age,
        vintage: spirit.vintage,
        details: spirit.details,
        acquisition: spirit.acquisition,
        storage: spirit.storage,
        bottle_image: spirit.bottleImage,
        notes: spirit.notes,
        custom_tags: spirit.customTags,
        user_id: user.id,
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('spirits')
        .insert(processedSpirit)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convertir le résultat de snake_case à camelCase
      const newSpirit: Spirit = {
        id: data.id,
        name: data.name,
        type: data.type,
        subType: data.sub_type,
        abv: data.abv,
        volume: data.volume,
        origin: data.origin,
        age: data.age,
        vintage: data.vintage,
        details: data.details,
        acquisition: data.acquisition,
        storage: data.storage,
        bottleImage: data.bottle_image,
        notes: data.notes,
        customTags: data.custom_tags,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      // Mettre à jour l'état local
      setSpirits(prev => [newSpirit, ...prev]);
      
      showNotification('Spiritueux ajouté avec succès', 'success');
      setSpiritLoading(false);
      return data.id;
    } catch (error: unknown) {
      console.error('Exception addSpirit:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur ajout spiritueux'}`,
        'error'
      );
      setSpiritLoading(false);
      return null;
    }
  };

  /**
   * Met à jour un spiritueux existant
   * @param id ID du spiritueux à mettre à jour
   * @param updates Modifications à appliquer
   */
  const updateSpirit = async (id: string, updates: Partial<Omit<Spirit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    setSpiritLoading(true);
    try {
      const now = new Date().toISOString();
      
      // Convertir de camelCase à snake_case pour la base de données
      const processedUpdates: DbSpiritUpdates = {
        updated_at: now
      };
      
      if (updates.name !== undefined) processedUpdates.name = updates.name;
      if (updates.type !== undefined) processedUpdates.type = updates.type;
      if (updates.subType !== undefined) processedUpdates.sub_type = updates.subType;
      if (updates.abv !== undefined) processedUpdates.abv = updates.abv;
      if (updates.volume !== undefined) processedUpdates.volume = updates.volume;
      if (updates.origin !== undefined) processedUpdates.origin = updates.origin;
      if (updates.age !== undefined) processedUpdates.age = updates.age;
      if (updates.vintage !== undefined) processedUpdates.vintage = updates.vintage;
      if (updates.details !== undefined) processedUpdates.details = updates.details;
      if (updates.acquisition !== undefined) processedUpdates.acquisition = updates.acquisition;
      if (updates.storage !== undefined) processedUpdates.storage = updates.storage;
      if (updates.bottleImage !== undefined) processedUpdates.bottle_image = updates.bottleImage;
      if (updates.notes !== undefined) processedUpdates.notes = updates.notes;
      if (updates.customTags !== undefined) processedUpdates.custom_tags = updates.customTags;
      
      const { data, error } = await supabase
        .from('spirits')
        .update(processedUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convertir le résultat de snake_case à camelCase
      const updatedSpirit: Spirit = {
        id: data.id,
        name: data.name,
        type: data.type,
        subType: data.sub_type,
        abv: data.abv,
        volume: data.volume,
        origin: data.origin,
        age: data.age,
        vintage: data.vintage,
        details: data.details,
        acquisition: data.acquisition,
        storage: data.storage,
        bottleImage: data.bottle_image,
        notes: data.notes,
        customTags: data.custom_tags,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      // Mettre à jour l'état local
      setSpirits(prev => prev.map(s => s.id === id ? updatedSpirit : s));
      
      // Mettre à jour le spiritueux sélectionné si nécessaire
      if (selectedSpirit?.id === id) {
        setSelectedSpirit(updatedSpirit);
      }
      
      showNotification('Spiritueux mis à jour avec succès', 'success');
      setSpiritLoading(false);
      return true;
    } catch (error: unknown) {
      console.error('Exception updateSpirit:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur mise à jour spiritueux'}`,
        'error'
      );
      setSpiritLoading(false);
      return false;
    }
  };

  /**
   * Supprime un spiritueux
   * @param id ID du spiritueux à supprimer
   */
  const deleteSpirit = async (id: string) => {
    try {
      // Confirmation de suppression
      const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce spiritueux ?");
      if (!confirmDelete) return false;
      
      const { error } = await supabase
        .from('spirits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setSpirits(prev => prev.filter(s => s.id !== id));
      
      // Réinitialiser le spiritueux sélectionné si nécessaire
      if (selectedSpirit?.id === id) {
        setSelectedSpirit(null);
      }
      
      showNotification('Spiritueux supprimé avec succès', 'success');
      return true;
    } catch (error: unknown) {
      console.error('Exception deleteSpirit:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur suppression spiritueux'}`,
        'error'
      );
      return false;
    }
  };

  // Charger les données initiales
  useEffect(() => {
    fetchSpirits();
    fetchStorageLocations();
  }, [fetchSpirits, fetchStorageLocations]);

  return {
    spirits,
    storageLocations,
    selectedSpirit,
    setSelectedSpirit,
    loading,
    spiritLoading,
    fetchSpirits,
    fetchStorageLocations,
    addSpirit,
    updateSpirit,
    deleteSpirit
  };
};

export default useSpiritData;