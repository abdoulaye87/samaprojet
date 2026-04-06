import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/economy-engine';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Erreur seed:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'initialisation de la base de données' },
      { status: 500 }
    );
  }
}
