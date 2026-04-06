import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data: shop } = await supabase.from('Shop').select('*').eq('id', id).single()
    if (!shop) return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 })
    return NextResponse.json({ shop })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
