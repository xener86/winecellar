// app/spirits/hooks/useMixologyData.ts

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Cocktail, 
  CocktailSuggestion, 
  CocktailFilter 
} from '@/utils/types/cocktail.types';
import { Spirit } from '@/utils/types/spirit.types';
import MixologyService from '@/services/MixologyService';
import SpiritAIService from '@/services/SpiritAIService';

/**
 * Hook personnalisé pour gérer les données de mixologie
 */
export const useMixologyData = () => {
  const router = useRouter();
  const { showNotification } = useNotifications();
  
  // États
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [suggestions, setSuggestions] = useState<CocktailSuggestion[]>([]);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cocktailLoading, setCocktailLoading] = useState(false);
  const [service, setService] = useState<MixologyService | null>(null);
  
  // Initialisation du service de mixologie
  useEffect(() => {
    const initService = async () => {
      try {
        // Récupérer la clé API pour le service IA
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;
        
        const { data, error } = await supabase
          .from('user_preferences')
          .select('openai_api_key, mistral_api_key')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erreur récupération clés API:', error);
          return;
        }
        
        let aiService: SpiritAIService | undefined;
        
        // Initialiser le service AI si une clé API est disponible
        if (data?.openai_api_key) {
          aiService = new SpiritAIService({
            apiKey: data.openai_api_key,
            apiProvider: 'openai'
          });
        } else if (data?.mistral_api_key) {
          aiService = new SpiritAIService({
            apiKey: data.mistral_api_key,
            apiProvider: 'mistral'
          });
        }
        
        // Initialiser le service de mixologie
        const mixologyService = new MixologyService(supabase, aiService);
        setService(mixologyService);
      } catch (error) {
        console.error('Error initializing mixology service:', error);
      }
    };
    
    initService();
  }, []);
  
  /**
   * Récupère tous les cocktails de l'utilisateur
   * @param filter Options de filtrage
   */
  const fetchCocktails = useCallback(async (filter?: CocktailFilter) => {
    if (!service) return;
    
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        setLoading(false);
        return;
      }
      
      const data = await service.getCocktails(user.id, filter);
      setCocktails(data);
    } catch (error: unknown) {
      console.error('Exception fetchCocktails:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement cocktails'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [service, router, showNotification]);
  
  /**
   * Génère des suggestions de cocktails basées sur la collection de spiritueux
   * @param spirits Collection de spiritueux
   */
  const generateSuggestions = useCallback(async (spirits: Spirit[]) => {
    if (!service) return;
    
    setLoading(true);
    try {
      const suggestions = await service.suggestCocktailsFromCollection(spirits);
      setSuggestions(suggestions);
    } catch (error: unknown) {
      console.error('Exception generateSuggestions:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur génération suggestions'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [service, showNotification]);
  
  /**
   * Crée un nouveau cocktail
   * @param cocktailData Données du cocktail
   */
  const createCocktail = useCallback(async (cocktailData: Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!service) return null;
    
    setCocktailLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        setCocktailLoading(false);
        return null;
      }
      
      const cocktailId = await service.saveCocktail(cocktailData, user.id);
      
      // Actualiser la liste des cocktails
      fetchCocktails();
      
      showNotification('Cocktail créé avec succès', 'success');
      setCocktailLoading(false);
      return cocktailId;
    } catch (error: unknown) {
      console.error('Exception createCocktail:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur création cocktail'}`,
        'error'
      );
      setCocktailLoading(false);
      return null;
    }
  }, [service, router, showNotification, fetchCocktails]);
  
  /**
   * Met à jour un cocktail existant
   * @param id ID du cocktail
   * @param updates Modifications à appliquer
   */
  const updateCocktail = useCallback(async (id: string, updates: Partial<Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    if (!service) return false;
    
    setCocktailLoading(true);
    try {
      await service.updateCocktail(id, updates);
      
      // Mettre à jour l'état local
      setCocktails(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      
      // Mettre à jour le cocktail sélectionné si nécessaire
      if (selectedCocktail?.id === id) {
        setSelectedCocktail(prev => prev ? { ...prev, ...updates } : null);
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
  }, [service, showNotification, selectedCocktail]);
  
  /**
   * Supprime un cocktail
   * @param id ID du cocktail
   */
  const deleteCocktail = useCallback(async (id: string) => {
    if (!service) return false;
    
    try {
      // Confirmation de suppression
      const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce cocktail ?");
      if (!confirmDelete) return false;
      
      await service.deleteCocktail(id);
      
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
  }, [service, showNotification, selectedCocktail]);
  
  /**
   * Génère un cocktail avec l'IA
   * @param ingredients Liste d'ingrédients disponibles
   */
  const generateCocktailWithAI = useCallback(async (ingredients: string[]) => {
    if (!service) return null;
    
    setCocktailLoading(true);
    try {
      const cocktailData = await service.generateCocktailWithAI(ingredients);
      setCocktailLoading(false);
      return cocktailData;
    } catch (error: unknown) {
      console.error('Exception generateCocktailWithAI:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur génération cocktail'}`,
        'error'
      );
      setCocktailLoading(false);
      return null;
    }
  }, [service, showNotification]);
  
  /**
   * Récupère les cocktails pour un spiritueux spécifique
   * @param spirit Spiritueux
   */
  const getCocktailsForSpirit = useCallback(async (spirit: Spirit) => {
    if (!service) return [];
    
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        setLoading(false);
        return [];
      }
      
      const data = await service.getCocktailsForSpirit(spirit, user.id);
      setLoading(false);
      return data;
    } catch (error: unknown) {
      console.error('Exception getCocktailsForSpirit:', error);
      showNotification(
        `Erreur: ${error instanceof Error ? error.message : 'Erreur chargement cocktails'}`,
        'error'
      );
      setLoading(false);
      return [];
    }
  }, [service, router, showNotification]);
  
  // Effet pour charger les cocktails au démarrage
  useEffect(() => {
    if (service) {
      fetchCocktails();
    }
  }, [service, fetchCocktails]);
  
  return {
    cocktails,
    suggestions,
    selectedCocktail,
    setSelectedCocktail,
    loading,
    cocktailLoading,
    fetchCocktails,
    generateSuggestions,
    createCocktail,
    updateCocktail,
    deleteCocktail,
    generateCocktailWithAI,
    getCocktailsForSpirit
  };
};

export default useMixologyData;