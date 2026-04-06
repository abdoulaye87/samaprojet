import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const { data: posts } = await supabase
      .from('FeedPost')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit)

    // Enrich with user names + liked status
    const userIds = [...new Set((posts || []).map(p => p.userId))]
    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('User').select('id, name').in('id', userIds)
      for (const u of users || []) userMap[u.id] = u.name
    }

    // Check liked
    let likedPostIds: string[] = []
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        const postIds = (posts || []).map(p => p.id)
        if (postIds.length > 0) {
          const { data: likes } = await supabase.from('FeedLike').select('postId').eq('userId', user.id).in('postId', postIds)
          likedPostIds = (likes || []).map(l => l.postId)
        }
      }
    }

    const enriched = (posts || []).map(p => ({
      ...p,
      userName: userMap[p.userId] || 'Inconnu',
      liked: likedPostIds.includes(p.id),
    }))

    return NextResponse.json({ posts: enriched })
  } catch (error) {
    console.error('Get feed error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
