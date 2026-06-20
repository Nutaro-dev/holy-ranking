'use client';

import type { ProductLine } from '@/types/database';

type Props = {
  action: (formData: FormData) => Promise<void>;
  initial?: ProductLine;
};

export function LineForm({ action, initial }: Props) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Name" name="name" defaultValue={initial?.name} required />
      <Field label="Slug" name="slug" defaultValue={initial?.slug} required />
      <Field label="Farbe (Hex)" name="color_hex" defaultValue={initial?.color_hex ?? '#FF006E'} />
      <label className="flex items-center gap-2 text-sm touch-target">
        <input
          type="checkbox"
          name="caffeine_typical"
          defaultChecked={initial?.caffeine_typical}
          className="w-5 h-5"
        />
        Typisch koffeinhaltig
      </label>
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
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-muted">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--line-hydration)]/50"
      />
    </label>
  );
}
