import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

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

    const { data: users } = await supabase
      .from('User')
      .select('*, ownedBusinesses:Business(id)')
      .order('createdAt', { ascending: true })

    // Transformer pour inclure les counts
    const usersWithCounts = (users || []).map(u => ({
      ...u,
      _count: {
        ownedBusinesses: (u.ownedBusinesses as unknown[])?.length || 0,
        businessesSent: 0,
        businessesReceived: 0,
      },
    }))

    // Supprimer le champ ownedBusinesses brut du payload final
    const cleaned = usersWithCounts.map(({ ownedBusinesses, ...rest }) => rest)

    return NextResponse.json({ users: cleaned })
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

    const { data: newUser, error } = await supabase
      .from('User')
      .insert({
        name,
        email: null,
        cash: cash ?? 5000,
        type: type ?? 'agent',
      })
      .select()
      .single()

    if (error) {
      console.error('Create user error:', error.message)
      return NextResponse.json(
        { error: "Erreur lors de la création de l'utilisateur" },
        { status: 500 }
      )
    }

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    )
  }
}
