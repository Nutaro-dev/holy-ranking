'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatAuthError } from '@/lib/supabase/auth-error';
import { requireUser } from '@/lib/auth';
import type { GlobalRanking, ProductReview, ScoreDistribution, UserProfile } from '@/types/database';

export async function getGlobalRankings(
  sort = 'score',
  lineSlug?: string,
  search?: string,
  caffeineFree?: boolean | null
): Promise<GlobalRanking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_global_rankings', {
    p_sort: sort,
    p_line_slug: lineSlug || null,
    p_search: search || null,
    p_caffeine_free: caffeineFree ?? null,
  });

  if (error) {
    console.error('getGlobalRankings error:', error);
    return [];
  }
  return data ?? [];
}

export async function getProductLines() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('product_lines')
    .select('*')
    .order('name');
  return data ?? [];
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data: ranking } = await supabase
    .from('global_rankings')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (ranking) return ranking;

  const { data: product } = await supabase
    .from('products')
    .select('*, product_lines(*)')
    .eq('slug', slug)
    .maybeSingle();

  return product;
}

export async function getUserReaction(productId: string) {
  const user = await requireUser().catch(() => null);
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('reactions')
    .select('reaction')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  return data?.reaction ?? null;
}

export async function toggleReaction(productId: string, reaction: 'like' | 'dislike') {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('reactions')
    .select('id, reaction')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    await supabase.from('reactions').delete().eq('id', existing.id);
  } else if (existing) {
    await supabase.from('reactions').update({ reaction }).eq('id', existing.id);
  } else {
    await supabase.from('reactions').insert({ user_id: user.id, product_id: productId, reaction });
  }

  revalidatePath('/');
  revalidatePath('/produkt/[slug]', 'page');
  revalidatePath('/linie/[slug]', 'page');
  revalidatePath('/profil');
}

export async function saveProductRating(input: {
  productId: string;
  score: number;
  reviewText?: string | null;
  isAnonymous?: boolean;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('user_rankings')
    .select('rank_position')
    .eq('user_id', user.id)
    .eq('product_id', input.productId)
    .maybeSingle();

  const rankPosition = existing?.rank_position ?? input.score;

  const { error } = await supabase.from('user_rankings').upsert(
    {
      user_id: user.id,
      product_id: input.productId,
      score: input.score,
      review_text: input.reviewText ?? null,
      is_anonymous: input.isAnonymous ?? false,
      rank_position: rankPosition,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,product_id' }
  );

  if (error) throw new Error(error.message);

  await supabase.from('tried_status').upsert(
    { user_id: user.id, product_id: input.productId, tried: true },
    { onConflict: 'user_id,product_id' }
  );

  revalidatePath('/meine-liste');
  revalidatePath('/');
  revalidatePath('/profil');
  revalidatePath('/produkt/[slug]', 'page');
}

export async function getUserRating(productId: string) {
  const user = await requireUser().catch(() => null);
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('user_rankings')
    .select('score, review_text, is_anonymous')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  return data;
}

export async function getProductReviews(productId: string, limit = 20): Promise<ProductReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getProductReviews error:', error);
    return [];
  }
  return data ?? [];
}

export async function getScoreDistribution(productId: string): Promise<ScoreDistribution[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_score_distribution', {
    p_product_id: productId,
  });

  if (error) {
    console.error('getScoreDistribution error:', error);
    return Array.from({ length: 10 }, (_, i) => ({ score: i + 1, count: 0 }));
  }
  return data ?? [];
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return data;
}

export async function updateUserProfile(input: {
  displayName: string;
  defaultAnonymous: boolean;
  bio?: string;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from('user_profiles').upsert(
    {
      user_id: user.id,
      display_name: input.displayName.trim() || null,
      default_anonymous: input.defaultAnonymous,
      bio: input.bio?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw new Error(error.message);

  revalidatePath('/meine-liste');
  revalidatePath('/profil');
}

export async function saveRanking(positions: { productId: string; rankPosition: number }[]) {
  const user = await requireUser();
  const supabase = await createClient();

  const rows = positions.map(({ productId, rankPosition }) => ({
    user_id: user.id,
    product_id: productId,
    rank_position: rankPosition,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('user_rankings').upsert(rows, {
    onConflict: 'user_id,product_id',
  });

  if (error) throw new Error(error.message);

  revalidatePath('/meine-liste');
  revalidatePath('/');
  revalidatePath('/profil');
}

export async function toggleTried(productId: string, tried: boolean) {
  const user = await requireUser();
  const supabase = await createClient();

  if (tried) {
    await supabase.from('tried_status').upsert(
      { user_id: user.id, product_id: productId, tried: true },
      { onConflict: 'user_id,product_id' }
    );
  } else {
    await supabase.from('tried_status').delete().eq('user_id', user.id).eq('product_id', productId);
    await supabase.from('user_rankings').delete().eq('user_id', user.id).eq('product_id', productId);
  }

  revalidatePath('/meine-liste');
  revalidatePath('/profil');
}

export async function getUserRankings(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_rankings')
    .select('*, products(*, product_lines(*))')
    .eq('user_id', userId)
    .order('rank_position');

  return data ?? [];
}

export async function getUserTriedStatus(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tried_status')
    .select('*, products(*, product_lines(*))')
    .eq('user_id', userId)
    .eq('tried', true);

  return data ?? [];
}

export async function getAllActiveProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*, product_lines(*)')
    .eq('is_active', true)
    .order('name');

  return data ?? [];
}

export async function signInWithPassword(email: string, password: string, redirectTo = '/') {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(formatAuthError(error));

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function signUpWithPassword(email: string, password: string) {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) throw new Error(formatAuthError(error));

  revalidatePath('/', 'layout');
  return { needsConfirmation: !data.session };
}

export async function signInWithEmail(email: string) {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) throw new Error(formatAuthError(error));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}
