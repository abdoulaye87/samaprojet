'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Wallet, Building2, ArrowRightLeft, Send, RefreshCw,
  TrendingUp, Package,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { fmt, fmtDate, typeColor, typeLabel } from '@/lib/format';

interface User {
  id: string;
  name: string;
  email: string | null;
  type: string;
}

interface PlayerDashboardProps {
  currentUser: User;
  accessToken: string;
}

interface Business {
  id: string;
  ownerId: string;
  name: string;
  revenue: number;
  cost: number;
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

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string | null;
    cash: number;
    type: string;
    createdAt: string;
  };
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

export function PlayerDashboard({ currentUser, accessToken }: PlayerDashboardProps) {
  const queryClient = useQueryClient();
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => fetchWithAuth<ProfileData>('/api/users/me', accessToken),
    refetchInterval: 15_000,
  });

  const { data: usersData } = useQuery<{ users: { id: string; name: string; type: string }[] }>({
    queryKey: ['users'],
    queryFn: () => fetchWithAuth<{ users: { id: string; name: string; type: string }[] }>('/api/users', accessToken),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['profile'] });

  const otherUsers = (usersData?.users || []).filter((u) => u.id !== currentUser.id);

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount || Number(transferAmount) <= 0) {
      toast.error('Veuillez sélectionner un destinataire et entrer un montant');
      return;
    }
    setTransferring(true);
    try {
      await fetchWithAuth('/api/users/transfer', accessToken, {
        method: 'POST',
        body: JSON.stringify({ toUserId: transferTo, amount: Number(transferAmount) }),
      });
      toast.success('Transfert effectué !');
      setTransferTo('');
      setTransferAmount('');
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors du transfert');
    } finally {
      setTransferring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const user = profile?.user;
  const businesses = profile?.businesses || [];
  const transactions = profile?.transactions || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <Wallet className="size-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Solde</p>
                <p className="text-xl font-bold tabular-nums text-green-700">
                  {fmt(user?.cash ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2.5">
                <Building2 className="size-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Mes Business</p>
                <p className="text-xl font-bold tabular-nums">{businesses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <ArrowRightLeft className="size-5 text-purple-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Transactions</p>
                <p className="text-xl font-bold tabular-nums">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mes Business */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="size-4" />
            Mes Business
          </CardTitle>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Vous n&apos;avez pas encore de business.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border"
                >
                  <div>
                    <p className="font-medium text-sm">{biz.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Revenu: {fmt(biz.revenue)} · Coût: {fmt(biz.cost)}
                    </p>
                  </div>
                  <Badge
                    variant={biz.revenue - biz.cost >= 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    <TrendingUp className="size-3 mr-1" />
                    {fmt(biz.revenue - biz.cost)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Envoyer de l'argent */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Send className="size-4" />
            Envoyer de l&apos;argent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Destinataire</Label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {otherUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                      {u.type === 'agent' && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Agent</Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40 space-y-1">
              <Label className="text-xs text-muted-foreground">Montant</Label>
              <Input
                type="number"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                min={0}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleTransfer}
                disabled={!transferTo || !transferAmount || transferring}
                className="w-full sm:w-auto"
              >
                <Send className="size-3.5 mr-1" />
                {transferring ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRightLeft className="size-4" />
              Historique
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={refresh}>
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune transaction pour le moment.
            </p>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-1">
                {transactions.map((tx) => {
                  const isSender = tx.fromUserId === currentUser.id;
                  const colors = typeColor(tx.type);
                  const [dotClass] = colors.split(' ');
                  const [, textColor] = colors.split(' ').slice(1);

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`econ-dot ${dotClass}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${textColor}`}>
                            {typeLabel(tx.type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isSender
                              ? `→ ${tx.toUser?.name || 'Utilisateur'}`
                              : `← ${tx.fromUser?.name || 'Utilisateur'}`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(tx.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          isSender ? 'text-red-600' : 'text-green-700'
                        }`}
                      >
                        {isSender ? '-' : '+'}
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
    </div>
  );
}
