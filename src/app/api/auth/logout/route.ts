import { NextResponse } from 'next/server'

// La déconnexion se fait côté client (suppression du token localStorage)
// Cette route existe pour la cohérence mais ne fait rien côté serveur
// Le token JWT de Supabase expire automatiquement après 1 heure
export async function POST() {
  return NextResponse.json({ message: 'Déconnexion réussie' })
}
