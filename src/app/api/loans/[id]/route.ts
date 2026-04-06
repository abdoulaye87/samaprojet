import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data: loan } = await supabase.from('Loan').select('*').eq('id', id).single()
    if (!loan) return NextResponse.json({ error: 'Prêt non trouvé' }, { status: 404 })
    return NextResponse.json({ loan })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
