import type { Metadata } from 'next';
import '@fontsource-variable/outfit';
import '@fontsource-variable/dm-sans';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Holy Ranking',
  description: 'Rank HOLY Energy, Iced Tea & Hydration flavors',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    isAdmin = !!data;
  }

  return (
    <html lang="de">
      <body className="pb-[var(--nav-height)] md:pb-0">
        <AppShell user={user} isAdmin={isAdmin}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
