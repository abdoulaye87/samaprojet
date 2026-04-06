import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST — Acheter un produit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, produit } = body;

    if (!agentId || !produit) {
      return NextResponse.json({ error: 'agentId et produit sont requis' }, { status: 400 });
    }

    const agent = await db.agent.findUnique({ where: { id: parseInt(agentId, 10) } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent non trouvé' }, { status: 404 });
    }

    const marketItem = await db.marketItem.findUnique({ where: { produit } });
    if (!marketItem) {
      return NextResponse.json({ error: 'Produit non trouvé sur le marché' }, { status: 404 });
    }

    const prix = Number(marketItem.prix);

    // Vérifier le solde
    if (agent.balance < prix) {
      return NextResponse.json({
        error: `Solde insuffisant ! ${agent.prenom} a ${agent.balance.toFixed(2)}F mais ${produit} coûte ${prix.toFixed(2)}F`,
      }, { status: 400 });
    }

    // Débiter le solde et augmenter l'investissement
    const updatedAgent = await db.agent.update({
      where: { id: agent.id },
      data: {
        balance: Number((agent.balance - prix).toFixed(2)),
        investissementTotal: Number((agent.investissementTotal + prix).toFixed(2)),
      },
    });

    // Créer la transaction
    await db.transaction.create({
      data: {
        agentId: agent.id,
        type: 'achat',
        montant: prix,
        description: `Achat de ${produit} à ${prix.toFixed(2)}F`,
      },
    });

    // Journaliser
    const economy = await db.economy.findUnique({ where: { id: 1 } });
    await db.eventLog.create({
      data: {
        message: `🛒 ${agent.prenom} a acheté ${produit} pour ${prix.toFixed(2)}F`,
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
      produit,
      prix,
      message: `${agent.prenom} a acheté ${produit} pour ${prix.toFixed(2)}F`,
    });
  } catch (error) {
    console.error('Erreur buy:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'achat' }, { status: 500 });
  }
}
