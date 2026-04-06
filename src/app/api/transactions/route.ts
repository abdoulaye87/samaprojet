import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { db } from '@/lib/db'

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) return null
  return data.user
}

// GET /api/transactions — Get all transactions with user names
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const transactions = await db.transaction.findMany({
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('List transactions error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des transactions' },
      { status: 500 }
    )
  }
}

// POST /api/transactions — Create a transaction (buy/sell from a business)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { toUserId, amount, type } = await req.json()

    if (!toUserId || !amount || !type) {
      return NextResponse.json(
        { error: 'Destinataire, montant et type sont requis' },
        { status: 400 }
      )
    }

    if (!['achat', 'vente', 'transfert'].includes(type)) {
      return NextResponse.json(
        { error: 'Type invalide. Utilisez: achat, vente, transfert' },
        { status: 400 }
      )
    }

    const fromUser = await db.user.findUnique({ where: { id: user.id } })
    const toUser = await db.user.findUnique({ where: { id: toUserId } })

    if (!fromUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    if (!toUser) {
      return NextResponse.json(
        { error: 'Destinataire non trouvé' },
        { status: 404 }
      )
    }

    if (type === 'achat' && fromUser.cash < amount) {
      return NextResponse.json(
        { error: 'Solde insuffisant pour cet achat' },
        { status: 400 }
      )
    }

    const result = await db.$transaction(async (tx) => {
      if (type === 'achat') {
        // Buyer pays, seller receives
        await tx.user.update({
          where: { id: user.id },
          data: { cash: { decrement: amount } },
        })
        await tx.user.update({
          where: { id: toUserId },
          data: { cash: { increment: amount } },
        })
      } else if (type === 'vente') {
        // Seller receives, buyer pays
        await tx.user.update({
          where: { id: user.id },
          data: { cash: { increment: amount } },
        })
        await tx.user.update({
          where: { id: toUserId },
          data: { cash: { decrement: amount } },
        })
      } else {
        // Transfer
        await tx.user.update({
          where: { id: user.id },
          data: { cash: { decrement: amount } },
        })
        await tx.user.update({
          where: { id: toUserId },
          data: { cash: { increment: amount } },
        })
      }

      const transaction = await tx.transaction.create({
        data: {
          fromUserId: user.id,
          toUserId,
          amount,
          type,
        },
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      })

      return transaction
    })

    return NextResponse.json({ transaction: result }, { status: 201 })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la transaction' },
      { status: 500 }
    )
  }
}
