import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)

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

    const { data: transactions } = await supabase
      .from('"Transaction"')
      .select('*')
      .order('createdAt', { ascending: false })

    // Récupérer les noms des utilisateurs
    const txList = transactions || []
    const userIds = [...new Set([...txList.map(t => t.fromUserId), ...txList.map(t => t.toUserId)])]

    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('"User"')
        .select('id, name')
        .in('id', userIds)
      for (const u of users || []) {
        userMap[u.id] = u.name
      }
    }

    // Enrichir les transactions avec les noms
    const enriched = txList.map(tx => ({
      ...tx,
      fromUser: { id: tx.fromUserId, name: userMap[tx.fromUserId] || 'Inconnu' },
      toUser: { id: tx.toUserId, name: userMap[tx.toUserId] || 'Inconnu' },
    }))

    return NextResponse.json({ transactions: enriched })
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

    const { data: fromUser } = await supabase
      .from('"User"')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: toUser } = await supabase
      .from('"User"')
      .select('*')
      .eq('id', toUserId)
      .single()

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

    // Calculer les nouveaux soldes
    let newFromCash = fromUser.cash
    let newToCash = toUser.cash

    if (type === 'achat') {
      // Acheteur paie, vendeur reçoit
      newFromCash = fromUser.cash - amount
      newToCash = toUser.cash + amount
    } else if (type === 'vente') {
      // Vendeur reçoit, acheteur paie
      newFromCash = fromUser.cash + amount
      newToCash = toUser.cash - amount
    } else {
      // Transfert
      newFromCash = fromUser.cash - amount
      newToCash = toUser.cash + amount
    }

    // Mettre à jour l'expéditeur
    const { error: fromError } = await supabase
      .from('"User"')
      .update({ cash: newFromCash })
      .eq('id', user.id)

    if (fromError) {
      console.error('Update fromUser error:', fromError.message)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du solde' },
        { status: 500 }
      )
    }

    // Mettre à jour le destinataire
    const { error: toError } = await supabase
      .from('"User"')
      .update({ cash: newToCash })
      .eq('id', toUserId)

    if (toError) {
      console.error('Update toUser error:', toError.message)
      // Rembourser l'expéditeur
      await supabase
        .from('"User"')
        .update({ cash: fromUser.cash })
        .eq('id', user.id)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du destinataire' },
        { status: 500 }
      )
    }

    // Créer l'enregistrement de transaction
    const { data: transaction, error: txError } = await supabase
      .from('"Transaction"')
      .insert({
        fromUserId: user.id,
        toUserId,
        amount,
        type,
      })
      .select()
      .single()

    if (txError) {
      console.error('Transaction record error:', txError.message)
      return NextResponse.json(
        { error: 'Erreur lors de la transaction' },
        { status: 500 }
      )
    }

    // Enrichir avec les noms
    const enrichedTransaction = {
      ...transaction,
      fromUser: { id: user.id, name: fromUser.name },
      toUser: { id: toUserId, name: toUser.name },
    }

    return NextResponse.json({ transaction: enrichedTransaction }, { status: 201 })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la transaction' },
      { status: 500 }
    )
  }
}
