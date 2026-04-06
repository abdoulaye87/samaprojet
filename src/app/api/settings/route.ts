import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const { data: settings } = await supabase.from('GameSettings').select('*').order('key')
    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { data: admin } = await supabase.from('User').select('type').eq('id', user.id).single()
    if (!admin || admin.type !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { settings: newSettings } = await req.json()
    if (!newSettings || !Array.isArray(newSettings)) {
      return NextResponse.json({ error: 'settings array requis' }, { status: 400 })
    }

    for (const s of newSettings) {
      await supabase.from('GameSettings')
        .update({ value: s.value, updatedAt: new Date().toISOString() })
        .eq('key', s.key)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
