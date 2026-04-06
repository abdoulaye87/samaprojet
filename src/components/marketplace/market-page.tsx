'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fmt } from '@/lib/format';

const CATEGORIES = [
  { id: 'all', label: 'Tous', emoji: '🛒' },
  { id: 'or', label: 'Or', emoji: '🥇' },
  { id: 'diamant', label: 'Diamant', emoji: '💎' },
  { id: 'immobilier', label: 'Immobilier', emoji: '🏠' },
  { id: 'vehicule', label: 'Véhicules', emoji: '🚗' },
  { id: 'alimentaire', label: 'Alimentaire', emoji: '🍚' },
  { id: 'materiel', label: 'Matériel', emoji: '🔧' },
  { id: 'luxe', label: 'Luxe', emoji: '💍' },
];

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  shopName: string;
  ownerName: string;
  rating: number;
}

interface MarketPrices {
  category: string;
  price: number;
  change_pct: number;
}

interface MarketPageProps {
  accessToken: string;
  userId: string;
}

export function MarketPage({ accessToken, userId }: MarketPageProps) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['products', category],
    queryFn: async () => {
      const url = category === 'all' ? '/api/market/products' : `/api/market/products?category=${category}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
  });

  const { data: pricesData } = useQuery<{ prices: MarketPrices[] }>({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const res = await fetch('/api/market/prices');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
  });

  const products = (productsData?.products || []).filter((p) =>
    search === '' || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBuy = async (product: Product) => {
    try {
      const res = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ productId: product.id, amount: product.price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success(`Vous avez acheté "${product.name}" pour ${fmt(product.price)} !`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'achat');
    }
  };

  const prices = pricesData?.prices || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="size-6 text-amber-600" />
          Marché
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Achetez des produits et services pour vos projets ou votre patrimoine
        </p>
      </div>

      {/* Market Ticker */}
      {prices.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {prices.map((p) => (
            <Badge
              key={p.category}
              variant="outline"
              className={cn(
                'whitespace-nowrap px-3 py-1.5 text-xs font-medium',
                p.change_pct > 0 ? 'border-green-200 text-green-700 bg-green-50' :
                p.change_pct < 0 ? 'border-red-200 text-red-700 bg-red-50' :
                'border-muted'
              )}
            >
              {CATEGORIES.find(c => c.id === p.category)?.emoji}{' '}
              {fmt(p.price)}{' '}
              {p.change_pct > 0 ? `+${p.change_pct}%` : p.change_pct < 0 ? `${p.change_pct}%` : ''}
            </Badge>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              category === cat.id
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            )}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-4xl mb-3">🏪</p>
            <p className="text-muted-foreground">Aucun produit disponible pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border border-amber-100">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{product.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.shopName}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {CATEGORIES.find(c => c.id === product.category)?.emoji} {product.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-amber-700">{fmt(product.price)}</p>
                    <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => handleBuy(product)}
                  >
                    <ShoppingCart className="size-3.5 mr-1" />
                    Acheter
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
