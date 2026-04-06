import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the token and get the session
    const { data, error } = await supabaseAuth.auth.getUser(token)

    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 }
      )
    }

    return NextResponse.json({ message: 'Déconnexion réussie' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}
