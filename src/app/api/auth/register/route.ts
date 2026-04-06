import { NextRequest, NextResponse } from 'next/server'
import { supabase, confirmUserEmail } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, mot de passe et nom sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Inscrire via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: undefined,
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Inscription échouée: utilisateur non créé' },
        { status: 500 }
      )
    }

    // Auto-confirmer l'email immédiatement via Admin API
    if (authData.user.id) {
      await confirmUserEmail(authData.user.id)
    }

    // Créer le profil dans Supabase
    await supabase.from('User').upsert(
      {
        id: authData.user.id,
        name,
        email,
        cash: 5000,
        type: 'player',
      },
      { onConflict: 'id' }
    )

    // Après auto-confirmation, tenter de connecter l'utilisateur directement
    const { data: loginData } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginData?.session && loginData?.user) {
      return NextResponse.json({
        success: true,
        session: {
          access_token: loginData.session.access_token,
          refresh_token: loginData.session.refresh_token,
          expires_in: loginData.session.expires_in,
        },
        user: {
          id: loginData.user.id,
          email: loginData.user.email,
          name,
          type: 'player',
        },
      })
    }

    // Fallback: inscription réussie mais connexion auto impossible
    return NextResponse.json({
      success: true,
      needConfirmation: false,
      message: 'Compte créé avec succès ! Connectez-vous maintenant.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    )
  }
}
