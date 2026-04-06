'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users, UserPlus, Building2, RefreshCw, Edit3, TrendingUp,
  Package, ArrowRightLeft,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { fmt, fmtDate, typeColor, typeLabel } from '@/lib/format';

interface AdminDashboardProps {
  currentUser: { id: string; name: string; type: string };
  accessToken: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string | null;
  cash: number;
  type: string;
  createdAt: string;
  _count: { ownedBusinesses: number; businessesSent: number; businessesReceived: number };
}

interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: string;
  createdAt: string;
  fromUser?: { id: string; name: string };
  toUser?: { id: string; name: string };
}

interface Business {
  id: string;
  ownerId: string;
  name: string;
  revenue: number;
  cost: number;
  createdAt: string;
  owner: { id: string; name: string; type: string };
}

interface UserDetail {
  user: { id: string; name: string; email: string | null; cash: number; type: string; createdAt: string };
  businesses: Business[];
  transactions: Transaction[];
}

async function fetchWithAuth<T>(url: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Erreur réseau');
    throw new Error(text);
  }
  return res.json();
}

export function AdminDashboard({ currentUser, accessToken }: AdminDashboardProps) {
  const queryClient = useQueryClient();

  // Users list
  const { data: usersData, isLoading: loadingUsers } = useQuery<{ users: UserRow[] }>({
    queryKey: ['users'],
    queryFn: () => fetchWithAuth<{ users: UserRow[] }>('/api/users', accessToken),
    refetchInterval: 15_000,
  });

  // All transactions
  const { data: txData } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ['all-transactions'],
    queryFn: () => fetchWithAuth<{ transactions: Transaction[] }>('/api/transactions', accessToken),
    refetchInterval: 15_000,
  });

  // Selected user detail
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: userDetails } = useQuery<UserDetail>({
    queryKey: ['user-detail', selectedUserId],
    queryFn: () => fetchWithAuth<UserDetail>(`/api/users/${selectedUserId}`, accessToken),
    enabled: !!selectedUserId,
  });

  // Forms
  const [agentName, setAgentName] = useState('');
  const [agentCash, setAgentCash] = useState('5000');
  const [editUserId, setEditUserId] = useState('');
  const [editCash, setEditCash] = useState('');
  const [bizOwnerId, setBizOwnerId] = useState('');
  const [bizName, setBizName] = useState('');
  const [bizRevenue, setBizRevenue] = useState('');
  const [bizCost, setBizCost] = useState('');

  const users = usersData?.users || [];
  const transactions = txData?.transactions || [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
    if (selectedUserId) queryClient.invalidateQueries({ queryKey: ['user-detail', selectedUserId] });
  };

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    try {
      await fetchWithAuth('/api/users', accessToken, {
        method: 'POST',
        body: JSON.stringify({ name: agentName.trim(), cash: Number(agentCash) || 5000, type: 'agent' }),
      });
      toast.success(`Agent "${agentName.trim()}" créé`);
      setAgentName('');
      setAgentCash('5000');
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const handleUpdateUser = async () => {
    if (!editUserId || !editCash) {
      toast.error('Sélectionnez un utilisateur et entrez un montant');
      return;
    }
    try {
      await fetchWithAuth(`/api/users/${editUserId}`, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ cash: Number(editCash) }),
      });
      toast.success('Utilisateur modifié');
      setEditUserId('');
      setEditCash('');
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const handleCreateBusiness = async () => {
    if (!bizOwnerId || !bizName || !bizRevenue || !bizCost) {
      toast.error('Tous les champs sont requis');
      return;
    }
    try {
      await fetchWithAuth(`/api/users/${bizOwnerId}/business`, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          name: bizName,
          revenue: Number(bizRevenue),
          cost: Number(bizCost),
        }),
      });
      toast.success(`Business "${bizName}" créé`);
      setBizOwnerId('');
      setBizName('');
      setBizRevenue('');
      setBizCost('');
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  if (loadingUsers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="size-3.5" />
            Tous les utilisateurs
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-1.5">
            <UserPlus className="size-3.5" />
            Gestion
          </TabsTrigger>
        </TabsList>

        {/* ===== Users Tab ===== */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Users Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Users className="size-4" />
                      Utilisateurs ({users.length})
                    </CardTitle>
                    <Button size="sm" variant="ghost" onClick={refresh}>
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedUserId === u.id
                              ? 'border-amber-400 bg-amber-50'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() =>
                            setSelectedUserId(selectedUserId === u.id ? null : u.id)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-amber-100 p-1.5">
                              <Users className="size-3.5 text-amber-700" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{u.name}</span>
                                <Badge
                                  variant={u.type === 'agent' ? 'default' : 'secondary'}
                                  className="text-[10px]"
                                >
                                  {u.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {u.email || 'Agent (pas d\'email)'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm tabular-nums">{fmt(u.cash)}</p>
                            <p className="text-xs text-muted-foreground">
                              {u._count.ownedBusinesses} business
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* User Detail */}
            <div className="lg:col-span-1">
              {selectedUser && userDetails ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      {userDetails.user.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Solde: {fmt(userDetails.user.cash)} · {userDetails.user.type}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Businesses */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Package className="size-3" />
                        Business ({userDetails.businesses.length})
                      </p>
                      {userDetails.businesses.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucun business</p>
                      ) : (
                        <div className="space-y-1.5">
                          {userDetails.businesses.map((b) => (
                            <div key={b.id} className="p-2 rounded bg-muted/40 text-xs">
                              <span className="font-medium">{b.name}</span>
                              <span className="ml-2 text-muted-foreground">
                                R: {fmt(b.revenue)} · C: {fmt(b.cost)} · P: {fmt(b.revenue - b.cost)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Transactions */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <ArrowRightLeft className="size-3" />
                        Transactions récentes
                      </p>
                      <ScrollArea className="max-h-48">
                        <div className="space-y-1">
                          {userDetails.transactions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Aucune transaction</p>
                          ) : (
                            userDetails.transactions.slice(0, 10).map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between py-1 text-xs">
                                <span className="text-muted-foreground">
                                  {fmtDate(tx.createdAt)}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  {typeLabel(tx.type)}
                                </Badge>
                                <span className="font-medium tabular-nums">{fmt(tx.amount)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex items-center justify-center min-h-[300px]">
                  <CardContent className="p-8 text-center">
                    <Users className="size-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium text-sm">
                      Sélectionnez un utilisateur
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Cliquez sur un utilisateur pour voir ses détails
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* All Transactions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowRightLeft className="size-4" />
                Toutes les transactions ({transactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucune transaction
                </p>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-1">
                    {transactions.map((tx) => {
                      const colors = typeColor(tx.type);
                      const [dotClass] = colors.split(' ');
                      const [, textColor] = colors.split(' ').slice(1);

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className={`econ-dot ${dotClass}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${textColor}`}>
                                {typeLabel(tx.type)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {tx.fromUser?.name} → {tx.toUser?.name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(tx.createdAt)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">
                            {fmt(tx.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Management Tab ===== */}
        <TabsContent value="management" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Create Agent */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserPlus className="size-4" />
                  Créer un agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <Input
                    placeholder="Nom de l'agent"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAgent(); }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cash initial</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={agentCash}
                    onChange={(e) => setAgentCash(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateAgent} className="w-full" disabled={!agentName.trim()}>
                  <UserPlus className="size-3.5 mr-1" />
                  Créer l&apos;agent
                </Button>
              </CardContent>
            </Card>

            {/* Update User */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Edit3 className="size-4" />
                  Modifier un utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Utilisateur</Label>
                  <Select value={editUserId} onValueChange={setEditUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({fmt(u.cash)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nouveau cash</Label>
                  <Input
                    type="number"
                    placeholder="Nouveau montant"
                    value={editCash}
                    onChange={(e) => setEditCash(e.target.value)}
                  />
                </div>
                <Button onClick={handleUpdateUser} className="w-full" disabled={!editUserId || !editCash}>
                  <Edit3 className="size-3.5 mr-1" />
                  Modifier
                </Button>
              </CardContent>
            </Card>

            {/* Create Business */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="size-4" />
                  Créer un business
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Propriétaire</Label>
                  <Select value={bizOwnerId} onValueChange={setBizOwnerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                          <Badge variant="outline" className="ml-1 text-[10px]">{u.type}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nom du business</Label>
                  <Input
                    placeholder="Ex: Super Boutique"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Revenu</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bizRevenue}
                      onChange={(e) => setBizRevenue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Coût</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bizCost}
                      onChange={(e) => setBizCost(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateBusiness}
                  className="w-full"
                  disabled={!bizOwnerId || !bizName || !bizRevenue || !bizCost}
                >
                  <Building2 className="size-3.5 mr-1" />
                  Créer le business
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
