import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Get active project
    const { data: project } = await supabase
      .from('Project')
      .select('*')
      .eq('userId', user.id)
      .eq('status', 'active')
      .single()

    let expenses: unknown[] = []
    let events: unknown[] = []
    let loan: unknown = null

    if (project) {
      const { data: exps } = await supabase.from('ProjectExpense').select('*').eq('projectId', project.id).order('revealed_at', { ascending: true })
      expenses = exps || []

      const { data: evts } = await supabase.from('GameEvent').select('*').eq('projectId', project.id).order('month', { ascending: false })
      events = evts || []

      if (project.loanId) {
        const { data: ln } = await supabase.from('Loan').select('*').eq('id', project.loanId).single()
        loan = ln
      }
    }

    return NextResponse.json({ project: project || null, expenses, events, loan })
  } catch (error) {
    console.error('Get project error:', error)
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

    const { loanId, name, category, budget, monthlyRevenue, monthlyExpense, description } = await req.json()
    if (!name || !category || !budget) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Get user cash
    const { data: userData } = await supabase.from('User').select('cash').eq('id', user.id).single()
    if (!userData) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })

    // Get game duration from settings
    const { data: durSetting } = await supabase.from('GameSettings').select('value').eq('key', 'game_duration_months').single()
    const totalMonths = durSetting ? parseInt(durSetting.value) : 12

    const initialCash = userData.cash
    const { data: project, error: insertError } = await supabase.from('Project').insert({
      userId: user.id,
      loanId: loanId || null,
      name,
      description: description || '',
      category,
      budget,
      initial_cash: initialCash,
      current_cash: initialCash,
      status: 'active',
      monthly_revenue: monthlyRevenue || 0,
      monthly_expense: monthlyExpense || 0,
      total_months: totalMonths,
    }).select().single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

    // Create initial project expenses
    const baseExpenses = [
      { name: 'Loyer mensuel', amount: Math.round(monthlyExpense * 0.3), category: 'operationnel', is_hidden: false, revealed_at: 0 },
      { name: 'Salaires employés', amount: Math.round(monthlyExpense * 0.35), category: 'operationnel', is_hidden: false, revealed_at: 0 },
      { name: 'Approvisionnement', amount: Math.round(monthlyExpense * 0.2), category: 'operationnel', is_hidden: false, revealed_at: 0 },
      { name: 'Électricité & eau', amount: Math.round(monthlyExpense * 0.1), category: 'operationnel', is_hidden: false, revealed_at: 0 },
    ]

    const hiddenExpenses = [
      { name: 'Taxe municipale', amount: Math.round(budget * 0.02), category: 'taxe', is_hidden: true, revealed_at: 3 },
      { name: 'Réparation équipement', amount: Math.round(monthlyExpense * 0.5), category: 'imprévu', is_hidden: true, revealed_at: 5 },
      { name: 'Panne générateur', amount: Math.round(monthlyExpense * 0.3), category: 'imprévu', is_hidden: true, revealed_at: 4 },
      { name: 'Contrôle fiscal', amount: Math.round(budget * 0.01), category: 'taxe', is_hidden: true, revealed_at: 7 },
      { name: 'Vol de marchandise', amount: Math.round(monthlyRevenue * 0.2), category: 'imprévu', is_hidden: true, revealed_at: 6 },
    ]

    const allExpenses = [
      ...baseExpenses.map(e => ({ ...e, projectId: project!.id, paid: false })),
      ...hiddenExpenses.map(e => ({ ...e, projectId: project!.id, paid: false })),
    ]

    if (allExpenses.length > 0) {
      await supabase.from('ProjectExpense').insert(allExpenses)
    }

    // Update user stats
    await supabase.from('User').update({ games_played: 0 }).eq('id', user.id)
    const { data: uStats } = await supabase.from('User').select('games_played').eq('id', user.id).single()
    if (uStats) {
      await supabase.from('User').update({ games_played: uStats.games_played + 1 }).eq('id', user.id)
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
