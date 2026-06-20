import type { GlobalRanking } from '@/types/database';
import { Trophy, ThumbsUp, MessageSquare, ListOrdered, BarChart3 } from 'lucide-react';

type Props = {
  product: GlobalRanking;
};

function StatRow({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]/50">
      <Icon className="w-5 h-5 text-[var(--line-hydration)] shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
        <p className="font-display font-bold text-lg">{value}</p>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

export function RatingStatsPanel({ product }: Props) {
  const likeRatio =
    product.total_reactions > 0
      ? Math.round((product.likes / product.total_reactions) * 100)
      : null;

  return (
    <div className="glass-card p-5 space-y-4">
      <h2 className="font-display text-lg font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[var(--line-energy)]" />
        Ranking-Details
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <StatRow
          icon={Trophy}
          label="Globaler Score"
          value={`${Math.round(product.final_score * 100)}%`}
          hint={`Platz #${product.global_rank} · Wilson ${Math.round(product.wilson_score * 100)}% · Rating ${Math.round((product.normalized_avg_score ?? 0.5) * 100)}%`}
        />
        <StatRow
          icon={BarChart3}
          label="Community-Rating"
          value={product.avg_score != null ? `${product.avg_score.toFixed(1)}/10` : '—'}
          hint={`${product.score_count} Bewertung${product.score_count === 1 ? '' : 'en'}`}
        />
        <StatRow
          icon={ThumbsUp}
          label="Like-Quote"
          value={likeRatio != null ? `${likeRatio}%` : '—'}
          hint={`${product.likes} 👍 · ${product.dislikes} 👎`}
        />
        <StatRow
          icon={MessageSquare}
          label="Kommentare"
          value={String(product.review_count)}
          hint="Optionale Reviews von Usern"
        />
        <StatRow
          icon={ListOrdered}
          label="Tier-List Rankings"
          value={String(product.rank_count)}
          hint={
            product.avg_rank != null
              ? `Ø Position ${product.avg_rank.toFixed(1)}`
              : 'Noch keine Listen-Rankings'
          }
        />
      </div>
    </div>
  );
}
