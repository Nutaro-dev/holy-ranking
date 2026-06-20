import { Star } from 'lucide-react';

type Props = {
  score: number | null;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
};

export function AvgRatingBadge({ score, count, size = 'md', showCount = true }: Props) {
  if (score == null) {
    return (
      <span className="text-sm text-muted">Noch keine Bewertungen</span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-lg px-4 py-2 gap-2',
  };

  const formatted = score.toFixed(1);

  return (
    <div
      className={`inline-flex items-center rounded-full font-display font-bold bg-gradient-to-r from-amber-500/20 to-[var(--line-energy)]/20 border border-amber-500/30 ${sizeClasses[size]}`}
    >
      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
      <span>{formatted}</span>
      <span className="text-muted font-body font-normal">/ 10</span>
      {showCount && count != null && count > 0 && (
        <span className="text-muted font-body font-normal">({count})</span>
      )}
    </div>
  );
}
