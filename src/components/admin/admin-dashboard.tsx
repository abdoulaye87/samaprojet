'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Store, ClipboardList, CreditCard,
  Settings, RefreshCw, Check, X, TrendingUp, AlertTriangle,
  Skull, DollarSign, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { fmt, fmtDate, statusLabel, statusColor } from '@/lib/format';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  currentUser: { id: string; name: string; type: string };
  accessToken: string;
}

async function fetchWithAuth<T>(url: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...opts,
  });
  if (!res.ok) throw new Error('Erreur');
  return res.json();
}

export function AdminDashboard({ currentUser, accessToken }: AdminDashboardProps) {
  const queryClient = useQueryClient();

  // Overview stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchWithAuth<{
      totalUsers: number; totalAgents: number; totalLoans: number;
      totalBankruptcies: number; totalInCirculation: number;
    }>('/api/users', accessToken),
    refetchInterval: 15_000,
  });

  // Loans (pending + all)
  const { data: loansData } = useQuery({
    queryKey: ['admin-loans'],
    queryFn: () => fetchWithAuth<{
      loans: Array<{
        id: string; amount: number; remaining: number; status: string;
        monthly_payment: number; userName: string; createdAt: string;
      }>;
    }>('/api/loans', accessToken),
    refetchInterval: 15_000,
  });

  // Settings
  const { data: settingsData } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => fetchWithAuth<{
      settings: Array<{ key: string; value: string }>;
    }>('/api/settings', accessToken),
    refetchInterval: 30_000,
  });

  // Editable settings
  const [interestRate, setInterestRate] = useState('');
  const [maxLoan, setMaxLoan] = useState('');
  const [saving, setSaving] = useState(false);

  const loans = loansData?.loans || [];
  const settings = settingsData?.settings || [];
  const pendingLoans = loans.filter(l => l.status === 'pending_approval');

  // Initialize settings values
  useState(() => {
    const rate = settings.find(s => s.key === 'default_interest_rate');
    if (rate && !interestRate) setInterestRate(rate.value);
    const max = settings.find(s => s.key === 'max_loan_amount');
    if (max && !maxLoan) setMaxLoan(max.value);
  });

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || '0';

  const handleApproveLoan = async (loanId: string, approved: boolean) => {
    try {
      await fetchWithAuth('/api/loans/approve', accessToken, {
        method: 'POST',
        body: JSON.stringify({ loanId, approved }),
      });
      toast.success(approved ? 'Prêt approuvé' : 'Prêt rejeté');
      queryClient.invalidateQueries({ queryKey: ['admin-loans'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await fetchWithAuth('/api/settings', accessToken, {
        method: 'PUT',
        body: JSON.stringify({ settings: [
          { key: 'default_interest_rate', value: interestRate },
          { key: 'max_loan_amount', value: maxLoan },
        ] }),
      });
      toast.success('Paramètres sauvegardés');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally { setSaving(false); }
  };

  if (loadingStats) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="size-6 text-amber-600" />
            Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Panneau de contrôle Sama Économie</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => {
          queryClient.invalidateQueries();
          toast.info('Données actualisées');
        }}>
          <RefreshCw className="size-3.5 mr-1" />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
            { id: 'loans', label: 'Prêts', icon: CreditCard },
            { id: 'settings', label: 'Paramètres', icon: Settings },
          ].map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-xs">
              <t.icon className="size-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Joueurs', value: String(Number(getSetting('agent_count_active')) + Number(getSetting('agent_count_dormant'))), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
              { label: 'Agents', value: getSetting('agent_count_active'), icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
              { label: 'Prêts actifs', value: String(loans.filter(l => l.status === 'active').length), icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'En attente', value: String(pendingLoans.length), icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
              { label: 'FCFA en circulation', value: fmt(Number(getSetting('agent_count_active')) * 50000), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('rounded-lg p-2', s.bg)}>
                        <s.icon className={cn('size-4', s.color)} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        <p className={cn('text-lg font-bold tabular-nums', s.color)}>{s.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pending Loans Quick View */}
          {pendingLoans.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="size-4 text-orange-600" />
                  Prêts en attente ({pendingLoans.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingLoans.map(loan => (
                    <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg bg-white border">
                      <div>
                        <p className="text-sm font-medium">{loan.userName}</p>
                        <p className="text-xs text-muted-foreground">{fmt(loan.amount)} · Mensualité {fmt(loan.monthly_payment)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleApproveLoan(loan.id, true)}>
                          <Check className="size-3.5 mr-1" /> Approuver
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50" onClick={() => handleApproveLoan(loan.id, false)}>
                          <X className="size-3.5 mr-1" /> Rejeter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Loans */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tous les prêts ({loans.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                {loans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun prêt</p>
                ) : (
                  <div className="space-y-2">
                    {loans.map(loan => (
                      <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{loan.userName}</span>
                            <Badge variant="secondary" className={cn('text-[10px]', statusColor(loan.status))}>{statusLabel(loan.status)}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Montant: {fmt(loan.amount)} · Restant: {fmt(loan.remaining)} · {fmtDate(loan.createdAt)}
                          </p>
                        </div>
                        {loan.status === 'pending_approval' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleApproveLoan(loan.id, true)}>
                              <Check className="size-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleApproveLoan(loan.id, false)}>
                              <X className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOANS */}
        <TabsContent value="loans" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Gestion des prêts</CardTitle>
              <CardDescription>Approuvez ou rejetez les demandes de prêt</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                {loans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Aucun prêt</p>
                ) : (
                  <div className="space-y-3">
                    {loans.map(loan => (
                      <div key={loan.id} className={cn(
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border',
                        loan.status === 'pending_approval' ? 'border-orange-200 bg-orange-50/30' : 'hover:bg-muted/30'
                      )}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{loan.userName}</span>
                            <Badge variant="secondary" className={cn('text-[10px]', statusColor(loan.status))}>{statusLabel(loan.status)}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <span>Montant: <strong>{fmt(loan.amount)}</strong></span>
                            <span>Restant: <strong>{fmt(loan.remaining)}</strong></span>
                            <span>Mensualité: <strong>{fmt(loan.monthly_payment)}</strong></span>
                          </div>
                        </div>
                        {loan.status === 'pending_approval' && (
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" onClick={() => handleApproveLoan(loan.id, true)} className="bg-green-600 hover:bg-green-700 text-white">
                              <Check className="size-3.5 mr-1" /> Approuver
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleApproveLoan(loan.id, false)}>
                              <X className="size-3.5 mr-1" /> Rejeter
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paramètres du jeu</CardTitle>
              <p className="text-sm text-muted-foreground">Modifiez les paramètres économiques de la simulation</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Taux d&apos;intérêt par défaut (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Actuel: {getSetting('default_interest_rate')}%</p>
                </div>
                <div className="space-y-2">
                  <Label>Montant maximum de prêt (FCFA)</Label>
                  <Input
                    type="number"
                    value={maxLoan}
                    onChange={(e) => setMaxLoan(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Actuel: {fmt(Number(getSetting('max_loan_amount')))}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { key: 'game_duration_months', label: 'Durée du jeu (mois)' },
                  { key: 'bankruptcy_threshold', label: 'Seuil faillite (FCFA)' },
                  { key: 'market_tax_rate', label: 'Taxe marché (%)' },
                  { key: 'agent_count_active', label: 'Agents actifs' },
                  { key: 'agent_count_dormant', label: 'Agents dormants' },
                  { key: 'auto_approve_loan', label: 'Auto-validation prêts' },
                ].map(s => (
                  <div key={s.key} className="p-3 rounded-lg bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold">{getSetting(s.key)}</p>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveSettings} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
                {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
