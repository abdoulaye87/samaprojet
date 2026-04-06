'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  User, MapPin, Trophy, Wallet, Eye, Star, Award,
  TrendingUp, Building2, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { fmt, statusLabel, statusColor, categoryEmoji } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ProfilePageProps {
  accessToken: string;
  userId: string;
}

async function fetchWithAuth<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur');
  return res.json();
}

export function ProfilePage({ accessToken, userId }: ProfilePageProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['profile-full', userId],
    queryFn: () => fetchWithAuth<{
      user: {
        id: string; name: string; email: string | null; avatar: string;
        location: string; bio: string | null; cash: number; type: string;
        credit_score: number; total_profit: number; total_spent: number;
        total_debt: number; games_played: number; games_won: number;
        games_lost: number; is_bankrupt: boolean; profile_views: number;
      };
      assets: Array<{ id: string; name: string; category: string; current_value: number; status: string }>;
      projects: Array<{ id: string; name: string; category: string; status: string; budget: number }>;
      loans: Array<{ id: string; remaining: number; status: string }>;
      reviews: Array<{ rating: number; comment: string | null; fromUserName: string }>;
    }>(`/api/users/${userId}`, accessToken),
  });

  const user = data?.user;
  const assets = data?.assets || [];
  const projects = data?.projects || [];
  const loans = data?.loans || [];
  const reviews = data?.reviews || [];

  const totalAssets = assets.reduce((s, a) => s + a.current_value, 0);
  const totalDebt = loans.reduce((s, l) => s + l.remaining, 0);
  const netWorth = (user?.cash || 0) + totalAssets - totalDebt;
  const creditPercent = (user?.credit_score || 0) / 1000 * 100;
  const creditColor = (user?.credit_score || 0) > 700 ? 'text-green-600' : (user?.credit_score || 0) > 400 ? 'text-amber-600' : 'text-red-600';

  const handleViewProfile = async () => {
    try {
      await fetch(`/api/users/${userId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success('Profil visité !');
    } catch {}
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-amber-400 to-orange-500" />
          <CardContent className="p-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <Avatar className="size-20 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-amber-100 text-amber-800 text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3" /> {user.location}
                  </span>
                  <Badge variant="secondary" className={cn('text-xs', user.type === 'admin' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')}>
                    {user.type === 'admin' ? '👑 Admin' : '🎮 Joueur'}
                  </Badge>
                  {user.is_bankrupt && <Badge variant="destructive">Faillite</Badge>}
                </div>
                {user.bio && <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleViewProfile}>
                  <Eye className="size-3.5 mr-1" />
                  {user.profile_views} visites
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Patrimoine net', value: fmt(netWorth), icon: Wallet, color: 'text-amber-700', bg: 'bg-amber-100' },
          { label: 'Cash', value: fmt(user.cash), icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-100' },
          { label: 'Parties jouées', value: `${user.games_won}V / ${user.games_lost}D`, icon: Trophy, color: 'text-purple-700', bg: 'bg-purple-100' },
          { label: 'Déttes', value: fmt(totalDebt), icon: Shield, color: 'text-red-600', bg: 'bg-red-100' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full">
              <CardContent className="p-4 text-center">
                <div className={cn('rounded-lg p-2 w-fit mx-auto mb-2', s.bg)}>
                  <s.icon className={cn('size-4', s.color)} />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn('text-lg font-bold tabular-nums', s.color)}>{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Credit Score + Assets + Projects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Credit Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              Score de crédit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className={cn('text-4xl font-black', creditColor)}>{user.credit_score}</p>
              <p className="text-xs text-muted-foreground mt-1">sur 1000</p>
              <Progress value={creditPercent} className="mt-3 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {user.credit_score >= 750 ? 'Excellent 🟢' : user.credit_score >= 500 ? 'Moyen 🟡' : 'Faible 🔴'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="size-4 text-amber-500" />
              Patrimoine ({assets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-48">
              {assets.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun actif</p>
              ) : (
                <div className="space-y-1.5">
                  {assets.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                      <span>{categoryEmoji(a.category.toLowerCase())} {a.name}</span>
                      <span className="font-semibold text-amber-700">{fmt(a.current_value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="size-4 text-amber-500" />
              Projets ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-48">
              {projects.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun projet</p>
              ) : (
                <div className="space-y-1.5">
                  {projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                      <div>
                        <span className="font-medium">{categoryEmoji(p.category)} {p.name}</span>
                        <p className="text-muted-foreground text-[10px]">{fmt(p.budget)}</p>
                      </div>
                      <Badge variant="secondary" className={cn('text-[10px]', statusColor(p.status))}>{statusLabel(p.status)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avis reçus ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviews.map((r, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{r.fromUserName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }, (_, j) => (
                        <Star key={j} className="size-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
