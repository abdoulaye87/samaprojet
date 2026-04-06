'use client';

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmt } from '@/lib/format';

interface Agent {
  id: string;
  prenom: string;
  balance: number;
  dette: number;
}

interface WealthChartProps {
  agents: Agent[];
}

export function WealthChart({ agents }: WealthChartProps) {
  if (!agents || agents.length === 0) {
    return (
      <Card className="econ-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Répartition de la richesse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Aucun agent disponible</p>
        </CardContent>
      </Card>
    );
  }

  const data = agents
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .map((agent) => ({
      name: agent.prenom,
      balance: agent.balance,
    }));

  return (
    <Card className="econ-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Répartition de la richesse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                formatter={(value: number) => [fmt(value), 'Solde']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="balance" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.balance >= 0 ? '#22c55e' : '#ef4444'}
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
