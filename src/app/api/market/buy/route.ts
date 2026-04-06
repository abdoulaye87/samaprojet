import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { productId } = await req.json()
    if (!productId) return NextResponse.json({ error: 'Produit requis' }, { status: 400 })

    // Get product
    const { data: product } = await supabase.from('Product').select('*').eq('id', productId).single()
    if (!product) return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    if (product.stock <= 0) return NextResponse.json({ error: 'Produit en rupture de stock' }, { status: 400 })

    // Get user cash
    const { data: userData } = await supabase.from('User').select('cash').eq('id', user.id).single()
    if (!userData) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    if (userData.cash < product.price) return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

    // Get tax rate
    const { data: taxSetting } = await supabase.from('GameSettings').select('value').eq('key', 'market_tax_rate').single()
    const taxRate = taxSetting ? parseFloat(taxSetting.value) / 100 : 0.02
    const totalCost = Math.round(product.price * (1 + taxRate))

    // Debit buyer
    await supabase.from('User').update({ cash: userData.cash - totalCost }).eq('id', user.id)

    // Credit seller
    const { data: seller } = await supabase.from('User').select('cash').eq('id', product.ownerId).single()
    if (seller) {
      await supabase.from('User').update({ cash: seller.cash + product.price }).eq('id', product.ownerId)
    }

    // Decrease stock
    if (product.stock < 999) {
      await supabase.from('Product').update({ stock: product.stock - 1 }).eq('id', productId)
    }

    // Create order
    await supabase.from('Order').insert({
      buyerId: user.id,
      sellerId: product.ownerId,
      productId: product.id,
      amount: totalCost,
      status: 'completed',
    })

    // Create asset for buyer
    await supabase.from('Asset').insert({
      userId: user.id,
      name: product.name,
      category: product.category,
      purchase_price: product.price,
      current_value: product.price,
      status: 'owned',
    })

    // Record transaction
    await supabase.from('Transaction').insert({
      fromUserId: user.id,
      toUserId: product.ownerId,
      amount: totalCost,
      type: 'achat',
      description: `Achat: ${product.name}`,
    })

    // Feed post
    await supabase.from('FeedPost').insert({
      userId: user.id,
      type: 'achat_achat',
      title: `${userData.name || 'Un joueur'} a acheté ${product.name}`,
      description: `Pour ${new Intl.NumberFormat('fr-FR').format(totalCost)} FCFA`,
    })

    // Update shop sales count
    const { data: shop } = await supabase.from('Shop').select('sales_count').eq('id', product.shopId).single()
    if (shop) {
      await supabase.from('Shop').update({ sales_count: shop.sales_count + 1 }).eq('id', product.shopId)
    }

    return NextResponse.json({ success: true, cost: totalCost })
  } catch (error) {
    console.error('Buy product error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
