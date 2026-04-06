import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { toUserId, amount, type = 'transfert' } = await req.json()
    if (!toUserId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Destinataire et montant requis' }, { status: 400 })
    }

    if (toUserId === user.id) {
      return NextResponse.json({ error: 'Impossible de se transférer à soi-même' }, { status: 400 })
    }

    // Check sender balance
    const { data: sender } = await supabase.from('User').select('cash').eq('id', user.id).single()
    if (!sender) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    if (sender.cash < amount) return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

    // Check receiver exists
    const { data: receiver } = await supabase.from('User').select('id').eq('id', toUserId).single()
    if (!receiver) return NextResponse.json({ error: 'Destinataire non trouvé' }, { status: 404 })

    // Debit sender
    await supabase.from('User').update({ cash: sender.cash - amount }).eq('id', user.id)

    // Credit receiver
    const { data: receiverData } = await supabase.from('User').select('cash').eq('id', toUserId).single()
    if (receiverData) {
      await supabase.from('User').update({ cash: receiverData.cash + amount }).eq('id', toUserId)
    }

    // Record transaction
    await supabase.from('Transaction').insert({
      fromUserId: user.id,
      toUserId,
      amount,
      type,
      description: type === 'don' ? 'Don entre joueurs' : 'Transfert',
    })

    // Notification
    const senderData = await supabase.from('User').select('name').eq('id', user.id).single()
    await supabase.from('Notification').insert({
      userId: toUserId,
      type: 'info',
      title: 'Transfert reçu',
      message: `${senderData?.data?.name || 'Un joueur'} vous a envoyé ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`,
    })

    return NextResponse.json({ success: true, amount })
  } catch (error) {
    console.error('Transfer error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
