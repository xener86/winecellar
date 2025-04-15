// app/api/pairings/wine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wine, apiKey, apiProvider = 'openai' } = body;

    if (!apiKey || !wine) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const wineLabel =
      typeof wine === 'string'
        ? wine
        : `${wine.name}${wine.vintage ? ' ' + wine.vintage : ''}${wine.region ? ', ' + wine.region : ''}`;

    const prompt = `
Tu es sommelier. Pour le vin suivant : "${wineLabel}", propose 4 plats compatibles. Pour chaque suggestion, donne :
- le nom du plat
- une explication du choix
- le type d'accord : classique, audacieux, caviste

Format JSON :
[
  {
    "food": "Magret de canard",
    "explanation": "L'acidité du vin équilibre la richesse du plat",
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
    console.error('[AI_WINE_ERROR]', err);
    return NextResponse.json({ error: 'Erreur serveur IA' }, { status: 500 });
  }
}
