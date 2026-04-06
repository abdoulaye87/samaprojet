'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  CreditCard, ChevronRight, TrendingUp, AlertTriangle,
  Store, Bird, Car, Leaf, Laptop, HardHat, CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { fmt, fmtDecimal } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ProjectTemplate {
  name: string;
  emoji: string;
  category: string;
  recommendedBudget: number;
  description: string;
  monthlyRevenue: number;
  monthlyExpense: number;
  icon: React.ElementType;
  color: string;
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    name: 'Boutique à Sandaga',
    emoji: '🏪',
    category: 'commerce',
    recommendedBudget: 500000,
    description: 'Tenu de vêtements et accessoires au cœur du marché de Sandaga. Forte affluence garantit des revenus stables.',
    monthlyRevenue: 120000,
    monthlyExpense: 75000,
    icon: Store,
    color: 'from-amber-400 to-orange-500',
  },
  {
    name: 'Élevage de poulets à Thiès',
    emoji: '🐔',
    category: 'elevage',
    recommendedBudget: 1000000,
    description: 'Ferme avicole moderne avec 500 poules pondeuses. Demande croissante en protéines au Sénégal.',
    monthlyRevenue: 250000,
    monthlyExpense: 150000,
    icon: Bird,
    color: 'from-yellow-400 to-amber-500',
  },
  {
    name: 'Transport inter-villes',
    emoji: '🚗',
    category: 'transport',
    recommendedBudget: 2000000,
    description: 'Service de minibus entre Dakar, Thiès et Saint-Louis. Routes principales à fort trafic.',
    monthlyRevenue: 500000,
    monthlyExpense: 320000,
    icon: Car,
    color: 'from-blue-400 to-cyan-500',
  },
  {
    name: 'Agriculture dans la Vallée du Fleuve',
    emoji: '🌾',
    category: 'agriculture',
    recommendedBudget: 3000000,
    description: 'Riziculture irriguée dans la vallée du fleuve Sénégal. Saisonnalité forte mais rendements élevés.',
    monthlyRevenue: 700000,
    monthlyExpense: 400000,
    icon: Leaf,
    color: 'from-green-400 to-emerald-500',
  },
  {
    name: 'Cyber café à Pikine',
    emoji: '💻',
    category: 'technologie',
    recommendedBudget: 500000,
    description: 'Cyber café avec 20 postes, impression et services administratifs. Zone densément peuplée.',
    monthlyRevenue: 130000,
    monthlyExpense: 65000,
    icon: Laptop,
    color: 'from-violet-400 to-purple-500',
  },
  {
    name: 'BTP à Diamniadio',
    emoji: '🏗️',
    category: 'immobilier',
    recommendedBudget: 5000000,
    description: 'Entreprise de construction dans la nouvelle ville de Diamniadio. Marché en pleine expansion.',
    monthlyRevenue: 1200000,
    monthlyExpense: 800000,
    icon: HardHat,
    color: 'from-stone-400 to-zinc-600',
  },
];

const HIDDEN_EXPENSES = [
  'Taxe municipale imprévue',
  'Réparation équipement',
  'Panne de courant (générateur)',
  'Amende contrôle fiscal',
  'Voleur / perte de marchandise',
  'Augmentation loyer',
  'Maladie employé clé',
  'Inondation / dégât des eaux',
  'Licenciement + indemnités',
  'Contrôle qualité raté',
];

interface LoanProjectPageProps {
  accessToken: string;
  userId: string;
}

export function LoanProjectPage({ accessToken, userId }: LoanProjectPageProps) {
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(2.5);
  const [loanMonths, setLoanMonths] = useState(12);
  const [step, setStep] = useState<'loan' | 'project'>('loan');
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectTemplate | null>(null);
  const [approvedLoan, setApprovedLoan] = useState<{ id: string; amount: number; remaining: number } | null>(null);

  const totalDue = loanAmount * (1 + interestRate / 100);
  const monthlyPayment = totalDue / loanMonths;

  // Fetch current interest rate
  useEffect(() => {
    fetch('/api/settings?key=default_interest_rate')
      .then(r => r.json())
      .then(data => {
        if (data.settings?.[0]?.value) {
          const rate = parseFloat(data.settings[0].value);
          if (!isNaN(rate)) setInterestRate(rate);
        }
      })
      .catch(() => {});
  }, []);

  const handleRequestLoan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amount: loanAmount, months: loanMonths }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      if (data.loan?.status === 'active') {
        setApprovedLoan({ id: data.loan.id, amount: data.loan.amount, remaining: data.loan.remaining });
        setStep('project');
        toast.success('Prêt approuvé ! Choisissez votre projet.');
      } else {
        toast.success('Demande de prêt envoyée ! En attente de validation.');
        // Wait for admin approval, poll
        const pollInterval = setInterval(async () => {
          try {
            const r = await fetch('/api/loans', { headers: { Authorization: `Bearer ${accessToken}` } });
            const d = await r.json();
            const active = d.loans?.find((l: { status: string; id: string; amount: number; remaining: number }) => l.status === 'active');
            if (active) {
              clearInterval(pollInterval);
              setApprovedLoan({ id: active.id, amount: active.amount, remaining: active.remaining });
              setStep('project');
              toast.success('Votre prêt a été approuvé !');
            }
          } catch {}
        }, 5000);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseProject = async () => {
    if (!selectedProject || !approvedLoan) return;
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          loanId: approvedLoan.id,
          name: selectedProject.name,
          category: selectedProject.category,
          budget: selectedProject.recommendedBudget,
          monthlyRevenue: selectedProject.monthlyRevenue,
          monthlyExpense: selectedProject.monthlyExpense,
          description: selectedProject.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success(`Projet "${selectedProject.name}" lancé avec succès !`);
      // Refresh page by navigating to home
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // Project step
  if (step === 'project') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="size-6 text-green-600" />
            <h2 className="text-2xl font-bold">Prêt approuvé !</h2>
          </div>
          <p className="text-muted-foreground">
            Vous avez reçu <span className="font-bold text-green-700">{fmt(approvedLoan?.amount || 0)}</span> — Choisissez maintenant votre projet.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROJECT_TEMPLATES.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 h-full',
                  selectedProject?.name === p.name
                    ? 'border-2 border-amber-400 shadow-lg shadow-amber-100 bg-amber-50/50'
                    : 'border border-amber-100 hover:border-amber-200'
                )}
                onClick={() => setSelectedProject(p)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('rounded-xl bg-gradient-to-br p-3 text-white', p.color)}>
                        <p className="text-2xl">{p.emoji}</p>
                      </div>
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-[10px]">{p.category}</Badge>
                      </div>
                    </div>
                    {selectedProject?.name === p.name && (
                      <CheckCircle2 className="size-5 text-amber-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                  <Separator />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Budget</p>
                      <p className="text-sm font-bold text-amber-700">{fmt(p.recommendedBudget)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Revenu/mois</p>
                      <p className="text-sm font-bold text-green-700">+{fmt(p.monthlyRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Dépense/mois</p>
                      <p className="text-sm font-bold text-red-600">-{fmt(p.monthlyExpense)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="size-3" />
                    <span>Bénéfice net: <strong>{fmt(p.monthlyRevenue - p.monthlyExpense)}/mois</strong></span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {selectedProject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedProject.emoji}</span>
              <div>
                <p className="font-semibold">{selectedProject.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmt(selectedProject.recommendedBudget)} · Bénéfice {fmt(selectedProject.monthlyRevenue - selectedProject.monthlyExpense)}/mois
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleChooseProject}
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200"
            >
              {loading ? 'Lancement...' : 'Lancer ce projet'}
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // Loan step
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="size-6 text-amber-600" />
          <h2 className="text-2xl font-bold">Demandez votre prêt</h2>
        </div>
        <p className="text-muted-foreground">
          Choisissez le montant de votre prêt pour lancer votre activité au Sénégal.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-amber-200 shadow-lg shadow-amber-100/30">
          <CardHeader>
            <CardTitle className="text-lg">Montant du prêt</CardTitle>
            <CardDescription>
              Taux d&apos;intérêt actuel : <span className="font-bold text-amber-700">{interestRate}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Big amount display */}
            <div className="text-center py-6">
              <p className="text-4xl sm:text-5xl font-extrabold tabular-nums bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                {fmt(loanAmount)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">montant demandé</p>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50 000 FCFA</span>
                <span>5 000 000 FCFA</span>
              </div>
              <Slider
                value={[loanAmount]}
                onValueChange={([v]) => setLoanAmount(v)}
                min={50000}
                max={5000000}
                step={50000}
                className="py-2"
              />
            </div>

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {[500000, 1000000, 2000000, 3000000, 5000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setLoanAmount(amt)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    loanAmount === amt
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  )}
                >
                  {fmt(amt)}
                </button>
              ))}
            </div>

            <Separator />

            {/* Loan summary */}
            <div className="bg-muted/40 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant emprunté</span>
                <span className="font-semibold">{fmt(loanAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taux d&apos;intérêt</span>
                <span className="font-semibold text-amber-700">{interestRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intérêts totaux</span>
                <span className="font-semibold text-red-600">{fmt(totalDue - loanAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Montant total à rembourser</span>
                <span className="font-bold text-lg text-amber-700">{fmt(totalDue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mensualité ({loanMonths} mois)</span>
                <span className="font-semibold">{fmt(monthlyPayment)}/mois</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <Info className="size-4 shrink-0 mt-0.5" />
              <span>
                Le prêt est soumis à validation. Les mensualités seront prélevées automatiquement chaque mois
                sur votre trésorerie. Attention à la faillite si votre solde tombe en dessous de -100 000 FCFA !
              </span>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200"
              onClick={handleRequestLoan}
              disabled={loading}
            >
              {loading ? (
                <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Demande en cours...</>
              ) : (
                <>Demander le prêt <ChevronRight className="size-4 ml-1" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
