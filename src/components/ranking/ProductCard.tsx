'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { GlobalRanking } from '@/types/database';
import { LineBadge } from '@/components/ui/LineBadge';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { AvgRatingBadge } from '@/components/rating/AvgRatingBadge';

type Props = {
  product: GlobalRanking;
  index?: number;
};

export function ProductCard({ product, index = 0 }: Props) {
  const accent = product.product_line_color || 'var(--line-energy)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Link href={`/produkt/${product.slug}`} className="block group">
        <article
          className="glass-card overflow-hidden transition-all duration-300 hover:border-white/15 hover:shadow-lg hover:shadow-black/20"
          style={{ borderLeftWidth: 3, borderLeftColor: accent }}
        >
          <div className="relative aspect-[4/3] bg-[var(--bg-elevated)] overflow-hidden">
            <Image
              src={product.image_url || '/products/placeholder-energy.svg'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <ScoreBadge score={product.final_score} rank={product.global_rank} size="sm" />
              {product.avg_score != null && (
                <AvgRatingBadge score={product.avg_score} count={product.score_count} size="sm" />
              )}
            </div>
            {product.is_seasonal && (
              <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-black/60 backdrop-blur">
                Saisonal
              </span>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-display font-semibold text-lg leading-tight group-hover:text-white transition-colors">
              {product.name}
            </h3>
            <LineBadge
              name={product.product_line_name}
              slug={product.product_line_slug}
              color={product.product_line_color}
            />
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted pt-1">
              <span>👍 {product.likes}</span>
              <span>💬 {product.review_count}</span>
              {product.caffeine_mg != null && product.caffeine_mg > 0 && (
                <span>{product.caffeine_mg}mg</span>
              )}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
