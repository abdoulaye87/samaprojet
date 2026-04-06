import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST — Recevoir de l'argent (dépôt)
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

    const amount = Number(montant);

    // Augmenter le solde
    const updatedAgent = await db.agent.update({
      where: { id: agent.id },
      data: { balance: Number((agent.balance + amount).toFixed(2)) },
    });

    // Créer la transaction
    await db.transaction.create({
      data: {
        agentId: agent.id,
        type: 'depot',
        montant: amount,
        description: `Dépôt de ${amount.toFixed(2)}F`,
      },
    });

    // Journaliser
    const economy = await db.economy.findUnique({ where: { id: 1 } });
    await db.log.create({
      data: {
        message: `📥 ${agent.prenom} a reçu ${amount.toFixed(2)}F — Nouveau solde: ${updatedAgent.balance.toFixed(2)}F`,
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
      message: `${agent.prenom} a reçu ${amount.toFixed(2)}F`,
    });
  } catch (error) {
    console.error('Erreur receive:', error);
    return NextResponse.json({ error: 'Erreur lors du dépôt' }, { status: 500 });
  }
}
