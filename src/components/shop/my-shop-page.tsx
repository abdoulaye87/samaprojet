'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Store, Plus, Package, Settings, BarChart3,
  ShoppingBag, Edit3, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { fmt, statusLabel, statusColor } from '@/lib/format';
import { cn } from '@/lib/utils';

interface MyShopPageProps {
  accessToken: string;
  userId: string;
}

async function fetchWithAuth<T>(url: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...opts,
  });
  if (!res.ok) throw new Error('Erreur');
  return res.json();
}

const PRODUCT_CATEGORIES = ['Alimentaire', 'Matériel', 'Luxe', 'Or', 'Diamant', 'Immobilier', 'Véhicule'];
const SERVICE_CATEGORIES = ['Transport', 'Construction', 'Réparation', 'Conseil', 'Formation', 'Main d\'oeuvre'];

export function MyShopPage({ accessToken, userId }: MyShopPageProps) {
  const queryClient = useQueryClient();
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create shop form
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopCategory, setShopCategory] = useState('boutique');
  const [shopLocation, setShopLocation] = useState('Dakar');

  // Add product form
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Alimentaire');
  const [prodPrice, setProdPrice] = useState('');

  // Add service form
  const [svcName, setSvcName] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcCategory, setSvcCategory] = useState('Transport');
  const [svcPrice, setSvcPrice] = useState('');

  // Fetch my shop
  const { data: shopData, isLoading } = useQuery({
    queryKey: ['my-shop'],
    queryFn: () => fetchWithAuth<{
      shop: {
        id: string; name: string; description?: string; category: string;
        location: string; rating: number; review_count: number; sales_count: number; status: string;
      } | null;
      products: Array<{ id: string; name: string; category: string; price: number; stock: number; status: string }>;
      services: Array<{ id: string; name: string; category: string; price: number; availability: string }>;
      orders: Array<{ id: string; buyerName: string; productName?: string; amount: number; status: string; createdAt: string }>;
    }>(`/api/shops`, accessToken),
    refetchInterval: 20_000,
  });

  const shop = shopData?.shop;
  const products = shopData?.products || [];
  const services = shopData?.services || [];
  const orders = shopData?.orders || [];

  const handleCreateShop = async () => {
    if (!shopName.trim()) { toast.error('Le nom est requis'); return; }
    setSubmitting(true);
    try {
      await fetchWithAuth('/api/shops', accessToken, {
        method: 'POST',
        body: JSON.stringify({ name: shopName, description: shopDesc, category: shopCategory, location: shopLocation }),
      });
      toast.success('Boutique créée !');
      setShopName(''); setShopDesc('');
      setShowCreateShop(false);
      queryClient.invalidateQueries({ queryKey: ['my-shop'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleAddProduct = async () => {
    if (!prodName || !prodPrice) { toast.error('Nom et prix requis'); return; }
    if (!shop) { toast.error('Créez d\'abord une boutique'); return; }
    setSubmitting(true);
    try {
      await fetchWithAuth(`/api/shops/${shop.id}/products`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ name: prodName, description: prodDesc, category: prodCategory, price: Number(prodPrice) }),
      });
      toast.success('Produit ajouté !');
      setProdName(''); setProdDesc(''); setProdPrice('');
      setShowAddProduct(false);
      queryClient.invalidateQueries({ queryKey: ['my-shop'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleAddService = async () => {
    if (!svcName || !svcPrice) { toast.error('Nom et prix requis'); return; }
    if (!shop) { toast.error('Créez d\'abord une boutique'); return; }
    setSubmitting(true);
    try {
      await fetchWithAuth(`/api/shops/${shop.id}/services`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ name: svcName, description: svcDesc, category: svcCategory, price: Number(svcPrice) }),
      });
      toast.success('Service ajouté !');
      setSvcName(''); setSvcDesc(''); setSvcPrice('');
      setShowAddService(false);
      queryClient.invalidateQueries({ queryKey: ['my-shop'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally { setSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  // No shop yet
  if (!shop) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Store className="size-6 text-amber-600" />
            Ma Boutique
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-2xl bg-amber-100 p-6 mb-4">
            <Store className="size-12 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Vous n&apos;avez pas encore de boutique</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Créez votre boutique pour vendre des produits et services sur le marché sénégalais.
          </p>
          <Dialog open={showCreateShop} onOpenChange={setShowCreateShop}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200">
                <Plus className="size-4 mr-1.5" />
                Créer ma boutique
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une boutique</DialogTitle>
                <DialogDescription>Décrivez votre activité</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input placeholder="Ex: Chez Ami Boutique" value={shopName} onChange={(e) => setShopName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Description de votre boutique..." value={shopDesc} onChange={(e) => setShopDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={shopCategory} onValueChange={setShopCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['boutique', 'entreprise', 'commerce', 'service'].map(c => (
                          <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Localisation</Label>
                    <Input placeholder="Dakar" value={shopLocation} onChange={(e) => setShopLocation(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateShop(false)}>Annuler</Button>
                <Button onClick={handleCreateShop} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white">
                  {submitting ? 'Création...' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shop Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Store className="size-6 text-amber-600" />
              {shop.name}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{shop.location}</span>
              <span>·</span>
              <span>{shop.rating.toFixed(1)} ⭐ ({shop.review_count})</span>
              <span>·</span>
              <span>{shop.sales_count} ventes</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Produits', value: products.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Services', value: services.length, icon: Settings, color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Commandes', value: orders.length, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Note', value: `${shop.rating.toFixed(1)}/5`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map((s, i) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('rounded-lg p-2', s.bg)}>
                <s.icon className={cn('size-4', s.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="products">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="products" className="gap-1.5 text-xs">
              <Package className="size-3.5" /> Produits ({products.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5 text-xs">
              <Settings className="size-3.5" /> Services ({services.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5 text-xs">
              <ShoppingBag className="size-3.5" /> Commandes ({orders.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddProduct(true)}>
              <Plus className="size-3.5 mr-1" /> Produit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddService(true)}>
              <Plus className="size-3.5 mr-1" /> Service
            </Button>
          </div>
        </div>

        <TabsContent value="products">
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="size-12 mx-auto mb-3 opacity-30" />
              <p>Aucun produit</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1">{p.category}</Badge>
                      </div>
                      <p className="font-bold text-amber-700">{fmt(p.price)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Stock: {p.stock}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services">
          {services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="size-12 mx-auto mb-3 opacity-30" />
              <p>Aucun service</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{s.name}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">{s.category}</Badge>
                    </div>
                    <p className="font-bold text-amber-700">{fmt(s.price)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="size-12 mx-auto mb-3 opacity-30" />
              <p>Aucune commande</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(o => (
                <Card key={o.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{o.buyerName}</p>
                      <p className="text-xs text-muted-foreground">{o.productName || 'Service'} · {fmt(o.amount)}</p>
                    </div>
                    <Badge variant="secondary" className={cn('text-[10px]', statusColor(o.status))}>{statusLabel(o.status)}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nom *</Label><Input value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Nom du produit" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={prodCategory} onValueChange={setProdCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prix (FCFA) *</Label>
                <Input type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>Annuler</Button>
            <Button onClick={handleAddProduct} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white">
              {submitting ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nom *</Label><Input value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Nom du service" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={svcCategory} onValueChange={setSvcCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prix (FCFA) *</Label>
                <Input type="number" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddService(false)}>Annuler</Button>
            <Button onClick={handleAddService} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white">
              {submitting ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
