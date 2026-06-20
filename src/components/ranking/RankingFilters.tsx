'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { ProductLine, SortOption } from '@/types/database';

type Props = {
  lines: ProductLine[];
};

export function RankingFilters({ lines }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = (searchParams.get('sort') as SortOption) || 'score';
  const line = searchParams.get('line') || '';
  const search = searchParams.get('q') || '';
  const caffeine = searchParams.get('caffeine') || '';

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="search"
          placeholder="Sorte suchen..."
          defaultValue={search}
          onChange={(e) => {
            const val = e.target.value;
            clearTimeout((window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
            (window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(
              () => update('q', val),
              300
            );
          }}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--line-energy)]/50 touch-target"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={sort}
          onChange={(e) => update('sort', e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-sm touch-target"
        >
          <option value="score">Bester Gesamt-Score</option>
          <option value="rating">Höchstes Rating (1–10)</option>
          <option value="most_reviews">Meiste Kommentare</option>
          <option value="product_line">Produktlinie</option>
          <option value="newest">Neueste</option>
          <option value="most_voted">Meiste Votes</option>
        </select>

        <select
          value={line}
          onChange={(e) => update('line', e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-sm touch-target"
        >
          <option value="">Alle Linien</option>
          {lines.map((l) => (
            <option key={l.id} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={caffeine}
          onChange={(e) => update('caffeine', e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-sm touch-target"
        >
          <option value="">Koffein: Alle</option>
          <option value="free">Koffeinfrei</option>
          <option value="caffeinated">Koffeinhaltig</option>
        </select>
      </div>
    </div>
  );
}
