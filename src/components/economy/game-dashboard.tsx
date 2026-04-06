'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Calendar, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, Zap, Shield,
  SkipForward, Gift, AlertOctagon, PartyPopper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { fmt, fmtDate, statusLabel, statusColor } from '@/lib/format';
import { cn } from '@/lib/utils';

interface GameDashboardProps {
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

export function GameDashboard({ accessToken, userId }: GameDashboardProps) {
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState(false);

  // Fetch project
  const { data: projectData, isLoading: loadingProject } = useQuery({
    queryKey: ['my-project', userId],
    queryFn: () => fetchWithAuth<{
      project: {
        id: string; name: string; category: string; status: string;
        currentCash: number; monthlyRevenue: number; monthlyExpense: number;
        monthsElapsed: number; totalMonths: number; budget: number;
        loanId: string | null;
      };
      expenses: Array<{ id: string; name: string; amount: number; category: string; is_hidden: boolean; revealed_at: number | null; paid: boolean }>;
      events: Array<{ id: string; title: string; description: string; impact: number; category: string; month: number; createdAt: string }>;
      loan: { id: string; amount: number; remaining: number; monthly_payment: number; months_remaining: number; status: string } | null;
    }>(`/api/projects`, accessToken),
    refetchInterval: 15_000,
  });

  // Fetch assets
  const { data: assetsData } = useQuery({
    queryKey: ['my-assets', userId],
    queryFn: () => fetchWithAuth<{ assets: Array<{ id: string; name: string; category: string; current_value: number; status: string }> }>(`/api/assets`, accessToken),
    refetchInterval: 30_000,
  });

  const project = projectData?.project;
  const expenses = projectData?.expenses || [];
  const events = projectData?.events || [];
  const loan = projectData?.loan;
  const assets = assetsData?.assets || [];

  const totalAssetsValue = assets.reduce((s, a) => s + a.current_value, 0);
  const netWorth = (project?.currentCash || 0) + totalAssetsValue - (loan?.remaining || 0);
  const monthlyProfit = (project?.monthlyRevenue || 0) - (project?.monthlyExpense || 0);
  const progress = project ? ((project.monthsElapsed / project.totalMonths) * 100) : 0;

  // Financial health (0-100)
  const cashRatio = loan ? Math.max(0, Math.min(100, ((project?.currentCash || 0) / (loan.remaining + 1)) * 100)) : 100;
  const healthColor = cashRatio > 50 ? 'text-green-600' : cashRatio > 20 ? 'text-amber-600' : 'text-red-600';
  const healthBg = cashRatio > 50 ? 'bg-green-500' : cashRatio > 20 ? 'bg-amber-500' : 'bg-red-500';

  const isBankrupt = project?.status === 'failed';
  const isWinner = project?.status === 'succeeded';

  const handleNextMonth = async () => {
    if (!project || advancing) return;
    setAdvancing(true);
    try {
      const res = await fetchWithAuth<{
        project: { status: string; currentCash: number; monthsElapsed: number };
        event: { title: string; description: string; impact: number; category: string } | null;
        loanPayment: number | null;
        newExpense: { name: string; amount: number } | null;
      }>('/api/game/next-month', accessToken, { method: 'POST' });

      if (res.project.status === 'failed') {
        toast.error('💀 FAILLITE ! Votre entreprise a fait faillite...', { duration: 5000 });
      } else if (res.project.status === 'succeeded') {
        toast.success('🎉 FÉLICITATIONS ! Vous avez terminé la simulation avec succès !', { duration: 5000 });
      } else {
        toast.success(`Mois ${res.project.monthsElapsed} terminé !`, { duration: 2000 });
      }

      if (res.event) {
        if (res.event.impact > 0) {
          toast.success(`${res.event.title}: +${fmt(res.event.impact)}`, { duration: 3000 });
        } else if (res.event.impact < 0) {
          toast.error(`${res.event.title}: ${fmt(res.event.impact)}`, { duration: 3000 });
        }
      }

      if (res.newExpense) {
        toast.warning(`Nouvelle dépense: ${res.newExpense.name} (-${fmt(res.newExpense.amount)})`, { duration: 3000 });
      }

      queryClient.invalidateQueries({ queryKey: ['my-project'] });
      queryClient.invalidateQueries({ queryKey: ['my-assets'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la simulation');
    } finally {
      setAdvancing(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!project) return null;

  // Bankruptcy screen
  if (isBankrupt) {
    return (
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, -10, 10, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        >
          <AlertOctagon className="size-20 text-red-500 mx-auto" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-black text-red-600 mt-6"
        >
          FAILLITE
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground mt-2"
        >
          Votre entreprise n&apos;a pas survécu. Solde final : <strong>{fmt(project.currentCash)}</strong>
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-6">
            <Zap className="size-4 mr-2" />
            Recommencer
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Success screen
  if (isWinner) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <PartyPopper className="size-20 text-amber-500 mx-auto" />
        </motion.div>
        <h2 className="text-5xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mt-6">
          SUCCESS !
        </h2>
        <p className="text-muted-foreground mt-2">
          Vous avez complété la simulation ! Patrimoine final : <strong className="text-amber-700">{fmt(netWorth)}</strong>
        </p>
        <Button onClick={() => window.location.reload()} className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <Zap className="size-4 mr-2" />
          Nouvelle partie
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{project.name}</h2>
            <p className="text-sm text-muted-foreground">
              Mois {project.monthsElapsed} / {project.totalMonths}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleNextMonth}
            disabled={advancing}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200"
          >
            {advancing ? (
              <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Simulation...</>
            ) : (
              <><SkipForward className="size-4 mr-2" />Mois suivant</>
            )}
          </Button>
        </div>
        <Progress value={progress} className="mt-3 h-2" />
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Trésorerie', value: fmt(project.currentCash), icon: Wallet, color: project.currentCash >= 0 ? 'text-green-700' : 'text-red-600', bg: project.currentCash >= 0 ? 'bg-green-100' : 'bg-red-100' },
          { label: 'Revenu/mois', value: `+${fmt(project.monthlyRevenue)}`, icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-100' },
          { label: 'Dépenses/mois', value: `-${fmt(project.monthlyExpense)}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Patrimoine net', value: fmt(netWorth), icon: Shield, color: 'text-amber-700', bg: 'bg-amber-100' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-lg p-2.5', kpi.bg)}>
                    <kpi.icon className={cn('size-5', kpi.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className={cn('text-lg font-bold tabular-nums', kpi.color)}>{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Loan + Expenses */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Loan */}
          {loan && (
            <Card className="border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  💰 Prêt en cours
                  <Badge variant="secondary" className={statusColor(loan.status)}>{statusLabel(loan.status)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Restant à payer</span>
                  <span className="font-semibold text-red-600">{fmt(loan.remaining)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mensualité</span>
                  <span className="font-medium">{fmt(loan.monthly_payment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mois restants</span>
                  <span className="font-medium">{loan.months_remaining}</span>
                </div>
                <Progress value={((loan.amount - loan.remaining) / loan.amount) * 100} className="h-1.5 mt-1" />
              </CardContent>
            </Card>
          )}

          {/* Health Gauge */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Santé financière</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={cn('text-3xl font-black', healthColor)}>
                  {Math.round(cashRatio)}%
                </div>
                <div className="flex-1">
                  <div className={cn('h-3 rounded-full bg-muted overflow-hidden')}>
                    <motion.div
                      className={cn('h-full rounded-full', healthBg)}
                      initial={{ width: 0 }}
                      animate={{ width: `${cashRatio}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {cashRatio > 50 ? 'Situation saine 🟢' : cashRatio > 20 ? 'Attention requise 🟡' : 'Danger critique 🔴'}
              </p>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dépenses ({expenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-60">
                <div className="space-y-1.5">
                  {expenses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">Aucune dépense</p>
                  ) : (
                    expenses.map((e) => (
                      <div key={e.id} className={cn('flex items-center justify-between p-2 rounded-lg text-xs', e.paid ? 'bg-muted/30' : 'bg-red-50')}>
                        <div className="flex items-center gap-2">
                          {e.is_hidden && !e.paid && <AlertTriangle className="size-3 text-amber-500" />}
                          <span className={e.paid ? 'text-muted-foreground line-through' : 'font-medium'}>{e.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-semibold">{fmt(e.amount)}</span>
                          {e.paid && <CheckCircle2 className="size-3 text-green-500" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Events Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                📅 Journal des événements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Aucun événement. Cliquez sur &quot;Mois suivant&quot; pour commencer la simulation.
                    </p>
                  ) : (
                    [...events].reverse().map((ev, i) => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          'flex gap-3 p-3 rounded-lg border',
                          ev.category === 'positif' ? 'border-green-200 bg-green-50/50' :
                          ev.category === 'negatif' ? 'border-red-200 bg-red-50/50' :
                          'border-gray-200 bg-gray-50/50'
                        )}
                      >
                        <div className={cn(
                          'rounded-full p-1.5 shrink-0 mt-0.5',
                          ev.category === 'positif' ? 'bg-green-100' :
                          ev.category === 'negatif' ? 'bg-red-100' : 'bg-gray-100'
                        )}>
                          {ev.category === 'positif' ? <Gift className="size-3.5 text-green-600" /> :
                           ev.category === 'negatif' ? <AlertTriangle className="size-3.5 text-red-600" /> :
                           <Calendar className="size-3.5 text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{ev.title}</p>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', ev.impact >= 0 ? 'text-green-700 border-green-300' : 'text-red-700 border-red-300')}
                            >
                              {ev.impact >= 0 ? '+' : ''}{fmt(ev.impact)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">Mois {ev.month}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Assets */}
          {assets.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">💎 Mes actifs ({assets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assets.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
                      <span className="font-medium">{a.name}</span>
                      <span className="font-semibold text-amber-700">{fmt(a.current_value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
