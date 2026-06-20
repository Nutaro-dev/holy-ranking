import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { updateProductLine } from '@/lib/actions/admin';
import { LineForm } from '@/components/admin/LineForm';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditLinePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: line } = await supabase.from('product_lines').select('*').eq('id', id).maybeSingle();

  if (!line) notFound();

  const updateAction = updateProductLine.bind(null, id);

  return (
    <div className="space-y-6 max-w-lg">
      <Link href="/admin/lines" className="text-sm text-muted hover:text-foreground">
        ← Linien
      </Link>
      <h1 className="font-display text-2xl font-bold">Linie bearbeiten</h1>
      <div className="glass-card p-6">
        <LineForm action={updateAction} initial={line} />
      </div>
    </div>
  );
}
