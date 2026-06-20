import Link from 'next/link';
import { Package, Layers, ArrowRight } from 'lucide-react';
import { getProductLines, getAllActiveProducts } from '@/lib/actions/rankings';
import { requireAdmin } from '@/lib/auth';

export default async function AdminDashboard() {
  await requireAdmin();
  const [lines, products] = await Promise.all([getProductLines(), getAllActiveProducts()]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Admin</h1>
        <p className="text-muted">Produktlinien und Sorten verwalten</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <AdminCard
          href="/admin/lines"
          icon={Layers}
          title="Produktlinien"
          count={lines.length}
          description="Energy, Iced Tea, Hydration"
        />
        <AdminCard
          href="/admin/products"
          icon={Package}
          title="Sorten"
          count={products.length}
          description="Aktive Produkte"
        />
      </div>
    </div>
  );
}

function AdminCard({
  href,
  icon: Icon,
  title,
  count,
  description,
}: {
  href: string;
  icon: typeof Package;
  title: string;
  count: number;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="glass-card p-6 flex items-center justify-between hover:border-white/15 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[var(--line-hydration)]/20">
          <Icon className="w-6 h-6 text-[var(--line-hydration)]" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <p className="text-muted text-sm">{description}</p>
          <p className="text-2xl font-bold mt-1">{count}</p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
    </Link>
  );
}
