import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { data: prices } = await supabase.from('MarketPrice').select('*')
    return NextResponse.json({ prices: prices || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
