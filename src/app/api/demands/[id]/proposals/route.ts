import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data: proposals } = await supabase
      .from('Proposal')
      .select('*')
      .eq('demandId', id)
      .order('createdAt', { ascending: false })

    // Enrich with user names
    const userIds = [...new Set((proposals || []).map(p => p.fromUserId))]
    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('User').select('id, name').in('id', userIds)
      for (const u of users || []) userMap[u.id] = u.name
    }

    const enriched = (proposals || []).map(p => ({ ...p, fromUserName: userMap[p.fromUserId] || 'Inconnu' }))
    return NextResponse.json({ proposals: enriched })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { price, message, productId, serviceId } = await req.json()
    if (!price) return NextResponse.json({ error: 'Prix requis' }, { status: 400 })

    const { data: proposal, error: insertError } = await supabase.from('Proposal').insert({
      demandId: id,
      fromUserId: user.id,
      productId: productId || null,
      serviceId: serviceId || null,
      price,
      message: message || null,
      status: 'pending',
    }).select().single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

    // Update demand responses count
    const { data: demand } = await supabase.from('Demand').select('responses_count').eq('id', id).single()
    if (demand) {
      await supabase.from('Demand').update({ responses_count: demand.responses_count + 1 }).eq('id', id)
    }

    return NextResponse.json({ proposal }, { status: 201 })
  } catch (error) {
    console.error('Create proposal error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
