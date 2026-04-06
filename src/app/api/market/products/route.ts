import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Get products with shop info
    const { data: products } = await supabase
      .from('Product')
      .select('*')
      .eq('status', 'available')
      .order('createdAt', { ascending: false })
      .limit(100)

    // Get shop names
    const shopIds = [...new Set((products || []).map(p => p.shopId))]
    const shopMap: Record<string, string> = {}
    if (shopIds.length > 0) {
      const { data: shops } = await supabase.from('Shop').select('id, name').in('id', shopIds)
      for (const s of shops || []) shopMap[s.id] = s.name
    }

    // Get market prices
    const { data: prices } = await supabase.from('MarketPrice').select('*')

    const enriched = (products || []).map(p => ({
      ...p,
      shopName: shopMap[p.shopId] || 'Inconnu',
      rating: Math.floor(Math.random() * 2) + 3, // Simulate ratings 3-5
    }))

    return NextResponse.json({ products: enriched, prices: prices || [] })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
