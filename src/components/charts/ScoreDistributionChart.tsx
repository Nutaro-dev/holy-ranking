'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ScoreDistribution } from '@/types/database';

type Props = {
  data: ScoreDistribution[];
  avgScore?: number | null;
};

export function ScoreDistributionChart({ data, avgScore }: Props) {
  const total = data.reduce((s, d) => s + Number(d.count), 0);

  if (total === 0) {
    return (
      <div className="glass-card p-8 text-center text-muted">
        Noch keine 1–10 Bewertungen für diese Sorte.
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3">
      {avgScore != null && (
        <p className="text-sm text-muted">
          Durchschnitt: <strong className="text-foreground">{avgScore.toFixed(1)}/10</strong> aus{' '}
          {total} Bewertung{total === 1 ? '' : 'en'}
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="score" tick={{ fill: '#8b8b9e', fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: '#8b8b9e', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: '#1a1a24',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
            }}
            formatter={(value: number) => [`${value} Stimmen`, 'Anzahl']}
            labelFormatter={(label) => `Score ${label}/10`}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.score}
                fill={
                  entry.score >= 8
                    ? '#ff006e'
                    : entry.score >= 5
                      ? '#00c896'
                      : '#7b2ff7'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
