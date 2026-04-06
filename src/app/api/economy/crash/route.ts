import { NextResponse } from 'next/server';
import { crashEconomy } from '@/lib/economy-engine';

// POST — Déclencher un crash économique
export async function POST() {
  try {
    const result = await crashEconomy();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Erreur crash:', error);
    return NextResponse.json({ error: 'Erreur lors du crash économique' }, { status: 500 });
  }
}
