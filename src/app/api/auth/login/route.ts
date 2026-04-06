import { NextRequest, NextResponse } from 'next/server'
import { supabase, confirmUserEmail } from '@/lib/supabase-server'

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

    // Si l'erreur est "email not confirmed", on essaie de confirmer automatiquement
    if (error) {
      if (error.message.includes('Email not confirmed') || error.message.includes('email not confirmed')) {
        // Récupérer l'utilisateur par email pour obtenir son ID
        const { data: userList } = await supabase
          .from('User')
          .select('id')
          .eq('email', email)
          .limit(1)

        if (userList && userList.length > 0) {
          const confirmed = await confirmUserEmail(userList[0].id)
          if (confirmed) {
            // Réessayer la connexion après confirmation
            const retry = await supabase.auth.signInWithPassword({ email, password })
            if (retry.data?.session && retry.data.user) {
              return await buildLoginResponse(retry.data.user.id, retry.data.user, email, retry.data.session)
            }
          }
        }

        return NextResponse.json(
          { error: 'Email non confirmé. Veuillez vérifier votre boîte de réception ou réessayer.' },
          { status: 403 }
        )
      }

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

    return await buildLoginResponse(data.user.id, data.user, email, data.session)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}

async function buildLoginResponse(
  userId: string,
  authUser: { user_metadata?: Record<string, unknown>; email?: string },
  email: string,
  session: { access_token: string; refresh_token: string; expires_in: number }
) {
  // Récupérer ou créer le profil dans Supabase
  const { data: user } = await supabase
    .from('User')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) {
    const name = (authUser.user_metadata?.name as string) || email.split('@')[0]
    await supabase.from('User').insert({
      id: userId,
      name,
      email,
      cash: 5000,
      type: 'player',
    })

    return NextResponse.json({
      success: true,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
      },
      user: {
        id: userId,
        email,
        name,
        type: 'player',
      },
    })
  }

  return NextResponse.json({
    success: true,
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type,
    },
  })
}
