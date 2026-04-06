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

    // Increment profile views
    await supabase.from('User').update({ profile_views: 0 }).eq('id', id) // placeholder
    // Use RPC or direct increment
    const { data: viewedUser } = await supabase.from('User').select('profile_views').eq('id', id).single()
    if (viewedUser) {
      await supabase.from('User').update({ profile_views: (viewedUser.profile_views || 0) + 1 }).eq('id', id)
    }

    // Record the view
    await supabase.from('ProfileView').insert({ viewerId: user.id, viewedId: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('View profile error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
