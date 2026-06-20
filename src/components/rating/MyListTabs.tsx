'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EyeOff, User } from 'lucide-react';
import type { Product, UserProfile } from '@/types/database';
import { LineBadge } from '@/components/ui/LineBadge';
import { ProductRatingForm } from '@/components/rating/ProductRatingForm';
import { TierListEditor } from '@/components/tier-list/TierListEditor';
import { updateUserProfile } from '@/lib/actions/rankings';

type RankedItem = {
  productId: string;
  product: Product;
  rankPosition: number;
  score?: number | null;
  reviewText?: string | null;
  isAnonymous?: boolean;
};

type Props = {
  triedProducts: Product[];
  untriedProducts: Product[];
  initialRankings: RankedItem[];
  ratingsByProduct: Record<
    string,
    { score: number | null; reviewText: string | null; isAnonymous: boolean }
  >;
  profile: UserProfile | null;
};

export function MyListTabs({
  triedProducts,
  untriedProducts,
  initialRankings,
  ratingsByProduct,
  profile,
}: Props) {
  const [tab, setTab] = useState<'rate' | 'order' | 'settings'>('rate');

  const unratedTried = triedProducts.filter((p) => !ratingsByProduct[p.id]?.score);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)]">
        {(
          [
            ['rate', 'Bewerten (1–10)'],
            ['order', 'Reihenfolge'],
            ['settings', 'Profil'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 touch-target py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-[var(--line-energy)] text-white'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'rate' && (
        <div className="space-y-6">
          {unratedTried.length > 0 && (
            <p className="text-sm text-[var(--line-iced-tea)]">
              {unratedTried.length} probierte Sorte{unratedTried.length === 1 ? '' : 'n'} noch ohne Score
            </p>
          )}

          {triedProducts.length === 0 ? (
            <p className="text-muted glass-card p-6 text-center">
              Markiere Sorten als probiert, um sie zu bewerten.
            </p>
          ) : (
            <div className="space-y-4">
              {triedProducts.map((product) => {
                const line = product.product_lines;
                const rating = ratingsByProduct[product.id];
                return (
                  <div key={product.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image src={product.image_url} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <Link href={`/produkt/${product.slug}`} className="font-medium hover:underline">
                          {product.name}
                        </Link>
                        {line && <LineBadge name={line.name} slug={line.slug} color={line.color_hex} />}
                      </div>
                    </div>
                    <ProductRatingForm
                      productId={product.id}
                      productName={product.name}
                      initialScore={rating?.score ?? null}
                      initialReview={rating?.reviewText}
                      initialAnonymous={rating?.isAnonymous}
                      defaultAnonymous={profile?.default_anonymous}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {untriedProducts.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold mb-3">Noch nicht probiert</h2>
              <div className="grid gap-2">
                {untriedProducts.slice(0, 12).map((p) => (
                  <Link
                    key={p.id}
                    href={`/produkt/${p.slug}`}
                    className="glass-card p-3 text-sm hover:border-white/15"
                  >
                    {p.name}
                  </Link>
                ))}
                {untriedProducts.length > 12 && (
                  <p className="text-xs text-muted">+{untriedProducts.length - 12} weitere</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'order' && (
        <TierListEditor
          triedProducts={triedProducts}
          untriedProducts={untriedProducts}
          initialRankings={initialRankings}
        />
      )}

      {tab === 'settings' && (
        <ProfileSettingsForm profile={profile} email="" />
      )}
    </div>
  );
}

function ProfileSettingsForm({
  profile,
  email,
}: {
  profile: UserProfile | null;
  email: string;
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [defaultAnonymous, setDefaultAnonymous] = useState(profile?.default_anonymous ?? false);
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState('');

  function save() {
    startTransition(async () => {
      try {
        await updateUserProfile({ displayName, defaultAnonymous, bio });
        setMsg('Profil gespeichert');
        setTimeout(() => setMsg(''), 2000);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Fehler');
      }
    });
  }

  return (
    <div className="glass-card p-5 space-y-4 max-w-lg">
      <h2 className="font-display text-lg font-bold flex items-center gap-2">
        <User className="w-5 h-5" />
        Dein Profil
      </h2>
      {email && <p className="text-sm text-muted">{email}</p>}

      <div className="space-y-2">
        <label className="text-sm text-muted">Anzeigename</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="z.B. HolyFan42"
          maxLength={40}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--line-energy)]/50"
        />
        <p className="text-xs text-muted">Wird bei Bewertungen angezeigt (außer anonym).</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted">Bio (optional)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          maxLength={160}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] resize-none text-sm"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={defaultAnonymous}
          onChange={(e) => setDefaultAnonymous(e.target.checked)}
          className="w-5 h-5 rounded accent-[var(--line-energy)]"
        />
        <span className="text-sm flex items-center gap-2">
          <EyeOff className="w-4 h-4" /> Standardmäßig anonym bewerten
        </span>
      </label>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="touch-target px-6 py-3 rounded-xl bg-[var(--line-iced-tea)] text-white font-medium disabled:opacity-50"
      >
        {pending ? 'Speichern…' : 'Profil speichern'}
      </button>
      {msg && <p className="text-sm text-[var(--line-iced-tea)]">{msg}</p>}
    </div>
  );
}

export { ProfileSettingsForm };
