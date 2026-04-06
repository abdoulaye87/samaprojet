import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applyInflation } from '@/lib/economy-engine';

// GET — État de l'économie
export async function GET() {
  try {
    const economy = await db.economy.findUnique({ where: { id: 1 } });

    if (!economy) {
      return NextResponse.json({ error: 'Économie non initialisée' }, { status: 404 });
    }

    return NextResponse.json({
      economy: {
        id: economy.id,
        periode: economy.periode,
        inflationCumul: Number(economy.inflationCumul.toFixed(4)),
        inflationRate: Number(economy.inflationRate.toFixed(4)),
        updatedAt: economy.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur GET economy:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'économie' }, { status: 500 });
  }
}

// POST — Avancer la période (appliquer l'inflation)
export async function POST() {
  try {
    const result = await applyInflation();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Erreur POST economy:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'application de l\'inflation' }, { status: 500 });
  }
}
