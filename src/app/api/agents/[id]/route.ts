import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET — Récupérer un agent par ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = parseInt(id, 10);
    if (isNaN(agentId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const agent = await db.agent.findUnique({
      where: { id: agentId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        loans: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      agent: {
        ...agent,
        balance: Number(agent.balance.toFixed(2)),
        dette: Number(agent.dette.toFixed(2)),
        investissementTotal: Number(agent.investissementTotal.toFixed(2)),
        createdAt: agent.createdAt.toISOString(),
        transactions: agent.transactions.map((t) => ({
          ...t,
          montant: Number(t.montant.toFixed(2)),
          createdAt: t.createdAt.toISOString(),
        })),
        loans: agent.loans.map((l) => ({
          ...l,
          montant: Number(l.montant.toFixed(2)),
          createdAt: l.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Erreur GET agent:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'agent' }, { status: 500 });
  }
}

// PUT — Mettre à jour un agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = parseInt(id, 10);
    if (isNaN(agentId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { prenom, balance } = body;

    const existing = await db.agent.findUnique({ where: { id: agentId } });
    if (!existing) {
      return NextResponse.json({ error: 'Agent non trouvé' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (prenom !== undefined) updateData.prenom = prenom;
    if (balance !== undefined) updateData.balance = Number(balance);

    const agent = await db.agent.update({
      where: { id: agentId },
      data: updateData,
    });

    return NextResponse.json({
      agent: {
        ...agent,
        balance: Number(agent.balance.toFixed(2)),
        dette: Number(agent.dette.toFixed(2)),
        investissementTotal: Number(agent.investissementTotal.toFixed(2)),
        createdAt: agent.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur PUT agent:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'agent' }, { status: 500 });
  }
}

// DELETE — Supprimer un agent (cascade sur transactions et prêts)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = parseInt(id, 10);
    if (isNaN(agentId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const existing = await db.agent.findUnique({ where: { id: agentId } });
    if (!existing) {
      return NextResponse.json({ error: 'Agent non trouvé' }, { status: 404 });
    }

    // Journaliser avant suppression
    await db.eventLog.create({
      data: {
        message: `🗑️ Agent supprimé: ${existing.prenom}`,
        type: 'info',
        periode: (await db.economy.findUnique({ where: { id: 1 } }))?.periode || 1,
      },
    });

    await db.agent.delete({ where: { id: agentId } });

    return NextResponse.json({ success: true, message: `Agent ${existing.prenom} supprimé` });
  } catch (error) {
    console.error('Erreur DELETE agent:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'agent' }, { status: 500 });
  }
}
