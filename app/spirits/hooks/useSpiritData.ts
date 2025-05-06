// app/spirits/hooks/useSpiritData.ts

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Spirit, SpiritType, SpiritFilter, SpiritStorageLocation } from '@/utils/types/spirit.types';
import { useNotifications } from '@/hooks/useNotifications';

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
        .eq('userId', user.id);
      
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
            `name.ilike.%${filter.searchTerm}%,subType.ilike.%${filter.searchTerm}%,origin->>distillery.ilike.%${filter.searchTerm}%`
          );
        }
        
        if (filter.tags && filter.tags.length > 0) {
          // Recherche sur un tableau de tags
          // Note: cette syntaxe peut varier selon la configuration de Postgrest
          query = query.contains('customTags', filter.tags);
        }
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setSpirits(data || []);
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
        .eq('userId', user.id)
        .order('name');
      
      if (error) throw error;
      
      setStorageLocations(data || []);
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
      
      const { data, error } = await supabase
        .from('spirits')
        .insert({
          ...spirit,
          userId: user.id,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setSpirits(prev => [data, ...prev]);
      
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
      
      const { data, error } = await supabase
        .from('spirits')
        .update({
          ...updates,
          updatedAt: now
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setSpirits(prev => prev.map(s => s.id === id ? data : s));
      
      // Mettre à jour le spiritueux sélectionné si nécessaire
      if (selectedSpirit?.id === id) {
        setSelectedSpirit(data);
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