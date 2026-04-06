import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Check admin
    const { data: admin } = await supabase.from('User').select('type').eq('id', user.id).single()
    if (!admin || admin.type !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { loanId, approved } = await req.json()
    if (!loanId || approved === undefined) {
      return NextResponse.json({ error: 'loanId et approved requis' }, { status: 400 })
    }

    const { data: loan } = await supabase.from('Loan').select('*').eq('id', loanId).single()
    if (!loan) return NextResponse.json({ error: 'Prêt non trouvé' }, { status: 404 })
    if (loan.status !== 'pending_approval') {
      return NextResponse.json({ error: 'Ce prêt n\'est pas en attente' }, { status: 400 })
    }

    if (approved) {
      // Approve: credit user
      const { data: borrower } = await supabase.from('User').select('cash').eq('id', loan.userId).single()
      if (borrower) {
        await supabase.from('User').update({ cash: borrower.cash + loan.amount }).eq('id', loan.userId)
      }

      await supabase.from('Loan').update({
        status: 'active',
        admin_approved: true,
      }).eq('id', loanId)

      await supabase.from('Transaction').insert({
        fromUserId: null, toUserId: loan.userId, amount: loan.amount,
        type: 'pret', description: `Prêt approuvé: ${new Intl.NumberFormat('fr-FR').format(loan.amount)} FCFA`,
      })
    } else {
      await supabase.from('Loan').update({
        status: 'defaulted',
        admin_approved: false,
      }).eq('id', loanId)
    }

    return NextResponse.json({ success: true, approved })
  } catch (error) {
    console.error('Approve loan error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
