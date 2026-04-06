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

// POST /api/users/transfer — Transfer money to another user
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { toUserId, amount } = await req.json()

    if (!toUserId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Destinataire et montant valide requis' },
        { status: 400 }
      )
    }

    const fromUser = await db.user.findUnique({ where: { id: user.id } })
    const toUser = await db.user.findUnique({ where: { id: toUserId } })

    if (!fromUser) {
      return NextResponse.json(
        { error: 'Expéditeur non trouvé' },
        { status: 404 }
      )
    }

    if (!toUser) {
      return NextResponse.json(
        { error: 'Destinataire non trouvé' },
        { status: 404 }
      )
    }

    if (fromUser.cash < amount) {
      return NextResponse.json(
        { error: 'Solde insuffisant' },
        { status: 400 }
      )
    }

    // Perform transfer in a transaction
    const result = await db.$transaction(async (tx) => {
      // Deduct from sender
      await tx.user.update({
        where: { id: user.id },
        data: { cash: { decrement: amount } },
      })

      // Add to receiver
      await tx.user.update({
        where: { id: toUserId },
        data: { cash: { increment: amount } },
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          fromUserId: user.id,
          toUserId,
          amount,
          type: 'transfert',
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
    console.error('Transfer error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du transfert' },
      { status: 500 }
    )
  }
}
