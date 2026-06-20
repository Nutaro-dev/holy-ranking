'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, LogIn, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { signOut } from '@/lib/actions/rankings';

const links = [
  { href: '/', label: 'Ranking' },
  { href: '/meine-liste', label: 'Meine Liste' },
  { href: '/profil', label: 'Profil' },
];

type Props = {
  user: User | null;
  isAdmin: boolean;
};

export function TopNav({ user, isAdmin }: Props) {
  const pathname = usePathname();

  return (
    <header className="hidden md:block sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <Flame className="w-6 h-6 text-[var(--line-energy)]" />
          Holy Ranking
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative px-4 py-2 rounded-full text-sm touch-target flex items-center"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[var(--glass)] rounded-full border border-[var(--glass-border)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${active ? 'text-foreground' : 'text-muted'}`}>{label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-full text-sm touch-target flex items-center ${
                pathname.startsWith('/admin') ? 'text-[var(--line-hydration)]' : 'text-muted'
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted truncate max-w-[180px]">{user.email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="touch-target flex items-center gap-1 px-3 py-2 rounded-full glass-card text-sm hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="touch-target flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--line-energy)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
