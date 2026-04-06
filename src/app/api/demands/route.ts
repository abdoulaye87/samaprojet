import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const { data: demands } = await supabase
      .from('Demand')
      .select('*')
      .in('status', ['open', 'in_progress'])
      .order('createdAt', { ascending: false })
      .limit(50)

    // Enrich with user names
    const userIds = [...new Set((demands || []).map(d => d.userId))]
    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('User').select('id, name').in('id', userIds)
      for (const u of users || []) userMap[u.id] = u.name
    }

    const enriched = (demands || []).map(d => ({ ...d, userName: userMap[d.userId] || 'Inconnu' }))
    return NextResponse.json({ demands: enriched })
  } catch (error) {
    console.error('Get demands error:', error)
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

    const { title, description, category, budget } = await req.json()
    if (!title) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })

    const { data: demand, error: insertError } = await supabase.from('Demand').insert({
      userId: user.id,
      title,
      description: description || '',
      category: category || 'produit',
      budget: budget || null,
    }).select().single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })
    return NextResponse.json({ demand }, { status: 201 })
  } catch (error) {
    console.error('Create demand error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
