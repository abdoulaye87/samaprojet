import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

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

    const { data: business, error: bizError } = await supabase
      .from('Business')
      .select('*')
      .eq('id', id)
      .single()

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Business non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les infos du propriétaire
    const { data: owner } = await supabase
      .from('User')
      .select('id, name, type, email')
      .eq('id', business.ownerId)
      .single()

    const enrichedBusiness = {
      ...business,
      owner: owner || { id: business.ownerId, name: 'Inconnu', type: 'unknown', email: null },
    }

    return NextResponse.json({ business: enrichedBusiness })
  } catch (error) {
    console.error('Get business error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement du business' },
      { status: 500 }
    )
  }
}
