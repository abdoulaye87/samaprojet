import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET — Lister tous les agents
export async function GET() {
  try {
    const agents = await db.agent.findMany({
      orderBy: { createdAt: 'asc' },
      include: { loans: true },
    });

    const formatted = agents.map((a) => ({
      id: a.id,
      prenom: a.prenom,
      balance: Number(a.balance.toFixed(2)),
      dette: Number(a.dette.toFixed(2)),
      investissementTotal: Number(a.investissementTotal.toFixed(2)),
      createdAt: a.createdAt.toISOString(),
      loans: a.loans.map((l) => ({
        id: l.id,
        montant: Number(l.montant.toFixed(2)),
        tauxInteret: l.tauxInteret,
        statut: l.statut,
        createdAt: l.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ agents: formatted });
  } catch (error) {
    console.error('Erreur GET agents:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des agents' }, { status: 500 });
  }
}

// POST — Créer un nouvel agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prenom, balance } = body;

    if (!prenom || typeof prenom !== 'string') {
      return NextResponse.json({ error: 'Le prénom est requis' }, { status: 400 });
    }

    const agent = await db.agent.create({
      data: {
        prenom,
        balance: balance ? Number(balance) : 1000.00,
      },
    });

    // Journaliser
    await db.eventLog.create({
      data: {
        message: `👤 Nouvel agent créé: ${prenom} (${Number(agent.balance).toFixed(2)}F)`,
        type: 'info',
        periode: (await db.economy.findUnique({ where: { id: 1 } }))?.periode || 1,
      },
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
    console.error('Erreur POST agent:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'agent' }, { status: 500 });
  }
}
