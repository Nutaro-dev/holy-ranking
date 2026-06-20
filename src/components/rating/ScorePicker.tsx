'use client';

import { motion } from 'framer-motion';

type Props = {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export function ScorePicker({ value, onChange, disabled, size = 'md' }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Bewertung 1 bis 10">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        const hot = n >= 8;
        return (
          <motion.button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            whileTap={{ scale: 0.92 }}
            className={`touch-target rounded-xl font-display font-bold border transition-all ${sizes[size]} ${
              active
                ? hot
                  ? 'bg-[var(--line-energy)] border-[var(--line-energy)] text-white shadow-lg shadow-[var(--line-energy)]/30'
                  : 'bg-[var(--line-iced-tea)] border-[var(--line-iced-tea)] text-white'
                : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] text-muted hover:border-white/20 hover:text-foreground'
            } disabled:opacity-50`}
            aria-pressed={active}
            aria-label={`${n} von 10`}
          >
            {n}
          </motion.button>
        );
      })}
    </div>
  );
}
