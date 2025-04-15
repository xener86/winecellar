// app/api/pairings/food/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { foodQuery, apiKey, apiProvider = 'openai' } = body;

    if (!apiKey || !foodQuery) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const prompt = `
Tu es un expert en accords mets-vins. Pour le plat suivant : "${foodQuery}", donne-moi 4 suggestions de vins avec les infos suivantes pour chaque :
- nom du vin
- type (rouge, blanc, rosé...)
- explication du choix
- type d'accord : classique, audacieux ou caviste

Réponds au format JSON :
[
  {
    "wine": "Chablis",
    "wine_type": "white_dry",
    "explanation": "Le Chablis équilibre la richesse du plat.",
    "pairing_type": "classic"
  },
  ...
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
        return NextResponse.json({ error: 'Erreur Mistral' }, { status: 500 });
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

    const parsed = JSON.parse(responseText);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error('[AI_ROUTE_ERROR]', err);
    return NextResponse.json({ error: 'Erreur serveur IA' }, { status: 500 });
  }
}
