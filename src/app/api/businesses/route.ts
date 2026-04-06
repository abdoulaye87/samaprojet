import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { db } from '@/lib/db'

// GET /api/businesses — List all businesses
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const businesses = await db.business.findMany({
      include: {
        owner: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error('List businesses error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des businesses' },
      { status: 500 }
    )
  }
}
