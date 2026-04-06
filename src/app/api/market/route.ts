import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET — Lister les produits du marché
export async function GET() {
  try {
    const market = await db.marketItem.findMany({ orderBy: { produit: 'asc' } });

    const formatted = market.map((item) => ({
      id: item.id,
      produit: item.produit,
      prix: Number(item.prix.toFixed(2)),
      prixBase: Number(item.prixBase.toFixed(2)),
      variation: Number(((item.prix - item.prixBase) / item.prixBase * 100).toFixed(1)),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json({ market: formatted });
  } catch (error) {
    console.error('Erreur GET market:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du marché' }, { status: 500 });
  }
}
