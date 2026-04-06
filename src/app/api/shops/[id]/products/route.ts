import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { name, description, category, price, stock = 999, image } = await req.json()
    if (!name || !price) return NextResponse.json({ error: 'Nom et prix requis' }, { status: 400 })

    const { data: product, error: insertError } = await supabase.from('Product').insert({
      shopId: id,
      ownerId: user.id,
      name,
      description: description || '',
      category: category || 'materiel',
      price,
      stock,
      image: image || null,
      status: 'available',
    }).select().single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Add product error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
