// services/winePairingService.js
import { supabase } from '../utils/supabase';
import WineAIService from '../services/WineAIService';

/**
 * Service spécialisé pour la gestion des accords mets-vins
 */
class WinePairingService {
  private cache: Map<string, any>;
  private cacheExpiration: number;
  private wineAIService: WineAIService;
  
  constructor() {
    this.cache = new Map();
    this.cacheExpiration = 24 * 60 * 60 * 1000; // 24 heures
    this.wineAIService = new WineAIService(); // Instancier le service WineAIService
    console.log('WinePairingService initialisé');
  }

  /**
   * Récupère des accords mets-vins en fonction d'un plat
   * @param {string} foodQuery - Le plat ou l'ingrédient recherché
   * @param {Object} options - Options de la requête
   * @returns {Promise<Array>} - Liste d'accords mets-vins
   */
  async findPairingsByFood(foodQuery, options = {}) {
    console.log('findPairingsByFood appelé avec:', { foodQuery, options });
    
    const {
      sourceMode = 'all', // 'all', 'cellar', 'store'
      pairingMode = 'all', // 'all', 'classic', 'audacious', 'merchant'
      apiProvider = 'openai',
      apiKey,
      userId = null,
      limit = 4,
      offset = 0,
      forceRefresh = false
    } = options;

    if (!foodQuery || typeof foodQuery !== 'string' || !foodQuery.trim()) {
      console.error('Requête de plat invalide:', foodQuery);
      throw new Error("Nom de plat invalide ou manquant");
    }

    const cacheKey = `food_pairings_${foodQuery}_${sourceMode}_${pairingMode}_${limit}_${offset}`;
    
    // Vérifier le cache
    if (!forceRefresh) {
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log('Résultats trouvés dans le cache pour:', cacheKey);
        return cachedData;
      }
    }

    try {
      console.log('Recherche d\'accords pour le plat:', foodQuery);
      
      // 1. D'abord, chercher dans la base de données pour des accords existants
      let existingPairings = [];
      
      if (userId) {
        console.log('Recherche d\'accords existants dans la base de données pour l\'utilisateur:', userId);
        const { data, error } = await supabase
          .from('food_pairing')
          .select(`
            id, 
            food, 
            wine_id, 
            wine_type, 
            pairing_strength, 
            pairing_type,
            explanation,
            user_rating,
            saved,
            caviste_recommendation,
            wine:wine_id (
              id, 
              name, 
              color, 
              vintage, 
              domain,
              region,
              appellation
            )
          `)
          .ilike('food', `%${foodQuery}%`)
          .eq('user_id', userId);

        if (error) {
          console.error('Erreur Supabase lors de la recherche d\'accords existants:', error);
        } else if (data && data.length > 0) {
          console.log(`${data.length} accords existants trouvés dans la base de données`);
          existingPairings = data;
        } else {
          console.log('Aucun accord existant trouvé dans la base de données');
        }
      }

      // 2. Si suffisamment d'accords trouvés, les retourner
      if (existingPairings.length >= limit && !forceRefresh) {
        console.log('Filtrage des accords existants selon les critères');
        // Filtrer selon les critères
        const filteredPairings = existingPairings.filter(pairing => {
          // Filtrer par type d'accord
          if (pairingMode !== 'all' && pairing.pairing_type !== pairingMode) {
            return false;
          }
          
          // Filtrer par source (cave vs magasin)
          if (sourceMode === 'cellar' && !pairing.wine_id) {
            return false;
          }
          if (sourceMode === 'store' && pairing.wine_id) {
            return false;
          }
          
          return true;
        });

        if (filteredPairings.length >= limit) {
          const result = filteredPairings.slice(offset, offset + limit);
          console.log(`${result.length} accords filtrés retournés depuis la base de données`);
          this.setInCache(cacheKey, result);
          return result;
        }
      }

      // 3. Si pas assez d'accords trouvés ou rafraîchissement forcé, interroger l'IA
      if (!apiKey) {
        console.error('Clé API manquante, impossible d\'interroger l\'IA');
        throw new Error("Clé API requise pour générer des accords mets-vins");
      }

      console.log(`Préparation de l'appel à l'API ${apiProvider} pour les accords`);
      
      // Récupérer les vins de la cave si nécessaire
      let cellarWines = [];
      if (userId && (sourceMode === 'cellar' || sourceMode === 'all')) {
        console.log('Récupération des vins de la cave');
        const { data: bottlesData, error } = await supabase
          .from('bottle')
          .select(`
            id, 
            wine_id, 
            status,
            wine:wine_id (
              id, 
              name, 
              color, 
              vintage, 
              domain,
              region,
              appellation,
              alcohol_percentage
            )
          `)
          .eq('status', 'in_stock')
          .eq('user_id', userId);

        if (error) {
          console.error('Erreur lors de la récupération des vins de la cave:', error);
        } else if (bottlesData) {
          cellarWines = bottlesData.filter(bottle => bottle.wine).map(bottle => bottle.wine);
          console.log(`${cellarWines.length} vins trouvés dans la cave`);
        }
      }

      // Construire le prompt pour l'IA
      const prompt = this.buildFoodPairingPrompt(foodQuery, {
        pairingMode,
        sourceMode,
        cellarWines: sourceMode === 'cellar' ? cellarWines : []
      });
      
      console.log('Prompt généré pour l\'IA:', prompt);

      // Appeler l'API d'IA
      let aiResponse;
      console.log(`Appel de l'API ${apiProvider}...`);
      try {
        if (apiProvider === 'openai') {
          aiResponse = await this.wineAIService.callOpenAI(prompt, apiKey);
        } else if (apiProvider === 'mistral') {
          aiResponse = await this.wineAIService.callMistral(prompt, apiKey);
        } else {
          throw new Error("Fournisseur d'API non pris en charge");
        }
        
        if (!aiResponse) {
          throw new Error(`Pas de réponse de l'API ${apiProvider}`);
        }
        
        console.log(`Réponse reçue de ${apiProvider} (longueur: ${aiResponse.length} caractères)`);
      } catch (apiError) {
        console.error(`Erreur lors de l'appel à l'API ${apiProvider}:`, apiError);
        throw new Error(`Erreur de l'API ${apiProvider}: ${apiError.message}`);
      }

      // Analyser la réponse
      const pairings = this.parsePairingsResponse(aiResponse);
      console.log(`${pairings.length} accords extraits de la réponse de l'IA`);

      if (pairings.length === 0) {
        console.warn('Aucun accord extrait de la réponse de l\'IA');
        throw new Error("L'IA n'a pas généré d'accords valides");
      }

      // Enrichir les résultats
      const enrichedPairings = await this.enrichPairings(pairings, {
        userId,
        cellarWines,
        foodQuery
      });
      
      console.log(`${enrichedPairings.length} accords enrichis prêts`);

      // Sauvegarder les accords générés dans la base de données pour une utilisation future
      if (userId) {
        try {
          console.log('Sauvegarde des accords dans la base de données');
          await this.savePairingsToDatabase(enrichedPairings, userId);
        } catch (saveError) {
          console.error('Erreur lors de la sauvegarde des accords, mais poursuite du traitement:', saveError);
          // Continuer même en cas d'erreur de sauvegarde
        }
      }

      // Mettre en cache et retourner
      this.setInCache(cacheKey, enrichedPairings);
      return enrichedPairings;

    } catch (error) {
      console.error('Erreur complète lors de la recherche d\'accords par plat:', error);
      throw error;
    }
  }

  /**
   * Récupère des accords mets-vins en fonction d'un vin
   * @param {Object|string} wine - Objet vin ou nom du vin
   * @param {Object} options - Options de la requête
   * @returns {Promise<Array>} - Liste d'accords mets-vins
   */
  async findPairingsByWine(wine, options = {}) {
    console.log('findPairingsByWine appelé avec:', { wine, options });
    
    const {
      wineType = null, // Type de vin si wine est un string
      pairingMode = 'all', // 'all', 'classic', 'audacious', 'merchant'
      apiProvider = 'openai',
      apiKey,
      userId = null,
      limit = 4,
      offset = 0,
      forceRefresh = false
    } = options;

    if (!wine) {
      console.error('Vin invalide:', wine);
      throw new Error("Vin invalide ou manquant");
    }

    const wineName = typeof wine === 'string' ? wine : wine.name;
    const wineId = typeof wine === 'string' ? null : wine.id;
    
    console.log('Recherche d\'accords pour le vin:', { wineName, wineId, wineType });
    
    const cacheKey = `wine_pairings_${wineName}_${wineType || 'none'}_${pairingMode}_${limit}_${offset}`;
    
    // Vérifier le cache
    if (!forceRefresh) {
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        console.log('Résultats trouvés dans le cache pour:', cacheKey);
        return cachedData;
      }
    }

    try {
      // 1. D'abord, chercher dans la base de données pour des accords existants
      let existingPairings = [];
      
      if (userId) {
        console.log('Recherche d\'accords existants dans la base de données pour l\'utilisateur:', userId);
        
        let query = supabase
          .from('food_pairing')
          .select(`
            id, 
            food, 
            wine_id, 
            wine_type, 
            pairing_strength, 
            pairing_type,
            explanation,
            user_rating,
            saved,
            caviste_recommendation,
            wine:wine_id (
              id, 
              name, 
              color, 
              vintage, 
              domain,
              region,
              appellation
            )
          `)
          .eq('user_id', userId);
          
        if (wineId) {
          query = query.eq('wine_id', wineId);
        } else if (wineType) {
          query = query.eq('wine_type', wineType);
        } else if (wineName) {
          // Pour la recherche par nom de vin, vérifions d'abord si le vin existe dans la base
          const { data: wineData } = await supabase
            .from('wine')
            .select('id')
            .ilike('name', `%${wineName}%`)
            .limit(10);
            
          if (wineData && wineData.length > 0) {
            const wineIds = wineData.map(w => w.id);
            query = query.in('wine_id', wineIds);
          } else {
            // Si le vin n'existe pas, on peut chercher dans le type de vin
            query = query.ilike('wine_type', `%${wineName}%`);
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error('Erreur Supabase lors de la recherche d\'accords existants:', error);
        } else if (data && data.length > 0) {
          console.log(`${data.length} accords existants trouvés dans la base de données`);
          existingPairings = data;
        } else {
          console.log('Aucun accord existant trouvé dans la base de données');
        }
      }

      // 2. Si suffisamment d'accords trouvés, les retourner
      if (existingPairings.length >= limit && !forceRefresh) {
        console.log('Filtrage des accords existants selon les critères');
        // Filtrer selon les critères
        const filteredPairings = existingPairings.filter(pairing => {
          // Filtrer par type d'accord
          if (pairingMode !== 'all' && pairing.pairing_type !== pairingMode) {
            return false;
          }
          
          return true;
        });

        if (filteredPairings.length >= limit) {
          const result = filteredPairings.slice(offset, offset + limit);
          console.log(`${result.length} accords filtrés retournés depuis la base de données`);
          this.setInCache(cacheKey, result);
          return result;
        }
      }

      // 3. Si pas assez d'accords trouvés ou rafraîchissement forcé, interroger l'IA
      if (!apiKey) {
        console.error('Clé API manquante, impossible d\'interroger l\'IA');
        throw new Error("Clé API requise pour générer des accords mets-vins");
      }

      console.log(`Préparation de l'appel à l'API ${apiProvider} pour les accords`);

      // Construire le prompt pour l'IA
      const prompt = this.buildWinePairingPrompt(wine, {
        wineType,
        pairingMode
      });
      
      console.log('Prompt généré pour l\'IA:', prompt);

      // Appeler l'API d'IA
      let aiResponse;
      console.log(`Appel de l'API ${apiProvider}...`);
      try {
        if (apiProvider === 'openai') {
          aiResponse = await this.wineAIService.callOpenAI(prompt, apiKey);
        } else if (apiProvider === 'mistral') {
          aiResponse = await this.wineAIService.callMistral(prompt, apiKey);
        } else {
          throw new Error("Fournisseur d'API non pris en charge");
        }
        
        if (!aiResponse) {
          throw new Error(`Pas de réponse de l'API ${apiProvider}`);
        }
        
        console.log(`Réponse reçue de ${apiProvider} (longueur: ${aiResponse.length} caractères)`);
      } catch (apiError) {
        console.error(`Erreur lors de l'appel à l'API ${apiProvider}:`, apiError);
        throw new Error(`Erreur de l'API ${apiProvider}: ${apiError.message}`);
      }

      // Analyser la réponse
      const pairings = this.parsePairingsResponse(aiResponse);
      console.log(`${pairings.length} accords extraits de la réponse de l'IA`);

      if (pairings.length === 0) {
        console.warn('Aucun accord extrait de la réponse de l\'IA');
        throw new Error("L'IA n'a pas généré d'accords valides");
      }

      // Enrichir les résultats avec les infos du vin
      const enrichedPairings = pairings.map(pairing => ({
        ...pairing,
        wine_id: wineId,
        wine_type: wineType || (typeof wine !== 'string' ? wine.color : null),
        wine: typeof wine !== 'string' ? wine : null,
        // Assurer la cohérence du type d'accord
        pairing_type: pairing.pairing_type || pairing.type || 'classic'
      }));
      
      console.log(`${enrichedPairings.length} accords enrichis prêts`);

      // Sauvegarder les accords générés dans la base de données pour une utilisation future
      if (userId) {
        try {
          console.log('Sauvegarde des accords dans la base de données');
          await this.savePairingsToDatabase(enrichedPairings, userId);
        } catch (saveError) {
          console.error('Erreur lors de la sauvegarde des accords, mais poursuite du traitement:', saveError);
          // Continuer même en cas d'erreur de sauvegarde
        }
      }

      // Mettre en cache et retourner
      this.setInCache(cacheKey, enrichedPairings);
      return enrichedPairings;

    } catch (error) {
      console.error('Erreur complète lors de la recherche d\'accords par vin:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde un accord dans la base de données
   * @param {Object} pairing - L'accord à sauvegarder 
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - L'accord sauvegardé
   */
  async savePairing(pairing, userId) {
    console.log('savePairing appelé avec:', { pairing, userId });
    
    try {
      if (!pairing || !userId) {
        throw new Error("Données manquantes: accord ou ID utilisateur");
      }

      // Vérifier si l'accord existe déjà
      let existingPairingId = pairing.id;
      
      if (!existingPairingId) {
        // Rechercher un accord similaire existant
        const { data: existingData } = await supabase
          .from('food_pairing')
          .select('id')
          .eq('user_id', userId)
          .eq('food', pairing.food || '')
          .eq('wine_id', pairing.wine_id || null)
          .maybeSingle();
          
        if (existingData) {
          existingPairingId = existingData.id;
        }
      }

      let result;
      
      if (existingPairingId) {
        // Mettre à jour l'accord existant
        console.log('Mise à jour de l\'accord existant:', existingPairingId);
        const { data, error } = await supabase
          .from('food_pairing')
          .update({ 
            saved: true,
            user_rating: pairing.user_rating || null
          })
          .eq('id', existingPairingId)
          .eq('user_id', userId)
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          result = data[0];
        }
      } else {
        // Créer un nouvel accord
        console.log('Création d\'un nouvel accord');
        
        // S'assurer que toutes les propriétés nécessaires sont présentes
        const newPairing = {
          food: pairing.food || '',
          wine_id: pairing.wine_id || null,
          wine_type: pairing.wine_type || pairing.type || null,
          pairing_strength: parseFloat(pairing.pairing_strength) || 3,
          pairing_type: pairing.pairing_type || pairing.type || 'classic',
          explanation: pairing.explanation || '',
          user_id: userId,
          saved: true,
          user_rating: pairing.user_rating || null,
          ai_generated: true
        };

        try {
          // Première tentative avec caviste_recommendation
          const { data, error } = await supabase
            .from('food_pairing')
            .insert({
              ...newPairing,
              caviste_recommendation: pairing.pairing_type === 'merchant' || pairing.type === 'merchant'
            })
            .select();

          if (error) throw error;
          if (data && data.length > 0) {
            result = data[0];
          }
        } catch (error) {
          // Si l'erreur est due à caviste_recommendation, réessayer sans
          if (error.message && error.message.includes('caviste_recommendation')) {
            const { data, error: retryError } = await supabase
              .from('food_pairing')
              .insert(newPairing)
              .select();
              
            if (retryError) throw retryError;
            if (data && data.length > 0) {
              result = data[0];
            }
          } else {
            throw error;
          }
        }
      }

      console.log('Accord sauvegardé avec succès:', result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'accord:', error);
      throw error;
    }
  }

  /**
   * Supprime un accord des favoris
   * @param {string} pairingId - ID de l'accord à supprimer
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async removePairing(pairingId, userId) {
    console.log('removePairing appelé avec:', { pairingId, userId });
    
    try {
      if (!pairingId || !userId) {
        throw new Error("ID de l'accord ou ID utilisateur manquant");
      }

      // Au lieu de supprimer, on met à jour le flag 'saved'
      const { error } = await supabase
        .from('food_pairing')
        .update({ saved: false })
        .eq('id', pairingId)
        .eq('user_id', userId)
        .select();

      if (error) throw error;
      
      console.log('Accord supprimé des favoris avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'accord:', error);
      throw error;
    }
  }

  /**
   * Évalue un accord mets-vin
   * @param {string} pairingId - ID de l'accord
   * @param {number} rating - Note (1-5)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - L'accord mis à jour
   */
  async ratePairing(pairingId, rating, userId) {
    console.log('ratePairing appelé avec:', { pairingId, rating, userId });
    
    try {
      if (!pairingId || !userId) {
        throw new Error("ID de l'accord ou ID utilisateur manquant");
      }

      // Valider la note
      const validRating = Math.min(5, Math.max(1, parseInt(rating) || 0));
      
      if (validRating === 0) {
        throw new Error("Note invalide, doit être entre 1 et 5");
      }

      const { data, error } = await supabase
        .from('food_pairing')
        .update({ user_rating: validRating })
        .eq('id', pairingId)
        .eq('user_id', userId)
        .select();

      if (error) throw error;
      
      console.log('Accord évalué avec succès:', data && data.length > 0 ? data[0] : 'No data returned');
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de l\'accord:', error);
      throw error;
    }
  }

  /**
   * Construit un prompt pour la recherche d'accords par plat
   * @param {string} foodQuery - Le plat recherché
   * @param {Object} options - Options du prompt
   * @returns {string} - Le prompt formaté
   */
  buildFoodPairingPrompt(foodQuery, options = {}) {
    const { pairingMode = 'all', sourceMode = 'all', cellarWines = [] } = options;
    
    let prompt = `En tant que sommelier expert, suggère les accords vins optimaux pour ce plat: "${foodQuery}".\n\n`;
    
    // Ajouter les informations sur les vins disponibles si nécessaire
    if (sourceMode === 'cellar' && cellarWines.length > 0) {
      prompt += `Voici les vins disponibles dans ma cave:\n`;
      
      // Limiter à 20 vins pour ne pas dépasser les limites du modèle
      const limitedWines = cellarWines.slice(0, 20);
      limitedWines.forEach((wine, index) => {
        prompt += `${index + 1}. ${wine.name}${wine.vintage ? ` (${wine.vintage})` : ''}, ${wine.color}, ${wine.region || 'région non spécifiée'}\n`;
      });
      prompt += "\n";
    }
    
    // Configurer le nombre d'accords de chaque type selon le mode
    let classicCount = 2;
    let audaciousCount = 1;
    let merchantCount = 1;
    
    switch (pairingMode) {
      case 'classic':
        classicCount = 4;
        audaciousCount = 0;
        merchantCount = 0;
        break;
      case 'audacious':
        classicCount = 1;
        audaciousCount = 3;
        merchantCount = 0;
        break;
      case 'merchant':
        classicCount = 1;
        audaciousCount = 0;
        merchantCount = 3;
        break;
    }
    
    prompt += `Réponds UNIQUEMENT avec un tableau JSON contenant exactement ${classicCount + audaciousCount + merchantCount} accords, incluant:\n`;
    
    if (classicCount > 0) {
      prompt += `- ${classicCount} accord(s) CLASSIQUE(S): des associations traditionnelles et éprouvées\n`;
    }
    
    if (audaciousCount > 0) {
      prompt += `- ${audaciousCount} accord(s) AUDACIEUX: des associations créatives et surprenantes\n`;
    }
    
    if (merchantCount > 0) {
      prompt += `- ${merchantCount} SUGGESTION(S) CAVISTE: des vins exceptionnels à acheter spécifiquement pour ce plat\n`;
    }
    
    prompt += `\nFormat JSON requis:
[
  {
    "wine": "Nom du vin ou type de vin",
    "wine_type": "red_light/red_medium/red_full/white_dry/white_sweet/rose/sparkling/fortified",
    "pairing_strength": note de 1 à 5,
    "explanation": "Explication détaillée de l'accord",
    "pairing_type": "classic/audacious/merchant"
  },
  ...
]`;

    if (sourceMode === 'cellar' && cellarWines.length > 0) {
      prompt += `\n\nPour les vins de ma cave, utilise le nom exact dans le champ "wine".`;
    }
    
    return prompt;
  }

  /**
   * Construit un prompt pour la recherche d'accords par vin
   * @param {Object|string} wine - Objet vin ou nom du vin
   * @param {Object} options - Options du prompt
   * @returns {string} - Le prompt formaté
   */
  buildWinePairingPrompt(wine, options = {}) {
    const { pairingMode = 'all', wineType = null } = options;
    
    let wineName, wineColor, wineRegion, wineVintage;

    if (typeof wine === 'string') {
      wineName = wine;
      wineColor = wineType ? this.getWineColorFromType(wineType) : '';
    } else {
      wineName = wine.name;
      wineColor = wine.color === 'red' ? 'Rouge' : 
                wine.color === 'white' ? 'Blanc' : 
                wine.color === 'rose' ? 'Rosé' : 
                wine.color === 'sparkling' ? 'Effervescent' : 'Fortifié';
      wineRegion = wine.region || '';
      wineVintage = wine.vintage ? wine.vintage.toString() : '';
    }

    let prompt = `En tant que sommelier expert, suggère les meilleurs plats pour accompagner ce vin: "${wineName}"${wineVintage ? ` (${wineVintage})` : ''}${wineColor ? `, ${wineColor}` : ''}${wineRegion ? `, ${wineRegion}` : ''}.\n\n`;
    
    // Configurer le nombre d'accords de chaque type selon le mode
    let classicCount = 2;
    let audaciousCount = 1;
    let merchantCount = 1;
    
    switch (pairingMode) {
      case 'classic':
        classicCount = 4;
        audaciousCount = 0;
        merchantCount = 0;
        break;
      case 'audacious':
        classicCount = 1;
        audaciousCount = 3;
        merchantCount = 0;
        break;
      case 'merchant':
        classicCount = 1;
        audaciousCount = 0;
        merchantCount = 3;
        break;
    }
    
    prompt += `Réponds UNIQUEMENT avec un tableau JSON contenant exactement ${classicCount + audaciousCount + merchantCount} accords, incluant:\n`;
    
    if (classicCount > 0) {
      prompt += `- ${classicCount} accord(s) CLASSIQUE(S): des associations traditionnelles et éprouvées\n`;
    }
    
    if (audaciousCount > 0) {
      prompt += `- ${audaciousCount} accord(s) AUDACIEUX: des associations créatives et surprenantes\n`;
    }
    
    if (merchantCount > 0) {
      prompt += `- ${merchantCount} PLAT(S) EXCEPTIONNEL(S): des préparations sophistiquées ou gastronomiques\n`;
    }
    
    prompt += `\nFormat JSON requis:
[
  {
    "food": "Nom du plat",
    "pairing_strength": note de 1 à 5,
    "explanation": "Explication détaillée de l'accord",
    "pairing_type": "classic/audacious/merchant"
  },
  ...
]`;
    
    return prompt;
  }

  /**
   * Analyse la réponse de l'IA pour extraire les accords
   * @param {string} aiResponse - Réponse brute de l'IA
   * @returns {Array} - Tableau d'accords formatés
   */
  parsePairingsResponse(aiResponse) {
    try {
      if (!aiResponse) {
        console.error('Réponse vide de l\'IA');
        return [];
      }
      
      // Log pour débogage
      console.log('Réponse brute à parser (début):', aiResponse.substring(0, 200) + '...');
      
      // Essayer d'extraire le JSON si la réponse contient d'autres textes
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('JSON extrait et parsé:', parsed.length, 'accords trouvés');
          
          // Normaliser les structures en assurant la cohérence des champs
          const normalized = parsed.map(item => {
            // Pour les accords générés à partir d'un plat
            if (item.wine) {
              return {
                wine: item.wine,
                wine_type: item.wine_type || null,
                pairing_strength: parseFloat(item.pairing_strength) || 3,
                explanation: item.explanation || '',
                pairing_type: item.pairing_type || item.type || 'classic'
              };
            }
            // Pour les accords générés à partir d'un vin
            else if (item.food) {
              return {
                food: item.food,
                pairing_strength: parseFloat(item.pairing_strength) || 3,
                explanation: item.explanation || '',
                pairing_type: item.pairing_type || item.type || 'classic'
              };
            }
            // Format inconnu, retourner tel quel
            return item;
          });
          
          return normalized;
        } catch (jsonError) {
          console.error('Erreur de parsing du JSON extrait:', jsonError);
          console.log('JSON extrait qui a causé l\'erreur:', jsonMatch[0]);
        }
      }
      
      // Essayer de parser toute la réponse comme JSON
      try {
        const parsed = JSON.parse(aiResponse);
        console.log('Réponse entière parsée comme JSON:', parsed.length, 'accords trouvés');
        return parsed;
      } catch (entireJsonError) {
        console.error('Erreur de parsing de la réponse entière:', entireJsonError);
      }
      
      // Si toutes les tentatives échouent, tenter une extraction moins stricte
      console.log('Tentative d\'extraction moins stricte...');
      
      // Chercher tout ce qui ressemble à des objets JSON
      const objectMatches = aiResponse.match(/\{[^{}]*\}/g);
      if (objectMatches && objectMatches.length > 0) {
        console.log(`${objectMatches.length} objets JSON potentiels trouvés`);
        
        const parsedObjects = [];
        for (const objStr of objectMatches) {
          try {
            const obj = JSON.parse(objStr);
            if (obj.wine || obj.food) {
              parsedObjects.push(obj);
            }
          } catch (_) {
            // Ignorer les objets qui ne peuvent pas être parsés
          }
        }
        
        if (parsedObjects.length > 0) {
          console.log(`${parsedObjects.length} objets JSON valides extraits`);
          return parsedObjects;
        }
      }
      
      // Si aucune méthode ne fonctionne, retourner un tableau vide
      console.error('Impossible d\'extraire des accords valides de la réponse');
      console.log('Réponse brute complète:', aiResponse);
      return [];
    } catch (error) {
      console.error('Erreur lors du parsing des accords:', error);
      console.log('Réponse brute qui a causé l\'erreur:', aiResponse);
      
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  /**
   * Enrichit les accords avec des informations additionnelles
   * @param {Array} pairings - Accords bruts
   * @param {Object} options - Options d'enrichissement
   * @returns {Promise<Array>} - Accords enrichis
   */
  async enrichPairings(pairings, options = {}) {
    console.log('enrichPairings appelé avec', pairings.length, 'accords');
    const { userId, cellarWines = [], foodQuery = null } = options;
    
    try {
      // Enrichir avec les informations des vins de la cave si disponibles
      const enrichedPairings = pairings.map(pairing => {
        // Si c'est un accord par plat (il a un champ 'wine')
        if (pairing.wine && cellarWines.length > 0) {
          const matchedWine = cellarWines.find(w => 
            w.name.toLowerCase() === pairing.wine.toLowerCase() || 
            w.name.toLowerCase().includes(pairing.wine.toLowerCase()) ||
            pairing.wine.toLowerCase().includes(w.name.toLowerCase())
          );
          
          if (matchedWine) {
            console.log(`Vin correspondant trouvé dans la cave pour "${pairing.wine}": ${matchedWine.name} (${matchedWine.id})`);
            return {
              ...pairing,
              wine_id: matchedWine.id,
              wine: matchedWine
            };
          }
        }
        
        // Ajouter le plat recherché si nécessaire
        if (foodQuery && !pairing.food) {
          pairing.food = foodQuery;
        }
        
        return pairing;
      });
      
      return enrichedPairings;
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement des accords:', error);
      return pairings; // Retourner les accords non modifiés en cas d'erreur
    }
  }

  /**
   * Sauvegarde les accords générés dans la base de données
   * @param {Array} pairings - Accords à sauvegarder
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Accords sauvegardés
   */
  async savePairingsToDatabase(pairings, userId) {
    console.log('savePairingsToDatabase appelé avec', pairings.length, 'accords');
    
    try {
      // Vérifier si les données sont valides
      if (!pairings || !Array.isArray(pairings) || pairings.length === 0) {
        console.log("Pas de données à sauvegarder");
        return []; 
      }
      
      // Vérifier si l'utilisateur est fourni
      if (!userId) {
        console.log("ID utilisateur manquant, sauvegarde ignorée");
        return []; 
      }
      
      // Préparer les données à sauvegarder avec des vérifications de type
      const pairingsToSave = pairings.map(pairing => {
        // S'assurer que tous les champs nécessaires existent
        let foodField = '';
        let wineIdField = null;
        let wineTypeField = null;
        
        // Pour les accords générés à partir d'un plat
        if (pairing.wine) {
          foodField = pairing.food || '';
          wineIdField = (pairing.wine_id && typeof pairing.wine_id === 'string') ? pairing.wine_id : null;
          wineTypeField = pairing.wine_type || this.getWineTypeFromColor(
            pairing.wine && pairing.wine.color ? pairing.wine.color : null
          );
        } 
        // Pour les accords générés à partir d'un vin
        else if (pairing.food) {
          foodField = pairing.food;
          wineIdField = (pairing.wine_id && typeof pairing.wine_id === 'string') ? pairing.wine_id : null;
          wineTypeField = pairing.wine_type || null;
        }
        
        const pairingStrength = parseFloat(pairing.pairing_strength) || 3;
        const pairingType = pairing.pairing_type || pairing.type || 'classic';
        const explanation = pairing.explanation || '';
        
        return {
          food: foodField,
          wine_id: wineIdField,
          wine_type: wineTypeField,
          pairing_strength: pairingStrength,
          pairing_type: pairingType,
          explanation: explanation,
          user_id: userId,
          saved: false,
          ai_generated: true
        };
      });
      
      // Filtrer pour ne garder que les accords valides
      const validPairings = pairingsToSave.filter(p => 
        (p.food && p.food.trim() !== '') || (p.wine_id || p.wine_type)
      );
      
      if (validPairings.length === 0) {
        console.log("Aucun accord valide à sauvegarder après filtrage");
        return [];
      }
      
      console.log("Tentative de sauvegarde de", validPairings.length, "accords valides");
      
      // Tenter d'insérer les accords un par un pour éviter les erreurs d'insertion en batch
      const savedPairings = [];
      
      for (const pairing of validPairings) {
        try {
          // Tenter d'abord avec caviste_recommendation
          try {
            const { data, error } = await supabase
              .from('food_pairing')
              .insert({
                ...pairing,
                caviste_recommendation: pairing.pairing_type === 'merchant'
              })
              .select();
              
            if (!error && data && data.length > 0) {
              savedPairings.push(data[0]);
            }
          } catch (error) {
            // Si erreur avec caviste_recommendation, essayer sans
            const { data, error: secondError } = await supabase
              .from('food_pairing')
              .insert(pairing)
              .select();
              
            if (!secondError && data && data.length > 0) {
              savedPairings.push(data[0]);
            }
          }
        } catch (indError) {
          console.error('Erreur lors de la sauvegarde d\'un accord individuel:', indError);
        }
      }
      
      console.log(`${savedPairings.length}/${validPairings.length} accords sauvegardés avec succès`);
      return savedPairings;
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des accords:', error);
      return [];
    }
  }

  /**
   * Convertit un type de vin en couleur
   * @param {string} wineType - Type de vin (ex: red_light, white_dry)
   * @returns {string} - Couleur du vin (red, white, etc.)
   */
  getWineColorFromType(wineType) {
    if (!wineType) return 'unknown';
    
    if (wineType.startsWith('red_')) {
      return 'red';
    } else if (wineType.startsWith('white_')) {
      return 'white';
    } else if (wineType === 'rose') {
      return 'rose';
    } else if (wineType === 'sparkling') {
      return 'sparkling';
    } else if (wineType === 'fortified') {
      return 'fortified';
    }
    
    return 'unknown';
  }

  /**
   * Convertit une couleur de vin en type
   * @param {string} wineColor - Couleur du vin (red, white, etc.)
   * @returns {string} - Type de vin par défaut pour cette couleur
   */
  getWineTypeFromColor(wineColor) {
    if (!wineColor) return null;
    
    switch (wineColor.toLowerCase()) {
      case 'red': return 'red_medium';
      case 'white': return 'white_dry';
      case 'rose': return 'rose';
      case 'sparkling': return 'sparkling';
      case 'fortified': return 'fortified';
      default: return null;
    }
  }

  /**
   * Récupère une valeur depuis le cache
   * @param {string} key - Clé du cache
   * @returns {any} - Valeur en cache ou null
   */
  getFromCache(key) {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) return null;
    
    // Vérifier si l'élément a expiré
    if (Date.now() > cachedItem.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.value;
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé du cache
   * @param {any} value - Valeur à stocker
   */
  setInCache(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.cacheExpiration
    });
  }
}

export default new WinePairingService();