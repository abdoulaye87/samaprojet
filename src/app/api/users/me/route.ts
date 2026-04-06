import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé: token manquant' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Vérifier le token avec Supabase
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('Token verification error:', error.message)
      return NextResponse.json({ error: 'Token invalide: ' + error.message }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé via token' }, { status: 401 })
    }

    const userId = data.user.id

    // Récupérer le profil
    const { data: profile } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Utilisateur'
      await supabase.from('User').insert({
        id: userId,
        name,
        email: data.user.email,
        cash: 5000,
        type: 'player',
      })

      return NextResponse.json({
        user: {
          id: userId,
          name,
          email: data.user.email,
          cash: 5000,
          type: 'player',
          createdAt: new Date().toISOString(),
        },
        businesses: [],
        transactions: [],
      })
    }

    // Récupérer les businesses
    const { data: businesses } = await supabase
      .from('Business')
      .select('*')
      .eq('ownerId', userId)

    // Récupérer toutes les transactions liées à cet utilisateur
    const { data: transactions } = await supabase
      .from('Transaction')
      .select('*')
      .or(`fromUserId.eq.${userId},toUserId.eq.${userId}`)
      .order('createdAt', { ascending: false })
      .limit(20)

    // Récupérer les noms des utilisateurs liés
    const txList = transactions || []
    const userIds = [...new Set([...txList.map(t => t.fromUserId), ...txList.map(t => t.toUserId)])]

    const userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('User')
        .select('id, name')
        .in('id', userIds)
      for (const u of users || []) {
        userMap[u.id] = u.name
      }
    }

    // Enrichir les transactions avec les noms
    const enrichedTx = txList.map(tx => ({
      ...tx,
      fromUser: { id: tx.fromUserId, name: userMap[tx.fromUserId] || 'Inconnu' },
      toUser: { id: tx.toUserId, name: userMap[tx.toUserId] || 'Inconnu' },
    }))

    // Dédupliquer les transactions
    const seen = new Set<string>()
    const uniqueTransactions = enrichedTx.filter(tx => {
      if (seen.has(tx.id)) return false
      seen.add(tx.id)
      return true
    })

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        cash: profile.cash,
        type: profile.type,
        createdAt: profile.createdAt,
      },
      businesses: businesses || [],
      transactions: uniqueTransactions,
    })
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement du profil' },
      { status: 500 }
    )
  }
}
