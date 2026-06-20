import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from './env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}

export async function createServiceClient() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');

  return createSupabaseClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
