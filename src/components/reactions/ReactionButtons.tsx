'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { toggleReaction } from '@/lib/actions/rankings';

type Props = {
  productId: string;
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null;
  isLoggedIn: boolean;
};

export function ReactionButtons({ productId, likes, dislikes, userReaction, isLoggedIn }: Props) {
  const [reaction, setReaction] = useState(userReaction);
  const [counts, setCounts] = useState({ likes, dislikes });
  const [pending, startTransition] = useTransition();

  function handleClick(type: 'like' | 'dislike') {
    if (!isLoggedIn) return;

    const prev = reaction;
    const prevCounts = { ...counts };

    if (reaction === type) {
      setReaction(null);
      setCounts((c) => ({
        ...c,
        [type === 'like' ? 'likes' : 'dislikes']: Math.max(0, c[type === 'like' ? 'likes' : 'dislikes'] - 1),
      }));
    } else {
      setReaction(type);
      setCounts((c) => {
        const next = { ...c };
        if (prev === 'like') next.likes = Math.max(0, next.likes - 1);
        if (prev === 'dislike') next.dislikes = Math.max(0, next.dislikes - 1);
        next[type === 'like' ? 'likes' : 'dislikes'] += 1;
        return next;
      });
    }

    startTransition(async () => {
      try {
        await toggleReaction(productId, type);
      } catch {
        setReaction(prev);
        setCounts(prevCounts);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={reaction === 'like' ? { scale: [1, 1.2, 1] } : {}}
        onClick={() => handleClick('like')}
        disabled={!isLoggedIn || pending}
        className={`touch-target flex items-center gap-2 px-4 py-2.5 rounded-full border transition-colors ${
          reaction === 'like'
            ? 'bg-green-500/20 border-green-500/50 text-green-400'
            : 'glass-card hover:bg-white/10'
        } ${!isLoggedIn ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <ThumbsUp className="w-5 h-5" />
        <span className="font-medium">{counts.likes}</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={reaction === 'dislike' ? { scale: [1, 1.2, 1] } : {}}
        onClick={() => handleClick('dislike')}
        disabled={!isLoggedIn || pending}
        className={`touch-target flex items-center gap-2 px-4 py-2.5 rounded-full border transition-colors ${
          reaction === 'dislike'
            ? 'bg-red-500/20 border-red-500/50 text-red-400'
            : 'glass-card hover:bg-white/10'
        } ${!isLoggedIn ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <ThumbsDown className="w-5 h-5" />
        <span className="font-medium">{counts.dislikes}</span>
      </motion.button>

      {!isLoggedIn && (
        <Link href="/login" className="text-sm text-[var(--line-energy)] hover:underline ml-2">
          Zum Voten einloggen
        </Link>
      )}
    </div>
  );
}
