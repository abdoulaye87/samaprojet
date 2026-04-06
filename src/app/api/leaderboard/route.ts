import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'richest'

    let query = supabase.from('User').select('*').eq('status', 'active').neq('type', 'admin')

    if (type === 'richest') {
      query = query.order('cash', { ascending: false })
    } else if (type === 'most_debt') {
      query = query.order('total_debt', { ascending: false })
    } else if (type === 'entrepreneur') {
      query = query.order('games_won', { ascending: false })
    } else if (type === 'investor') {
      query = query.order('total_profit', { ascending: false })
    } else if (type === 'visited') {
      query = query.order('profile_views', { ascending: false })
    }

    const { data: users } = await query.limit(50)

    const valueMap: Record<string, number> = {}
    for (const u of users || []) {
      if (type === 'richest') valueMap[u.id] = u.cash
      else if (type === 'most_debt') valueMap[u.id] = u.total_debt
      else if (type === 'entrepreneur') valueMap[u.id] = u.games_won
      else if (type === 'investor') valueMap[u.id] = u.total_profit
      else if (type === 'visited') valueMap[u.id] = u.profile_views
      else valueMap[u.id] = u.cash
    }

    const rankings = (users || []).map((u, i) => ({
      userId: u.id,
      userName: u.name,
      value: valueMap[u.id] || 0,
      rank: i + 1,
    }))

    return NextResponse.json({ rankings })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
