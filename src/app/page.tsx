import { Suspense } from 'react';
import { Flame } from 'lucide-react';
import { getGlobalRankings, getProductLines } from '@/lib/actions/rankings';
import { ProductCard } from '@/components/ranking/ProductCard';
import { RankingFilters } from '@/components/ranking/RankingFilters';
import type { SortOption } from '@/types/database';

type Props = {
  searchParams: Promise<{
    sort?: SortOption;
    line?: string;
    q?: string;
    caffeine?: string;
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = params.sort || 'score';
  const lineSlug = params.line || undefined;
  const search = params.q || undefined;
  const caffeineFree =
    params.caffeine === 'free' ? true : params.caffeine === 'caffeinated' ? false : null;

  const [rankings, lines] = await Promise.all([
    getGlobalRankings(sort, lineSlug, search, caffeineFree),
    getProductLines(),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3 md:hidden">
          <Flame className="w-8 h-8 text-[var(--line-energy)]" />
          <h1 className="font-display text-3xl font-bold">Holy Ranking</h1>
        </div>
        <p className="text-muted max-w-xl">
          Das Community-Ranking für HOLY Energy, Iced Tea & Hydration — sortiert nach Wilson-Score
          und Community-Rankings.
        </p>
      </header>

      <Suspense fallback={<div className="glass-card p-4 h-24 animate-pulse" />}>
        <RankingFilters lines={lines} />
      </Suspense>

      {rankings.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted">
          Keine Sorten gefunden. Starte Supabase und führe die Migrations aus.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankings.map((product, i) => (
            <ProductCard key={product.product_id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
