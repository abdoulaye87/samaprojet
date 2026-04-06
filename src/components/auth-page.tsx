'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: { id: string; name: string; email: string; type: string; accessToken: string }) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setDebugInfo(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Erreur de connexion';
        setDebugInfo(`Erreur ${res.status}: ${errorMsg}`);
        toast.error(errorMsg);
        return;
      }

      const accessToken = data.session?.access_token;
      if (accessToken && data.user) {
        localStorage.setItem('access_token', accessToken);
        onLogin({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email || '',
          type: data.user.type || 'player',
          accessToken,
        });
        toast.success('Connexion réussie !');
      } else {
        setDebugInfo('Pas de session retournée. Détails: ' + JSON.stringify(data).substring(0, 200));
        toast.error('Session non retournée par le serveur');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setDebugInfo(`Erreur catch: ${msg}`);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (registerPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    setDebugInfo(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || "Erreur d'inscription";
        setDebugInfo(`Erreur ${res.status}: ${errorMsg}`);
        toast.error(errorMsg);
        return;
      }

      if (data.needConfirmation) {
        setDebugInfo('Confirmation email requise. Passez à la connexion.');
        toast.success('Compte créé ! Connectez-vous maintenant.');
      } else if (data.session?.access_token && data.user) {
        localStorage.setItem('access_token', data.session.access_token);
        onLogin({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email || '',
          type: data.user.type || 'player',
          accessToken: data.session.access_token,
        });
        toast.success('Inscription réussie !');
      } else {
        setDebugInfo('Pas de session auto. Passez à la connexion.');
        toast.success('Compte créé ! Connectez-vous.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setDebugInfo(`Erreur catch: ${msg}`);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-xl bg-amber-100 p-3 mb-4">
            <Activity className="size-8 text-amber-700" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Sama Économie</h1>
          <p className="text-muted-foreground mt-1">Simulation économique simplifiée</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="gap-1.5">
                  <LogIn className="size-3.5" />
                  Connexion
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-1.5">
                  <UserPlus className="size-3.5" />
                  Inscription
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <CardDescription className="mb-4">
                  Connectez-vous à votre compte
                </CardDescription>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <CardDescription className="mb-4">
                  Créez un nouveau compte
                </CardDescription>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nom</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Votre nom"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Mot de passe</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Minimum 6 caractères"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Inscription...' : "S'inscrire"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Debug info */}
        {debugInfo && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{debugInfo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
