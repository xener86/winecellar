// app/api/cocktails/suggest/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Fonction pour générer une suggestion de cocktail via l'API IA
async function generateCocktailSuggestion(
  mainSpirit: string,
  availableSpirits: any[],
  apiKey: string,
  existing?: any
) {
  try {
    // Identifier l'API à utiliser
    const isOpenAI = apiKey.startsWith('sk-');
    
    const endpoint = isOpenAI
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.mistral.ai/v1/chat/completions';
    
    // Créer le prompt
    let prompt = `En tant que mixologue professionnel, crée une recette de cocktail originale`;
    
    if (existing && existing.name) {
      prompt += ` basée sur ou améliorant "${existing.name}"`;
    } else {
      prompt += ` utilisant ${mainSpirit} comme base`;
    }
    
    prompt += `. Utilise si possible les spiritueux disponibles dans cette collection: ${availableSpirits.map(s => s.name).join(', ')}.`;
    
    if (existing && existing.ingredients && existing.ingredients.length > 0) {
      prompt += ` La recette actuelle utilise: ${existing.ingredients.map((i: any) => `${i.amount} ${i.unit} de ${i.name}`).join(', ')}.`;
    }
    
    prompt += ` Réponds UNIQUEMENT avec un objet JSON valide ayant cette structure précise:
    {
      "name": "Nom du cocktail",
      "category": "l'une de ces valeurs uniquement: classic, modern, tiki, sour, highball, fizz, frozen, hot, punch, martini, other",
      "glassType": "l'un de ces types uniquement: highball, lowball, martini, coupe, flute, hurricane, margarita, mug, shot, collins, wine, other",
      "ingredients": [
        {
          "name": "Nom de l'ingrédient",
          "amount": nombre (quantité),
          "unit": "ml, cl, oz, dash, drop, part, barspoon, splash, pinch, ou piece",
          "isOptional": true ou false
        }
      ],
      "garnish": "garniture (ou null)",
      "preparation": "Instructions détaillées de préparation",
      "preparationMethod": "l'une de ces méthodes uniquement: shaken, stirred, built, blended, layered, muddled, hot-build, other",
      "difficulty": "l'une de ces valeurs: easy, medium, hard"
    }
    `;
    
    // Envoyer la requête
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: isOpenAI ? "gpt-4" : "mistral-medium",
        messages: [
          { role: "system", content: "Tu es un mixologue expert qui crée des recettes de cocktails originales et précises." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extraire et analyser la réponse
    const content = data.choices[0].message.content;
    const cocktailData = JSON.parse(content);
    
    // Ajouter les ID pour chaque ingrédient
    if (cocktailData.ingredients && Array.isArray(cocktailData.ingredients)) {
      cocktailData.ingredients = cocktailData.ingredients.map((ingredient: any, index: number) => ({
        ...ingredient,
        id: `ingredient_${Date.now()}_${index}`
      }));
    }
    
    return cocktailData;
  } catch (error) {
    console.error('Erreur lors de la génération du cocktail:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Utilisateur non authentifié' 
      }, { status: 401 });
    }
    
    // Récupérer les données de la requête
    const body = await req.json();
    const { mainSpirit, availableSpirits, apiKey, existing } = body;
    
    if (!mainSpirit || !availableSpirits || !apiKey) {
      return NextResponse.json({ 
        error: 'Paramètres manquants' 
      }, { status: 400 });
    }
    
    // Générer la suggestion de cocktail
    const cocktailSuggestion = await generateCocktailSuggestion(
      mainSpirit,
      availableSpirits,
      apiKey,
      existing
    );
    
    return NextResponse.json(cocktailSuggestion);
  } catch (error) {
    console.error('Erreur API suggestion cocktail:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}