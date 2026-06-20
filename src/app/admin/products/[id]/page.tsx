import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getProductLines } from '@/lib/actions/rankings';
import { updateProduct, archiveProduct } from '@/lib/actions/admin';
import { ProductForm } from '@/components/admin/ProductForm';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const lines = await getProductLines();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!product) notFound();

  const updateAction = updateProduct.bind(null, id);
  const archiveAction = archiveProduct.bind(null, id);

  return (
    <div className="space-y-6 max-w-lg">
      <Link href="/admin/products" className="text-sm text-muted hover:text-foreground">
        ← Sorten
      </Link>
      <h1 className="font-display text-2xl font-bold">Sorte bearbeiten</h1>
      <div className="glass-card p-6">
        <ProductForm action={updateAction} lines={lines} initial={product} />
      </div>
      {product.is_active && (
        <form action={archiveAction}>
          <button
            type="submit"
            className="touch-target px-4 py-2 rounded-xl border border-red-500/50 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
          >
            Sorte archivieren
          </button>
        </form>
      )}
    </div>
  );
}
