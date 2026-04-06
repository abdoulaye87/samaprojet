import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function POST() {
  return NextResponse.json({ message: 'Déconnexion réussie' })
}
