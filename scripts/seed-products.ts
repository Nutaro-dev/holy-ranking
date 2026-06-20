/**
 * Fetches all HOLY tub products from de.holy.com (Shopify) and seeds Supabase Cloud.
 * Usage: npm run seed-products
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { getSupabaseSecretKey, getSupabaseUrl } from '../src/lib/supabase/env';

config({ path: '.env.local' });
config({ path: '.env' });

const LINES = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'HOLY Energy',
    slug: 'energy',
    color_hex: '#FF006E',
    caffeine_typical: true,
    collection: 'https://de.holy.com/collections/holy-energy/products.json?limit=250',
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    name: 'HOLY Iced Tea',
    slug: 'iced-tea',
    color_hex: '#00C896',
    caffeine_typical: false,
    collection: 'https://de.holy.com/collections/holy-iced-tea/products.json?limit=250',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    name: 'HOLY Hydration',
    slug: 'hydration',
    color_hex: '#7B2FF7',
    caffeine_typical: false,
    collection: 'https://de.holy.com/collections/holy-hydration/products.json?limit=250',
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    name: 'HOLY Milkshake',
    slug: 'milkshake',
    color_hex: '#FFB347',
    caffeine_typical: false,
    collection: 'https://de.holy.com/collections/milkshake/products.json?limit=250',
  },
] as const;

const SKIP_TITLE = /box|starter|probe|probier|sachet|shaker|merch|bundle|mega.?pack|mix &/i;

interface ShopifyProduct {
  handle: string;
  title: string;
  body_html?: string;
  tags: string[];
  images: { src: string }[];
  variants: { title: string }[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

function isTubProduct(p: ShopifyProduct): boolean {
  if (SKIP_TITLE.test(p.title)) return false;
  if (!p.images?.[0]?.src) return false;
  return p.variants.some(
    (v) =>
      /50\s*drinks|50\s*portion|1\s*dose/i.test(v.title) || v.title === 'Default Title',
  );
}

function caffeineMg(lineSlug: string, tags: string[]): number {
  if (lineSlug === 'energy') return 80;
  if (lineSlug === 'iced-tea') {
    if (tags.some((t) => /green|grün/i.test(t))) return 15;
    if (tags.some((t) => /black|schwarz/i.test(t))) return 20;
    return 0;
  }
  return 0;
}

async function fetchProducts(url: string): Promise<ShopifyProduct[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HolyRanking/1.0' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
  const data = (await res.json()) as { products: ShopifyProduct[] };
  return data.products.filter(isTubProduct);
}

async function main() {
  const supabaseUrl = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();
  if (!supabaseUrl || !secretKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('→ Upserting product lines…');
  const { error: linesError } = await supabase.from('product_lines').upsert(
    LINES.map(({ id, name, slug, color_hex, caffeine_typical }) => ({
      id,
      name,
      slug,
      color_hex,
      caffeine_typical,
    })),
    { onConflict: 'slug' },
  );
  if (linesError) {
    console.error('product_lines failed:', linesError.message);
    process.exit(1);
  }

  const allProducts: {
    product_line_id: string;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    caffeine_mg: number;
    is_seasonal: boolean;
    is_active: boolean;
  }[] = [];

  for (const line of LINES) {
    console.log(`→ Fetching ${line.name} from Shopify…`);
    const shopifyProducts = await fetchProducts(line.collection);
    console.log(`  ${shopifyProducts.length} tub products`);

    for (const p of shopifyProducts) {
      const name = p.title.replace(/\s*®.*$/, '').trim();
      const slug = `${line.slug}-${p.handle}`;
      const tags = p.tags ?? [];
      allProducts.push({
        product_line_id: line.id,
        name,
        slug,
        description: p.body_html ? stripHtml(p.body_html) : `${name} — HOLY ${line.name.replace('HOLY ', '')}.`,
        image_url: p.images[0].src,
        caffeine_mg: caffeineMg(line.slug, tags),
        is_seasonal: tags.some((t) => /limited|limitiert|saison/i.test(t)),
        is_active: true,
      });
    }
  }

  console.log(`→ Total: ${allProducts.length} products`);

  // Remove products no longer in catalog (keeps user rankings FK-safe: deactivate instead)
  const newSlugs = new Set(allProducts.map((p) => p.slug));
  const { data: existing } = await supabase.from('products').select('slug');
  const toDeactivate = (existing ?? []).filter((p) => !newSlugs.has(p.slug)).map((p) => p.slug);
  if (toDeactivate.length) {
    await supabase.from('products').update({ is_active: false }).in('slug', toDeactivate);
    console.log(`  Deactivated ${toDeactivate.length} outdated products`);
  }

  console.log('→ Upserting products (batch)…');
  const BATCH = 50;
  for (let i = 0; i < allProducts.length; i += BATCH) {
    const batch = allProducts.slice(i, i + BATCH);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'slug' });
    if (error) {
      console.error('products upsert failed:', error.message);
      process.exit(1);
    }
  }

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log(`✓ Done — ${count ?? allProducts.length} active products in Supabase`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
