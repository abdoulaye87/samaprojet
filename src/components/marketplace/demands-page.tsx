'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  ClipboardList, Plus, Send, MessageSquare, Filter,
  X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { fmt, fmtDate, statusLabel, statusColor, categoryEmoji } from '@/lib/format';
import { cn } from '@/lib/utils';

interface DemandsPageProps {
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

export function DemandsPage({ accessToken, userId }: DemandsPageProps) {
  const queryClient = useQueryClient();
  const [showNewDemand, setShowNewDemand] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [expandedDemand, setExpandedDemand] = useState<string | null>(null);

  // New demand form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('produit');
  const [newBudget, setNewBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Response form
  const [respPrice, setRespPrice] = useState('');
  const [respMessage, setRespMessage] = useState('');
  const [respProductId, setRespProductId] = useState('');

  const { data: demandsData, isLoading } = useQuery({
    queryKey: ['demands'],
    queryFn: () => fetchWithAuth<{
      demands: Array<{
        id: string; title: string; description?: string; category: string;
        budget?: number; status: string; userName: string; responses_count: number;
        createdAt: string;
      }>;
    }>('/api/demands', accessToken),
    refetchInterval: 20_000,
  });

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals', expandedDemand],
    queryFn: () => fetchWithAuth<{
      proposals: Array<{
        id: string; fromUserName: string; price: number; message?: string; status: string; createdAt: string;
      }>;
    }>(`/api/demands/${expandedDemand}/proposals`, accessToken),
    enabled: !!expandedDemand,
  });

  const demands = demandsData?.demands || [];

  const handleNewDemand = async () => {
    if (!newTitle.trim()) { toast.error('Le titre est requis'); return; }
    setSubmitting(true);
    try {
      await fetchWithAuth('/api/demands', accessToken, {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          category: newCategory,
          budget: newBudget ? Number(newBudget) : null,
        }),
      });
      toast.success('Demande publiée !');
      setNewTitle(''); setNewDesc(''); setNewBudget(''); setNewCategory('produit');
      setShowNewDemand(false);
      queryClient.invalidateQueries({ queryKey: ['demands'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally { setSubmitting(false); }
  };

  const handleRespond = async () => {
    if (!respondingTo || !respPrice) { toast.error('Le prix est requis'); return; }
    setSubmitting(true);
    try {
      await fetchWithAuth(`/api/demands/${respondingTo}/proposals`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ price: Number(respPrice), message: respMessage, productId: respProductId || null }),
      });
      toast.success('Proposition envoyée !');
      setRespondingTo(null); setRespPrice(''); setRespMessage('');
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      if (expandedDemand) queryClient.invalidateQueries({ queryKey: ['proposals', expandedDemand] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="size-6 text-amber-600" />
            Demandes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Publiez ou répondez aux demandes du marché</p>
        </div>
        <Dialog open={showNewDemand} onOpenChange={setShowNewDemand}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="size-4 mr-1.5" />
              Publier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle demande</DialogTitle>
              <DialogDescription>Décrivez ce que vous recherchez</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input placeholder="Ex: Je cherche 100 poules pondeuses" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Détails de votre demande..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['produit', 'service', 'emploi', 'partenariat'].map(c => (
                        <SelectItem key={c} value={c}>{categoryEmoji(c)} {c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget (FCFA)</Label>
                  <Input type="number" placeholder="Optionnel" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDemand(false)}>Annuler</Button>
              <Button onClick={handleNewDemand} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white">
                {submitting ? 'Publication...' : 'Publier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Demands List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {demands.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{categoryEmoji(d.category)}</span>
                        <h3 className="font-semibold text-sm">{d.title}</h3>
                        <Badge variant="secondary" className={cn('text-[10px]', statusColor(d.status))}>{statusLabel(d.status)}</Badge>
                      </div>
                      {d.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{d.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Par {d.userName}</span>
                        {d.budget && <span>Budget: <strong className="text-amber-700">{fmt(d.budget)}</strong></span>}
                        <span>{fmtDate(d.createdAt)}</span>
                        {d.responses_count > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            {d.responses_count} réponse{d.responses_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.status === 'open' && (
                        <Button size="sm" variant="outline" onClick={() => setRespondingTo(d.id)} className="text-amber-700 border-amber-300 hover:bg-amber-50">
                          <Send className="size-3.5 mr-1" />
                          Répondre
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setExpandedDemand(expandedDemand === d.id ? null : d.id)}>
                        {expandedDemand === d.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: Proposals */}
                  {expandedDemand === d.id && proposalsData && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Propositions ({proposalsData.proposals?.length || 0})
                      </p>
                      {proposalsData.proposals?.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">Aucune proposition pour le moment</p>
                      ) : (
                        <div className="space-y-2">
                          {proposalsData.proposals.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                              <div>
                                <span className="font-medium">{p.fromUserName}</span>
                                {p.message && <span className="text-muted-foreground ml-2">&quot;{p.message}&quot;</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-700">{fmt(p.price)}</span>
                                <Badge variant="secondary" className={cn('text-[10px]', statusColor(p.status))}>
                                  {statusLabel(p.status)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {demands.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="size-12 mx-auto mb-3 opacity-30" />
          <p>Aucune demande pour le moment</p>
          <Button variant="outline" className="mt-3" onClick={() => setShowNewDemand(true)}>
            <Plus className="size-4 mr-1.5" />
            Publier la première demande
          </Button>
        </div>
      )}

      {/* Respond Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(open) => !open && setRespondingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposer une offre</DialogTitle>
            <DialogDescription>Faites votre meilleure offre</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Prix proposé (FCFA) *</Label>
              <Input type="number" placeholder="Votre prix" value={respPrice} onChange={(e) => setRespPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea placeholder="Décrivez votre offre..." value={respMessage} onChange={(e) => setRespMessage(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)}>Annuler</Button>
            <Button onClick={handleRespond} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white">
              {submitting ? 'Envoi...' : 'Envoyer la proposition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
