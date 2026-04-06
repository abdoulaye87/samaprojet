import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/economy-engine';

// GET — Données agrégées du dashboard
export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur GET dashboard:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des données du dashboard' }, { status: 500 });
  }
}
