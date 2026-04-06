import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé: token manquant' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Vérifier le token avec Supabase
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('Token verification error:', error.message)
      return NextResponse.json({ error: 'Token invalide: ' + error.message }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé via token' }, { status: 401 })
    }

    // Récupérer le profil Prisma
    let profile = await db.user.findUnique({
      where: { id: data.user.id },
      include: {
        ownedBusinesses: true,
        businessesSent: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            fromUser: { select: { id: true, name: true } },
            toUser: { select: { id: true, name: true } },
          },
        },
        businessesReceived: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            fromUser: { select: { id: true, name: true } },
            toUser: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!profile) {
      const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Utilisateur'
      profile = await db.user.create({
        data: {
          id: data.user.id,
          name,
          email: data.user.email,
          cash: 5000,
          type: 'player',
        },
        include: {
          ownedBusinesses: true,
          businessesSent: true,
          businessesReceived: true,
        },
      })
    }

    // Fusionner et dédupliquer les transactions
    const allTransactions = [
      ...profile.businessesSent,
      ...profile.businessesReceived,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const seen = new Set<string>()
    const uniqueTransactions = allTransactions.filter(tx => {
      if (seen.has(tx.id)) return false
      seen.add(tx.id)
      return true
    })

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        cash: profile.cash,
        type: profile.type,
        createdAt: profile.createdAt,
      },
      businesses: profile.ownedBusinesses,
      transactions: uniqueTransactions,
    })
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement du profil' },
      { status: 500 }
    )
  }
}
