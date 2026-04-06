import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { db } from '@/lib/db'

// GET /api/businesses/[id] — Get business details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const business = await db.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, type: true, email: true },
        },
      },
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ business })
  } catch (error) {
    console.error('Get business error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement du business' },
      { status: 500 }
    )
  }
}
