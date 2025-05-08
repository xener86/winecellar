// app/api/cocktails/external/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import CocktailDBService from '@/services/CocktailDBService';

// Clé API TheCocktailDB - À remplacer par votre clé premium
// Vous pouvez utiliser "1" comme clé de test, mais certaines fonctionnalités sont limitées
const COCKTAILDB_API_KEY = '961249867'; // Remplacez par votre clé premium

export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel, à configurer selon vos besoins)
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Utilisateur non authentifié' 
      }, { status: 401 });
    }
    
    // Récupérer les paramètres de la requête
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (!action) {
      return NextResponse.json({ 
        error: 'Paramètre "action" manquant' 
      }, { status: 400 });
    }
    
    // Initialiser le service CocktailDB
    const cocktailDBService = new CocktailDBService({
      apiKey: COCKTAILDB_API_KEY,
      language: 'fr'
    });
    
    // Traiter l'action demandée
    switch (action) {
      case 'search': {
        const query = url.searchParams.get('query');
        if (!query) {
          return NextResponse.json({ 
            error: 'Paramètre "query" manquant' 
          }, { status: 400 });
        }
        
        const cocktails = await cocktailDBService.searchByName(query);
        return NextResponse.json(cocktails);
      }
      
      case 'ingredient': {
        const ingredient = url.searchParams.get('ingredient');
        if (!ingredient) {
          return NextResponse.json({ 
            error: 'Paramètre "ingredient" manquant' 
          }, { status: 400 });
        }
        
        const cocktails = await cocktailDBService.getByIngredient(ingredient);
        return NextResponse.json(cocktails);
      }
      
      case 'category': {
        const category = url.searchParams.get('category');
        if (!category) {
          return NextResponse.json({ 
            error: 'Paramètre "category" manquant' 
          }, { status: 400 });
        }
        
        const cocktails = await cocktailDBService.getByCategory(category);
        return NextResponse.json(cocktails);
      }
      
      case 'random': {
        const count = url.searchParams.get('count');
        const randomCocktails = [];
        
        // Récupérer plusieurs cocktails aléatoires si count est spécifié
        if (count) {
          const numCount = parseInt(count, 10);
          for (let i = 0; i < numCount; i++) {
            const cocktail = await cocktailDBService.getRandom();
            if (cocktail) {
              randomCocktails.push(cocktail);
            }
          }
          return NextResponse.json(randomCocktails);
        } else {
          const cocktail = await cocktailDBService.getRandom();
          return NextResponse.json(cocktail);
        }
      }
      
      case 'details': {
        const id = url.searchParams.get('id');
        if (!id) {
          return NextResponse.json({ 
            error: 'Paramètre "id" manquant' 
          }, { status: 400 });
        }
        
        const cocktail = await cocktailDBService.getById(id);
        return NextResponse.json(cocktail);
      }
      
      default:
        return NextResponse.json({ 
          error: `Action "${action}" non reconnue` 
        }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Erreur API externe cocktails:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
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
    const { action } = body;
    
    if (!action) {
      return NextResponse.json({ 
        error: 'Paramètre "action" manquant' 
      }, { status: 400 });
    }
    
    // Initialiser le service CocktailDB
    const cocktailDBService = new CocktailDBService({
      apiKey: COCKTAILDB_API_KEY,
      language: 'fr'
    });
    
    // Traiter l'action demandée
    switch (action) {
      case 'import': {
        // Import d'un cocktail externe dans la base de données locale
        const { cocktailId } = body;
        if (!cocktailId) {
          return NextResponse.json({ 
            error: 'Paramètre "cocktailId" manquant' 
          }, { status: 400 });
        }
        
        // Récupérer les détails du cocktail
        const cocktail = await cocktailDBService.getById(cocktailId);
        if (!cocktail) {
          return NextResponse.json({ 
            error: 'Cocktail non trouvé' 
          }, { status: 404 });
        }
        
        // Convertir le format pour la base de données
        const dbCocktail = {
          name: cocktail.name,
          category: cocktail.category,
          glass_type: cocktail.glassType,
          ingredients: cocktail.ingredients,
          garnish: cocktail.garnish,
          preparation: cocktail.preparation,
          preparation_method: cocktail.preparationMethod,
          image: cocktail.image,
          is_custom: false,
          is_favorite: false,
          notes: cocktail.notes,
          tags: cocktail.tags,
          rating: cocktail.rating,
          difficulty: cocktail.difficulty,
          user_id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          external_id: cocktailId // Garder une référence à l'ID externe
        };
        
        // Insérer dans Supabase
        const { data, error } = await supabase
          .from('cocktails')
          .insert(dbCocktail)
          .select()
          .single();
        
        if (error) {
          throw new Error(`Erreur lors de l'import: ${error.message}`);
        }
        
        return NextResponse.json(data);
      }
      
      // Autres actions POST si nécessaire
      
      default:
        return NextResponse.json({ 
          error: `Action "${action}" non reconnue` 
        }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Erreur API externe cocktails (POST):', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }, { status: 500 });
  }
}