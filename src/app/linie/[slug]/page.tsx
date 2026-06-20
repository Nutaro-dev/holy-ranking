import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGlobalRankings, getProductLines } from '@/lib/actions/rankings';
import { ProductCard } from '@/components/ranking/ProductCard';
import { LineBadge } from '@/components/ui/LineBadge';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LinePage({ params }: Props) {
  const { slug } = await params;
  const lines = await getProductLines();
  const line = lines.find((l) => l.slug === slug);

  if (!line) notFound();

  const rankings = await getGlobalRankings('score', slug);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Alle Sorten
        </Link>
        <div className="flex items-center gap-4">
          <LineBadge name={line.name} slug={line.slug} color={line.color_hex} size="md" />
          <h1 className="font-display text-3xl font-bold">{line.name}</h1>
        </div>
        <p className="text-muted">
          {rankings.length} Sorten · {line.caffeine_typical ? 'Typisch koffeinhaltig' : 'Meist koffeinfrei'}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rankings.map((product, i) => (
          <ProductCard key={product.product_id} product={product} index={i} />
        ))}
      </div>
    </div>
  );
}
