import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  getProductBySlug,
  getUserReaction,
  getProductReviews,
  getScoreDistribution,
  getUserRating,
} from '@/lib/actions/rankings';
import { getUser } from '@/lib/auth';
import { LineBadge } from '@/components/ui/LineBadge';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { AvgRatingBadge } from '@/components/rating/AvgRatingBadge';
import { ReactionButtons } from '@/components/reactions/ReactionButtons';
import { LikeDislikeChart } from '@/components/charts/LikeDislikeChart';
import { ScoreDistributionChart } from '@/components/charts/ScoreDistributionChart';
import { RatingStatsPanel } from '@/components/rating/RatingStatsPanel';
import { ReviewList } from '@/components/rating/ReviewList';
import { ProductRatingForm } from '@/components/rating/ProductRatingForm';
import { getUserProfile } from '@/lib/actions/rankings';
import type { GlobalRanking } from '@/types/database';

type Props = {
  params: Promise<{ slug: string }>;
};

function isGlobalRanking(p: unknown): p is GlobalRanking {
  return typeof p === 'object' && p !== null && 'final_score' in p;
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const user = await getUser();
  const productId = isGlobalRanking(product) ? product.product_id : product.id;

  const [userReaction, reviews, scoreDist, userRating, profile] = await Promise.all([
    user ? getUserReaction(productId) : null,
    getProductReviews(productId),
    getScoreDistribution(productId),
    user ? getUserRating(productId) : null,
    user ? getUserProfile(user.id) : null,
  ]);

  const name = isGlobalRanking(product) ? product.name : product.name;
  const description = isGlobalRanking(product) ? product.description : product.description;
  const imageUrl = isGlobalRanking(product) ? product.image_url : product.image_url;
  const lineName = isGlobalRanking(product)
    ? product.product_line_name
    : product.product_lines?.name;
  const lineSlug = isGlobalRanking(product)
    ? product.product_line_slug
    : product.product_lines?.slug;
  const lineColor = isGlobalRanking(product)
    ? product.product_line_color
    : product.product_lines?.color_hex;
  const likes = isGlobalRanking(product) ? product.likes : 0;
  const dislikes = isGlobalRanking(product) ? product.dislikes : 0;
  const finalScore = isGlobalRanking(product) ? product.final_score : 0.5;
  const globalRank = isGlobalRanking(product) ? product.global_rank : undefined;
  const avgScore = isGlobalRanking(product) ? product.avg_score : null;
  const scoreCount = isGlobalRanking(product) ? product.score_count : 0;
  const reviewCount = isGlobalRanking(product) ? product.review_count : 0;
  const caffeineMg = isGlobalRanking(product) ? product.caffeine_mg : product.caffeine_mg;
  const isSeasonal = isGlobalRanking(product) ? product.is_seasonal : product.is_seasonal;

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors touch-target"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zum Ranking
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square rounded-2xl overflow-hidden glass-card">
          <Image
            src={imageUrl || '/products/placeholder-energy.svg'}
            alt={name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            {lineName && lineSlug && (
              <Link href={`/linie/${lineSlug}`}>
                <LineBadge name={lineName} slug={lineSlug} color={lineColor} size="md" />
              </Link>
            )}
            <h1 className="font-display text-4xl font-bold">{name}</h1>
            {isSeasonal && (
              <span className="inline-block text-sm px-3 py-1 rounded-full bg-[var(--line-hydration)]/20 text-[var(--line-hydration)]">
                Saisonale Sorte
              </span>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <AvgRatingBadge score={avgScore} count={scoreCount} size="lg" />
              <ScoreBadge score={finalScore} rank={globalRank} size="md" />
            </div>
          </div>

          {description && <p className="text-muted leading-relaxed">{description}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-muted">
            {caffeineMg != null && (
              <span>{caffeineMg > 0 ? `${caffeineMg}mg Koffein` : 'Koffeinfrei'}</span>
            )}
            <span>{scoreCount} Bewertungen</span>
            <span>{reviewCount} Kommentare</span>
          </div>

          <ReactionButtons
            productId={productId}
            likes={likes}
            dislikes={dislikes}
            userReaction={userReaction}
            isLoggedIn={!!user}
          />
        </div>
      </div>

      {isGlobalRanking(product) && <RatingStatsPanel product={product} />}

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Score-Verteilung (1–10)</h2>
          <ScoreDistributionChart data={scoreDist} avgScore={avgScore} />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Like / Dislike</h2>
          <LikeDislikeChart likes={likes} dislikes={dislikes} />
        </div>
      </section>

      {user ? (
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Deine Bewertung</h2>
          <ProductRatingForm
            productId={productId}
            productName={name}
            initialScore={userRating?.score ?? null}
            initialReview={userRating?.review_text}
            initialAnonymous={userRating?.is_anonymous}
            defaultAnonymous={profile?.default_anonymous}
          />
        </section>
      ) : (
        <div className="glass-card p-6 text-center">
          <p className="text-muted mb-3">Melde dich an, um diese Sorte zu bewerten.</p>
          <Link
            href="/login"
            className="touch-target inline-flex px-6 py-3 rounded-xl bg-[var(--line-energy)] text-white font-medium"
          >
            Anmelden
          </Link>
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-bold mb-4">
          Community ({reviews.length})
        </h2>
        <ReviewList reviews={reviews} currentUserId={user?.id} />
      </section>
    </div>
  );
}
