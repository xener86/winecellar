// app/api/cocktails/by-spirit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { CocktailIngredient } from '@/utils/types/cocktail.types';

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
    const { spiritId, spiritType } = body;
    
    if (!spiritId && !spiritType) {
      return NextResponse.json({ 
        error: 'ID ou type de spiritueux requis' 
      }, { status: 400 });
    }
    
    const userId = session.user.id;
    
    // Récupérer les cocktails de l'utilisateur
    const query = supabase
      .from('cocktails')
      .select('*')
      .eq('user_id', userId);
    
    // Récupérer les cocktails
    const { data: cocktails, error } = await query;
    
    if (error) {
      return NextResponse.json({ 
        error: `Erreur récupération cocktails: ${error.message}` 
      }, { status: 500 });
    }
    
    // Filtrer les cocktails qui utilisent ce spiritueux
    const matchingCocktails = cocktails.filter((cocktail: Record<string, unknown>) => {
      const ingredients = cocktail.ingredients as CocktailIngredient[] || [];
      
      return ingredients.some((ingredient: CocktailIngredient) => {
        // Vérifier par ID
        if (spiritId && ingredient.spiritId === spiritId) {
          return true;
        }
        
        // Vérifier par type
        if (spiritType) {
          // Vérifier si l'ingrédient contient le nom du type de spiritueux
          const name = ingredient.name.toLowerCase();
          switch (spiritType) {
            case 'whisky':
              return name.includes('whisky') || name.includes('whiskey') || 
                name.includes('bourbon') || name.includes('scotch');
            case 'rum':
              return name.includes('rum') || name.includes('rhum');
            case 'gin':
              return name.includes('gin');
            case 'vodka':
              return name.includes('vodka');
            case 'tequila':
              return name.includes('tequila') || name.includes('mezcal');
            case 'brandy':
              return name.includes('brandy') || name.includes('cognac') ||
                name.includes('armagnac');
            case 'liqueur':
              return name.includes('liqueur') || name.includes('liquor');
            default:
              return false;
          }
        }
        
        return false;
      });
    });
    
    // Transformer les données pour le format attendu
    const formattedCocktails = matchingCocktails.map((cocktail: Record<string, unknown>) => ({
      id: cocktail.id,
      name: cocktail.name,
      category: cocktail.category,
      glassType: cocktail.glass_type,
      ingredients: cocktail.ingredients,
      garnish: cocktail.garnish,
      preparation: cocktail.preparation,
      preparationMethod: cocktail.preparation_method,
      image: cocktail.image,
      isCustom: cocktail.is_custom,
      isFavorite: cocktail.is_favorite,
      notes: cocktail.notes,
      tags: cocktail.tags,
      rating: cocktail.rating,
      difficulty: cocktail.difficulty,
      userId: cocktail.user_id,
      createdAt: cocktail.created_at,
      updatedAt: cocktail.updated_at
    }));
    
    return NextResponse.json(formattedCocktails);
  } catch (error) {
    console.error('Erreur API cocktails par spiritueux:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}