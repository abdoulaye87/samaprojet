import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { data: orders } = await supabase
      .from('Order')
      .select('*')
      .or(`buyerId.eq.${user.id},sellerId.eq.${user.id}`)
      .order('createdAt', { ascending: false })
      .limit(50)

    // Enrich
    const userIds = [...new Set((orders || []).flatMap(o => [o.buyerId, o.sellerId]).filter(Boolean))]
    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('User').select('id, name').in('id', userIds)
      for (const u of users || []) userMap[u.id] = u.name
    }

    const enriched = (orders || []).map(o => ({
      ...o,
      buyerName: userMap[o.buyerId] || 'Inconnu',
      sellerName: userMap[o.sellerId] || 'Inconnu',
    }))

    return NextResponse.json({ orders: enriched })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
