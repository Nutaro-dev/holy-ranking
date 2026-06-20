'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function createProductLine(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from('product_lines').insert({
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    color_hex: formData.get('color_hex') as string,
    caffeine_typical: formData.get('caffeine_typical') === 'on',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function updateProductLine(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('product_lines')
    .update({
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      color_hex: formData.get('color_hex') as string,
      caffeine_typical: formData.get('caffeine_typical') === 'on',
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const caffeine = formData.get('caffeine_mg') as string;

  const { error } = await supabase.from('products').insert({
    product_line_id: formData.get('product_line_id') as string,
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: (formData.get('description') as string) || null,
    image_url: (formData.get('image_url') as string) || null,
    caffeine_mg: caffeine ? parseInt(caffeine, 10) : null,
    is_seasonal: formData.get('is_seasonal') === 'on',
    is_active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const caffeine = formData.get('caffeine_mg') as string;

  const { error } = await supabase
    .from('products')
    .update({
      product_line_id: formData.get('product_line_id') as string,
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: (formData.get('description') as string) || null,
      image_url: (formData.get('image_url') as string) || null,
      caffeine_mg: caffeine ? parseInt(caffeine, 10) : null,
      is_seasonal: formData.get('is_seasonal') === 'on',
      is_active: formData.get('is_active') === 'on',
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function archiveProduct(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/');
}
