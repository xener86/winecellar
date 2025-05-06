// app/hooks/useMixologyData.ts

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Cocktail, 
  CocktailFilter 
} from '@/utils/types/cocktail.types';
import { Spirit } from '@/utils/types/spirit.types';

/**
 * Hook personnalisé pour gérer les données de mixologie
 */
export const useMixologyData = () => {
  const router = useRouter();
  const { showNotification } = useNotifications();
  
  // États
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cocktailLoading, setCocktailLoading] = useState(false);
  
  /**
   * Récupère tous les cocktails de l'utilisateur
   * @param filter Options de filtrage
   */
  const fetchCocktails = useCallback(async (filter?: CocktailFilter) => {
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
        .from('cocktails')
        .select('*')
        .eq('user_id', user.id);
      
      // Appliquer les filtres si présents
      if (filter) {
        if (filter.categories && filter.categories.length > 0) {
          query = query.in('category', filter.categories);
        }
        
        if (filter.difficulty && filter.difficulty.length > 0) {
          query = query.in('difficulty', filter.difficulty);
        }
        
        if (filter.searchTerm) {
          query = query.or(
            `name.ilike.%${filter.searchTerm}%,category.ilike.%${filter.searchTerm}%`
          );
        }
      }
      
      const { data: cocktailData, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transformer les données pour le format attendu
      const formattedCocktails = cocktailData.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        glassType: item.glass_type,
        ingredients: item.ingredients || [],
        garnish: item.garnish,
        preparation: item.preparation,
        preparationMethod: item.preparation_method,
        image: item.image,
        isCustom: item.is_custom,
        isFavorite: item.is_favorite,
        notes: item.notes,
        tags: item.tags,
        rating: item.rating,
        difficulty: item.difficulty,
        userId: item.user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setCocktails(formattedCocktails);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Exception fetchCocktails:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement cocktails'}`,
        'error'
      );
      setLoading(false);
    }
  }, [router, showNotification]);

  /**
   * Crée un nouveau cocktail
   * @param cocktailData Données du cocktail
   */
  const createCocktail = useCallback(async (cocktailData: Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    setCocktailLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        setCocktailLoading(false);
        return null;
      }
      
      const now = new Date().toISOString();
      
      // Transformer les données pour le format de la base de données
      const dbCocktailData = {
        name: cocktailData.name,
        category: cocktailData.category,
        glass_type: cocktailData.glassType,
        ingredients: cocktailData.ingredients,
        garnish: cocktailData.garnish,
        preparation: cocktailData.preparation,
        preparation_method: cocktailData.preparationMethod,
        image: cocktailData.image,
        is_custom: cocktailData.isCustom,
        is_favorite: cocktailData.isFavorite,
        notes: cocktailData.notes,
        tags: cocktailData.tags,
        rating: cocktailData.rating,
        difficulty: cocktailData.difficulty,
        user_id: user.id,
        created_at: now,
        updated_at: now
      };
      
      const { data: newCocktail, error } = await supabase
        .from('cocktails')
        .insert(dbCocktailData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Actualiser la liste des cocktails
      fetchCocktails();
      
      showNotification('Cocktail créé avec succès', 'success');
      setCocktailLoading(false);
      return newCocktail.id;
    } catch (error: unknown) {
      console.error('Exception createCocktail:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur création cocktail'}`,
        'error'
      );
      setCocktailLoading(false);
      return null;
    }
  }, [router, showNotification, fetchCocktails]);

  /**
   * Met à jour un cocktail existant
   * @param id ID du cocktail
   * @param updates Modifications à appliquer
   */
  const updateCocktail = useCallback(async (id: string, updates: Partial<Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    setCocktailLoading(true);
    try {
      const now = new Date().toISOString();
      
      // Transformer les données pour le format de la base de données
      const dbUpdates: Record<string, unknown> = {
        updated_at: now
      };
      
      // Mapper les propriétés
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.glassType !== undefined) dbUpdates.glass_type = updates.glassType;
      if (updates.ingredients !== undefined) dbUpdates.ingredients = updates.ingredients;
      if (updates.garnish !== undefined) dbUpdates.garnish = updates.garnish;
      if (updates.preparation !== undefined) dbUpdates.preparation = updates.preparation;
      if (updates.preparationMethod !== undefined) dbUpdates.preparation_method = updates.preparationMethod;
      if (updates.image !== undefined) dbUpdates.image = updates.image;
      if (updates.isCustom !== undefined) dbUpdates.is_custom = updates.isCustom;
      if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
      if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
      
      const { error } = await supabase
        .from('cocktails')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setCocktails(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            ...updates,
            updatedAt: now
          };
        }
        return c;
      }));
      
      // Mettre à jour le cocktail sélectionné si nécessaire
      if (selectedCocktail?.id === id) {
        setSelectedCocktail(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...updates,
            updatedAt: now
          };
        });
      }
      
      showNotification('Cocktail mis à jour avec succès', 'success');
      setCocktailLoading(false);
      return true;
    } catch (error: unknown) {
      console.error('Exception updateCocktail:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur mise à jour cocktail'}`,
        'error'
      );
      setCocktailLoading(false);
      return false;
    }
  }, [showNotification, selectedCocktail]);

  /**
   * Supprime un cocktail
   * @param id ID du cocktail
   */
  const deleteCocktail = useCallback(async (id: string) => {
    try {
      // Confirmation de suppression
      const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce cocktail ?");
      if (!confirmDelete) return false;
      
      const { error } = await supabase
        .from('cocktails')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setCocktails(prev => prev.filter(c => c.id !== id));
      
      // Réinitialiser le cocktail sélectionné si nécessaire
      if (selectedCocktail?.id === id) {
        setSelectedCocktail(null);
      }
      
      showNotification('Cocktail supprimé avec succès', 'success');
      return true;
    } catch (error: unknown) {
      console.error('Exception deleteCocktail:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur suppression cocktail'}`,
        'error'
      );
      return false;
    }
  }, [showNotification, selectedCocktail]);

  /**
   * Génère des suggestions de cocktails
   * @param spirits Collection de spiritueux
   */
  const generateSuggestions = useCallback(async (spirits: Spirit[]) => {
    // Cette fonction est un placeholder pour le moment
    // Dans une implémentation réelle, elle ferait appel à l'API pour générer des suggestions
    console.log("Génération de suggestions basées sur", spirits.length, "spiritueux");
    return [];
  }, []);

  /**
   * Récupère les cocktails pour un spiritueux spécifique
   * @param spirit Spiritueux
   */
  const getCocktailsForSpirit = useCallback(async (spirit: Spirit) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return [];
      }
      
      // Appeler l'API pour récupérer les cocktails associés à ce spiritueux
      const response = await fetch('/api/cocktails/by-spirit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spiritId: spirit.id,
          spiritType: spirit.type
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const responseData = await response.json();
      return responseData as Cocktail[];
    } catch (error: unknown) {
      console.error('Exception getCocktailsForSpirit:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement cocktails'}`,
        'error'
      );
      return [];
    }
  }, [router, showNotification]);

  return {
    cocktails,
    suggestions: [], // Placeholder pour les suggestions
    selectedCocktail,
    setSelectedCocktail,
    loading,
    cocktailLoading,
    fetchCocktails,
    generateSuggestions,
    createCocktail,
    updateCocktail,
    deleteCocktail,
    getCocktailsForSpirit
  };
};

export default useMixologyData;