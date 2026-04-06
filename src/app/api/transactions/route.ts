import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET — Lister les transactions (filtrable par agentId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const transactions = await db.transaction.findMany({
      where: agentId ? { agentId: parseInt(agentId, 10) } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: { agent: { select: { prenom: true } } },
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      agentId: t.agentId,
      agentPrenom: t.agent.prenom,
      type: t.type,
      montant: Number(t.montant.toFixed(2)),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ transactions: formatted });
  } catch (error) {
    console.error('Erreur GET transactions:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des transactions' }, { status: 500 });
  }
}
