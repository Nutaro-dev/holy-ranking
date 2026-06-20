'use client';

import type { Product, ProductLine } from '@/types/database';

type Props = {
  action: (formData: FormData) => Promise<void>;
  lines: ProductLine[];
  initial?: Product;
};

export function ProductForm({ action, lines, initial }: Props) {
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm text-muted">Produktlinie</span>
        <select
          name="product_line_id"
          defaultValue={initial?.product_line_id}
          required
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)]"
        >
          {lines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <Field label="Name" name="name" defaultValue={initial?.name} required />
      <Field label="Slug" name="slug" defaultValue={initial?.slug} required />
      <label className="block space-y-1">
        <span className="text-sm text-muted">Beschreibung</span>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ''}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)]"
        />
      </label>
      <Field label="Bild-URL" name="image_url" defaultValue={initial?.image_url} />
      <Field
        label="Koffein (mg)"
        name="caffeine_mg"
        type="number"
        defaultValue={initial?.caffeine_mg?.toString()}
      />
      <label className="flex items-center gap-2 text-sm touch-target">
        <input type="checkbox" name="is_seasonal" defaultChecked={initial?.is_seasonal} className="w-5 h-5" />
        Saisonal
      </label>
      {initial && (
        <label className="flex items-center gap-2 text-sm touch-target">
          <input type="checkbox" name="is_active" defaultChecked={initial.is_active} className="w-5 h-5" />
          Aktiv
        </label>
      )}
      <button
        type="submit"
        className="touch-target px-6 py-2.5 rounded-xl bg-[var(--line-hydration)] text-white font-medium hover:opacity-90"
      >
        {initial ? 'Speichern' : 'Erstellen'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = 'text',
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-muted">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--line-hydration)]/50"
      />
    </label>
  );
}
