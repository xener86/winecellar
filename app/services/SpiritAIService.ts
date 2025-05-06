// app/services/SpiritAIService.ts

import { Spirit, SpiritType } from '../utils/types/spirit.types';

interface SpiritAIOptions {
  apiKey: string;
  apiProvider: 'openai' | 'mistral';
  language?: 'fr' | 'en';
}

interface SpiritAIResponse {
  name: string;
  type: string;
  subType?: string;
  abv?: number;
  country?: string;
  region?: string;
  distillery?: string;
  age?: number;
  vintage?: number;
  color?: string;
  finish?: string;
  tastingNotes?: string[];
  ingredients?: string[];
}

/**
 * Service pour l'extraction d'informations sur les spiritueux via IA
 */
class SpiritAIService {
  private apiKey: string;
  private provider: 'openai' | 'mistral';
  private language: 'fr' | 'en';

  constructor(options: SpiritAIOptions) {
    this.apiKey = options.apiKey;
    this.provider = options.apiProvider;
    this.language = options.language || 'fr';
  }

  /**
   * Obtient les informations détaillées d'un spiritueux à partir de son nom
   * @param searchTerm Nom du spiritueux à rechercher
   * @returns Informations partielles sur le spiritueux
   */
  async getSpiritInfo(searchTerm: string): Promise<Partial<Spirit>> {
    try {
      if (!this.apiKey) {
        throw new Error('API key is required');
      }

      const endpoint = this.provider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://api.mistral.ai/v1/chat/completions';

      // Prompt adapté aux spiritueux
      const systemPrompt = this.language === 'fr'
        ? `Tu es un expert en spiritueux. Analyse le spiritueux suivant et retourne une fiche détaillée au format JSON strict avec les champs: name, type (whisky/rum/gin/vodka/tequila/brandy/liqueur/other), subType, abv (nombre), country, region, distillery, age (nombre en années), vintage (année), color, finish, tastingNotes (array), ingredients (array).`
        : `You are a spirits expert. Analyze the following spirit and return a detailed profile in strict JSON format with the fields: name, type (whisky/rum/gin/vodka/tequila/brandy/liqueur/other), subType, abv (number), country, region, distillery, age (number in years), vintage (year), color, finish, tastingNotes (array), ingredients (array).`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.provider === 'openai' ? 'gpt-4' : 'mistral-medium',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: searchTerm }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const resultContent = data.choices[0].message.content;
      
      // Parse le JSON retourné par l'API
      let result: SpiritAIResponse;
      try {
        result = JSON.parse(resultContent);
      } catch (e) {
        throw new Error(`Failed to parse API response: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Transformation vers le format Spirit
      return this.mapResponseToSpirit(result);
    } catch (error) {
      console.error('Spirit AI Service error:', error);
      throw error;
    }
  }

  /**
   * Convertit la réponse de l'API en format Spirit compatible
   * @param result Réponse de l'API
   * @returns Objet partiel Spirit
   */
  private mapResponseToSpirit(result: SpiritAIResponse): Partial<Spirit> {
    // Vérification et conversion du type
    const validTypes: SpiritType[] = ['whisky', 'rum', 'gin', 'vodka', 'tequila', 'brandy', 'liqueur', 'other'];
    let type: SpiritType = 'other';
    
    if (result.type && validTypes.includes(result.type.toLowerCase() as SpiritType)) {
      type = result.type.toLowerCase() as SpiritType;
    }

    // Création de l'objet Spirit
    return {
      name: result.name || '',
      type: type,
      subType: result.subType || null,
      abv: typeof result.abv === 'number' ? result.abv : undefined,
      volume: undefined, // Non fourni par l'API, à compléter manuellement
      origin: {
        country: result.country || '',
        region: result.region || null,
        distillery: result.distillery || null
      },
      age: typeof result.age === 'number' ? result.age : null,
      vintage: typeof result.vintage === 'number' ? result.vintage : null,
      details: {
        color: result.color || null,
        finish: result.finish || null,
        tastingNotes: Array.isArray(result.tastingNotes) ? result.tastingNotes : null,
        ingredients: Array.isArray(result.ingredients) ? result.ingredients : null
      },
      acquisition: {
        date: new Date().toISOString().split('T')[0], // Date du jour par défaut
        price: null,
        store: null
      },
      storage: {
        locationId: null,
        position: {
          id: null,
          row: null,
          column: null
        },
        fillLevel: 'full' // Par défaut, la bouteille est pleine
      },
      bottleImage: null,
      notes: null,
      customTags: null
    };
  }

  /**
   * Analyse une image de bouteille pour en extraire les informations
   * (Fonctionnalité future - non implémentée)
   */
  async analyzeBottleImage(imageUrl: string): Promise<Partial<Spirit>> {
    // Future implémentation pour l'analyse d'image
    throw new Error('Image analysis not implemented yet');
  }
}

export default SpiritAIService;