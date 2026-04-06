import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET — Récupérer les journaux d'événements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await db.eventLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      message: log.message,
      type: log.type,
      periode: log.periode,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({ logs: formatted });
  } catch (error) {
    console.error('Erreur GET logs:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des journaux' }, { status: 500 });
  }
}
