// app/services/AIPairingService.ts

import { supabase } from '@/utils/supabase';
import { Bottle, DBWine } from '@/utils/types';

/**
 * Service 100% IA pour les accords mets-vins
 * Utilise GPT-4 avec un profil gastronome personnalisé
 */

// Configuration IA
const AI_CONFIG = {
  primary: {
    model: "gpt-4-turbo-preview",
    temperature: 0.7,
    max_tokens: 3000,
  },
  fallback: {
    model: "gpt-3.5-turbo",
    temperature: 0.6,
    max_tokens: 2000,
  }
};

// Types pour le service
export interface ScoredBottle {
  bottle: Bottle;
  score: number;
  pairingType: 'perfect' | 'excellent' | 'good' | 'audacious';
  explanation: string;
  whyItWorks: string[];
  servingTips: {
    temperature: string;
    glassType: string;
    decanting: string;
  };
}

export interface PurchaseSuggestion {
  name: string;
  producer: string;
  vintage?: number;
  region: string;
  appellation: string;
  grapes: string[];
  priceRange: '€' | '€€' | '€€€' | '€€€€';
  whereToBuy: string[];
  score: number;
  explanation: string;
  whyPerfect: string[];
  characteristics: {
    style: string;
    profile: string;
    notes: string[];
  };
}

export interface PairingAnalysis {
  query: string;
  dishAnalysis: {
    mainIngredients: string[];
    cookingMethod: string;
    dominantFlavors: string[];
    texture: string;
    intensity: 'light' | 'medium' | 'full';
  };
  pairingPrinciples: string[];
  cellarMatches: ScoredBottle[];
  purchaseSuggestions: PurchaseSuggestion[];
}

export class AIPairingService {
  private static instance: AIPairingService;

  private constructor() {}

  static getInstance(): AIPairingService {
    if (!AIPairingService.instance) {
      AIPairingService.instance = new AIPairingService();
    }
    return AIPairingService.instance;
  }

  /**
   * Trouve les meilleurs accords pour un plat
   */
  async findPairings(
    foodQuery: string,
    userId: string,
    apiKey: string,
    apiProvider: 'openai' | 'mistral' = 'openai'
  ): Promise<PairingAnalysis> {
    try {
      // 1. Récupérer les vins de la cave
      const cellarBottles = await this.getCellarBottles(userId);
      
      // 2. Préparer le prompt avec le profil utilisateur
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(foodQuery, cellarBottles);
      
      // 3. Appel à l'IA
      const aiResponse = await this.callAI(
        systemPrompt,
        userPrompt,
        apiKey,
        apiProvider
      );
      
      // 4. Parser et enrichir la réponse
      const analysis = this.parseAIResponse(aiResponse, cellarBottles);
      
      return analysis;
    } catch (error) {
      console.error('Erreur dans findPairings:', error);
      throw error;
    }
  }

  /**
   * Récupère les bouteilles de la cave avec leurs vins
   */
  private async getCellarBottles(userId: string): Promise<Bottle[]> {
    const { data, error } = await supabase
      .from('bottle')
      .select(`
        *,
        wine:wine_id(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'in_stock');

    if (error) throw error;
    
    return (data || []).map(bottle => ({
      ...bottle,
      wine: Array.isArray(bottle.wine) ? bottle.wine[0] : bottle.wine
    }));
  }

  /**
   * Construit le prompt système avec le profil personnalisé
   */
  private buildSystemPrompt(): string {
    return `Tu es un Master Sommelier personnel avec 20 ans d'expérience dans les plus grands restaurants étoilés. 
Tu connais parfaitement ton client, voici son profil :

- C'est un amateur éclairé du goût qui apprécie l'authenticité
- Il aime comprendre POURQUOI un accord fonctionne (pédagogie très importante)
- Il respecte les accords classiques mais reste ouvert aux propositions audacieuses SI elles sont bien justifiées
- Il n'aime pas le snobisme : tes explications doivent être claires, passionnées et accessibles
- Il privilégie l'harmonie et l'équilibre, mais apprécie les contrastes maîtrisés
- Il aime les anecdotes et détails qui enrichissent l'expérience

Pour chaque accord :
1. Explique clairement et avec passion pourquoi ça fonctionne
2. Si c'est audacieux, justifie en détail pourquoi ça vaut la peine d'essayer
3. Donne des conseils pratiques de service (température, carafage, verre)
4. Sois précis mais accessible dans ton vocabulaire`;
  }

  /**
   * Construit le prompt utilisateur avec le plat et les vins disponibles
   */
  private buildUserPrompt(foodQuery: string, bottles: Bottle[]): string {
    const winesList = bottles.map(b => {
      const w = b.wine as DBWine;
      return {
        id: b.id,
        wine: `${w.name} ${w.vintage || ''} - ${w.region || ''} ${w.appellation || ''} - ${w.color || ''}`
      };
    });

    return `Analyse le plat suivant et propose des accords mets-vins : "${foodQuery}"

Voici les vins disponibles dans la cave :
${JSON.stringify(winesList, null, 2)}

Réponds UNIQUEMENT avec un JSON valide suivant cette structure exacte :
{
  "dishAnalysis": {
    "mainIngredients": ["ingrédient1", "ingrédient2"],
    "cookingMethod": "méthode de cuisson",
    "dominantFlavors": ["saveur1", "saveur2"],
    "texture": "description de la texture",
    "intensity": "light" | "medium" | "full"
  },
  "pairingPrinciples": [
    "Principe d'accord appliqué et pourquoi"
  ],
  "cellarMatches": [
    {
      "bottleId": "id de la bouteille",
      "score": 9.5,
      "pairingType": "perfect" | "excellent" | "good" | "audacious",
      "explanation": "Explication passionnée et pédagogique",
      "whyItWorks": [
        "Raison 1 détaillée",
        "Raison 2 détaillée"
      ],
      "servingTips": {
        "temperature": "température de service",
        "glassType": "type de verre recommandé",
        "decanting": "conseils de carafage"
      }
    }
  ],
  "purchaseSuggestions": [
    {
      "name": "Nom du vin",
      "producer": "Producteur",
      "vintage": 2019,
      "region": "Région",
      "appellation": "Appellation",
      "grapes": ["cépage1", "cépage2"],
      "priceRange": "€€",
      "whereToBuy": ["Caviste 1", "Site web"],
      "score": 9.8,
      "explanation": "Description du vin",
      "whyPerfect": [
        "Raison 1 de l'accord parfait",
        "Raison 2 de l'accord parfait"
      ],
      "characteristics": {
        "style": "Style du vin",
        "profile": "Profil gustatif",
        "notes": ["note1", "note2", "note3"]
      }
    }
  ]
}

IMPORTANT :
- Sélectionne exactement 4 bouteilles de la cave : 3 meilleurs accords (scores 7-10) + 1 accord audacieux justifié
- Propose exactement 2 suggestions d'achat qui seraient des accords parfaits (scores 9-10)
- Les explications doivent être passionnées, pédagogiques et sans snobisme
- Pour l'accord audacieux, justifie vraiment pourquoi c'est intéressant à tester`;
  }

  /**
   * Appelle l'API OpenAI/Mistral
   */
  private async callAI(
    systemPrompt: string,
    userPrompt: string,
    apiKey: string,
    provider: 'openai' | 'mistral'
  ): Promise<string> {
    const config = AI_CONFIG.primary;
    
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur OpenAI: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      // Implémentation Mistral similaire
      throw new Error('Provider Mistral non implémenté');
    }
  }

  /**
   * Parse et enrichit la réponse de l'IA
   */
  private parseAIResponse(
    aiResponse: string,
    bottles: Bottle[]
  ): PairingAnalysis {
    try {
      const parsed = JSON.parse(aiResponse);
      
      // Enrichir les cellarMatches avec les objets Bottle complets
      const enrichedMatches = parsed.cellarMatches.map((match: {
        bottleId: string;
        score: number;
        pairingType: 'perfect' | 'excellent' | 'good' | 'audacious';
        explanation: string;
        whyItWorks: string[];
        servingTips: {
          temperature: string;
          glassType: string;
          decanting: string;
        };
      }) => {
        const bottle = bottles.find(b => b.id === match.bottleId);
        if (!bottle) {
          console.warn(`Bouteille ${match.bottleId} non trouvée`);
          return null;
        }
        
        return {
          bottle,
          score: match.score,
          pairingType: match.pairingType,
          explanation: match.explanation,
          whyItWorks: match.whyItWorks,
          servingTips: match.servingTips
        };
      }).filter(Boolean);

      return {
        query: parsed.query || '',
        dishAnalysis: parsed.dishAnalysis,
        pairingPrinciples: parsed.pairingPrinciples,
        cellarMatches: enrichedMatches,
        purchaseSuggestions: parsed.purchaseSuggestions
      };
    } catch (error) {
      console.error('Erreur parsing réponse IA:', error);
      throw new Error('Réponse IA invalide');
    }
  }
}

export default AIPairingService;