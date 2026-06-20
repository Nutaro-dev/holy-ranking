/**
 * Supabase Cloud env helpers.
 * Supports new publishable/secret keys (sb_publishable_*, sb_secret_*)
 * with fallback to legacy anon/service_role names.
 */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
}

export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  );
}

export function getSupabaseSecretKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    ''
  );
}
