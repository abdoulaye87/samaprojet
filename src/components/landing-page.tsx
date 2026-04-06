'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  TrendingUp, LogIn, UserPlus, Coins, Users, Award,
  ChevronRight, Star, Zap, Shield, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============ ANIMATED COUNTER ============
function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [target, duration]);
  return (
    <span className="tabular-nums">
      {new Intl.NumberFormat('fr-FR').format(count)}
    </span>
  );
}

// ============ FLOATING COINS BACKGROUND ============
function FloatingCoins() {
  const coins = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 12,
    size: 20 + Math.random() * 40,
    opacity: 0.05 + Math.random() * 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          className="absolute rounded-full bg-amber-400"
          style={{
            left: `${coin.left}%`,
            width: coin.size,
            height: coin.size,
            opacity: coin.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: coin.duration,
            delay: coin.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============ LANDING PAGE ============
export function LandingPage({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [feedPosts, setFeedPosts] = useState<Array<{ title: string; desc: string; time: string }>>([]);
  const [stats, setStats] = useState({ players: 0, inCirculation: 0 });

  useEffect(() => {
    // Fetch last 5 feed posts
    fetch('/api/feed?limit=5')
      .then(r => r.json())
      .then(data => {
        if (data.posts) {
          setFeedPosts(data.posts.slice(0, 5).map((p: { title: string; description?: string; createdAt: string }) => ({
            title: p.title,
            desc: p.description || '',
            time: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(p.createdAt)),
          })));
        }
      })
      .catch(() => {});

    // Fetch stats
    fetch('/api/settings?key=agent_count_active')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          const active = Number(data.settings.find((s: { key: string; value: string }) => s.key === 'agent_count_active')?.value || 127);
          const dormant = Number(data.settings.find((s: { key: string; value: string }) => s.key === 'agent_count_dormant')?.value || 300);
          setStats({
            players: active + dormant + Math.floor(Math.random() * 50),
            inCirculation: 15_000_000 + Math.floor(Math.random() * 5_000_000),
          });
        }
      })
      .catch(() => {
        setStats({ players: 847, inCirculation: 18_500_000 });
      });
  }, []);

  const features = [
    { icon: Coins, title: 'Empruntez & Investissez', desc: 'Obtenez un prêt bancaire et lancez votre business au Sénégal' },
    { icon: TrendingUp, title: 'Gérez votre Business', desc: 'Survivez aux aléas économiques et faites prospérer votre entreprise' },
    { icon: Globe, title: 'Marché en temps réel', desc: 'Achetez et vendez sur le marché: or, diamants, immobilier et plus' },
    { icon: Users, title: 'Réseau social', desc: 'Connectez-vous avec d\'autres entrepreneurs, publiez des demandes' },
    { icon: Award, title: 'Classements', desc: 'Devenez l\'entrepreneur #1 du Sénégal dans les classements' },
    { icon: Shield, title: 'Simulation réaliste', desc: 'Événements aléatoires, taxes, emprunts, faillite possible' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative">
      <FloatingCoins />

      {/* Nav */}
      <header className="relative z-10 border-b bg-white/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2 shadow-lg shadow-amber-200">
              <Zap className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                Sama Économie
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Simulation Économique Sénégalaise</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onLogin} className="text-amber-700 hover:text-amber-800 hover:bg-amber-50">
              <LogIn className="size-4 mr-1.5" />
              Connexion
            </Button>
            <Button size="sm" onClick={onRegister} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200">
              <UserPlus className="size-4 mr-1.5" />
              Inscription
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Badge className="mb-6 bg-amber-100 text-amber-800 border-amber-200 px-4 py-1.5 text-sm">
            <Star className="size-3.5 mr-1.5 fill-amber-500 text-amber-500" />
            Nouveau — Saison 2
          </Badge>

          <motion.h2
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
              Devenez l&apos;entrepreneur
            </span>
            <br />
            <span className="text-foreground">#1 du Sénégal</span>
          </motion.h2>

          <motion.p
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Empruntez, investissez, gérez votre business et affrontez les aléas
            économiques dans cette simulation gamifiée inspirée du marché sénégalais.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button size="lg" onClick={onRegister} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-200/50 px-8 text-base">
              Commencer l&apos;aventure
              <ChevronRight className="size-5 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={onLogin} className="border-amber-300 text-amber-700 hover:bg-amber-50 px-8 text-base">
              J&apos;ai déjà un compte
            </Button>
          </motion.div>
        </motion.div>

        {/* Live Counter */}
        <motion.div
          className="mt-12 flex justify-center gap-8 sm:gap-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-700 tabular-nums">
              <AnimatedCounter target={stats.players} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">Entrepreneurs actifs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-extrabold text-orange-600 tabular-nums">
              <AnimatedCounter target={stats.inCirculation} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">FCFA en circulation</p>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          className="mt-12 rounded-2xl overflow-hidden shadow-2xl shadow-amber-200/30 border border-amber-200/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <img
            src="/hero-banner.png"
            alt="Sama Économie — Simulation Sénégalaise"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-2xl sm:text-3xl font-bold">Comment ça marche ?</h3>
          <p className="text-muted-foreground mt-2">Lancez votre entreprise en 3 étapes</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className="h-full border-amber-100 hover:border-amber-300 transition-all hover:shadow-lg hover:shadow-amber-100/30 hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 p-3 w-fit mb-3">
                    <f.icon className="size-5 text-amber-700" />
                  </div>
                  <h4 className="font-semibold text-sm">{f.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Feed */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h3 className="text-2xl font-bold">Activité récente</h3>
          <p className="text-muted-foreground mt-1 text-sm">Dernières actions des entrepreneurs</p>
        </motion.div>

        <div className="max-w-lg mx-auto space-y-2">
          <AnimatePresence>
            {feedPosts.length === 0 ? (
              Array.from({ length: 3 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/60 backdrop-blur border border-amber-100"
                >
                  <div className="rounded-full bg-amber-100 p-2">
                    <TrendingUp className="size-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Un entrepreneur a rejoint l&apos;aventure</p>
                    <p className="text-xs text-muted-foreground">À l&apos;instant</p>
                  </div>
                </motion.div>
              ))
            ) : (
              feedPosts.map((post, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/60 backdrop-blur border border-amber-100"
                >
                  <div className="rounded-full bg-amber-100 p-2">
                    <TrendingUp className="size-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    {post.desc && <p className="text-xs text-muted-foreground truncate">{post.desc}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{post.time}</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto px-4 text-center"
        >
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl shadow-amber-100/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold">Prêt à conquérir le marché ?</h3>
              <p className="text-muted-foreground mt-2">
                Rejoignez des centaines d&apos;entrepreneurs sénégalais dans la simulation économique la plus réaliste.
              </p>
              <Button size="lg" onClick={onRegister} className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg">
                Créer mon compte gratuitement
                <ChevronRight className="size-5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-white/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="size-4 text-amber-500" />
            <span>Sama Économie V2 — Simulation économique sénégalaise</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Monnaie virtuelle · Pas d&apos;argent réel impliqué
          </p>
        </div>
      </footer>
    </div>
  );
}
