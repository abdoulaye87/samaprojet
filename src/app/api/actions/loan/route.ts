import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST — Prendre un prêt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, montant, taux } = body;

    if (!agentId || !montant || montant <= 0) {
      return NextResponse.json({ error: 'agentId et montant (positif) sont requis' }, { status: 400 });
    }

    const agent = await db.agent.findUnique({ where: { id: parseInt(agentId, 10) } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent non trouvé' }, { status: 404 });
    }

    const amount = Number(montant);
    const tauxInteret = taux !== undefined ? Number(taux) : 0.02;

    // Créer le prêt
    const loan = await db.loan.create({
      data: {
        agentId: agent.id,
        montant: amount,
        tauxInteret,
        statut: 'en cours',
      },
    });

    // Augmenter le solde et la dette de l'agent
    const updatedAgent = await db.agent.update({
      where: { id: agent.id },
      data: {
        balance: Number((agent.balance + amount).toFixed(2)),
        dette: Number((agent.dette + amount).toFixed(2)),
      },
    });

    // Créer la transaction
    await db.transaction.create({
      data: {
        agentId: agent.id,
        type: 'pret',
        montant: amount,
        description: `Prêt de ${amount.toFixed(2)}F à ${(tauxInteret * 100).toFixed(1)}%`,
      },
    });

    // Journaliser
    const economy = await db.economy.findUnique({ where: { id: 1 } });
    await db.eventLog.create({
      data: {
        message: `🏦 ${agent.prenom} a contracté un prêt de ${amount.toFixed(2)}F (taux: ${(tauxInteret * 100).toFixed(1)}%) — Dette totale: ${updatedAgent.dette.toFixed(2)}F`,
        type: 'info',
        periode: economy?.periode || 1,
      },
    });

    return NextResponse.json({
      success: true,
      loan: {
        ...loan,
        montant: Number(loan.montant.toFixed(2)),
        createdAt: loan.createdAt.toISOString(),
      },
      agent: {
        ...updatedAgent,
        balance: Number(updatedAgent.balance.toFixed(2)),
        dette: Number(updatedAgent.dette.toFixed(2)),
        investissementTotal: Number(updatedAgent.investissementTotal.toFixed(2)),
      },
      message: `${agent.prenom} a obtenu un prêt de ${amount.toFixed(2)}F`,
    });
  } catch (error) {
    console.error('Erreur loan:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du prêt' }, { status: 500 });
  }
}
