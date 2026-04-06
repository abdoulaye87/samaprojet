import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST — Rembourser un prêt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, montant } = body;

    if (!agentId || !montant || montant <= 0) {
      return NextResponse.json({ error: 'agentId et montant (positif) sont requis' }, { status: 400 });
    }

    const agent = await db.agent.findUnique({ where: { id: parseInt(agentId, 10) } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent non trouvé' }, { status: 404 });
    }

    if (agent.dette <= 0) {
      return NextResponse.json({ error: `${agent.prenom} n'a aucune dette à rembourser` }, { status: 400 });
    }

    const amount = Number(montant);

    // Vérifier le solde
    if (agent.balance < amount) {
      return NextResponse.json({
        error: `Solde insuffisant ! ${agent.prenom} a ${agent.balance.toFixed(2)}F mais veut rembourser ${amount.toFixed(2)}F`,
      }, { status: 400 });
    }

    // Récupérer les prêts en cours triés par date (FIFO)
    const activeLoans = await db.loan.findMany({
      where: { agentId: agent.id, statut: 'en cours' },
      orderBy: { createdAt: 'asc' },
    });

    if (activeLoans.length === 0) {
      return NextResponse.json({ error: 'Aucun prêt actif trouvé' }, { status: 400 });
    }

    let remaining = amount;
    const loansUpdated: { id: number; statut: string }[] = [];

    for (const loan of activeLoans) {
      if (remaining <= 0) break;

      if (remaining >= loan.montant) {
        // Rembourser entièrement ce prêt
        remaining = Number((remaining - loan.montant).toFixed(2));
        await db.loan.update({
          where: { id: loan.id },
          data: { statut: 'remboursé' },
        });
        loansUpdated.push({ id: loan.id, statut: 'remboursé' });
      } else {
        // Rembourser partiellement
        await db.loan.update({
          where: { id: loan.id },
          data: { montant: Number((loan.montant - remaining).toFixed(2)) },
        });
        remaining = 0;
        loansUpdated.push({ id: loan.id, statut: 'partiel' });
      }
    }

    // Recalculer la dette totale à partir des prêts en cours
    const recalculatedLoans = await db.loan.findMany({
      where: { agentId: agent.id, statut: 'en cours' },
    });
    const newDette = recalculatedLoans.reduce((sum, l) => sum + l.montant, 0);

    // Mettre à jour l'agent
    const updatedAgent = await db.agent.update({
      where: { id: agent.id },
      data: {
        balance: Number((agent.balance - amount).toFixed(2)),
        dette: Number(newDette.toFixed(2)),
      },
    });

    // Créer la transaction
    await db.transaction.create({
      data: {
        agentId: agent.id,
        type: 'remboursement',
        montant: amount,
        description: `Remboursement de ${amount.toFixed(2)}F`,
      },
    });

    // Journaliser
    const economy = await db.economy.findUnique({ where: { id: 1 } });
    const remboursés = loansUpdated.filter((l) => l.statut === 'remboursé').length;
    await db.eventLog.create({
      data: {
        message: `💵 ${agent.prenom} a remboursé ${amount.toFixed(2)}F — ${remboursés} prêt(s) soldé(s) — Dette restante: ${newDette.toFixed(2)}F`,
        type: 'info',
        periode: economy?.periode || 1,
      },
    });

    return NextResponse.json({
      success: true,
      agent: {
        ...updatedAgent,
        balance: Number(updatedAgent.balance.toFixed(2)),
        dette: Number(updatedAgent.dette.toFixed(2)),
        investissementTotal: Number(updatedAgent.investissementTotal.toFixed(2)),
      },
      loansUpdated,
      message: `${agent.prenom} a remboursé ${amount.toFixed(2)}F — Dette restante: ${newDette.toFixed(2)}F`,
    });
  } catch (error) {
    console.error('Erreur repay:', error);
    return NextResponse.json({ error: 'Erreur lors du remboursement' }, { status: 500 });
  }
}
