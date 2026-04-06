import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { data: loans } = await supabase
      .from('Loan')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })

    // Enrich with user names
    return NextResponse.json({ loans: loans || [] })
  } catch (error) {
    console.error('Get loans error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { amount, months = 12 } = await req.json()
    if (!amount || amount < 50000 || amount > 5000000) {
      return NextResponse.json({ error: 'Montant entre 50 000 et 5 000 000 FCFA' }, { status: 400 })
    }

    // Check for existing active loan
    const { data: existing } = await supabase.from('Loan').select('id').eq('userId', user.id).in('status', ['active', 'pending_approval'])
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Vous avez déjà un prêt en cours' }, { status: 400 })
    }

    // Get interest rate from settings
    const { data: settings } = await supabase.from('GameSettings').select('value').eq('key', 'default_interest_rate').single()
    const interestRate = settings ? parseFloat(settings.value) : 2.5

    // Check auto-approve
    const { data: autoApprove } = await supabase.from('GameSettings').select('value').eq('key', 'auto_approve_loan').single()
    const isAutoApproved = autoApprove?.value !== 'false'

    const totalDue = amount * (1 + interestRate / 100)
    const monthlyPayment = totalDue / months
    const loanStatus = isAutoApproved ? 'active' : 'pending_approval'

    const { data: loan, error: insertError } = await supabase.from('Loan').insert({
      userId: user.id,
      amount,
      interest_rate: interestRate,
      total_due: totalDue,
      remaining: totalDue,
      monthly_payment: monthlyPayment,
      months_remaining: months,
      status: loanStatus,
      auto_approved: isAutoApproved,
    }).select().single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

    if (isAutoApproved) {
      // Credit user
      await supabase.from('User').update({ cash: 0 }).eq('id', user.id) // placeholder
      const { data: currentUser } = await supabase.from('User').select('cash').eq('id', user.id).single()
      if (currentUser) {
        await supabase.from('User').update({ cash: currentUser.cash + amount }).eq('id', user.id)
      }

      // Record transaction
      await supabase.from('Transaction').insert({
        fromUserId: null, toUserId: user.id, amount,
        type: 'pret', description: `Prêt de ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`,
      })
    }

    return NextResponse.json({ loan }, { status: 201 })
  } catch (error) {
    console.error('Create loan error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
