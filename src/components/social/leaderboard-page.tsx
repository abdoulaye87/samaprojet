'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy, TrendingUp, TrendingDown, Award, Eye, Medal, Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fmt } from '@/lib/format';
import { cn } from '@/lib/utils';

interface LeaderboardPageProps {
  accessToken: string;
}

async function fetchWithAuth<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur');
  return res.json();
}

const TABS = [
  { id: 'richest', label: 'Plus riche', icon: TrendingUp },
  { id: 'most_debt', label: 'Plus endetté', icon: TrendingDown },
  { id: 'entrepreneur', label: 'Meilleur entrepreneur', icon: Award },
  { id: 'investor', label: 'Meilleur investisseur', icon: Trophy },
  { id: 'visited', label: 'Plus visité', icon: Eye },
];

export function LeaderboardPage({ accessToken }: LeaderboardPageProps) {
  const [tab, setTab] = useState('richest');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', tab],
    queryFn: () => fetchWithAuth<{
      rankings: Array<{
        userId: string; userName: string; value: number; rank: number;
      }>;
    }>(`/api/leaderboard?type=${tab}`, accessToken),
    refetchInterval: 30_000,
  });

  const rankings = data?.rankings || [];

  const podiumColors = ['text-amber-500', 'text-gray-400', 'text-amber-700'];
  const podiumBgs = ['bg-amber-50 border-amber-200', 'bg-gray-50 border-gray-200', 'bg-orange-50 border-orange-200'];
  const podiumIcons = [Crown, Medal, Award];
  const podiumSizes = ['size-8', 'size-6', 'size-5'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="size-6 text-amber-600" />
          Classements
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Les meilleurs entrepreneurs du Sénégal</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {TABS.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-xs">
              <t.icon className="size-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="mt-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="size-12 mx-auto mb-3 opacity-30" />
                <p>Aucun classement disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Top 3 Podium */}
                {rankings.slice(0, 3).length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 0, 2].map((idx) => {
                      const entry = rankings[idx];
                      if (!entry) return null;
                      const PodiumIcon = podiumIcons[idx];
                      return (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx === 0 ? 0.2 : idx === 1 ? 0 : 0.1 }}
                          className={cn('rounded-xl border p-4 text-center', podiumBgs[idx])}
                        >
                          <PodiumIcon className={cn(podiumSizes[idx], 'mx-auto mb-2', podiumColors[idx])} />
                          <Avatar className="mx-auto mb-2">
                            <AvatarFallback className={cn('text-sm font-bold', idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-gray-100 text-gray-800' : 'bg-orange-100 text-orange-800')}>
                              {entry.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-semibold truncate">{entry.userName}</p>
                          <p className={cn('text-sm font-bold tabular-nums mt-1', podiumColors[idx])}>{fmt(entry.value)}</p>
                          <Badge variant="secondary" className="mt-1 text-[10px]">#{entry.rank}</Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Full list */}
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-96">
                      {rankings.map((entry, i) => (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 border-b last:border-0',
                            i < 3 ? 'bg-amber-50/30' : ''
                          )}
                        >
                          <span className={cn('text-sm font-bold w-6 text-center', i < 3 ? podiumColors[i] : 'text-muted-foreground')}>
                            {entry.rank}
                          </span>
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs bg-muted">
                              {entry.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.userName}</p>
                          </div>
                          <span className={cn('text-sm font-bold tabular-nums', i === 0 ? 'text-amber-700' : 'text-foreground')}>
                            {fmt(entry.value)}
                          </span>
                          {i < 3 && (
                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
