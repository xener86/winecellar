// app/api/auth/check/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Simple endpoint pour vérifier si l'utilisateur est authentifié
 * Retourne 200 si authentifié, 401 sinon
 */
export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'Utilisateur non authentifié'
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      userId: session.user.id
    }, { status: 200 });
  } catch (error) {
    console.error('Erreur vérification authentification:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: 'Erreur serveur lors de la vérification de l\'authentification'
    }, { status: 500 });
  }
}