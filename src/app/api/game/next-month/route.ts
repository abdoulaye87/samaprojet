import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

const EVENTS_POSITIFS = [
  { title: 'Boom des ventes !', description: 'La demande a explosé ce mois-ci grâce à une campagne publicitaire virale.', impactRange: [0.1, 0.4] },
  { title: 'Subvention gouvernementale', description: 'Le programme d\'aide aux PME vous accorde une subvention.', impactRange: [0.05, 0.2] },
  { title: 'Client fidèle important', description: 'Un gros client régulier passe une commande exceptionnelle.', impactRange: [0.1, 0.3] },
  { title: 'Retard de paiement annulé', description: 'Un client qui devait de l\'argent a finalement payé.', impactRange: [0.05, 0.15] },
]

const EVENTS_NEGATIFS = [
  { title: 'Panne majeure', description: 'Un équipement clé est tombé en panne. Réparation urgente requise.', impactRange: [-0.3, -0.1] },
  { title: 'Concurrent agressif', description: 'Un nouveau concurrent a ouvert tout près avec des prix bas.', impactRange: [-0.25, -0.1] },
  { title: 'Inondation', description: 'Les pluies ont causé des dégâts sur votre stock et équipement.', impactRange: [-0.35, -0.15] },
  { title: 'Employé démissionne', description: 'Votre meilleur employé a démissionné. Formation d\'un remplaçant nécessaire.', impactRange: [-0.2, -0.08] },
  { title: 'Hausse des prix', description: 'L\'inflation a fait grimper le coût de vos approvisionnements.', impactRange: [-0.2, -0.1] },
  { title: 'Grève générale', description: 'Une grève a paralysé les transports pendant 3 jours.', impactRange: [-0.25, -0.1] },
  { title: 'Vol', description: 'Vous avez été victime d\'un vol pendant la nuit.', impactRange: [-0.15, -0.05] },
]

const EVENTS_NEUTRES = [
  { title: 'Journée normale', description: 'Un mois sans événement particulier.', impactRange: [0, 0] },
]

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Get active project
    const { data: project } = await supabase.from('Project').select('*').eq('userId', user.id).eq('status', 'active').single()
    if (!project) return NextResponse.json({ error: 'Aucun projet actif' }, { status: 400 })

    if (project.months_elapsed >= project.total_months) {
      // Game complete!
      const profit = project.current_cash - project.initial_cash
      await supabase.from('Project').update({ status: 'succeeded' }).eq('id', project.id)

      // Update user stats
      const { data: uStats } = await supabase.from('User').select('games_won, total_profit').eq('id', user.id).single()
      if (uStats) {
        await supabase.from('User').update({
          games_won: uStats.games_won + 1,
          total_profit: uStats.total_profit + Math.max(0, profit),
        }).eq('id', user.id)
      }

      // Feed post
      await supabase.from('FeedPost').insert({
        userId: user.id,
        type: 'succes',
        title: `${project.name} — Simulation terminée avec succès !`,
        description: `Profit: ${new Intl.NumberFormat('fr-FR').format(profit)} FCFA`,
      })

      return NextResponse.json({
        project: { ...project, status: 'succeeded', months_elapsed: project.months_elapsed + 1 },
        event: null,
        loanPayment: null,
        newExpense: null,
      })
    }

    const newMonth = project.months_elapsed + 1

    // 1. Calculate revenue
    const revenue = project.monthly_revenue * (0.85 + Math.random() * 0.3) // ±15% variation

    // 2. Calculate expenses (base + revealed hidden)
    const { data: projectExpenses } = await supabase.from('ProjectExpense').select('*').eq('projectId', project.id)
    const baseExpense = project.monthly_expense

    let extraExpense = 0
    let newExpense: { name: string; amount: number } | null = null

    for (const exp of projectExpenses || []) {
      if (exp.revealed_at !== null && exp.revealed_at === newMonth && !exp.paid) {
        extraExpense += exp.amount
        await supabase.from('ProjectExpense').update({ paid: true }).eq('id', exp.id)
        newExpense = { name: exp.name, amount: exp.amount }
      }
    }

    const totalExpenses = baseExpense + extraExpense

    // 3. Random event (40% chance)
    let event = null
    const eventRoll = Math.random()
    if (eventRoll < 0.2) {
      // Negative event
      const evt = EVENTS_NEGATIFS[Math.floor(Math.random() * EVENTS_NEGATIFS.length)]
      const pct = evt.impactRange[0] + Math.random() * (evt.impactRange[1] - evt.impactRange[0])
      const impact = Math.round(revenue * pct)
      event = { ...evt, impact, category: 'negatif' as const }

      await supabase.from('GameEvent').insert({
        userId: user.id, projectId: project.id,
        title: evt.title, description: evt.description,
        impact, category: 'negatif', month: newMonth,
      })
    } else if (eventRoll < 0.35) {
      // Positive event
      const evt = EVENTS_POSITIFS[Math.floor(Math.random() * EVENTS_POSITIFS.length)]
      const pct = evt.impactRange[0] + Math.random() * (evt.impactRange[1] - evt.impactRange[0])
      const impact = Math.round(project.monthly_revenue * pct)
      event = { ...evt, impact, category: 'positif' as const }

      await supabase.from('GameEvent').insert({
        userId: user.id, projectId: project.id,
        title: evt.title, description: evt.description,
        impact, category: 'positif', month: newMonth,
      })
    }

    // 4. Calculate net
    const eventImpact = event?.impact || 0
    const netCash = project.current_cash + revenue - totalExpenses + eventImpact

    // 5. Loan payment
    let loanPayment = 0
    if (project.loanId) {
      const { data: loan } = await supabase.from('Loan').select('*').eq('id', project.loanId).single()
      if (loan && loan.status === 'active' && loan.months_remaining > 0) {
        loanPayment = Math.min(loan.monthly_payment, loan.remaining, Math.max(0, netCash))
        if (loanPayment > 0) {
          const newRemaining = loan.remaining - loanPayment
          const newMonths = Math.max(0, loan.months_remaining - 1)

          await supabase.from('Loan').update({
            remaining: Math.max(0, newRemaining),
            months_remaining: newMonths,
            status: newRemaining <= 0 ? 'paid' : 'active',
          }).eq('id', loan.id)

          if (newRemaining <= 0) {
            await supabase.from('Transaction').insert({
              fromUserId: user.id, amount: loanPayment,
              type: 'remboursement', description: 'Dernière mensualité du prêt',
            })
          }
        }
      }
    }

    const finalCash = netCash - loanPayment

    // 6. Check bankruptcy
    const { data: bankSetting } = await supabase.from('GameSettings').select('value').eq('key', 'bankruptcy_threshold').single()
    const threshold = bankSetting ? parseInt(bankSetting.value) : -100000

    let newStatus = 'active'
    if (finalCash < threshold) {
      newStatus = 'failed'

      const { data: uStats } = await supabase.from('User').select('games_lost, is_bankrupt').eq('id', user.id).single()
      if (uStats) {
        await supabase.from('User').update({
          games_lost: uStats.games_lost + 1,
          is_bankrupt: true,
        }).eq('id', user.id)
      }

      await supabase.from('FeedPost').insert({
        userId: user.id, type: 'faillite',
        title: `${project.name} — FAILLITE !`,
        description: `Solde final: ${new Intl.NumberFormat('fr-FR').format(Math.round(finalCash))} FCFA`,
      })
    }

    // 7. Update project
    await supabase.from('Project').update({
      current_cash: Math.round(finalCash),
      months_elapsed: newMonth,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }).eq('id', project.id)

    // Update user cash
    await supabase.from('User').update({ cash: Math.round(finalCash) }).eq('id', user.id)

    // 8. Fluctuate market prices
    const { data: prices } = await supabase.from('MarketPrice').select('*')
    for (const price of prices || []) {
      const change = (Math.random() - 0.48) * 5 // slight upward bias
      const newPrice = Math.round(price.price * (1 + change / 100))
      await supabase.from('MarketPrice').update({
        price: newPrice,
        change_pct: Math.round(change * 10) / 10,
        updatedAt: new Date().toISOString(),
      }).eq('category', price.category)
    }

    return NextResponse.json({
      project: { ...project, current_cash: Math.round(finalCash), months_elapsed: newMonth, status: newStatus },
      event,
      loanPayment: loanPayment > 0 ? loanPayment : null,
      newExpense,
    })
  } catch (error) {
    console.error('Next month error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
