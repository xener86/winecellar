// app/api/pairings/cellar-match/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { supabase } from '@/utils/supabase';

export async function POST(req: NextRequest) {
  console.log("API cellar-match appelée !");
  try {
    const body = await req.json();
    console.log("Requête reçue - Type de plat:", body.foodQuery);
    console.log("Nombre de recommandations:", body.wineRecommendations?.length);
    
    const { 
      foodQuery, 
      wineRecommendations, 
      userId,
      apiKey, 
      apiProvider = 'openai'
    } = body;

    if (!apiKey || !foodQuery || !wineRecommendations || !userId) {
      console.error("Données manquantes:", { 
        apiKey: !!apiKey, 
        foodQuery: !!foodQuery, 
        wineRecommendations: !!wineRecommendations, 
        userId: !!userId 
      });
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Récupérer les vins de la cave de l'utilisateur
    const { data: bottlesData, error: bottlesError } = await supabase
      .from('bottle')
      .select(`id, wine_id, position_id, status, wine:wine_id(*)`)
      .eq('status', 'in_stock')
      .eq('user_id', userId);

    if (bottlesError) {
      console.error("Erreur lors de la récupération des bouteilles:", bottlesError);
      return NextResponse.json({ 
        error: 'Erreur lors de la récupération des bouteilles',
        details: bottlesError.message
      }, { status: 500 });
    }

    // Si aucune bouteille trouvée, retourner une réponse vide mais valide
    if (!bottlesData || bottlesData.length === 0) {
      console.log("Aucune bouteille trouvée dans la cave");
      return NextResponse.json([]);
    }

    // Formater les bouteilles pour l'envoi à l'API
    const cellarWines = bottlesData.map(b => ({
      ...b,
      wine: Array.isArray(b.wine) ? b.wine[0] : b.wine
    }));

    console.log(`${cellarWines.length} bouteilles trouvées dans la cave`);

    // Si l'utilisateur n'a pas de bouteilles ou toutes les bouteilles n'ont pas de vin associé
    if (cellarWines.every(b => !b.wine)) {
      console.log("Aucune bouteille avec des données de vin valides");
      return NextResponse.json([]);
    }

    // Créer le prompt pour le modèle
    const prompt = `
Tu es un expert en vins qui doit faire correspondre des suggestions génériques avec des bouteilles spécifiques dans une cave.

Pour le plat : "${foodQuery}", on m'a recommandé les types de vins suivants :
${JSON.stringify(wineRecommendations.map(r => ({
  wine_type: r.wine_type,
  grape: r.grape,
  characteristics: r.characteristics,
  pairing_type: r.pairing_type
})), null, 2)}

Voici les bouteilles disponibles dans ma cave :
${JSON.stringify(cellarWines.map(b => ({
  id: b.id,
  wine_id: b.wine_id,
  name: b.wine?.name,
  color: b.wine?.color,
  vintage: b.wine?.vintage,
  domain: b.wine?.domain,
  region: b.wine?.region,
  appellation: b.wine?.appellation,
  country: b.wine?.country
})), null, 2)}

Pour chaque type de vin recommandé, trouve la ou les bouteilles correspondantes dans ma cave qui seraient les plus adaptées.
Si aucune correspondance parfaite n'est trouvée, suggère la meilleure alternative en expliquant pourquoi.

Réponds au format JSON :
[
  {
    "recommendation": {
      "wine_type": "Type de vin recommandé",
      "grape": "Cépage",
      "characteristics": "Caractéristiques",
      "pairing_type": "classic/audacious/heart",
      "explanation": "Explication"
    },
    "matches": [
      {
        "bottle_id": "id de la bouteille",
        "wine_id": "id du vin",
        "wine": {
          "id": "id du vin",
          "name": "nom du vin",
          "color": "couleur",
          "vintage": 2018
        },
        "match_quality": "perfect" | "good" | "alternative",
        "explanation": "Explication de la correspondance ou de l'alternative"
      }
    ]
  }
]
`.trim();

    let responseText = '';

    if (apiProvider === 'mistral') {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-medium',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Mistral API error:', err);
        return NextResponse.json({ error: 'Erreur Mistral', details: err }, { status: 500 });
      }

      const mistralResponse = await res.json();
      responseText = mistralResponse.choices?.[0]?.message?.content?.trim() || '';
    } else {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      responseText = completion.choices?.[0]?.message?.content?.trim() || '';
    }

    console.log("Réponse brute de l'API:", responseText.substring(0, 200) + "...");

    try {
      // Vérifier si la réponse commence par [ et se termine par ] (pour être sûr que c'est du JSON)
      if (!responseText.trim().startsWith('[') || !responseText.trim().endsWith(']')) {
        console.error("Format de réponse invalide - ne semble pas être du JSON:", responseText);
        
        // Tentative de correction de format JSON
        const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/);
        if (jsonMatch) {
          responseText = jsonMatch[0];
          console.log("JSON extrait du texte:", responseText.substring(0, 200) + "...");
        } else {
          // Si on ne peut pas extraire du JSON, on crée une réponse par défaut
          return NextResponse.json([{
            recommendation: wineRecommendations[0],
            matches: []
          }]);
        }
      }
      
      const parsed = JSON.parse(responseText);
      
// Enrichir la réponse avec les objets de recommandation complets
const enrichedResponse = parsed.map((match: Record<string, unknown>, index: number) => {
  const originalRec = wineRecommendations[index] || wineRecommendations[0];
  const matchRecommendation = typeof match.recommendation === 'object' && match.recommendation ? match.recommendation : {};
  
  return {
    recommendation: {
      ...originalRec,
      ...(matchRecommendation as Record<string, unknown>)
    },
    matches: Array.isArray(match.matches) ? match.matches : []
  };
});
      
      return NextResponse.json(enrichedResponse);
    } catch (parseError) {
      console.error('Erreur lors du parsing de la réponse:', parseError);
      console.error('Réponse brute:', responseText);
      
      // Retourner une réponse minimale valide pour éviter un crash frontend
      return NextResponse.json([{
        recommendation: wineRecommendations[0],
        matches: []
      }], { status: 200 });
    }
  } catch (err: unknown) {
    console.error('[CELLAR_MATCH_ERROR] Erreur détaillée:', err);
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ 
      error: 'Erreur serveur IA', 
      message,
      stack: err instanceof Error ? err.stack : undefined 
    }, { status: 500 });
  }
}