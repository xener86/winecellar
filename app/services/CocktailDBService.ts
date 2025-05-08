// app/services/CocktailDBService.ts

import { Cocktail, CocktailIngredient, CocktailCategory, GlassType, PreparationMethod, MeasurementUnit } from '@/utils/types/cocktail.types';

/**
 * Options de configuration pour le service CocktailDB
 */
interface CocktailDBOptions {
  apiKey: string;
  language?: 'fr' | 'en';
}

/**
 * Interface pour la réponse de l'API CocktailDB
 */
interface CocktailDBResponse {
  drinks: CocktailDBDrink[] | null;
}

/**
 * Interface pour un cocktail retourné par l'API CocktailDB
 */
interface CocktailDBDrink {
  idDrink: string;
  strDrink: string;
  strDrinkAlternate: string | null;
  strTags: string | null;
  strVideo: string | null;
  strCategory: string;
  strIBA: string | null;
  strAlcoholic: string;
  strGlass: string;
  strInstructions: string;
  strInstructionsES: string | null;
  strInstructionsDE: string | null;
  strInstructionsFR: string | null;
  strInstructionsIT: string | null;
  strDrinkThumb: string | null;
  strIngredient1: string | null;
  strIngredient2: string | null;
  strIngredient3: string | null;
  strIngredient4: string | null;
  strIngredient5: string | null;
  strIngredient6: string | null;
  strIngredient7: string | null;
  strIngredient8: string | null;
  strIngredient9: string | null;
  strIngredient10: string | null;
  strIngredient11: string | null;
  strIngredient12: string | null;
  strIngredient13: string | null;
  strIngredient14: string | null;
  strIngredient15: string | null;
  strMeasure1: string | null;
  strMeasure2: string | null;
  strMeasure3: string | null;
  strMeasure4: string | null;
  strMeasure5: string | null;
  strMeasure6: string | null;
  strMeasure7: string | null;
  strMeasure8: string | null;
  strMeasure9: string | null;
  strMeasure10: string | null;
  strMeasure11: string | null;
  strMeasure12: string | null;
  strMeasure13: string | null;
  strMeasure14: string | null;
  strMeasure15: string | null;
  strImageSource: string | null;
  strImageAttribution: string | null;
  strCreativeCommonsConfirmed: string;
  dateModified: string | null;
}

/**
 * Interface simplifiée pour les cocktails issus du filtre par ingrédient/catégorie
 */
interface CocktailDBFilterResponse {
  drinks: CocktailDBFilterItem[] | null;
}

/**
 * Item de filtre retourné par l'API
 */
interface CocktailDBFilterItem {
  idDrink: string;
  strDrink: string;
  strDrinkThumb: string;
}

/**
 * Service pour interagir avec l'API TheCocktailDB
 */
export default class CocktailDBService {
  private readonly apiKey: string;
  private readonly language: 'fr' | 'en';
  private readonly baseUrl: string;
  
  /**
   * Crée une nouvelle instance du service CocktailDB
   * @param options Options de configuration 
   */
  constructor(options: CocktailDBOptions) {
    this.apiKey = options.apiKey;
    this.language = options.language || 'fr';
    this.baseUrl = `https://www.thecocktaildb.com/api/json/v2/${this.apiKey}`;
  }
  
  /**
   * Recherche des cocktails par nom
   * @param name Nom du cocktail à rechercher
   * @returns Liste des cocktails correspondants
   */
  async searchByName(name: string): Promise<Cocktail[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search.php?s=${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data: CocktailDBResponse = await response.json();
      
      if (!data.drinks) {
        return [];
      }
      
      return data.drinks.map(drink => this.mapApiResponseToCocktail(drink));
    } catch (error) {
      console.error('Erreur searchByName:', error);
      throw error;
    }
  }
  
  /**
   * Récupère un cocktail par son ID
   * @param id ID du cocktail
   * @returns Détails du cocktail ou null si non trouvé
   */
  async getById(id: string): Promise<Cocktail | null> {
    try {
      const response = await fetch(`${this.baseUrl}/lookup.php?i=${id}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data: CocktailDBResponse = await response.json();
      
      if (!data.drinks || data.drinks.length === 0) {
        return null;
      }
      
      return this.mapApiResponseToCocktail(data.drinks[0]);
    } catch (error) {
      console.error('Erreur getById:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les cocktails par ingrédient
   * @param ingredient Nom de l'ingrédient
   * @returns Liste des cocktails utilisant cet ingrédient
   */
  async getByIngredient(ingredient: string): Promise<Cocktail[]> {
    try {
      // Cette requête ne retourne que les IDs et les noms, donc une seconde requête est nécessaire
      const response = await fetch(`${this.baseUrl}/filter.php?i=${encodeURIComponent(ingredient)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data: CocktailDBFilterResponse = await response.json();
      
      if (!data.drinks) {
        return [];
      }
      
      // Récupérer les détails complets pour chaque cocktail trouvé
      const cocktails: Cocktail[] = [];
      for (const drink of data.drinks) {
        try {
          const cocktail = await this.getById(drink.idDrink);
          if (cocktail) {
            cocktails.push(cocktail);
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des détails pour ${drink.strDrink}:`, error);
          // Continuer avec le cocktail suivant
        }
      }
      
      return cocktails;
    } catch (error) {
      console.error('Erreur getByIngredient:', error);
      throw error;
    }
  }
  
  /**
   * Récupère un cocktail aléatoire
   * @returns Un cocktail aléatoire
   */
  async getRandom(): Promise<Cocktail | null> {
    try {
      const response = await fetch(`${this.baseUrl}/random.php`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data: CocktailDBResponse = await response.json();
      
      if (!data.drinks || data.drinks.length === 0) {
        return null;
      }
      
      return this.mapApiResponseToCocktail(data.drinks[0]);
    } catch (error) {
      console.error('Erreur getRandom:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les cocktails par catégorie
   * @param category Nom de la catégorie
   * @returns Liste des cocktails de cette catégorie
   */
  async getByCategory(category: string): Promise<Cocktail[]> {
    try {
      // Cette requête ne retourne que les IDs et les noms, donc une seconde requête est nécessaire
      const response = await fetch(`${this.baseUrl}/filter.php?c=${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data: CocktailDBFilterResponse = await response.json();
      
      if (!data.drinks) {
        return [];
      }
      
      // Récupérer les détails complets pour chaque cocktail trouvé
      const cocktails: Cocktail[] = [];
      for (const drink of data.drinks) {
        try {
          const cocktail = await this.getById(drink.idDrink);
          if (cocktail) {
            cocktails.push(cocktail);
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des détails pour ${drink.strDrink}:`, error);
          // Continuer avec le cocktail suivant
        }
      }
      
      return cocktails;
    } catch (error) {
      console.error('Erreur getByCategory:', error);
      throw error;
    }
  }
  
  /**
   * Convertit la réponse de l'API en objet Cocktail
   * @param drink Données de l'API
   * @returns Objet Cocktail formaté
   */
  private mapApiResponseToCocktail(drink: CocktailDBDrink): Cocktail {
    // Extraire les ingrédients et mesures
    const ingredients: CocktailIngredient[] = [];
    for (let i = 1; i <= 15; i++) {
      const ingredientProp = `strIngredient${i}` as keyof CocktailDBDrink;
      const measureProp = `strMeasure${i}` as keyof CocktailDBDrink;
      
      const ingredient = drink[ingredientProp];
      const measure = drink[measureProp];
      
      if (ingredient && typeof ingredient === 'string' && ingredient.trim()) {
        // Essayer d'extraire la quantité et l'unité du texte de mesure
        let amount = 0;
        let unit: MeasurementUnit = 'part';
        
        if (measure && typeof measure === 'string') {
          const measureText = measure.trim();
          // Tentative d'extraction d'un nombre
          const numberMatch = measureText.match(/(\d+(\.\d+)?)/);
          if (numberMatch) {
            amount = parseFloat(numberMatch[0]);
          }
          
          // Tentative d'extraction d'une unité
          const unitMatch = measureText.match(/([a-zA-Z]+)/);
          if (unitMatch) {
            const extractedUnit = unitMatch[0].toLowerCase();
            
            // Normaliser certaines unités
            if (['oz', 'ounce', 'ounces'].includes(extractedUnit)) {
              unit = 'oz';
            } else if (['cl', 'centiliter', 'centiliters'].includes(extractedUnit)) {
              unit = 'cl';
            } else if (['ml', 'milliliter', 'milliliters'].includes(extractedUnit)) {
              unit = 'ml';
            } else if (['tsp', 'teaspoon', 'teaspoons'].includes(extractedUnit)) {
              unit = 'barspoon';
            } else if (['tbsp', 'tablespoon', 'tablespoons'].includes(extractedUnit)) {
              unit = 'part';
            } else if (['dash', 'dashes'].includes(extractedUnit)) {
              unit = 'dash';
            } else if (['drop', 'drops'].includes(extractedUnit)) {
              unit = 'drop';
            } else {
              unit = 'part'; // Valeur par défaut
            }
          }
        }
        
        ingredients.push({
          id: `ingredient_${Date.now()}_${i}`,
          name: ingredient.trim(),
          amount: amount || 1, // Si impossible d'extraire, utiliser 1 comme valeur par défaut
          unit: unit, 
          isOptional: false
        });
      }
    }

    // Déterminer la catégorie
    let category: CocktailCategory = 'other';
    if (drink.strCategory) {
      const categoryMap: Record<string, CocktailCategory> = {
        'Ordinary Drink': 'classic',
        'Cocktail': 'modern',
        'Shake': 'other',
        'Other/Unknown': 'other',
        'Cocoa': 'other',
        'Shot': 'other',
        'Coffee / Tea': 'hot',
        'Homemade Liqueur': 'other',
        'Punch / Party Drink': 'punch',
        'Beer': 'other',
        'Soft Drink': 'other'
      };
      
      category = categoryMap[drink.strCategory] || 'other';
    }

    // Déterminer le type de verre
    let glassType: GlassType = 'other';
    if (drink.strGlass) {
      const glassMap: Record<string, GlassType> = {
        'Highball glass': 'highball',
        'Cocktail glass': 'martini',
        'Old-fashioned glass': 'lowball',
        'Collins glass': 'collins',
        'Champagne flute': 'flute',
        'Whiskey Glass': 'lowball',
        'Margarita glass': 'margarita',
        'Champagne Glass': 'flute',
        'Martini Glass': 'martini',
        'Wine Glass': 'wine',
        'Hurricane glass': 'hurricane',
        'Coffee mug': 'mug',
        'Shot glass': 'shot',
        'Jar': 'other',
        'Irish coffee cup': 'mug',
        'Punch bowl': 'other',
        'Pitcher': 'other',
        'Pint glass': 'highball',
        'Copper Mug': 'mug',
        'Beer mug': 'mug',
        'Beer Glass': 'highball',
        'Beer pilsner': 'highball',
        'Parfait glass': 'other',
        'Mason jar': 'other',
        'Margarita/Coupette glass': 'margarita',
        'Coupe Glass': 'coupe'
      };
      
      glassType = glassMap[drink.strGlass] || 'other';
    }

    // Déterminer la méthode de préparation
    let preparationMethod: PreparationMethod = 'built';
    const instructions = drink.strInstructions ? drink.strInstructions.toLowerCase() : '';
    
    if (instructions.includes('shake') || instructions.includes('shaker')) {
      preparationMethod = 'shaken';
    } else if (instructions.includes('stir')) {
      preparationMethod = 'stirred';
    } else if (instructions.includes('blend')) {
      preparationMethod = 'blended';
    } else if (instructions.includes('layer')) {
      preparationMethod = 'layered';
    } else if (instructions.includes('muddle')) {
      preparationMethod = 'muddled';
    }

    // Déterminer la difficulté
    const difficulty: 'easy' | 'medium' | 'hard' = 
      ingredients.length <= 3 && instructions.length < 100 
        ? 'easy' 
        : ingredients.length > 6 || instructions.length > 300 
          ? 'hard' 
          : 'medium';

    // Utiliser les instructions dans la langue spécifiée si disponibles
    let preparation = drink.strInstructions;
    if (this.language === 'fr' && drink.strInstructionsFR) {
      preparation = drink.strInstructionsFR;
    }

    // Extraire les tags s'ils existent
    const tags: string[] = [];
    if (drink.strTags) {
      const tagList = drink.strTags.split(',');
      tagList.forEach((tagItem: string) => {
        if (tagItem.trim()) {
          tags.push(tagItem.trim());
        }
      });
    }

    // Construire l'objet Cocktail
    return {
      id: drink.idDrink,
      name: drink.strDrink,
      category: category,
      glassType: glassType,
      ingredients,
      garnish: null, // Non fourni directement par l'API
      preparation,
      preparationMethod: preparationMethod,
      image: drink.strDrinkThumb || null,
      isCustom: false,
      isFavorite: false,
      notes: null,
      tags: tags,
      rating: null,
      difficulty: difficulty,
      userId: '', // Sera défini par l'application
      createdAt: drink.dateModified || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// L'export par défaut est déjà défini dans la déclaration de classe