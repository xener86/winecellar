// app/api/cocktails/import/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import CocktailDBService from '@/services/CocktailDBService';

// Clé API TheCocktailDB
const COCKTAILDB_API_KEY = '1'; // Utilisation de la clé gratuite car c'est juste pour tester

/**
 * API d'importation simplifiée pour contourner les problèmes d'authentification
 */
export async function POST(req: NextRequest) {
  console.log("API d'importation simplifiée appelée");
  
  try {
    // 1. Obtenir l'identifiant du cocktail depuis la requête
    const body = await req.json();
    const { cocktailId } = body;
    
    if (!cocktailId) {
      return NextResponse.json({ 
        error: 'ID du cocktail manquant' 
      }, { status: 400 });
    }
    
    console.log("ID du cocktail à importer:", cocktailId);
    
    // 2. Obtenir l'utilisateur actuel
    let userId;
    
    try {
      const supabase = createServerComponentClient({ cookies });
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        userId = data.user.id;
        console.log("Utilisateur authentifié:", userId);
      } else {
        console.warn("Aucun utilisateur authentifié trouvé");
        // Retourner une erreur d'authentification
        return NextResponse.json({ 
          error: 'Utilisateur non authentifié. Veuillez vous connecter.' 
        }, { status: 401 });
      }
    } catch (authError) {
      console.error("Erreur d'authentification:", authError);
      return NextResponse.json({ 
        error: 'Erreur lors de la vérification de l\'authentification' 
      }, { status: 500 });
    }
    
    // 3. Récupérer les détails du cocktail
    try {
      const cocktailDBService = new CocktailDBService({
        apiKey: COCKTAILDB_API_KEY,
        language: 'fr'
      });
      
      const cocktail = await cocktailDBService.getById(cocktailId);
      
      if (!cocktail) {
        return NextResponse.json({ 
          error: 'Cocktail introuvable dans la source externe' 
        }, { status: 404 });
      }
      
      console.log("Cocktail trouvé:", cocktail.name);
      
      // 4. Convertir le format pour la base de données
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
        tags: cocktail.tags || [],
        rating: cocktail.rating,
        difficulty: cocktail.difficulty,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        external_id: cocktailId
      };
      
      // 5. Insérer dans Supabase
      console.log("Tentative d'insertion dans Supabase");
      const supabase = createServerComponentClient({ cookies });
      const { data, error } = await supabase
        .from('cocktails')
        .insert(dbCocktail)
        .select()
        .single();
      
      if (error) {
        console.error("Erreur Supabase:", error);
        throw new Error(`Erreur lors de l'import: ${error.message}`);
      }
      
      console.log("Import réussi, ID généré:", data.id);
      return NextResponse.json({
        success: true,
        message: `Cocktail "${cocktail.name}" importé avec succès`,
        data: data
      });
    } catch (apiError) {
      console.error("Erreur API CocktailDB:", apiError);
      return NextResponse.json({ 
        error: apiError instanceof Error ? apiError.message : 'Erreur lors de la récupération des détails du cocktail' 
      }, { status: 500 });
    }
    
  } catch (error: unknown) {
    console.error("Erreur complète lors de l'importation:", error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'importation'
    }, { status: 500 });
  }
}