import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { db } from '@/lib/db'

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
        // Permet d'obtenir la session immédiatement
        // (fonctionne si la confirmation email est désactivée dans Supabase)
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

    // Créer le profil Prisma
    await db.user.upsert({
      where: { id: authData.user.id },
      create: {
        id: authData.user.id,
        name,
        email,
        cash: 5000,
        type: 'player',
      },
      update: { name, email },
    })

    // Si session disponible = confirmation email désactivée → connexion auto
    if (authData.session) {
      return NextResponse.json({
        success: true,
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in,
        },
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name,
          type: 'player',
        },
      })
    }

    // Sinon = confirmation email activée → dire à l'utilisateur de se connecter
    return NextResponse.json({
      success: true,
      needConfirmation: true,
      message: 'Compte créé ! Vérifiez votre email puis connectez-vous.',
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
