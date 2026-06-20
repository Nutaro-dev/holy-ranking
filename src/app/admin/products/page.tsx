import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getProductLines } from '@/lib/actions/rankings';
import { createProduct } from '@/lib/actions/admin';
import { ProductForm } from '@/components/admin/ProductForm';
import { LineBadge } from '@/components/ui/LineBadge';

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const lines = await getProductLines();

  const { data: products } = await supabase
    .from('products')
    .select('*, product_lines(*)')
    .order('name');

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-foreground">
          ← Admin
        </Link>
        <h1 className="font-display text-3xl font-bold mt-2">Sorten</h1>
      </div>

      <section className="glass-card p-6">
        <h2 className="font-display text-lg font-bold mb-4">Neue Sorte</h2>
        <ProductForm action={createProduct} lines={lines} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Alle Sorten</h2>
        {(products ?? []).map((product) => {
          const line = product.product_lines;
          return (
            <div
              key={product.id}
              className={`glass-card p-4 flex items-center justify-between ${!product.is_active ? 'opacity-50' : ''}`}
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {line && <LineBadge name={line.name} slug={line.slug} color={line.color_hex} />}
                  {!product.is_active && (
                    <span className="text-xs text-red-400">Archiviert</span>
                  )}
                </div>
              </div>
              <Link
                href={`/admin/products/${product.id}`}
                className="text-sm text-[var(--line-energy)] hover:underline touch-target px-3 py-2"
              >
                Bearbeiten
              </Link>
            </div>
          );
        })}
      </section>
    </div>
  );
}
