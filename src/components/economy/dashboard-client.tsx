'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Activity, LogOut, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AuthPage } from '@/components/auth-page';
import { PlayerDashboard } from '@/components/player-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';
import { useQuery } from '@tanstack/react-query';

interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  type: string;
}

async function fetchWithAuth<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Non autorisé');
  }
  return res.json();
}

export function DashboardClient() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // Use setTimeout to avoid setting state synchronously in effect
      const id = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(id);
    }
    // Verify the token by fetching user profile
    fetch('/api/users/me', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Token invalid');
      })
      .then((data) => {
        setUser(data.user);
        setAccessToken(token);
      })
      .catch(() => {
        localStorage.removeItem('access_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (userData: {
    id: string;
    name: string;
    email: string;
    type: string;
    accessToken: string;
  }) => {
    setUser({ id: userData.id, name: userData.name, email: userData.email, type: userData.type });
    setAccessToken(userData.accessToken);
  };

  const handleLogout = async () => {
    if (accessToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch {
        // Ignore logout errors
      }
    }
    localStorage.removeItem('access_token');
    setUser(null);
    setAccessToken(null);
    toast.info('Déconnecté');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="size-5 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (!user || !accessToken) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Activity className="size-6 text-amber-600" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Sama Économie</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.name}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {user.type === 'agent' ? 'Admin' : 'Joueur'}
            </span>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              <LogOut className="size-3.5 mr-1" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {user.type === 'agent' ? (
          <AdminDashboard currentUser={user} accessToken={accessToken} />
        ) : (
          <PlayerDashboard currentUser={user} accessToken={accessToken} />
        )}
      </main>
    </div>
  );
}
