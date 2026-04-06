'use client';

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketProduct {
  id: string;
  produit: string;
  prix: number;
  prixBase: number;
}

interface InflationChartProps {
  market: MarketProduct[];
}

export function InflationChart({ market }: InflationChartProps) {
  if (!market || market.length === 0) {
    return (
      <Card className="econ-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Évolution des prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Aucun produit disponible</p>
        </CardContent>
      </Card>
    );
  }

  const data = market.map((item) => ({
    name: item.produit,
    base: item.prixBase,
    actuel: item.prix,
    variation: ((item.prix - item.prixBase) / item.prixBase) * 100,
  }));

  return (
    <Card className="econ-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Évolution des prix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${Math.round(v)}F`}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const label = name === 'base' ? 'Prix de base' : 'Prix actuel';
                  return [`${value.toLocaleString('fr-FR')} F`, label];
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value: string) =>
                  value === 'base' ? 'Prix de base' : 'Prix actuel'
                }
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Bar dataKey="base" fill="oklch(0.7 0 0 / 40%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="actuel" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.variation > 5 ? '#f59e0b' : entry.variation < -5 ? '#22c55e' : 'oklch(0.45 0.15 45)'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
