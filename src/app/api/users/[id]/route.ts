import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Fetch user
    const { data: user } = await supabase.from('User').select('*').eq('id', id).single()
    if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })

    // Fetch assets
    const { data: assets } = await supabase.from('Asset').select('*').eq('userId', id).eq('status', 'owned')

    // Fetch projects
    const { data: projects } = await supabase.from('Project').select('*').eq('userId', id)

    // Fetch loans
    const { data: loans } = await supabase.from('Loan').select('*').eq('userId', id)

    // Fetch reviews (as receiver)
    const { data: reviews } = await supabase.from('Review').select('*').eq('toUserId', id)
    const reviewUserIds = [...new Set((reviews || []).map(r => r.fromUserId))]
    const userMap: Record<string, string> = {}
    if (reviewUserIds.length > 0) {
      const { data: reviewers } = await supabase.from('User').select('id, name').in('id', reviewUserIds)
      for (const u of reviewers || []) userMap[u.id] = u.name
    }

    const enrichedReviews = (reviews || []).map(r => ({
      ...r,
      fromUserName: userMap[r.fromUserId] || 'Inconnu',
    }))

    return NextResponse.json({
      user: {
        id: user.id, name: user.name, email: user.email, avatar: user.avatar,
        location: user.location, bio: user.bio, cash: user.cash, type: user.type,
        credit_score: user.credit_score, total_profit: user.total_profit, total_spent: user.total_spent,
        total_debt: user.total_debt, games_played: user.games_played, games_won: user.games_won,
        games_lost: user.games_lost, is_bankrupt: user.is_bankrupt, profile_views: user.profile_views,
        createdAt: user.createdAt,
      },
      assets: assets || [],
      projects: projects || [],
      loans: loans || [],
      reviews: enrichedReviews,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
