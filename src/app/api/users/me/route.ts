import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { db } from '@/lib/db'

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) return null
  return data.user
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get or create user in Prisma
    let profile = await db.user.findUnique({
      where: { id: user.id },
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
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur'
      profile = await db.user.create({
        data: {
          id: user.id,
          name,
          email: user.email,
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
