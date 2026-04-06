import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Use ADMIN client to verify token
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // Get or create user in Prisma
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

    // Merge sent and received transactions, sort by date
    const allTransactions = [
      ...profile.businessesSent,
      ...profile.businessesReceived,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Deduplicate by id
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
