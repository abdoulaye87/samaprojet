'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Share2, Newspaper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fmtDate } from '@/lib/format';

interface FeedPageProps {
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

export function FeedPage({ accessToken, userId }: FeedPageProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => fetchWithAuth<{
      posts: Array<{
        id: string; type: string; title: string; description?: string;
        likes: number; comments: number; userName: string;
        liked: boolean; createdAt: string;
      }>;
    }>(`/api/feed`, accessToken),
    refetchInterval: 20_000,
  });

  const posts = data?.posts || [];

  const handleLike = async (postId: string) => {
    try {
      await fetchWithAuth(`/api/feed/${postId}/like`, accessToken, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch (e) {
      toast.error('Erreur lors du like');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Newspaper className="size-6 text-amber-600" />
          Feed d&apos;actualités
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Les dernières actions de la communauté</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Newspaper className="size-12 mx-auto mb-3 opacity-30" />
          <p>Aucune activité pour le moment</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-3 mx-auto">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="text-xs bg-amber-100 text-amber-800">
                        {post.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{post.userName}</span>
                        <span className="text-xs text-muted-foreground">{fmtDate(post.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1">{post.title}</p>
                      {post.description && (
                        <p className="text-xs text-muted-foreground mt-1">{post.description}</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center gap-1.5 text-xs transition-colors hover:text-red-500 group"
                        >
                          <Heart className={cn(
                            'size-4 transition-all',
                            post.liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground group-hover:text-red-400'
                          )} />
                          <span className={post.liked ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                            {post.likes}
                          </span>
                        </button>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MessageSquare className="size-4" />
                          {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
