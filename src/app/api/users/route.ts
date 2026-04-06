import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Admin only
    const { data: profile } = await supabase.from('User').select('type').eq('id', user.id).single()
    if (!profile || profile.type !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { data: users, count } = await supabase.from('User').select('*', { count: 'exact' })
    return NextResponse.json({ users: users || [], total: count || 0 })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { data: profile } = await supabase.from('User').select('type').eq('id', user.id).single()
    if (!profile || profile.type !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { name, cash, type } = await req.json()
    if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

    const { data: newUser, error: insertError } = await supabase.from('User').insert({
      name, cash: cash || 0, type: type || 'player', credit_score: 750,
    }).select().single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })
    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
