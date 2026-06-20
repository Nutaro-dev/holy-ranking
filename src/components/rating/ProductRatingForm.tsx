'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { EyeOff, MessageSquare } from 'lucide-react';
import { ScorePicker } from '@/components/rating/ScorePicker';
import { saveProductRating } from '@/lib/actions/rankings';

type Props = {
  productId: string;
  productName: string;
  initialScore?: number | null;
  initialReview?: string | null;
  initialAnonymous?: boolean;
  defaultAnonymous?: boolean;
};

export function ProductRatingForm({
  productId,
  productName,
  initialScore = null,
  initialReview = '',
  initialAnonymous = false,
  defaultAnonymous = false,
}: Props) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [review, setReview] = useState(initialReview ?? '');
  const [anonymous, setAnonymous] = useState(initialAnonymous || defaultAnonymous);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSave(newScore?: number) {
    const s = newScore ?? score;
    if (s == null) {
      setError('Bitte wähle eine Bewertung von 1–10.');
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await saveProductRating({
          productId,
          score: s,
          reviewText: review.trim() || null,
          isAnonymous: anonymous,
        });
        setScore(s);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
      }
    });
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="font-display font-bold">{productName}</h3>
        <p className="text-sm text-muted">Wie würdest du diese Sorte bewerten?</p>
      </div>

      <ScorePicker
        value={score}
        onChange={(n) => {
          setScore(n);
          handleSave(n);
        }}
        disabled={pending}
      />

      <div className="space-y-2">
        <label className="text-sm text-muted flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Kommentar (optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Geschmack, Süße, Koffein-Kick, Mischverhalten…"
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--line-energy)]/50 resize-none text-sm"
        />
        <p className="text-xs text-muted text-right">{review.length}/500</p>
      </div>

      <label className="flex items-center gap-3 touch-target cursor-pointer">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="w-5 h-5 rounded accent-[var(--line-energy)]"
        />
        <span className="flex items-center gap-2 text-sm">
          <EyeOff className="w-4 h-4 text-muted" />
          Anonym posten
        </span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <motion.button
        type="button"
        disabled={pending || score == null}
        onClick={() => handleSave()}
        whileTap={{ scale: 0.98 }}
        className="w-full touch-target py-3 rounded-xl bg-[var(--line-energy)] text-white font-medium disabled:opacity-50"
      >
        {pending ? 'Speichern…' : saved ? 'Gespeichert ✓' : 'Bewertung speichern'}
      </motion.button>
    </div>
  );
}
