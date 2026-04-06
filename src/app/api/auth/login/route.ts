import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth, supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe sont requis' },
        { status: 400 }
      )
    }

    // Use ANON client for user auth (not service role)
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Get user profile from Prisma (with admin client)
    const { db } = await import('@/lib/db')
    let user = await db.user.findUnique({
      where: { id: data.user.id },
    })

    if (!user) {
      const name = data.user.user_metadata?.name || email.split('@')[0]
      user = await db.user.create({
        data: {
          id: data.user.id,
          name,
          email,
          cash: 5000,
          type: 'player',
        },
      })
    }

    return NextResponse.json({
      message: 'Connexion réussie',
      session: data.session,
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
