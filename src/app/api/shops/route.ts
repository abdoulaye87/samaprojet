import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Get user's shop
    const { data: shop } = await supabase.from('Shop').select('*').eq('ownerId', user.id).eq('status', 'active').single()

    let products: unknown[] = []
    let services: unknown[] = []
    let orders: unknown[] = []

    if (shop) {
      const { data: prods } = await supabase.from('Product').select('*').eq('shopId', shop.id).order('createdAt', { ascending: false })
      products = prods || []

      const { data: svcs } = await supabase.from('Service').select('*').eq('shopId', shop.id).order('createdAt', { ascending: false })
      services = svcs || []

      const { data: ords } = await supabase.from('Order').select('*').eq('sellerId', user.id).order('createdAt', { ascending: false }).limit(50)
      // Enrich with buyer names
      const buyerIds = [...new Set((ords || []).map(o => o.buyerId))]
      const userMap: Record<string, string> = {}
      if (buyerIds.length > 0) {
        const { data: buyers } = await supabase.from('User').select('id, name').in('id', buyerIds)
        for (const u of buyers || []) userMap[u.id] = u.name
      }
      orders = (ords || []).map(o => ({ ...o, buyerName: userMap[o.buyerId] || 'Inconnu', productName: undefined }))
    }

    return NextResponse.json({ shop: shop || null, products, services, orders })
  } catch (error) {
    console.error('Get shops error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { name, description, category, location } = await req.json()
    if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

    // Check existing shop
    const { data: existing } = await supabase.from('Shop').select('id').eq('ownerId', user.id).eq('status', 'active').single()
    if (existing) return NextResponse.json({ error: 'Vous avez déjà une boutique active' }, { status: 400 })

    const { data: shop, error: insertError } = await supabase.from('Shop').insert({
      ownerId: user.id,
      name,
      description: description || '',
      category: category || 'boutique',
      location: location || 'Dakar',
    }).select().single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })
    return NextResponse.json({ shop }, { status: 201 })
  } catch (error) {
    console.error('Create shop error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
