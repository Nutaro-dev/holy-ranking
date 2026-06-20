'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, ListOrdered, User, Shield } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { TopNav } from './TopNav';

const mobileLinks = [
  { href: '/', label: 'Ranking', icon: Home },
  { href: '/meine-liste', label: 'Meine Liste', icon: ListOrdered },
  { href: '/profil', label: 'Profil', icon: User },
];

type Props = {
  children: React.ReactNode;
  user: SupabaseUser | null;
  isAdmin: boolean;
};

export function AppShell({ children, user, isAdmin }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh flex flex-col">
      <TopNav user={user} isAdmin={isAdmin} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-8">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-card rounded-none border-x-0 border-b-0">
        <div className="flex items-stretch justify-around h-[var(--nav-height)]">
          {mobileLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-1 touch-target text-xs"
              >
                <motion.div animate={{ scale: active ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <Icon
                    className="w-6 h-6"
                    style={{ color: active ? 'var(--line-energy)' : 'var(--text-muted)' }}
                  />
                </motion.div>
                <span className={active ? 'text-foreground font-medium' : 'text-muted'}>{label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex flex-1 flex-col items-center justify-center gap-1 touch-target text-xs"
            >
              <Shield className="w-6 h-6" style={{ color: pathname.startsWith('/admin') ? 'var(--line-hydration)' : 'var(--text-muted)' }} />
              <span className={pathname.startsWith('/admin') ? 'text-foreground font-medium' : 'text-muted'}>Admin</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
