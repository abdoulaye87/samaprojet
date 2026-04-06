import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe sont requis' },
        { status: 400 }
      )
    }

    // Se connecter avec email/mot de passe
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'Connexion échouée: session non retournée par Supabase' },
        { status: 500 }
      )
    }

    // Récupérer ou créer le profil dans Supabase
    const { data: user } = await supabase
      .from('"User"')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!user) {
      const name = data.user.user_metadata?.name || email.split('@')[0]
      await supabase.from('"User"').insert({
        id: data.user.id,
        name,
        email,
        cash: 5000,
        type: 'player',
      })

      return NextResponse.json({
        success: true,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
        },
        user: {
          id: data.user.id,
          email,
          name,
          type: 'player',
        },
      })
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}
