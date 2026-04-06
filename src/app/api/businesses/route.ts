import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

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

    // Récupérer toutes les businesses
    const { data: businesses, error: bizError } = await supabase
      .from('Business')
      .select('*')
      .order('createdAt', { ascending: true })

    if (bizError) {
      console.error('List businesses error:', bizError.message)
      return NextResponse.json(
        { error: 'Erreur lors du chargement des businesses' },
        { status: 500 }
      )
    }

    // Récupérer les noms des propriétaires
    const ownerIds = [...new Set((businesses || []).map(b => b.ownerId))]
    const ownerMap: Record<string, { id: string; name: string; type: string }> = {}

    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from('User')
        .select('id, name, type')
        .in('id', ownerIds)
      for (const o of owners || []) {
        ownerMap[o.id] = { id: o.id, name: o.name, type: o.type }
      }
    }

    // Enrichir les businesses avec les infos du propriétaire
    const enriched = (businesses || []).map(b => ({
      ...b,
      owner: ownerMap[b.ownerId] || { id: b.ownerId, name: 'Inconnu', type: 'unknown' },
    }))

    return NextResponse.json({ businesses: enriched })
  } catch (error) {
    console.error('List businesses error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des businesses' },
      { status: 500 }
    )
  }
}
