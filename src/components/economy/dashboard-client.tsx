'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users, Wallet, TrendingDown, TrendingUp, AlertTriangle,
  Plus, Trash2, Edit3, RefreshCw, Clock, ChevronLeft, Play,
  ArrowUpCircle, ArrowDownCircle, Banknote, CreditCard, ShoppingBag,
  BarChart3, Info, Zap, History, UserCheck, Activity
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { WealthChart } from '@/components/economy/wealth-chart';
import { InflationChart } from '@/components/economy/inflation-chart';
import { fmt, fmtDecimal, pct, typeColor, typeLabel, fmtDate } from '@/lib/format';

/* ---------- Types ---------- */
interface Agent {
  id: string;
  prenom: string;
  balance: number;
  dette: number;
  investissementTotal: number;
  createdAt: string;
  transactions: Transaction[];
  loans: Loan[];
}

interface Transaction {
  id: string;
  agentId: string;
  type: string;
  montant: number;
  description: string;
  createdAt: string;
}

interface Loan {
  id: string;
  agentId: string;
  montant: number;
  taux: number;
}

interface MarketProduct {
  id: string;
  produit: string;
  prix: number;
  prixBase: number;
  updatedAt: string;
}

interface Economy {
  id: string;
  periode: number;
  inflationCumul: number;
  inflationRate: number;
  updatedAt: string;
}

interface EventLogEntry {
  id: string;
  message: string;
  type: string;
  periode: number;
  createdAt: string;
}

interface DashboardData {
  agents: Agent[];
  market: MarketProduct[];
  economy: Economy;
  logs: EventLogEntry[];
  totalRichesse: number;
  totalDette: number;
}

/* ---------- Helpers ---------- */
const emptyDashboard: DashboardData = {
  agents: [],
  market: [],
  economy: { id: '', periode: 0, inflationCumul: 0, inflationRate: 0.02, updatedAt: '' },
  logs: [],
  totalRichesse: 0,
  totalDette: 0,
};

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Erreur réseau');
    throw new Error(text);
  }
  return res.json();
}

/* ---------- Main Component ---------- */
export function DashboardClient() {
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentFormOpen, setAgentFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [crashDialogOpen, setCrashDialogOpen] = useState(false);
  const [agentFormName, setAgentFormName] = useState('');

  // Action form state
  const [actionMontant, setActionMontant] = useState('');
  const [actionProduit, setActionProduit] = useState('');

  const autoInflationRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  /* --- Data fetching --- */
  const { data: dashboard = emptyDashboard, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => fetchJSON<DashboardData>('/api/dashboard'),
    refetchInterval: 10_000,
  });

  /* --- Auto-seed on first load if empty --- */
  useEffect(() => {
    if (!isLoading && dashboard && dashboard.agents.length === 0) {
      fetchJSON('/api/seed', { method: 'POST' })
        .then(() => {
          toast.success('Données initiales générées');
          refetch();
        })
        .catch(() => {});
    }
  }, [isLoading, dashboard, refetch]);

  /* --- Auto-inflation every 30s --- */
  useEffect(() => {
    autoInflationRef.current = setInterval(() => {
      fetchJSON('/api/economy', { method: 'POST' })
        .then(() => refetch())
        .catch(() => {});
    }, 30_000);
    return () => {
      if (autoInflationRef.current) clearInterval(autoInflationRef.current);
    };
  }, [refetch]);

  /* --- Selected agent derived --- */
  const selectedAgent = dashboard.agents.find((a) => a.id === selectedAgentId) || null;

  /* --- Handlers --- */
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const openCreateAgent = () => {
    setEditingAgent(null);
    setAgentFormName('');
    setAgentFormOpen(true);
  };

  const openEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentFormName(agent.prenom);
    setAgentFormOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!agentFormName.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    try {
      if (editingAgent) {
        await fetchJSON(`/api/agents/${editingAgent.id}`, {
          method: 'PUT',
          body: JSON.stringify({ prenom: agentFormName.trim() }),
        });
        toast.success(`Agent "${agentFormName.trim()}" modifié`);
      } else {
        await fetchJSON('/api/agents', {
          method: 'POST',
          body: JSON.stringify({ prenom: agentFormName.trim() }),
        });
        toast.success(`Agent "${agentFormName.trim()}" créé`);
      }
      setAgentFormOpen(false);
      setAgentFormName('');
      setEditingAgent(null);
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;
    try {
      await fetchJSON(`/api/agents/${selectedAgent.id}`, { method: 'DELETE' });
      toast.success(`Agent "${selectedAgent.prenom}" supprimé`);
      setSelectedAgentId(null);
      setDeleteDialogOpen(false);
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    }
  };

  const handleCrash = async () => {
    try {
      await fetchJSON('/api/economy/crash', { method: 'POST' });
      toast.warning('💥 Crash économique déclenché !');
      setCrashDialogOpen(false);
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors du crash');
    }
  };

  const handleInflationTick = async () => {
    try {
      await fetchJSON('/api/economy', { method: 'POST' });
      toast.info('Tick d\'inflation appliqué');
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur inflation');
    }
  };

  const handleAction = async (endpoint: string, body: Record<string, unknown>) => {
    try {
      await fetchJSON(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.success('Action effectuée');
      setActionMontant('');
      setActionProduit('');
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'action');
    }
  };

  const handleReceive = () => {
    if (!selectedAgent || !actionMontant) return;
    handleAction('/api/actions/receive', {
      agentId: selectedAgent.id,
      montant: Number(actionMontant),
    });
  };

  const handleBuy = () => {
    if (!selectedAgent || !actionProduit) return;
    handleAction('/api/actions/buy', {
      agentId: selectedAgent.id,
      produit: actionProduit,
    });
  };

  const handleSell = () => {
    if (!selectedAgent || !actionProduit) return;
    handleAction('/api/actions/sell', {
      agentId: selectedAgent.id,
      produit: actionProduit,
    });
  };

  const handleLoan = () => {
    if (!selectedAgent || !actionMontant) return;
    handleAction('/api/actions/loan', {
      agentId: selectedAgent.id,
      montant: Number(actionMontant),
    });
  };

  const handleRepay = () => {
    if (!selectedAgent || !actionMontant) return;
    handleAction('/api/actions/repay', {
      agentId: selectedAgent.id,
      montant: Number(actionMontant),
    });
  };

  /* ---------- RENDER ---------- */
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const { agents, market, economy, logs, totalRichesse, totalDette } = dashboard;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* ===== TOP BAR ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="size-7 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Économie GLM5</h1>
            <p className="text-sm text-muted-foreground">Simulation économique en temps réel</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            Période {economy.periode}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="size-3 text-amber-500" />
            {pct(economy.inflationCumul)}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleInflationTick}>
            <Zap className="size-4" />
            Tick Inflation
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setCrashDialogOpen(true)}>
            <AlertTriangle className="size-4" />
            Crash
          </Button>
          <Button size="sm" onClick={openCreateAgent}>
            <Plus className="size-4" />
            Nouvel agent
          </Button>
        </div>
      </div>

      {/* ===== METRIC CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="econ-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Users className="size-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Agents actifs</p>
                <p className="text-xl font-bold tabular-nums">{agents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="econ-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Wallet className="size-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Richesse totale</p>
                <p className="text-xl font-bold tabular-nums text-green-700">{fmt(totalRichesse)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="econ-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <TrendingDown className="size-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Dette totale</p>
                <p className="text-xl font-bold tabular-nums text-red-600">{fmt(totalDette)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="econ-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <TrendingUp className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Inflation cumulée</p>
                <p className="text-xl font-bold tabular-nums text-amber-700">{pct(economy.inflationCumul)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== MAIN GRID: Agent List + Detail ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agent Cards Grid */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Agents</h2>
            <Button size="sm" variant="ghost" onClick={refresh}>
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
          <ScrollArea className="max-h-[500px] econ-scrollbar">
            <div className="space-y-2 pr-2">
              {agents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun agent. Cliquez sur &quot;Nouvel agent&quot;.
                </p>
              )}
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className={`econ-card cursor-pointer transition-all ${
                    selectedAgentId === agent.id
                      ? 'ring-2 ring-amber-500 border-amber-300'
                      : 'hover:border-amber-200'
                  }`}
                  onClick={() => setSelectedAgentId(agent.id === selectedAgentId ? null : agent.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-amber-100 p-1.5">
                          <UserCheck className="size-3.5 text-amber-700" />
                        </div>
                        <span className="font-semibold text-sm">{agent.prenom}</span>
                      </div>
                      <Badge variant={agent.balance >= 0 ? 'secondary' : 'destructive'} className="text-xs">
                        {fmt(agent.balance)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>Dette: <span className="text-red-500 font-medium">{fmt(agent.dette)}</span></span>
                      <span>Invest: <span className="text-amber-600 font-medium">{fmt(agent.investissementTotal)}</span></span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Agent Detail Panel */}
        <div className="lg:col-span-2">
          {selectedAgent ? (
            <Card className="econ-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedAgent.prenom}</CardTitle>
                    <CardDescription>Créé le {fmtDate(selectedAgent.createdAt)}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditAgent(selectedAgent)}>
                      <Edit3 className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setSelectedAgentId(null)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="stats">
                  <TabsList className="mb-4">
                    <TabsTrigger value="stats">
                      <BarChart3 className="size-3.5 mr-1" />
                      Statistiques
                    </TabsTrigger>
                    <TabsTrigger value="actions">
                      <Play className="size-3.5 mr-1" />
                      Actions
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="size-3.5 mr-1" />
                      Historique
                    </TabsTrigger>
                  </TabsList>

                  {/* --- Stats Tab --- */}
                  <TabsContent value="stats">
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="econ-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground font-medium">Solde</p>
                          <p className={`text-lg font-bold tabular-nums ${selectedAgent.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {fmt(selectedAgent.balance)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="econ-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground font-medium">Dette</p>
                          <p className="text-lg font-bold tabular-nums text-red-600">
                            {fmt(selectedAgent.dette)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="econ-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground font-medium">Investissements</p>
                          <p className="text-lg font-bold tabular-nums text-amber-700">
                            {fmt(selectedAgent.investissementTotal)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="econ-card">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground font-medium">Patrimoine net</p>
                          <p className={`text-lg font-bold tabular-nums ${selectedAgent.balance - selectedAgent.dette >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {fmt(selectedAgent.balance - selectedAgent.dette)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* --- Actions Tab --- */}
                  <TabsContent value="actions">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Recevoir */}
                      <Card className="econ-card">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <ArrowDownCircle className="size-4" />
                            Recevoir des fonds
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Montant"
                              value={actionMontant}
                              onChange={(e) => setActionMontant(e.target.value)}
                              className="text-sm"
                            />
                            <Button size="sm" variant="outline" onClick={handleReceive} disabled={!actionMontant}>
                              <Banknote className="size-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Acheter */}
                      <Card className="econ-card">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                            <ShoppingBag className="size-4" />
                            Acheter un produit
                          </div>
                          <div className="flex gap-2">
                            <Select value={actionProduit} onValueChange={setActionProduit}>
                              <SelectTrigger className="flex-1 text-sm">
                                <SelectValue placeholder="Produit" />
                              </SelectTrigger>
                              <SelectContent>
                                {market.map((item) => (
                                  <SelectItem key={item.id} value={item.produit}>
                                    {item.produit} ({fmt(item.prix)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" onClick={handleBuy} disabled={!actionProduit}>
                              <ArrowUpCircle className="size-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Vendre */}
                      <Card className="econ-card">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                            <ShoppingBag className="size-4" />
                            Vendre un produit
                          </div>
                          <div className="flex gap-2">
                            <Select value={actionProduit} onValueChange={setActionProduit}>
                              <SelectTrigger className="flex-1 text-sm">
                                <SelectValue placeholder="Produit" />
                              </SelectTrigger>
                              <SelectContent>
                                {market.map((item) => (
                                  <SelectItem key={item.id} value={item.produit}>
                                    {item.produit} ({fmt(item.prix)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" onClick={handleSell} disabled={!actionProduit}>
                              <ArrowDownCircle className="size-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Emprunter */}
                      <Card className="econ-card">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                            <CreditCard className="size-4" />
                            Demander un prêt
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Montant"
                              value={actionMontant}
                              onChange={(e) => setActionMontant(e.target.value)}
                              className="text-sm"
                            />
                            <Button size="sm" variant="outline" onClick={handleLoan} disabled={!actionMontant}>
                              <CreditCard className="size-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Rembourser */}
                      <Card className="econ-card sm:col-span-2">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                            <Banknote className="size-4" />
                            Rembourser une dette
                          </div>
                          <div className="flex gap-2 max-w-sm">
                            <Input
                              type="number"
                              placeholder="Montant à rembourser"
                              value={actionMontant}
                              onChange={(e) => setActionMontant(e.target.value)}
                              className="text-sm"
                            />
                            <Button size="sm" variant="outline" onClick={handleRepay} disabled={!actionMontant || selectedAgent.dette <= 0}>
                              <ArrowDownCircle className="size-3.5" />
                            </Button>
                          </div>
                          {selectedAgent.dette > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Dette actuelle : <span className="font-medium text-red-600">{fmt(selectedAgent.dette)}</span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* --- History Tab --- */}
                  <TabsContent value="history">
                    <ScrollArea className="max-h-96 econ-scrollbar">
                      <div className="space-y-1 pr-2">
                        {selectedAgent.transactions.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Aucune transaction
                          </p>
                        )}
                        {selectedAgent.transactions
                          .slice()
                          .reverse()
                          .map((tx) => {
                            const colors = typeColor(tx.type);
                            const [dotClass] = colors.split(' ');
                            const [, textColor] = colors.split(' ').slice(1);
                            return (
                              <div key={tx.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className={`econ-dot ${dotClass}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${textColor}`}>
                                      {typeLabel(tx.type)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{fmtDate(tx.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                                </div>
                                <span className={`text-sm font-semibold tabular-nums ${tx.montant >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                  {tx.montant >= 0 ? '+' : ''}{fmt(tx.montant)}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="econ-card flex items-center justify-center min-h-[300px]">
              <CardContent className="p-8 text-center">
                <Users className="size-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Sélectionnez un agent</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Cliquez sur un agent pour voir ses détails et effectuer des actions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WealthChart agents={agents} />
        <InflationChart market={market} />
      </div>

      {/* ===== MARKET + BANK CENTRAL ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Market */}
        <Card className="econ-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Marché
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {market.map((item) => {
                const diff = item.prix - item.prixBase;
                const diffPct = item.prixBase > 0 ? (diff / item.prixBase) * 100 : 0;
                return (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">{item.produit}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">{fmt(item.prix)}</span>
                      <Badge variant={diff >= 0 ? 'destructive' : 'secondary'} className="text-[10px] tabular-nums">
                        {diff >= 0 ? '+' : ''}{pct(diffPct / 100)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {market.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun produit sur le marché</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bank Central */}
        <Card className="econ-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Banknote className="size-4" />
              Banque Centrale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Période actuelle</span>
                <Badge variant="outline" className="tabular-nums font-semibold">#{economy.periode}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Taux d&apos;inflation</span>
                <span className="text-sm font-semibold tabular-nums text-amber-700">{pct(economy.inflationRate)}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Inflation cumulée</span>
                <span className="text-sm font-semibold tabular-nums text-amber-700">{pct(economy.inflationCumul)}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Niveau d&apos;inflation</span>
                  <span>{Math.min(Math.abs(economy.inflationCumul) * 100, 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(Math.abs(economy.inflationCumul) * 100, 100)} className="h-2" />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Richesse totale</span>
                <span className="text-sm font-semibold tabular-nums text-green-700">{fmt(totalRichesse)}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Dette totale</span>
                <span className="text-sm font-semibold tabular-nums text-red-600">{fmt(totalDette)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== JOURNAL ÉCONOMIQUE ===== */}
      <Card className="econ-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Info className="size-4" />
            Journal Économique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72 econ-scrollbar">
            <div className="space-y-1 pr-2">
              {logs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun événement enregistré</p>
              )}
              {logs.slice().reverse().map((log) => {
                const colors = typeColor(log.type);
                const [dotClass] = colors.split(' ');
                return (
                  <div key={log.id} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`econ-dot ${dotClass} mt-1.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {log.periode > 0 && (
                        <Badge variant="outline" className="text-[10px]">P{log.periode}</Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtDate(log.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ===== DIALOGS ===== */}

      {/* Agent Create/Edit Dialog */}
      <Dialog open={agentFormOpen} onOpenChange={setAgentFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAgent ? 'Modifier l\'agent' : 'Nouvel agent'}
            </DialogTitle>
            <DialogDescription>
              {editingAgent
                ? `Modifier les informations de ${editingAgent.prenom}.`
                : 'Entrez le nom du nouvel agent économique.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Nom de l&apos;agent</Label>
              <Input
                id="agent-name"
                placeholder="Ex: Alice Dupont"
                value={agentFormName}
                onChange={(e) => setAgentFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAgent();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSaveAgent}>
              {editingAgent ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crash Confirmation Dialog */}
      <AlertDialog open={crashDialogOpen} onOpenChange={setCrashDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Déclencher un crash ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va déclencher un crash économique. Tous les agents
              subiront des pertes significatives. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCrash}
              className="bg-red-600 hover:bg-red-700"
            >
              Déclencher le crash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;agent ?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAgent
                ? `Voulez-vous vraiment supprimer "${selectedAgent.prenom}" ? Toutes ses transactions et dettes seront définitivement supprimées.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
