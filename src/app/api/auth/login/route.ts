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

    // Get user profile from Prisma
    const { db } = await import('@/lib/db')
    const user = await db.user.findUnique({
      where: { id: data.user.id },
      include: {
        ownedBusinesses: true,
        businessesSent: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        businessesReceived: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    // If user doesn't exist in Prisma, create them
    if (!user) {
      const name = data.user.user_metadata?.name || email.split('@')[0]
      await db.user.create({
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
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email.split('@')[0],
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
