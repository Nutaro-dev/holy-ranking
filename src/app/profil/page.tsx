import Link from 'next/link';
import { Trophy, ThumbsUp, Star, MessageSquare } from 'lucide-react';
import { getUserRankings, getUserTriedStatus, getUserProfile } from '@/lib/actions/rankings';
import { requireUser } from '@/lib/auth';
import { LineBadge } from '@/components/ui/LineBadge';
import { AvgRatingBadge } from '@/components/rating/AvgRatingBadge';
import { ProfileSettingsForm } from '@/components/rating/MyListTabs';
import type { Product } from '@/types/database';

export default async function ProfilPage() {
  const user = await requireUser();

  const [rankings, triedStatus, profile] = await Promise.all([
    getUserRankings(user.id),
    getUserTriedStatus(user.id),
    getUserProfile(user.id),
  ]);

  const rated = rankings.filter((r) => r.score != null);
  const withReviews = rankings.filter((r) => r.review_text?.trim());
  const top5 = [...rated].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);
  const avgUserScore =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.score ?? 0), 0) / rated.length
      : null;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold">Profil</h1>
        <p className="text-muted">{user.email}</p>
        {profile?.display_name && (
          <p className="text-sm text-[var(--line-iced-tea)]">@{profile.display_name}</p>
        )}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Star} label="Bewertungen" value={rated.length} />
        <StatCard icon={Trophy} label="Probiert" value={triedStatus.length} />
        <StatCard icon={MessageSquare} label="Kommentare" value={withReviews.length} />
        <StatCard
          icon={ThumbsUp}
          label="Ø Score"
          value={avgUserScore != null ? avgUserScore.toFixed(1) : '—'}
        />
      </div>

      <section>
        <h2 className="font-display text-xl font-bold mb-4">Meine Top 5 (nach Score)</h2>
        {top5.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted">
            <p>Noch keine 1–10 Bewertungen.</p>
            <Link href="/meine-liste" className="text-[var(--line-energy)] hover:underline mt-2 inline-block">
              Jetzt bewerten →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {top5.map((r, i) => {
              const product = r.products as Product;
              const line = product?.product_lines;
              return (
                <Link
                  key={r.id}
                  href={`/produkt/${product?.slug}`}
                  className="glass-card p-4 flex items-center gap-4 hover:border-white/15 transition-colors"
                >
                  <span className="font-display text-2xl font-bold text-[var(--line-energy)] w-10">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product?.name}</p>
                    {line && (
                      <LineBadge name={line.name} slug={line.slug} color={line.color_hex} />
                    )}
                    {r.review_text && (
                      <p className="text-xs text-muted mt-1 line-clamp-1">{r.review_text}</p>
                    )}
                  </div>
                  {r.score != null && (
                    <AvgRatingBadge score={r.score} showCount={false} size="sm" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <ProfileSettingsForm profile={profile} email={user.email ?? ''} />
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: number | string;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-2">
      <Icon className="w-5 h-5 text-[var(--line-hydration)]" />
      <p className="text-2xl font-display font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
