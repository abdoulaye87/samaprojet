import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST — Vendre un produit (80% du prix actuel)
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

    const prixActuel = Number(marketItem.prix);
    const prixVente = Number((prixActuel * 0.80).toFixed(2)); // 80% du prix actuel

    // Vérifier que l'agent a assez d'investissement
    if (agent.investissementTotal < prixActuel) {
      return NextResponse.json({
        error: `Investissement insuffisant pour vendre ${produit} ! Investissement total: ${agent.investissementTotal.toFixed(2)}F, prix de référence: ${prixActuel.toFixed(2)}F`,
      }, { status: 400 });
    }

    // Créditer le solde et diminuer l'investissement
    const updatedAgent = await db.agent.update({
      where: { id: agent.id },
      data: {
        balance: Number((agent.balance + prixVente).toFixed(2)),
        investissementTotal: Number((agent.investissementTotal - prixActuel).toFixed(2)),
      },
    });

    // Créer la transaction
    await db.transaction.create({
      data: {
        agentId: agent.id,
        type: 'vente',
        montant: prixVente,
        description: `Vente de ${produit} à ${prixVente.toFixed(2)}F (80% de ${prixActuel.toFixed(2)}F)`,
      },
    });

    // Journaliser
    const economy = await db.economy.findUnique({ where: { id: 1 } });
    await db.eventLog.create({
      data: {
        message: `💰 ${agent.prenom} a vendu ${produit} pour ${prixVente.toFixed(2)}F (perte de ${Number((prixActuel - prixVente).toFixed(2))}F)`,
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
      prixVente,
      message: `${agent.prenom} a vendu ${produit} pour ${prixVente.toFixed(2)}F`,
    });
  } catch (error) {
    console.error('Erreur sell:', error);
    return NextResponse.json({ error: 'Erreur lors de la vente' }, { status: 500 });
  }
}
