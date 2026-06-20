import {
  getUserRankings,
  getAllActiveProducts,
  getUserTriedStatus,
  getUserProfile,
} from '@/lib/actions/rankings';
import { requireUser } from '@/lib/auth';
import { MyListTabs } from '@/components/rating/MyListTabs';
import type { Product } from '@/types/database';

export default async function MeineListePage() {
  const user = await requireUser();

  const [rankings, allProducts, triedStatus, profile] = await Promise.all([
    getUserRankings(user.id),
    getAllActiveProducts(),
    getUserTriedStatus(user.id),
    getUserProfile(user.id),
  ]);

  const triedIds = new Set(triedStatus.map((t) => t.product_id));
  const rankedIds = new Set(rankings.map((r) => r.product_id));

  const triedProducts = triedStatus
    .map((t) => t.products as Product)
    .filter(Boolean);

  const untriedProducts = allProducts.filter(
    (p) => !triedIds.has(p.id) && !rankedIds.has(p.id)
  ) as Product[];

  const initialRankings = rankings
    .filter((r) => r.rank_position)
    .sort((a, b) => a.rank_position - b.rank_position)
    .map((r) => ({
      productId: r.product_id,
      product: r.products as Product,
      rankPosition: r.rank_position,
      score: r.score,
      reviewText: r.review_text,
      isAnonymous: r.is_anonymous,
    }));

  const ratingsByProduct = Object.fromEntries(
    rankings.map((r) => [
      r.product_id,
      {
        score: r.score,
        reviewText: r.review_text,
        isAnonymous: r.is_anonymous,
      },
    ])
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Meine Liste</h1>
        <p className="text-muted mt-1">
          Bewerte Sorten von 1–10, optional mit Kommentar — anonym oder mit Profil.
        </p>
      </header>

      <MyListTabs
        triedProducts={triedProducts}
        untriedProducts={untriedProducts}
        initialRankings={initialRankings}
        ratingsByProduct={ratingsByProduct}
        profile={profile}
      />
    </div>
  );
}
