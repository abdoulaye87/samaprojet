import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Check if already liked
    const { data: existing } = await supabase.from('FeedLike').select('id').eq('postId', id).eq('userId', user.id).single()

    if (existing) {
      // Unlike
      await supabase.from('FeedLike').delete().eq('id', existing.id)
      const { data: post } = await supabase.from('FeedPost').select('likes').eq('id', id).single()
      if (post) {
        await supabase.from('FeedPost').update({ likes: Math.max(0, post.likes - 1) }).eq('id', id)
      }
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await supabase.from('FeedLike').insert({ postId: id, userId: user.id })
      const { data: post } = await supabase.from('FeedPost').select('likes').eq('id', id).single()
      if (post) {
        await supabase.from('FeedPost').update({ likes: post.likes + 1 }).eq('id', id)
      }
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
