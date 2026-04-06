'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Activity, LogOut, RefreshCw, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { LandingPage } from '@/components/landing-page';
import { AuthPage } from '@/components/auth-page';
import { GameDashboard } from '@/components/economy/game-dashboard';
import { LoanProjectPage } from '@/components/economy/loan-project-page';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { MarketPage } from '@/components/marketplace/market-page';
import { DemandsPage } from '@/components/marketplace/demands-page';
import { ProfilePage } from '@/components/social/profile-page';
import { LeaderboardPage } from '@/components/social/leaderboard-page';
import { FeedPage } from '@/components/social/feed-page';
import { MyShopPage } from '@/components/shop/my-shop-page';
import { useQuery } from '@tanstack/react-query';

interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  type: string;
  avatar?: string | null;
}

type AppPage = 'home' | 'dashboard' | 'market' | 'demands' | 'profile' | 'leaderboard' | 'shop' | 'feed';

const NAV_ITEMS: Array<{ id: AppPage; label: string; icon: React.ElementType }> = [
  { id: 'home', label: 'Accueil', icon: Activity },
  { id: 'market', label: 'Marché', icon: () => <span className="text-lg">🏪</span> },
  { id: 'demands', label: 'Demandes', icon: () => <span className="text-lg">📋</span> },
  { id: 'profile', label: 'Profil', icon: () => <span className="text-lg">👤</span> },
  { id: 'leaderboard', label: 'Classement', icon: () => <span className="text-lg">🏆</span> },
  { id: 'shop', label: 'Ma Boutique', icon: () => <span className="text-lg">🏪</span> },
  { id: 'feed', label: 'Feed', icon: () => <span className="text-lg">📰</span> },
];

async function fetchWithAuth<T>(url: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...opts,
  });
  if (!res.ok) throw new Error('Erreur requête');
  return res.json();
}

export function DashboardClient() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Session restore
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setTimeout(() => setLoading(false), 0);
      return;
    }
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : (() => { throw new Error(); })())
      .then((data) => {
        setUser(data.user);
        setAccessToken(token);
      })
      .catch(() => localStorage.removeItem('access_token'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = useCallback((userData: { id: string; name: string; email: string; type: string; accessToken: string }) => {
    setUser({ id: userData.id, name: userData.name, email: userData.email, type: userData.type });
    setAccessToken(userData.accessToken);
  }, []);

  const handleLogout = useCallback(async () => {
    if (accessToken) {
      try { await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }); } catch {}
    }
    localStorage.removeItem('access_token');
    setUser(null);
    setAccessToken(null);
    setCurrentPage('home');
    toast.info('Déconnecté');
  }, [accessToken]);

  // Fetch user's active project to determine game state
  const { data: projectData, isLoading: loadingProject } = useQuery({
    queryKey: ['my-project', user?.id],
    queryFn: () => fetchWithAuth<{ project: { id: string; status: string } | null }>(`/api/projects`, accessToken!),
    enabled: !!user && !!accessToken && user.type !== 'admin',
    refetchInterval: 30_000,
  });

  // Fetch pending loan
  const { data: loanData } = useQuery({
    queryKey: ['my-loans', user?.id],
    queryFn: () => fetchWithAuth<{ loans: Array<{ status: string }> }>('/api/loans', accessToken!),
    enabled: !!user && !!accessToken && user.type !== 'admin',
  });

  const activeProject = projectData?.project?.status === 'active' ? projectData.project : null;
  const hasPendingLoan = loanData?.loans?.some((l: { status: string }) => l.status === 'pending_approval');
  const hasActiveLoan = loanData?.loans?.some((l: { status: string }) => l.status === 'active');

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-4 shadow-xl shadow-amber-200">
            <Activity className="size-8 text-white" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="size-4 animate-spin" />
            <span className="text-sm">Chargement de Sama Économie...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Login/Register page — must be checked BEFORE the !user check
  if (currentPage === 'login') {
    return (
      <AuthPage
        onLogin={(userData) => {
          handleLogin(userData);
          setCurrentPage('home');
        }}
      />
    );
  }

  // Not logged in → Landing Page
  if (!user || !accessToken) {
    return <LandingPage onLogin={() => setCurrentPage('login')} onRegister={() => setCurrentPage('login')} />;
  }

  // Admin → AdminDashboard
  if (user.type === 'admin') {
    return <AdminDashboard currentUser={user} accessToken={accessToken} />;
  }

  // Player without active project and no active/pending loan → Loan + Project page
  const needsLoan = !activeProject && !hasActiveLoan && !hasPendingLoan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 shadow-md shadow-amber-200">
                <Activity className="size-4 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent hidden sm:block">
                Sama Économie
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs hidden sm:inline-flex">
              {user.name}
            </Badge>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="size-3.5 mr-1" />
              <span className="hidden sm:inline">Quitter</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className={cn(
          'fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-white/80 backdrop-blur-md transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <ScrollArea className="h-full py-4">
            <nav className="space-y-1 px-3">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    currentPage === item.id
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'text-muted-foreground hover:bg-amber-50 hover:text-amber-700'
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6"
            >
              {currentPage === 'home' && (
                needsLoan ? (
                  loadingProject ? (
                    <div className="flex items-center justify-center py-20">
                      <RefreshCw className="size-6 animate-spin text-amber-500" />
                    </div>
                  ) : (
                    <LoanProjectPage accessToken={accessToken} userId={user.id} />
                  )
                ) : (
                  <GameDashboard accessToken={accessToken} userId={user.id} />
                )
              )}
              {currentPage === 'market' && <MarketPage accessToken={accessToken} userId={user.id} />}
              {currentPage === 'demands' && <DemandsPage accessToken={accessToken} userId={user.id} />}
              {currentPage === 'profile' && <ProfilePage accessToken={accessToken} userId={user.id} />}
              {currentPage === 'leaderboard' && <LeaderboardPage accessToken={accessToken} />}
              {currentPage === 'shop' && <MyShopPage accessToken={accessToken} userId={user.id} />}
              {currentPage === 'feed' && <FeedPage accessToken={accessToken} userId={user.id} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
