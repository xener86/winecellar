/* eslint-disable @typescript-eslint/no-unused-vars */
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase'; // Assurez-vous que supabase est exporté et typé correctement

// --- Type Definitions ---

type WineColor = 'red' | 'white' | 'rose' | 'sparkling' | 'fortified' | string; // string comme fallback
type PairingType = 'classic' | 'audacious' | 'merchant';
type AgingPhase = 'youth' | 'development' | 'peak' | 'decline';
type Language = 'fr' | 'en';
type ApiProvider = 'openai' | 'mistral';

// Options communes pour les appels API IA
interface ApiOptions {
  temperature?: number;
  maxTokens?: number;
}

// Options de base pour les méthodes du service utilisant l'IA
interface WineApiOptions extends ApiOptions {
  apiProvider?: ApiProvider;
  apiKey?: string; // Clé API requise si appel IA
  forceRefresh?: boolean; // Pour forcer la mise à jour et ignorer le cache/DB
  language?: Language;
}

// Options spécifiques avec extensions propres
interface WineInfoOptions extends WineApiOptions {
  // Options spécifiques pour getWineInfo
  includeVintageScore?: boolean;
}

interface WinePairingOptions extends WineApiOptions {
  // Options spécifiques pour getWinePairings
  maxPairings?: number;
}

interface TastingProfileOptions extends WineApiOptions {
  // Options spécifiques pour getTastingProfile
  includeFlavorNotes?: boolean;
}

interface AgingDataOptions extends WineApiOptions {
  enhanceWithAI?: boolean; // Option spécifique pour getAgingData
}

// Options pour l'enrichissement des données
interface EnrichOptions {
  enhanceAgingData?: boolean;
  enhanceTastingProfile?: boolean;
  enhancePairings?: boolean;
  // Inclure les options API si l'enrichissement peut déclencher des appels IA
  apiProvider?: ApiProvider;
  apiKey?: string;
  language?: Language;
}

// --- Structures de données du Vin ---

// Profil de dégustation (peut être partiel initialement)
interface TasteProfile {
  body?: number; // 1-5
  acidity?: number; // 1-5
  tannin?: number; // 1-5 (0 pour blanc/rosé)
  sweetness?: number; // 1-5
  fruitiness?: number; // 1-5
  oak?: number; // 1-5
  complexity?: number; // 1-5
  intensity?: number; // 1-5
  primary_flavors?: string[];
}

// Données de vieillissement (peut être partiel initialement)
interface AgingData {
  potential_years?: number;
  potential?: number; // Utilisé dans getWineInfo prompt
  peak_min?: number; // Utilisé dans getWineInfo prompt
  peak_max?: number; // Utilisé dans getWineInfo prompt
  peak_start_year?: number;
  peak_end_year?: number;
  drink_now?: boolean;
  current_phase?: AgingPhase;
  estimated_quality_now?: number; // 0-100
}

// Accord Mets-Vin
interface Pairing {
  food: string;
  strength?: number; // 1-5 (Utilisé dans getWineInfo prompt)
  pairing_strength?: number; // 1-5 (Utilisé dans getWinePairingPrompt)
  type: PairingType;
  explanation: string;
}

// Notes de dégustation structurées
interface TastingNotes {
  appearance?: string;
  nose?: string;
  palate?: string;
  finish?: string;
}

// Données de base d'un vin (peut être partiel avant enrichissement)
interface BaseWineData {
  id?: number | string; // Peut venir de la DB
  name?: string;
  vintage?: number | null;
  domain?: string;
  region?: string;
  subregion?: string;
  appellation?: string;
  color?: WineColor;
  alcohol_percentage?: number | null;
  grapes?: string[]; // Noms des cépages
  style?: string;
  price_range?: string;
  taste_profile?: TasteProfile | null;
  aging?: AgingData | null;
  pairings?: Pairing[] | null;
  tasting_notes?: TastingNotes | string | null; // Peut être un texte brut ou structuré
  notes?: string; // Texte brut fallback
  vintage_score?: number | undefined; // Ajouté par enrichissement, corrigé ici
  // Champs de la DB pour le calcul de vieillissement
  optimal_consumption_start?: string | null;
  optimal_consumption_end?: string | null;
}

// Données finales enrichies (certains champs deviennent obligatoires)
interface EnrichedWineData extends BaseWineData {
  name: string; // Nom devient obligatoire
  color: WineColor; // Couleur devient obligatoire
  // Profils potentiellement remplis par défaut
  aging: AgingData | null;
  taste_profile: TasteProfile | null;
  pairings: Pairing[] | null;
}

// --- Inputs spécifiques pour certaines méthodes ---
interface AgingCurveInput {
  id?: number | string;
  name: string;
  vintage: number;
  color: WineColor;
  region?: string;
  appellation?: string;
  optimal_consumption_start?: string | Date | null;
  optimal_consumption_end?: string | Date | null;
  is_vintage_champagne?: boolean;
}

interface TastingProfileInput {
  id?: number | string;
  name: string;
  vintage?: number | null;
  color: WineColor;
  region?: string;
  appellation?: string;
  tasting_notes?: string | TastingNotes | null;
  notes?: string | null;
}

type PairingInput = string | {
    name: string;
    color?: WineColor;
    region?: string;
    vintage?: number;
    pairings?: Pairing[]; // Peut déjà avoir des pairings
};

// --- Structure DB (simplifiée) ---
interface GrapeInfo {
  grape_id: number;
  percentage: number | null;
  grape: { name: string } | null;
}
interface WineDbRecord {
  id: number;
  name: string;
  vintage: number | null;
  domain: string | null;
  region: string | null;
  appellation: string | null;
  color: WineColor | null;
  alcohol_percentage: number | null;
  notes: string | null;
  wine_grape: GrapeInfo[] | null;
  optimal_consumption_start?: string | null;
  optimal_consumption_end?: string | null;
}

// --- Cache ---
interface CacheItem<T = CacheableData> {
  value: T;
  expiry: number;
}
type CacheableData = EnrichedWineData | Pairing[] | AgingData | TasteProfile | WineDbRecord | null;


interface OpenAIChatCompletion {
  choices: { message: { content: string } }[];
}
interface MistralChatCompletion {
  choices: { message: { content: string } }[];
}

class WineAIService {
  private cache: Map<string, CacheItem>;
  private cacheExpiration: number;
  private supabase: SupabaseClient; // Type Supabase client

  constructor(supabaseInstance: SupabaseClient = supabase) {
    this.cache = new Map<string, CacheItem>();
    this.cacheExpiration = 24 * 60 * 60 * 1000; // 24 heures
    this.supabase = supabaseInstance; // Injecter ou utiliser l'instance importée
  }

  /**
   * Récupère les informations complètes sur un vin
   * @param wineName - Nom du vin à rechercher (peut inclure le millésime)
   * @param options - Options de la requête (API key, langue, etc.)
   * @returns Données enrichies du vin ou null si non trouvé/erreur majeure
   */
  async getWineInfo(wineName: string, options: WineInfoOptions = {}): Promise<EnrichedWineData | null> {
    const cacheKey = `wine_info_${wineName}_${options.language || 'fr'}`;
    const { language = 'fr', forceRefresh = false, apiProvider = 'openai', apiKey } = options;

    // 1. Vérifier le cache
    if (!forceRefresh) {
      const cachedData = this.getFromCache<EnrichedWineData>(cacheKey);
      if (cachedData) {
        console.log('Utilisation des données en cache pour:', wineName);
        return cachedData;
      }
    }

    try {
      // 2. Vérifier dans la base de données
      if (!forceRefresh) {
        const existingWine = await this.checkExistingWine(wineName);
        if (existingWine) {
           // Enrichir les données DB (qui sont partielles) avant de retourner/cacher
           const enrichedDbData = await this.enrichWineData(this.mapDbRecordToWineData(existingWine), options);
           this.setInCache(cacheKey, enrichedDbData);
           console.log('Vin trouvé dans la base de données:', wineName);
           return enrichedDbData;
        }
      }

      // 3. Interroger l'IA (si non trouvé ou forceRefresh)
      if (!apiKey) {
        console.error(`Clé API manquante pour ${apiProvider} lors de la recherche de "${wineName}". Impossible d'interroger l'IA.`);
        // Retourner null ou lancer une erreur ? Pour l'instant null.
        return null;
        // throw new Error(`Clé API ${apiProvider} manquante pour obtenir les informations du vin "${wineName}"`);
      }

      console.log(`Interrogation de l'IA (${apiProvider}) pour :`, wineName);
      const prompt = this.buildWineInfoPrompt(wineName, language);
      let aiResponseText: string | null = null;

      if (apiProvider === 'openai') {
        aiResponseText = await this.callOpenAI(prompt, apiKey, { temperature: options.temperature, maxTokens: options.maxTokens });
      } else if (apiProvider === 'mistral') {
        aiResponseText = await this.callMistral(prompt, apiKey, { temperature: options.temperature, maxTokens: options.maxTokens });
      } else {
        throw new Error(`Fournisseur d'API non pris en charge: ${apiProvider}`);
      }

      if (!aiResponseText) {
        throw new Error(`Réponse vide de l'API ${apiProvider}`);
      }

      // 4. Parser la réponse de l'IA
      const parsedData = this.parseWineData(aiResponseText, language);
      if (!parsedData || !parsedData.name) {
          // Si le parsing échoue ou ne renvoie pas de nom, impossible de continuer
          console.error("Échec du parsing de la réponse IA ou nom manquant:", aiResponseText);
          return null;
      }

      // 5. Enrichir les données parsées
      const enrichedData = await this.enrichWineData(parsedData, options);

      // 6. Mettre en cache et retourner
      this.setInCache(cacheKey, enrichedData);
      return enrichedData;

    } catch (error: unknown) {
      console.error(`Erreur lors de la récupération des informations pour "${wineName}":`, error instanceof Error ? error.message : error);
      // Ne pas propager l'erreur, retourner null pour indiquer l'échec
      return null;
    }
  }

  /**
   * Récupère uniquement les accords mets-vins pour un vin donné
   * @param wine - Nom du vin (string) ou objet vin partiel (PairingInput)
   * @param options - Options de la requête
   * @returns Liste des accords ou null en cas d'erreur
   */
  async getWinePairings(wine: PairingInput, options: WinePairingOptions = {}): Promise<Pairing[] | null> {
    const wineName = typeof wine === 'string' ? wine : wine.name;
    const cacheKey = `wine_pairings_${wineName}_${options.language || 'fr'}`;
    const { language = 'fr', forceRefresh = false, apiProvider = 'openai', apiKey } = options;

    // 1. Vérifier le cache
    if (!forceRefresh) {
      const cachedData = this.getFromCache<Pairing[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      // 2. Utiliser les pairings existants si l'objet vin est fourni et les contient
      if (typeof wine !== 'string' && wine.pairings && !forceRefresh) {
        return wine.pairings;
      }

      // 3. Interroger l'IA
      if (!apiKey) {
        console.warn(`Clé API manquante pour ${apiProvider} pour les accords de "${wineName}". Utilisation des accords par défaut.`);
        // Si pas de clé API, on ne peut pas interroger, retourner les défauts?
        const color = typeof wine === 'string' ? undefined : wine.color; // Essayer de deviner la couleur
        return color ? this.getDefaultPairings(color) : [];
      }

      console.log(`Interrogation de l'IA (${apiProvider}) pour les accords de :`, wineName);
      const prompt = this.buildWinePairingPrompt(wine, language);
      let aiResponseText: string | null = null;

      if (apiProvider === 'openai') {
        aiResponseText = await this.callOpenAI(prompt, apiKey, { temperature: options.temperature, maxTokens: options.maxTokens });
      } else if (apiProvider === 'mistral') {
        aiResponseText = await this.callMistral(prompt, apiKey, { temperature: options.temperature, maxTokens: options.maxTokens });
      } else {
          // Retourner les défauts si le provider n'est pas supporté et qu'on a une clé
          console.error(`Fournisseur d'API non pris en charge: ${apiProvider}`);
           const color = typeof wine === 'string' ? undefined : wine.color;
           return color ? this.getDefaultPairings(color) : [];
      }

       if (!aiResponseText) {
          console.error(`Réponse vide de l'API ${apiProvider} pour les accords.`);
           const color = typeof wine === 'string' ? undefined : wine.color;
           return color ? this.getDefaultPairings(color) : [];
       }

      // 4. Parser et mettre en cache
      const pairings = this.parsePairingsData(aiResponseText, language);
      if (pairings) {
        this.setInCache(cacheKey, pairings);
        return pairings;
      } else {
        // Si le parsing échoue, retourner les défauts?
         const color = typeof wine === 'string' ? undefined : wine.color;
         return color ? this.getDefaultPairings(color) : [];
      }

    } catch (error: unknown) {
      console.error(`Erreur lors de la récupération des accords pour "${wineName}":`, error instanceof Error ? error.message : error);
      // Retourner les défauts en cas d'erreur majeure
      const color = typeof wine === 'string' ? undefined : wine.color;
      return color ? this.getDefaultPairings(color) : [];
    }
  }

  /**
   * Récupère les données pour la courbe de vieillissement
   * @param wine - Objet vin avec au minimum name, vintage, color
   * @param options - Options de la requête
   * @returns Données de vieillissement ou null
   */
  async getAgingData(wine: AgingCurveInput, options: AgingDataOptions = {}): Promise<AgingData | null> {
    if (!wine || !wine.vintage) {
      console.warn('Millésime requis pour les données de vieillissement pour:', wine?.name);
      return null;
    }

    const cacheKey = `aging_data_${wine.id || wine.name}_${wine.vintage}_${options.language || 'fr'}`;
     
    const { forceRefresh = false, enhanceWithAI = false, apiProvider = 'openai', apiKey, language } = options;

    // 1. Vérifier le cache
    if (!forceRefresh) {
      const cachedData = this.getFromCache<AgingData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      // 2. Calculer la courbe avec les règles internes
      let agingData = this.calculateAgingCurve(wine);

      // 3. Optionnel: Améliorer avec l'IA
      if (enhanceWithAI && apiKey) {
        console.log(`Interrogation de l'IA (${apiProvider}) pour affiner le vieillissement de :`, wine.name);
        const prompt = this.buildAgingCurvePrompt(wine, language || 'fr');
        let aiResponseText: string | null = null;

        if (apiProvider === 'openai') {
          aiResponseText = await this.callOpenAI(prompt, apiKey, { temperature: options.temperature, maxTokens: options.maxTokens });
        } else if (apiProvider === 'mistral') {
          aiResponseText = await this.callMistral(prompt, apiKey, { temperature: options.temperature, maxTokens: options.maxTokens });
        } else {
           console.error(`Fournisseur d'API non pris en charge: ${apiProvider}`);
           // On continue avec les données calculées
        }

        if (aiResponseText) {
          const aiData = this.parseAgingData(aiResponseText);
          // Fusionner intelligemment : l'IA peut écraser certaines valeurs calculées
          if (aiData) {
            agingData = { ...agingData, ...aiData };
          }
        }
      }

      // 4. Mettre en cache et retourner
      if (agingData) {
          this.setInCache(cacheKey, agingData);
      }
      return agingData;

    } catch (error: unknown) {
      console.error(`Erreur lors du calcul/récupération des données de vieillissement pour "${wine.name}":`, error instanceof Error ? error.message : error);
      // En cas d'erreur, retourner la courbe calculée si possible, sinon null
      return this.calculateAgingCurve(wine) ?? null;
    }
  }

  /**
   * Récupère les données pour le graphique radar de dégustation
   * @param wine - Objet vin
   * @param options - Options de la requête
   * @returns Profil de dégustation ou null
   */
  async getTastingProfile(wine: TastingProfileInput, options: TastingProfileOptions = {}): Promise<TasteProfile | null> {
     const cacheKey = `tasting_profile_${wine.id || wine.name}_${options.language || 'fr'}`;
     const { forceRefresh = false, apiProvider = 'openai', apiKey, language } = options;

    // 1. Vérifier le cache
    if (!forceRefresh) {
        const cachedData = this.getFromCache<TasteProfile>(cacheKey);
        if (cachedData) {
            return cachedData;
        }
    }

    try {
        let profile: TasteProfile | null = null;

        // 2. Analyser les notes existantes si présentes
        const notesToAnalyze = wine.tasting_notes
            ? typeof wine.tasting_notes === 'string'
                ? wine.tasting_notes
                : `${wine.tasting_notes.appearance || ''} ${wine.tasting_notes.nose || ''} ${wine.tasting_notes.palate || ''} ${wine.tasting_notes.finish || ''}`
            : wine.notes;

        if (notesToAnalyze) {
            profile = this.analyzeTastingNotes(notesToAnalyze);
            // Compléter avec les défauts pour les caractéristiques manquantes
            profile = { ...this.getDefaultTastingProfile(wine.color), ...profile };
        }

        // 3. Si pas de notes ou profil incomplet, et clé API dispo -> IA
        if ((!profile || Object.keys(profile).length < 5) && apiKey) { // Seuil arbitraire
            console.log(`Interrogation de l'IA (${apiProvider}) pour le profil de dégustation de :`, wine.name);
            const prompt = this.buildTastingProfilePrompt(wine, language || 'fr');
             let aiResponseText: string | null = null;

            if (apiProvider === 'openai') {
                aiResponseText = await this.callOpenAI(prompt, apiKey, { temperature: options.temperature, maxTokens: options.maxTokens });
            } else if (apiProvider === 'mistral') {
                 aiResponseText = await this.callMistral(prompt, apiKey, { temperature: options.temperature, maxTokens: options.maxTokens });
            } else {
                 console.error(`Fournisseur d'API non pris en charge: ${apiProvider}`);
            }

            if(aiResponseText) {
                const aiProfile = this.parseTastingProfile(aiResponseText, language || 'fr');
                // Fusionner : le profil IA peut écraser ou compléter
                if (aiProfile) {
                  profile = { ...this.getDefaultTastingProfile(wine.color), ...profile, ...aiProfile };
                }
            }
        }

        // 4. Si toujours pas de profil, utiliser les valeurs par défaut
        if (!profile) {
            profile = this.getDefaultTastingProfile(wine.color);
        }

        // 5. Mettre en cache et retourner
        this.setInCache(cacheKey, profile);
        return profile;

    } catch (error: unknown) {
        console.error(`Erreur lors de la récupération du profil de dégustation pour "${wine.name}":`, error instanceof Error ? error.message : error);
        // Retourner le profil par défaut en cas d'erreur majeure
        return this.getDefaultTastingProfile(wine.color);
    }
  }

  // --- Méthodes d'appel API ---

  /** Appelle l'API OpenAI Chat Completions */
  public async callOpenAI(prompt: string, apiKey: string, options: ApiOptions = {}): Promise<string | null> {
    const { temperature = 0.7, maxTokens = 1000 } = options;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // ms

    while (retryCount < maxRetries) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo", // Ou un modèle plus récent/adapté
            messages: [
              { role: "system", content: "Tu es un sommelier expert. Fournis des informations précises et structurées au format JSON uniquement." },
              { role: "user", content: prompt }
            ],
            temperature: temperature,
            max_tokens: maxTokens,
            response_format: { type: "json_object" } // Demander explicitement du JSON si le modèle le supporte
          })
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Erreur API OpenAI (${response.status}): ${errorBody}`);
          if (response.status === 429 && retryCount < maxRetries - 1) { // Rate limit
            retryCount++;
            console.log(`Rate limit atteint, nouvelle tentative dans ${retryDelay * retryCount}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
            continue;
          }
          // Lancer une erreur spécifique pour mieux la catcher en amont
          throw new Error(`Erreur API OpenAI ${response.status}: ${errorBody}`);
        }

        const data: OpenAIChatCompletion = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
          return data.choices[0].message.content;
        } else {
          console.error("Réponse OpenAI invalide ou vide:", data);
          throw new Error("Réponse OpenAI invalide ou vide.");
        }
      } catch (error: unknown) {
         console.error(`Tentative ${retryCount + 1} échouée pour OpenAI:`, error instanceof Error ? error.message : error);
         retryCount++;
         if (retryCount >= maxRetries) {
             throw error; // Projeter l'erreur après la dernière tentative
         }
         // Attendre avant de réessayer
         await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
      }
    }
     // Ne devrait pas être atteint si throw est utilisé, mais sécurité
    return null;
  }

  /** Appelle l'API Mistral Chat Completions */
  public async callMistral(prompt: string, apiKey: string, options: ApiOptions = {}): Promise<string | null> {
    const { temperature = 0.7, maxTokens = 1000 } = options;

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: "mistral-medium-latest", // Ou un autre modèle Mistral
          messages: [
             { role: "system", content: "Tu es un sommelier expert. Fournis des informations précises et structurées au format JSON uniquement." },
             { role: "user", content: prompt }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" } // Demander explicitement du JSON
        })
      });

       if (!response.ok) {
         const errorBody = await response.text();
         console.error(`Erreur API Mistral (${response.status}): ${errorBody}`);
         throw new Error(`Erreur API Mistral ${response.status}: ${errorBody}`);
       }

       const data: MistralChatCompletion = await response.json();

       if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
         return data.choices[0].message.content;
       } else {
         console.error("Réponse Mistral invalide ou vide:", data);
         throw new Error("Réponse Mistral invalide ou vide.");
       }
    } catch (error: unknown) {
       console.error("Erreur lors de l'appel à Mistral:", error instanceof Error ? error.message : error);
       throw error; // Projeter l'erreur
    }
  }

  // --- Méthodes de construction de Prompt ---

  private buildWineInfoPrompt(wineName: string, language: Language = 'fr'): string {
    const lang = language === 'en' ? 'English' : 'French';
    // Utilisation de JSON Schema implicite dans le prompt pour guider l'IA
    return `Analyze the wine "${wineName}" and return ONLY a valid JSON object with the following structure and constraints. Respond in ${lang}.
    {
      "name": "string // Wine name without vintage",
      "vintage": "integer | null // Year, null if not specified or not applicable",
      "domain": "string | null // Winery name",
      "region": "string | null // Viticultural region",
      "subregion": "string | null // Sub-region if applicable",
      "appellation": "string | null // Appellation",
      "color": "string // 'red', 'white', 'rose', 'sparkling', or 'fortified'",
      "alcohol_percentage": "number | null // Alcohol percentage (e.g., 13.5)",
      "grapes": ["string"], // Array of grape names
      "style": "string | null // Wine style (e.g., light-bodied, full-bodied, dry, off-dry)",
      "price_range": "string | null // Estimated price range (e.g., '€15-€25')",
      "taste_profile": {
        "body": "integer // 1-5",
        "acidity": "integer // 1-5",
        "tannin": "integer // 1-5 (0 for white/rose)",
        "sweetness": "integer // 1-5",
        "fruitiness": "integer // 1-5",
        "oak": "integer // 1-5",
        "primary_flavors": ["string"] // 3-5 main flavor descriptors
      },
      "aging": {
        "potential": "integer | null // Estimated aging potential in years from vintage",
        "peak_min": "integer | null // Minimum age (from vintage) for peak drinking window",
        "peak_max": "integer | null // Maximum age (from vintage) for peak drinking window",
        "drink_now": "boolean // Is the wine likely good to drink now?"
      },
      "pairings": [
        {
          "food": "string // Food pairing suggestion",
          "strength": "number // Pairing strength score 1-5",
          "type": "string // 'classic', 'audacious', or 'merchant'",
          "explanation": "string // Brief explanation"
        }
      ],
      "tasting_notes": {
        "appearance": "string | null // Description of appearance",
        "nose": "string | null // Description of aromas",
        "palate": "string | null // Description of taste and mouthfeel",
        "finish": "string | null // Description of finish"
      }
    }
    IMPORTANT: Ensure all string descriptions (like tasting notes, explanations) are in ${lang}. Provide ONLY the JSON object, no introductory text or markdown formatting.`;
  }

  private buildWinePairingPrompt(wine: PairingInput, _language: Language = 'fr'): string {
    const lang = _language === 'en' ? 'English' : 'French';
     let wineDescription: string;

     if (typeof wine === 'string') {
         wineDescription = `the wine: "${wine}"`;
     } else {
         wineDescription = `this ${wine.color || ''} wine: "${wine.name}"${wine.vintage ? ` (${wine.vintage})` : ''}${wine.region ? ` from ${wine.region}` : ''}`;
     }

     return `As an expert sommelier, suggest exactly 4 food pairings for ${wineDescription}.
     Respond ONLY with a valid JSON array following this structure. Respond in ${lang}.
     [
       { "food": "string // Dish name 1", "pairing_strength": "number // 1-5", "explanation": "string // Detailed explanation", "type": "classic" },
       { "food": "string // Dish name 2", "pairing_strength": "number // 1-5", "explanation": "string // Detailed explanation", "type": "classic" },
       { "food": "string // Dish name 3", "pairing_strength": "number // 1-5", "explanation": "string // Detailed explanation", "type": "audacious" },
       { "food": "string // Dish name 4", "pairing_strength": "number // 1-5", "explanation": "string // Detailed explanation", "type": "merchant" }
     ]
     IMPORTANT: Ensure all food names and explanations are in ${lang}. Provide ONLY the JSON array, no introductory text or markdown formatting.`;
  }

  private buildAgingCurvePrompt(wine: AgingCurveInput, _language: Language = 'fr'): string {
  const lang = _language === 'en' ? 'English' : 'French';
    return `Analyze the aging potential of this wine: "${wine.name}", vintage ${wine.vintage}, color ${wine.color}, region: ${wine.region || 'not specified'}.
    Respond ONLY with a valid JSON object following this structure. Respond in ${lang}.
    {
      "potential_years": "integer | null // Total estimated aging potential in years from vintage",
      "peak_start_year": "integer | null // Estimated year the peak drinking window starts",
      "peak_end_year": "integer | null // Estimated year the peak drinking window ends",
      "drink_now": "boolean // Is the wine likely good to drink now?",
      "current_phase": "string | null // 'youth', 'development', 'peak', or 'decline'",
      "estimated_quality_now": "integer | null // Estimated quality percentage (0-100) if consumed now"
    }
    IMPORTANT: Provide ONLY the JSON object, no introductory text or markdown formatting. Base years on the provided vintage ${wine.vintage}.`;
 }

 private buildTastingProfilePrompt(wine: TastingProfileInput, _language: Language = 'fr'): string {
  const lang = _language === 'en' ? 'English' : 'French';
  return `Analyze the tasting profile of this wine: "${wine.name}"${wine.vintage ? `, vintage ${wine.vintage}` : ''}, color ${wine.color}, region: ${wine.region || 'not specified'}, appellation: ${wine.appellation || 'not specified'}.
  Respond ONLY with a valid JSON object following this structure. Respond in ${lang}.
  {
    "body": "integer // 1-5",
    "acidity": "integer // 1-5",
    "tannin": "integer // 1-5 (0 for white/rose)",
    "sweetness": "integer // 1-5",
    "fruitiness": "integer // 1-5",
    "complexity": "integer // 1-5",
    "oak": "integer // 1-5",
    "intensity": "integer // 1-5",
    "primary_flavors": ["string"] // Array of 3-5 primary flavor descriptors
  }
  IMPORTANT: Ensure flavor descriptors are in ${lang}. Provide ONLY the JSON object, no introductory text or markdown formatting.`;
}

  // --- Méthodes de Parsing ---

  private parseJsonResponse<T>(aiResponse: string): T | null {
    try {
        // Essayer d'extraire un objet JSON, même s'il est entouré de texte/markdown
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})|(\[[\s\S]*\])/);
        let jsonString = aiResponse; // Par défaut, essayer de parser toute la réponse

        if (jsonMatch) {
            // Prendre la première capture non nulle (```json ... ```, ou {...}, ou [...])
            jsonString = jsonMatch[1] || jsonMatch[2] || jsonMatch[3];
        }

        if (!jsonString) {
             console.error("Aucun contenu JSON trouvé dans la réponse IA:", aiResponse);
             return null;
        }

        return JSON.parse(jsonString) as T;
    } catch (error: unknown) {
        console.error("Erreur de parsing JSON:", error instanceof Error ? error.message : error);
        console.error("Réponse brute:", aiResponse);
        return null;
    }
  }

  private parseWineData(aiResponse: string, _language: Language = 'fr'): BaseWineData | null {
    const parsed = this.parseJsonResponse<BaseWineData>(aiResponse);
    if (!parsed) {
        // Tenter un parsing manuel en fallback ? Pour l'instant non pour la robustesse.
        console.error("Échec du parsing JSON principal pour WineData. Tentative de fallback manuel non implémentée ici.");
        // return this.manuallyParseWineData(aiResponse, language); // Décommenter si nécessaire
        return null;
    }

     // TODO: Ajouter la logique de traduction/vérification de langue si nécessaire
     // this.ensureWineDataLanguage(parsed, language);
     return parsed;
  }

   private parsePairingsData(aiResponse: string, _language: Language = 'fr'): Pairing[] | null {
       const parsed = this.parseJsonResponse<Pairing[]>(aiResponse);
       if (!parsed || !Array.isArray(parsed)) {
           console.error("Échec du parsing JSON pour PairingsData ou ce n'est pas un tableau:", aiResponse);
           return null;
       }
       // TODO: Ajouter la logique de traduction/vérification de langue
       // parsed.forEach(p => this.ensurePairingLanguage(p, language));
       return parsed;
   }

   private parseAgingData(aiResponse: string): AgingData | null {
       const parsed = this.parseJsonResponse<AgingData>(aiResponse);
        if (!parsed) {
            console.error("Échec du parsing JSON pour AgingData:", aiResponse);
            return null;
        }
       return parsed;
   }

   private parseTastingProfile(aiResponse: string, _language: Language = 'fr'): TasteProfile | null {
       const parsed = this.parseJsonResponse<TasteProfile>(aiResponse);
        if (!parsed) {
            console.error("Échec du parsing JSON pour TastingProfile:", aiResponse);
            return null;
        }
       // TODO: Ajouter la logique de traduction/vérification de langue
       // this.ensureTastingProfileLanguage(parsed, language);
       return parsed;
   }

  // --- Enrichissement et Calculs ---

   /** Enrichit les données de vin avec calculs, scores, et valeurs par défaut */
   private async enrichWineData(
    wineData: BaseWineData,
    options: EnrichOptions = {}
 ): Promise<EnrichedWineData> {
    const enriched: BaseWineData = { ...wineData }; // Copie initiale

     
    const {
        enhanceAgingData = true,
        enhanceTastingProfile = true,
        enhancePairings = true,
        language = 'fr' // Nécessaire pour les appels potentiels
    } = options;
 
    try {
         // 1. Données de Vieillissement
         if (enhanceAgingData && !enriched.aging && enriched.vintage && enriched.name && enriched.color) {
             // Construire l'input nécessaire pour getAgingData
             const agingInput: AgingCurveInput = {
                 name: enriched.name,
                vintage: enriched.vintage ?? undefined,
                 color: enriched.color,
                 region: enriched.region,
                 appellation: enriched.appellation,
                 optimal_consumption_start: enriched.optimal_consumption_start,
                 optimal_consumption_end: enriched.optimal_consumption_end
             };
             // Utiliser les options API de enrichOptions si disponibles
             const agingOptions: AgingDataOptions = {
                 language, // Utilisation de language ici
                 apiKey: options.apiKey,
                 apiProvider: options.apiProvider,
                 enhanceWithAI: true // Tenter d'utiliser l'IA si possible
             };
             enriched.aging = await this.getAgingData(agingInput, agingOptions);
         } else if (enhanceAgingData && !enriched.aging && enriched.vintage && enriched.name && enriched.color) {
             // Fallback calcul simple si pas d'appel getAgingData possible
             enriched.aging = this.calculateAgingCurve({
                  name: enriched.name,
                  vintage: enriched.vintage ?? undefined,
                  color: enriched.color,
                  region: enriched.region,
                  appellation: enriched.appellation,
                  optimal_consumption_start: enriched.optimal_consumption_start,
                  optimal_consumption_end: enriched.optimal_consumption_end
              });
         }
 
 
         // 2. Profil de Dégustation
         if (enhanceTastingProfile && !enriched.taste_profile && enriched.name && enriched.color) {
              const profileInput: TastingProfileInput = {
                  name: enriched.name,
                  vintage: enriched.vintage ?? undefined,
                  color: enriched.color,
                  region: enriched.region,
                  appellation: enriched.appellation,
                  tasting_notes: enriched.tasting_notes,
                  notes: enriched.notes
              };
              const profileOptions: TastingProfileOptions = {
                  language, // Utilisation de language ici
                  apiKey: options.apiKey,
                  apiProvider: options.apiProvider
              };
              enriched.taste_profile = await this.getTastingProfile(profileInput, profileOptions);
          } else if (enhanceTastingProfile && !enriched.taste_profile && enriched.color) {
               // Fallback défaut simple si pas d'appel getTastingProfile possible
               enriched.taste_profile = this.getDefaultTastingProfile(enriched.color);
          }
 
         // 3. Accords Mets-Vins
         if (enhancePairings && (!enriched.pairings || enriched.pairings.length === 0) && enriched.name && enriched.color) {
              const pairingInput: PairingInput = {
                  name: enriched.name,
                  vintage: enriched.vintage ?? undefined,
                  color: enriched.color,
                  region: enriched.region,
              };
              const pairingOptions: WinePairingOptions = {
                  language, // Utilisation de language ici
                  apiKey: options.apiKey,
                  apiProvider: options.apiProvider
              };
              enriched.pairings = await this.getWinePairings(pairingInput, pairingOptions);
         } else if (enhancePairings && (!enriched.pairings || enriched.pairings.length === 0) && enriched.color) {
             // Fallback défaut simple si pas d'appel getWinePairings possible
              enriched.pairings = this.getDefaultPairings(enriched.color);
         }
 
 
// 4. Score Millésime (si région/millésime dispo)
         // Vérifier qu'on a bien 'region' et 'vintage'
         if (enriched.region && enriched.vintage) {
           // Récupérer le score depuis la base (ou undefined s’il n’existe pas)
           const vintageScore = await this.getVintageScore(enriched.region, enriched.vintage);
           // Assigner ce score (qui est number | undefined) à vintage_score
           enriched.vintage_score = vintageScore;
         }
         // 5. Assurer la présence des champs obligatoires (même si vides/null)
         if (!enriched.name) enriched.name = "Unknown Wine"; // Fallback
         if (!enriched.color) enriched.color = "unknown"; // Fallback
         if (enriched.aging === undefined) enriched.aging = null;
         if (enriched.taste_profile === undefined) enriched.taste_profile = null;
         if (enriched.pairings === undefined) enriched.pairings = null;
 
 
     } catch (error: unknown) {
         console.error("Erreur lors de l'enrichissement:", error instanceof Error ? error.message : error);
          // Assurer quand même que les champs obligatoires existent
         if (!enriched.name) enriched.name = "Unknown Wine";
         if (!enriched.color) enriched.color = "unknown";
         if (enriched.aging === undefined) enriched.aging = null;
         if (enriched.taste_profile === undefined) enriched.taste_profile = null;
         if (enriched.pairings === undefined) enriched.pairings = null;
     }
 
     // Forcer le type à EnrichedWineData (assume que les champs obligatoires sont là)
    return enriched as EnrichedWineData;
 }

   /** Récupère le score d'un millésime pour une région donnée */
    public async getVintageScore(region: string, vintage: number): Promise<number | undefined> {
    // Correction ici : return type modifié pour accepter null
    // Mapping simplifié (à affiner)
       const regionMapping: { [key: string]: string } = {
           'bordeaux': 'Bordeaux', 'bourgogne': 'Bourgogne', 'rhône': 'Rhône', 'rhone': 'Rhône',
           'loire': 'Loire', 'alsace': 'Alsace', 'champagne': 'Champagne', 'beaujolais': 'Beaujolais',
           'languedoc': 'Languedoc', 'roussillon': 'Languedoc', 'provence': 'Provence',
           'jura': 'Jura', 'savoie': 'Jura', 'sud-ouest': 'Sud-Ouest'
           // Ajouter d'autres régions majeures
       };
       let normalizedRegion: string | null = null;
       const lowerRegion = region.toLowerCase();
       for (const [key, value] of Object.entries(regionMapping)) {
           if (lowerRegion.includes(key)) {
               normalizedRegion = value;
               break;
           }
       }

       if (!normalizedRegion) {
           // console.warn(`Région non mappée pour score millésime: ${region}`);
           return undefined; // Correction ici : return null au lieu de undefined
       }

       try {
           const { data, error } = await this.supabase
               .from('vintage_scores') // Assurez-vous que cette table existe et est peuplée
               .select('score')
               .eq('region', normalizedRegion)
               .eq('vintage', vintage)
               .maybeSingle(); // Utiliser maybeSingle pour gérer 0 ou 1 résultat

           if (error) {
               console.error(`Erreur Supabase (getVintageScore) pour ${normalizedRegion}/${vintage}:`, error.message);
               return undefined; // Correction ici : return null au lieu de undefined
           }
           return (data?.score ?? undefined) as number | undefined; // Correction ici : return null au lieu de undefined

       } catch (error: unknown) {
           console.error(`Erreur lors de la récupération du score millésime (${normalizedRegion}/${vintage}):`, error instanceof Error ? error.message : error);
           return undefined; // Correction ici : return null au lieu de undefined
       }
   }

   /** Calcule une courbe de vieillissement basée sur des règles simples */
   private calculateAgingCurve(wine: AgingCurveInput): AgingData | null {
        if (!wine || !wine.vintage) return null;

        const currentYear = new Date().getFullYear();
        const ageYears = currentYear - wine.vintage;

        let peakAgeValue = 8; // Années avant l'apogée (depuis millésime)
        let estimatedAgeability = 15; // Durée totale de vie estimée (depuis millésime)

        // --- Logique d'estimation (simplifiée) ---
        const color = wine.color?.toLowerCase();
        const region = wine.region?.toLowerCase() ?? '';
        const appellation = wine.appellation?.toLowerCase() ?? '';

        if (color === 'red') {
            if (region.includes('bordeaux') || region.includes('bourgogne') || appellation.includes('grand cru') || appellation.includes('barolo') || appellation.includes('barbaresco')) {
                peakAgeValue = 12; estimatedAgeability = 25;
            } else if (region.includes('rhone') || region.includes('rhône') || appellation.includes('premier cru') || region.includes('chianti classico riserva') || region.includes('rioja gran reserva')) {
                peakAgeValue = 10; estimatedAgeability = 20;
            } else if (region.includes('beaujolais') && !appellation.includes('cru')) {
                 peakAgeValue = 3; estimatedAgeability = 7;
            } else {
                peakAgeValue = 7; estimatedAgeability = 12;
            }
        } else if (color === 'white') {
            if ((region.includes('bourgogne') && !appellation.includes('mâcon')) || appellation.includes('grand cru') || region.includes('alsace grand cru') || region.includes('allemagne') || region.includes('germany') || region.includes('sauternes')) {
                 peakAgeValue = 10; estimatedAgeability = 20;
            } else if (region.includes('loire') && (appellation.includes('sancerre') || appellation.includes('pouilly-fumé'))) {
                 peakAgeValue = 6; estimatedAgeability = 12;
            } else {
                 peakAgeValue = 4; estimatedAgeability = 8;
            }
        } else if (color === 'rose') {
             peakAgeValue = 2; estimatedAgeability = 4;
        } else if (color === 'sparkling') {
             if (region.includes('champagne') && !appellation.includes('non-vintage')) {
                 peakAgeValue = 10; estimatedAgeability = 20;
             } else {
                 peakAgeValue = 5; estimatedAgeability = 10;
             }
        } else if (color === 'fortified') {
             if (appellation.includes('vintage port')) {
                peakAgeValue = 20; estimatedAgeability = 50;
             } else {
                 peakAgeValue = 15; estimatedAgeability = 30;
             }
        }

         // Utiliser les données de consommation optimale si dispo (priment sur l'estimation)
         try {
             if (wine.optimal_consumption_start && wine.optimal_consumption_end) {
                 const startYear = new Date(wine.optimal_consumption_start).getFullYear();
                 const endYear = new Date(wine.optimal_consumption_end).getFullYear();
                 if (!isNaN(startYear) && !isNaN(endYear) && endYear > startYear) {
                    peakAgeValue = ((endYear - startYear) / 2) + (startYear - wine.vintage);
                    estimatedAgeability = endYear - wine.vintage;
                 }
             }
            } catch(error: unknown) { console.warn("Erreur parsing dates optimal_consumption:", error); } 
             // --- Fin Logique d'estimation ---


        // --- Calcul Phase et Qualité ---
        const peakStartAge = Math.max(1, peakAgeValue * 0.7); // Début apogée (au moins 1 an)
        const peakEndAge = Math.max(peakStartAge + 1, peakAgeValue * 1.5); // Fin apogée
        let currentPhase: AgingPhase;
        let quality = 0; // 0-100

        if (ageYears <= peakStartAge / 2) {
             currentPhase = "youth";
             quality = 20 + (ageYears / (peakStartAge / 2)) * 50; // Monte à 70%
        } else if (ageYears <= peakStartAge) {
             currentPhase = "development";
             quality = 70 + ((ageYears - peakStartAge / 2) / (peakStartAge - peakStartAge / 2)) * 25; // Monte à 95%
        } else if (ageYears <= peakEndAge) {
             currentPhase = "peak";
             // Qualité varie peu pendant l'apogée (ex: 100 -> 90)
             const peakDuration = peakEndAge - peakStartAge;
             quality = 100 - ((ageYears - peakStartAge) / peakDuration) * 10;
        } else if (ageYears <= estimatedAgeability) {
             currentPhase = "decline";
             // Déclin plus rapide après l'apogée
             const declineDuration = estimatedAgeability - peakEndAge;
              // Éviter division par zéro
             const declineProgress = declineDuration > 0 ? (ageYears - peakEndAge) / declineDuration : 1;
             quality = 90 - declineProgress * 70; // Descend à 20%
        } else {
            currentPhase = "decline";
            quality = 10; // Très décliné
        }

         quality = Math.max(5, Math.min(100, Math.round(quality))); // Borner 5-100

        return {
            potential_years: Math.round(estimatedAgeability),
            peak_start_year: Math.round(wine.vintage + peakStartAge),
            peak_end_year: Math.round(wine.vintage + peakEndAge),
            drink_now: currentPhase === "peak" || currentPhase === "development", // Simplifié
            current_phase: currentPhase,
            estimated_quality_now: quality
        };
   }

   /** Analyse basique de notes de dégustation textuelles */
   private analyzeTastingNotes(notes: string | null | undefined): Partial<TasteProfile> | null {
        if (!notes) return null;

        const profile: Partial<TasteProfile> = {};
        const text = notes.toLowerCase();

        // Mots-clés (simplifié, à améliorer)
        const keywords = {
            body: ['corsé', 'full-bodied', 'puissant', 'robust', 'charnu', 'dense'],
            light_body: ['léger', 'light-bodied', 'fluide'],
            acidity: ['vif', 'crisp', 'acidité', 'fresh', 'tendu', 'nervous'],
            low_acidity: ['mou', 'flabby', 'plat', 'low acidity'],
            tannin: ['tannique', 'tannins', 'astringent', 'firm', 'structured'],
            low_tannin: ['souple', 'soft', 'smooth tannins', 'peu tannique'],
            sweetness: ['doux', 'sweet', 'moelleux', 'liquoreux', 'sucre'],
            dryness: ['sec', 'dry'],
            fruitiness: ['fruité', 'fruit-forward', 'juteux', 'ripe fruit'],
            complexity: ['complexe', 'complex', 'layered', 'nuancé'],
            oak: ['boisé', 'oaky', 'vanille', 'vanilla', 'toasté', 'toast'],
            intensity: ['intense', 'puissant', 'powerful', 'expressif', 'pronounced'],
        };

        // Logique très basique : +1 si mot-clé trouvé (à affiner avec scores, contexte, etc.)
        if (keywords.body.some(k => text.includes(k))) profile.body = 4;
        if (keywords.light_body.some(k => text.includes(k))) profile.body = 2;
        if (keywords.acidity.some(k => text.includes(k))) profile.acidity = 4;
        if (keywords.low_acidity.some(k => text.includes(k))) profile.acidity = 2;
        if (keywords.tannin.some(k => text.includes(k))) profile.tannin = 4;
        if (keywords.low_tannin.some(k => text.includes(k))) profile.tannin = 2;
        if (keywords.sweetness.some(k => text.includes(k))) profile.sweetness = 4;
        if (keywords.dryness.some(k => text.includes(k))) profile.sweetness = 1;
        if (keywords.fruitiness.some(k => text.includes(k))) profile.fruitiness = 4;
        if (keywords.complexity.some(k => text.includes(k))) profile.complexity = 4;
        if (keywords.oak.some(k => text.includes(k))) profile.oak = 3; // Chêne est plus nuancé
        if (keywords.intensity.some(k => text.includes(k))) profile.intensity = 4;

        // Valeurs par défaut si non détecté
        if (profile.body === undefined) profile.body = 3;
        if (profile.acidity === undefined) profile.acidity = 3;
        if (profile.tannin === undefined) profile.tannin = text.includes('rouge') || text.includes('red') ? 3 : 1;
        if (profile.sweetness === undefined) profile.sweetness = 1;
        if (profile.fruitiness === undefined) profile.fruitiness = 3;
        if (profile.complexity === undefined) profile.complexity = 3;
        if (profile.oak === undefined) profile.oak = 1;
        if (profile.intensity === undefined) profile.intensity = 3;

        return profile;
   }
   /** Retourne un profil de dégustation par défaut basé sur la couleur */
   private getDefaultTastingProfile(color: WineColor | undefined): TasteProfile {
    const defaults: TasteProfile = { body: 3, acidity: 3, tannin: 1, sweetness: 1, fruitiness: 3, complexity: 3, oak: 1, intensity: 3, primary_flavors: [] };
    switch (color?.toLowerCase()) {
        case 'red':       return { ...defaults, body: 4, tannin: 4, acidity: 3, oak: 2, primary_flavors: ['cerise', 'mûre', 'épice'] };
        case 'white':     return { ...defaults, body: 2, acidity: 4, fruitiness: 4, primary_flavors: ['citron', 'pomme', 'fleur blanche'] };
        case 'rose':      return { ...defaults, body: 2, acidity: 4, fruitiness: 4, sweetness: 1.5, primary_flavors: ['fraise', 'groseille', 'agrume'] };
        case 'sparkling': return { ...defaults, body: 2, acidity: 5, complexity: 3.5, sweetness: 2, primary_flavors: ['pomme verte', 'citron', 'brioche'] };
        case 'fortified': return { ...defaults, body: 5, tannin: 3, sweetness: 4, intensity: 5, complexity: 4, fruitiness: 4, oak: 3, primary_flavors: ['fruits secs', 'caramel', 'noix'] };
        default:          return { ...defaults, primary_flavors: ['fruit', 'terre', 'végétal'] };
    }
}

/** Retourne des accords par défaut basés sur la couleur */
private getDefaultPairings(color: WineColor | undefined): Pairing[] {
     const defaultExplanation = "Accord classique qui fonctionne bien avec ce type de vin.";
     const audaciousExplanation = "Un accord plus surprenant mais intéressant à explorer.";
     const merchantExplanation = "Un accord raffiné, souvent trouvé dans les grands restaurants.";

     switch (color?.toLowerCase()) {
         case 'red': return [
             { food: "Viande rouge grillée", strength: 4.5, type: "classic", explanation: defaultExplanation },
             { food: "Fromages affinés", strength: 4, type: "classic", explanation: defaultExplanation },
             { food: "Champignons sautés", strength: 3.5, type: "audacious", explanation: audaciousExplanation },
             { food: "Canard rôti", strength: 4.5, type: "merchant", explanation: merchantExplanation }
         ];
         case 'white': return [
             { food: "Poisson blanc vapeur ou grillé", strength: 4.5, type: "classic", explanation: defaultExplanation },
             { food: "Salade César", strength: 4, type: "classic", explanation: defaultExplanation },
             { food: "Cuisine asiatique légère (non épicée)", strength: 3.8, type: "audacious", explanation: audaciousExplanation },
             { food: "Risotto aux asperges", strength: 4.2, type: "merchant", explanation: merchantExplanation }
         ];
          case 'rose': return [
              { food: "Salade niçoise", strength: 4, type: "classic", explanation: defaultExplanation },
              { food: "Grillades légères (poulet, crevettes)", strength: 3.8, type: "classic", explanation: defaultExplanation },
              { food: "Cuisine méditerranéenne", strength: 4, type: "audacious", explanation: audaciousExplanation },
              { food: "Bouillabaisse", strength: 4.5, type: "merchant", explanation: merchantExplanation }
          ];
          case 'sparkling': return [
            { food: "Huîtres", strength: 4.5, type: "classic", explanation: defaultExplanation },
            { food: "Amuse-bouches variés", strength: 4, type: "classic", explanation: defaultExplanation },
            { food: "Poulet frit", strength: 3.5, type: "audacious", explanation: audaciousExplanation },
            { food: "Caviar ou œufs de saumon", strength: 4.8, type: "merchant", explanation: merchantExplanation }
        ];
        case 'fortified': return [
            { food: "Chocolat noir", strength: 4.5, type: "classic", explanation: defaultExplanation },
            { food: "Fromages bleus (Roquefort, Stilton)", strength: 4.2, type: "classic", explanation: defaultExplanation },
            { food: "Foie gras (pour certains types)", strength: 4, type: "audacious", explanation: audaciousExplanation },
            { food: "Desserts aux noix ou caramel", strength: 4.5, type: "merchant", explanation: merchantExplanation }
        ];
       default: return [
            { food: "Apéritif", strength: 3, type: "classic", explanation: "Suggestion générique." }
       ];
   }
}

// --- Vérification DB & Mapping ---

/** Vérifie si un vin existe en base de données */
private async checkExistingWine(wineName: string): Promise<WineDbRecord | null> {
  try {
      // Extraire millésime potentiel du nom
      let vintage: number | null = null;
      let nameWithoutVintage = wineName;
      const vintageMatch = wineName.match(/\b(19[89]\d|20\d{2})\b/); // Regex plus précise
      if (vintageMatch) {
          vintage = parseInt(vintageMatch[0], 10);
          nameWithoutVintage = wineName.replace(vintageMatch[0], '').replace(/\s+/g, ' ').trim();
      }

      // Construire la requête
      let query = this.supabase.from('wine').select(`
          id, name, vintage, domain, region, appellation, color,
          alcohol_percentage, notes, optimal_consumption_start, optimal_consumption_end,
          wine_grape (grape_id, percentage, grape:grape_id(name))
      `);

      // Recherche par nom (sans millésime) et millésime si trouvé
      query = query.ilike('name', `%${nameWithoutVintage}%`);
      if (vintage !== null) {
           query = query.eq('vintage', vintage);
       } else {
           // Si aucun millésime dans le nom, rechercher ceux sans millésime explicite en DB
           query = query.is('vintage', null);
       }


      // Exécuter et limiter (prendre le plus pertinent ?)
      // Pour l'instant, prend le premier trouvé
      const { data, error } = await query.limit(1).maybeSingle(); // Utiliser maybeSingle


      if (error) {
          console.error(`Erreur Supabase (checkExistingWine pour "${wineName}"):`, error.message);
          return null; // Ne pas jeter l'erreur, juste retourner null
      }

      return data as unknown as WineDbRecord | null;

  } catch (error: unknown) {
      console.error(`Erreur inattendue dans checkExistingWine ("${wineName}"):`, error instanceof Error ? error.message : error);
      return null;
  }
}

/** Mappe un enregistrement DB vers la structure BaseWineData */
private mapDbRecordToWineData(dbRecord: WineDbRecord): BaseWineData {
   const grapes = dbRecord.wine_grape
       ?.map(wg => wg.grape?.name)
       .filter((name): name is string => name !== null && name !== undefined) ?? []; // Filtrer null/undefined

   return {
       id: dbRecord.id,
       name: dbRecord.name,
       vintage: dbRecord.vintage,
       domain: dbRecord.domain || undefined,
       region: dbRecord.region || undefined,
       appellation: dbRecord.appellation || undefined,
       color: dbRecord.color || undefined,
       alcohol_percentage: dbRecord.alcohol_percentage,
       notes: dbRecord.notes || undefined, // Utiliser 'notes' comme source principale
       tasting_notes: dbRecord.notes || undefined, // Peut être parsé plus tard si nécessaire
       grapes: grapes,
       optimal_consumption_start: dbRecord.optimal_consumption_start,
       optimal_consumption_end: dbRecord.optimal_consumption_end,
       // Les autres champs (aging, taste_profile, pairings) seront ajoutés par enrichWineData
   };
}

// --- Gestion du Cache ---

private getFromCache<T extends CacheableData>(key: string): T | null {
  const cachedItem = this.cache.get(key);
  if (!cachedItem) return null;

  if (Date.now() > cachedItem.expiry) {
      this.cache.delete(key);
      console.log(`Cache expiré pour: ${key}`);
      return null;
  }

  return cachedItem.value as T; // Assurer le type au retour
}

private setInCache(key: string, value: CacheableData): void {
  if (value === undefined || value === null) {
       console.warn(`Tentative de mise en cache d'une valeur vide pour ${key}`);
       return; // Ne pas cacher undefined/null explicitement
  }
  this.cache.set(key, {
      value,
      expiry: Date.now() + this.cacheExpiration
  });
  console.log(`Mise en cache pour: ${key}`);
}

// --- Traduction (Basique - à externaliser ou remplacer par une vraie API) ---

/**
* Tente de s'assurer qu'un texte est dans la langue cible.
* NOTE: Logique de détection/traduction très basique. A améliorer.
*/
private ensureTextInLanguage(text: string | null | undefined, targetLanguage: Language): string {
   if (!text) return '';
   // Logique de détection simpliste (peut être trompeuse)
   const isLikelyEnglish = /\b(the|and|of|in|on|with|palate|finish|aroma|flavor)\b/i.test(text);
   const isLikelyFrench = /\b(le|la|les|et|de|du|en|dans|avec|palais|finale|arôme|saveur)\b/i.test(text);

   let currentLang: Language | null = null;
   if (isLikelyEnglish && !isLikelyFrench) currentLang = 'en';
   if (isLikelyFrench && !isLikelyEnglish) currentLang = 'fr';
   // Si ambigu ou non détecté, on ne traduit pas
   if (!currentLang || currentLang === targetLanguage) {
       return text;
   }

   // return this.translateText(text, currentLang, targetLanguage); // Désactivé par défaut
   return text; // Retourner le texte original si la traduction n'est pas fiable
}

/**
* Traduction mot à mot très basique via dictionnaire.
* NOTE: Ne gère pas la grammaire, le contexte. Très limité.
* À remplacer par une API de traduction pour un résultat fiable.
*/
private translateText(text: string, fromLang: Language, toLang: Language): string {
  if (fromLang === toLang) return text;
  console.warn(`Utilisation de la traduction basique de '${fromLang}' vers '${toLang}'. Qualité limitée.`);

  // Dictionnaire (exemple très réduit)
  const enToFrDict: Record<string, string> = { 'cherry': 'cerise', 'red': 'rouge', 'wine': 'vin', /* ... ajouter beaucoup plus ... */ };
  const frToEnDict: Record<string, string> = { 'cerise': 'cherry', 'rouge': 'red', 'vin': 'wine', /* ... */ };

  const dict = (fromLang === 'en') ? enToFrDict : frToEnDict;
  let translatedText = text;
  
  // Trier les clés par longueur décroissante pour éviter les remplacements partiels
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    // Utiliser une expression régulière pour remplacer uniquement les mots entiers
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    translatedText = translatedText.replace(regex, dict[key]);
  }

  return translatedText;
}
}

export default WineAIService;