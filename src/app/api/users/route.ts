import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { db } from '@/lib/db'

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) return null
  return data.user
}

// GET /api/users — List all users
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const users = await db.user.findMany({
      include: {
        _count: {
          select: { ownedBusinesses: true, businessesSent: true, businessesReceived: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des utilisateurs' },
      { status: 500 }
    )
  }
}

// POST /api/users — Create an agent (admin)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { name, cash, type } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    const newUser = await db.user.create({
      data: {
        name,
        email: null,
        cash: cash ?? 5000,
        type: type ?? 'agent',
      },
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}
