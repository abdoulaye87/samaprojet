import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-server'
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

    // Use ANON client for user auth (not service role)
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Create user in Prisma (in case trigger doesn't fire)
    if (authData.user) {
      await db.user.upsert({
        where: { id: authData.user.id },
        create: {
          id: authData.user.id,
          name,
          email,
          cash: 5000,
          type: 'player',
        },
        update: {
          name,
          email,
        },
      })
    }

    return NextResponse.json({
      message: 'Inscription réussie',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name,
      },
      session: authData.session,
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    )
  }
}
