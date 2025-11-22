// app/api/pairings/ai-match/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AIPairingService } from '@/services/AIPairingService';

export async function POST(req: NextRequest) {
  console.log("🍷 API ai-match appelée");
  
  try {
    const body = await req.json();
    console.log("📝 Requête reçue:", {
      foodQuery: body.foodQuery,
      userId: body.userId,
      hasApiKey: !!body.apiKey
    });
    
    const { 
      foodQuery, 
      userId,
      apiKey, 
      apiProvider = 'openai'
    } = body;

    // Validation des paramètres
    if (!foodQuery?.trim()) {
      return NextResponse.json(
        { error: 'Le plat est requis' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non identifié' },
        { status: 401 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API requise' },
        { status: 400 }
      );
    }

    // Appel au service
    const pairingService = AIPairingService.getInstance();
    const analysis = await pairingService.findPairings(
      foodQuery,
      userId,
      apiKey,
      apiProvider
    );

    console.log("✅ Analyse terminée:", {
      cellarMatches: analysis.cellarMatches.length,
      suggestions: analysis.purchaseSuggestions.length
    });

    return NextResponse.json(analysis);

  } catch (error) {
    console.error("❌ Erreur dans ai-match:", error);
    
    // Gestion des erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes('OpenAI')) {
        return NextResponse.json(
          { error: 'Erreur avec l\'API OpenAI. Vérifiez votre clé.' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('Réponse IA invalide')) {
        return NextResponse.json(
          { error: 'La réponse de l\'IA n\'a pas pu être traitée' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse des accords' },
      { status: 500 }
    );
  }
}

// Endpoint pour sauvegarder un accord
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'save':
        // Logique pour sauvegarder l'accord
        // const { pairingId, userId, data } = body;
        // await supabase.from('saved_pairings').insert(...)
        return NextResponse.json({ success: true });
        
      case 'rate':
        // Logique pour noter l'accord
        // const { pairingId, userId, data } = body;
        // await supabase.from('pairing_ratings').upsert(...)
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur dans PUT ai-match:", error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}