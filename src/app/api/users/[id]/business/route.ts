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

// POST /api/users/[id]/business — Create a business for a user (admin)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticate(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const { name, revenue, cost } = await req.json()

    if (!name || revenue === undefined || cost === undefined) {
      return NextResponse.json(
        { error: 'Nom, revenu et coût sont requis' },
        { status: 400 }
      )
    }

    const owner = await db.user.findUnique({ where: { id } })
    if (!owner) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const business = await db.business.create({
      data: {
        ownerId: id,
        name,
        revenue,
        cost,
      },
    })

    return NextResponse.json({ business }, { status: 201 })
  } catch (error) {
    console.error('Create business error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du business' },
      { status: 500 }
    )
  }
}
