import { createClient } from '@/lib/supabase/server';

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const admin = await isAdmin(user.id);
  if (!admin) throw new Error('Forbidden');
  return user;
}
