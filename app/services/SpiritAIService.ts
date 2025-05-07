// app/services/SpiritAIService.ts

import { Spirit, SpiritType } from '../utils/types/spirit.types';

/**
 * Options de configuration pour le service AI des spiritueux
 */
interface SpiritAIOptions {
  apiKey: string;
  apiProvider?: 'openai'; // Utilisation uniquement d'OpenAI
  language?: 'fr' | 'en';
}

/**
 * Structure de la réponse de l'API IA
 */
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
 * Format des messages pour les requêtes API
 */
interface ApiMessage {
  role: string;
  content: string;
}

/**
 * Type pour le corps de la requête API
 */
interface ApiRequestBody {
  model: string;
  messages: ApiMessage[];
  temperature: number;
}

/**
 * Service pour l'extraction d'informations sur les spiritueux via IA
 */
class SpiritAIService {
  private readonly apiKey: string;
  private readonly language: 'fr' | 'en';

  /**
   * Crée une nouvelle instance du service SpiritAI
   * @param options Options de configuration du service
   */
  constructor(options: SpiritAIOptions) {
    this.apiKey = options.apiKey;
    this.language = options.language || 'fr'; // Français par défaut
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

      const endpoint = 'https://api.openai.com/v1/chat/completions';
      const systemPrompt = this.getSystemPrompt();
      const requestBody = this.buildRequestBody(systemPrompt, searchTerm);
      
      const response = await this.makeApiRequest(endpoint, requestBody);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await this.parseApiResponse(response);
      return this.mapResponseToSpirit(result);
    } catch (error) {
      console.error('Spirit AI Service error:', error);
      throw error;
    }
  }

  /**
   * Génère le prompt système adapté à la langue choisie
   */
  private getSystemPrompt(): string {
    return this.language === 'fr'
      ? `Tu es un expert en spiritueux. Analyse le spiritueux suivant et retourne une fiche détaillée au format JSON strict avec les champs: name, type (whisky/rum/gin/vodka/tequila/brandy/liqueur/other), subType, abv (nombre), country, region, distillery, age (nombre en années), vintage (année), color, finish, tastingNotes (array), ingredients (array).`
      : `You are a spirits expert. Analyze the following spirit and return a detailed profile in strict JSON format with the fields: name, type (whisky/rum/gin/vodka/tequila/brandy/liqueur/other), subType, abv (number), country, region, distillery, age (number in years), vintage (year), color, finish, tastingNotes (array), ingredients (array).`;
  }

  /**
   * Construit le corps de la requête API
   */
  private buildRequestBody(systemPrompt: string, searchTerm: string): ApiRequestBody {
    // Forcer la réponse en français si c'est la langue demandée
    const languageInstruction = this.language === 'fr' 
      ? 'Réponds uniquement en français. ' 
      : '';
    
    const finalSystemPrompt = languageInstruction + systemPrompt;
    
    // Utiliser gpt-3.5-turbo car il est plus fiable pour le parsing JSON
    return {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: searchTerm }
      ],
      temperature: 0.7
    };
  }

  /**
   * Effectue la requête API
   */
  private async makeApiRequest(endpoint: string, requestBody: ApiRequestBody): Promise<Response> {
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Parse la réponse de l'API
   */
  private async parseApiResponse(response: Response): Promise<SpiritAIResponse> {
    const data = await response.json();
    const resultContent = data.choices[0].message.content;
    
    try {
      // Essayer de parser la chaîne JSON
      return JSON.parse(resultContent);
    } catch (e) {
      console.error('Erreur lors de l\'analyse de la réponse API:', resultContent);
      throw new Error(`Failed to parse API response: ${e instanceof Error ? e.message : String(e)}`);
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
   * @param _imageUrl URL de l'image à analyser (préfixé avec _ car non utilisé)
   */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async analyzeBottleImage(_imageUrl: string): Promise<Partial<Spirit>> {
  // Future implémentation pour l'analyse d'image
  throw new Error('Image analysis not implemented yet');
}
}

export default SpiritAIService;