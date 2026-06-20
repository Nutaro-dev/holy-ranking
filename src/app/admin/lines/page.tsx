import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getProductLines } from '@/lib/actions/rankings';
import { createProductLine } from '@/lib/actions/admin';
import { LineForm } from '@/components/admin/LineForm';
import { LineBadge } from '@/components/ui/LineBadge';

export default async function AdminLinesPage() {
  await requireAdmin();
  const lines = await getProductLines();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-muted hover:text-foreground">
            ← Admin
          </Link>
          <h1 className="font-display text-3xl font-bold mt-2">Produktlinien</h1>
        </div>
      </div>

      <section className="glass-card p-6">
        <h2 className="font-display text-lg font-bold mb-4">Neue Linie</h2>
        <LineForm action={createProductLine} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Bestehende Linien</h2>
        {lines.map((line) => (
          <div key={line.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LineBadge name={line.name} slug={line.slug} color={line.color_hex} size="md" />
              <span className="text-sm text-muted">{line.slug}</span>
            </div>
            <Link
              href={`/admin/lines/${line.id}`}
              className="text-sm text-[var(--line-energy)] hover:underline touch-target px-3 py-2"
            >
              Bearbeiten
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
