'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type Props = {
  likes: number;
  dislikes: number;
};

export function LikeDislikeChart({ likes, dislikes }: Props) {
  const total = likes + dislikes;
  const data = [
    { name: 'Likes', value: likes, color: '#22c55e' },
    { name: 'Dislikes', value: dislikes, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="glass-card p-6 text-center text-muted">
        Noch keine Reaktionen — sei der Erste!
      </div>
    );
  }

  return (
    <div className="glass-card p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-sm text-muted mt-2">
        {Math.round((likes / total) * 100)}% positiv ({total} Stimmen)
      </p>
    </div>
  );
}
