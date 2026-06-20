import { Trophy } from 'lucide-react';

type Props = {
  score: number;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
};

export function ScoreBadge({ score, rank, size = 'md' }: Props) {
  const pct = Math.round(score * 100);
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-display font-bold bg-gradient-to-r from-[var(--line-energy)]/20 to-[var(--line-hydration)]/20 border border-[var(--glass-border)] ${sizeClasses[size]}`}
    >
      {rank !== undefined && (
        <span className="text-muted font-body font-normal">#{rank}</span>
      )}
      <Trophy className="w-3.5 h-3.5 text-[var(--line-energy)]" />
      <span>{pct}%</span>
    </div>
  );
}
