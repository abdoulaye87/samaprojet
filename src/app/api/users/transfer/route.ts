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

    // Récupérer l'expéditeur
    const { data: fromUser } = await supabase
      .from('"User"')
      .select('*')
      .eq('id', user.id)
      .single()

    // Récupérer le destinataire
    const { data: toUser } = await supabase
      .from('"User"')
      .select('*')
      .eq('id', toUserId)
      .single()

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

    // Décrémenter l'expéditeur
    const { error: debitError } = await supabase
      .from('"User"')
      .update({ cash: fromUser.cash - amount })
      .eq('id', user.id)

    if (debitError) {
      console.error('Debit error:', debitError.message)
      return NextResponse.json(
        { error: 'Erreur lors du débit' },
        { status: 500 }
      )
    }

    // Incrémenter le destinataire
    const { error: creditError } = await supabase
      .from('"User"')
      .update({ cash: toUser.cash + amount })
      .eq('id', toUserId)

    if (creditError) {
      console.error('Credit error:', creditError.message)
      // Tenter de rembourser l'expéditeur en cas d'erreur
      await supabase
        .from('"User"')
        .update({ cash: fromUser.cash })
        .eq('id', user.id)
      return NextResponse.json(
        { error: 'Erreur lors du crédit' },
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
        type: 'transfert',
      })
      .select()
      .single()

    if (txError) {
      console.error('Transaction record error:', txError.message)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement de la transaction' },
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
    console.error('Transfer error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du transfert' },
      { status: 500 }
    )
  }
}
