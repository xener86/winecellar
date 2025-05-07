// app/services/MixologyService.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Cocktail, 
  CocktailSuggestion, 
  CocktailFilter 
} from '@/utils/types/cocktail.types';
import { Spirit } from '@/utils/types/spirit.types';
import SpiritAIService from '@/services/SpiritAIService';

// Interface for MixologyService
export interface IMixologyService {
  getCocktails(userId: string, filter?: CocktailFilter): Promise<Cocktail[]>;
  suggestCocktailsFromCollection(spirits: Spirit[]): Promise<CocktailSuggestion[]>;
  saveCocktail(cocktailData: Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string>;
  updateCocktail(id: string, updates: Partial<Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  deleteCocktail(id: string): Promise<void>;
  generateCocktailWithAI(ingredients: string[]): Promise<Partial<Cocktail> | null>;
  getCocktailsForSpirit(spirit: Spirit, userId: string): Promise<Cocktail[]>;
}

class MixologyService implements IMixologyService {
  private supabase: SupabaseClient;
  private aiService?: SpiritAIService;

  constructor(supabaseClient: SupabaseClient, aiService?: SpiritAIService) {
    this.supabase = supabaseClient;
    this.aiService = aiService;
  }

  /**
   * Récupère les cocktails de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param filter Options de filtrage
   * @returns Liste de cocktails
   */
  async getCocktails(userId: string, filter?: CocktailFilter): Promise<Cocktail[]> {
    // Construire la requête de base
    let query = this.supabase
      .from('cocktails')
      .select('*')
      .eq('user_id', userId);
    
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
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transformer les données pour le format attendu
    const formattedCocktails = data.map((item): Cocktail => ({
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
    
    return formattedCocktails;
  }

  /**
   * Génère des suggestions de cocktails basées sur les spiritueux disponibles
   * @param spirits Liste de spiritueux
   * @returns Liste de suggestions
   */
  async suggestCocktailsFromCollection(spirits: Spirit[]): Promise<CocktailSuggestion[]> {
    // Pour l'instant, retourne une liste vide
    // Cette méthode sera implémentée ultérieurement
    console.log(`Suggestion basée sur ${spirits.length} spiritueux`);
    return [];
  }

  /**
   * Sauvegarde un nouveau cocktail
   * @param cocktailData Données du cocktail
   * @param userId ID de l'utilisateur
   * @returns ID du cocktail créé
   */
  async saveCocktail(
    cocktailData: Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, 
    userId: string
  ): Promise<string> {
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
      user_id: userId,
      created_at: now,
      updated_at: now
    };
    
    const { data, error } = await this.supabase
      .from('cocktails')
      .insert(dbCocktailData)
      .select()
      .single();
    
    if (error) throw error;
    
    return data.id;
  }

  /**
   * Met à jour un cocktail existant
   * @param id ID du cocktail
   * @param updates Modifications à appliquer
   */
  async updateCocktail(
    id: string, 
    updates: Partial<Omit<Cocktail, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
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
    
    const { error } = await this.supabase
      .from('cocktails')
      .update(dbUpdates)
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Supprime un cocktail
   * @param id ID du cocktail
   */
  async deleteCocktail(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('cocktails')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Génère un cocktail avec l'IA
   * @param ingredients Liste d'ingrédients
   * @returns Données du cocktail généré
   */
  async generateCocktailWithAI(ingredients: string[]): Promise<Partial<Cocktail> | null> {
    // Cette fonctionnalité nécessite l'implémentation du service AI
    // Pour l'instant, retourne null
    console.log(`Génération d'un cocktail avec ${ingredients.length} ingrédients`);
    return null;
  }

  /**
   * Récupère les cocktails utilisant un spiritueux spécifique
   * @param spirit Le spiritueux
   * @param userId ID de l'utilisateur
   * @returns Liste de cocktails
   */
  async getCocktailsForSpirit(spirit: Spirit, userId: string): Promise<Cocktail[]> {
    // Appeler l'API pour récupérer les cocktails
    try {
      console.log(`Recherche de cocktails pour l'utilisateur ${userId}`);
      
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
      
      const data = await response.json();
      return data as Cocktail[];
    } catch (error) {
      console.error('Erreur récupération cocktails pour spiritueux:', error);
      throw error;
    }
  }
}

export default MixologyService;