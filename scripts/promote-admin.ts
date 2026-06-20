import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { getSupabaseSecretKey, getSupabaseUrl } from '../src/lib/supabase/env';

config({ path: '.env.local' });
config({ path: '.env' });

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run promote-admin -- <email>');
  process.exit(1);
}

const supabaseUrl = getSupabaseUrl();
const secretKey = getSupabaseSecretKey();

if (!supabaseUrl || !secretKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error(`No user found with email: ${email}`);
    console.error('Sign in or register once before promoting.');
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from('admin_users')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' });

  if (insertError) {
    console.error('Failed to promote admin:', insertError.message);
    process.exit(1);
  }

  console.log(`✓ ${email} promoted to admin (${user.id})`);
}

main();
