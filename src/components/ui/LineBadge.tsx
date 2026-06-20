type Props = {
  name: string;
  slug: string;
  color?: string | null;
  size?: 'sm' | 'md';
};

export function LineBadge({ name, slug, color, size = 'sm' }: Props) {
  const accent =
    color ||
    (slug === 'energy'
      ? 'var(--line-energy)'
      : slug === 'iced-tea'
        ? 'var(--line-iced-tea)'
        : slug === 'milkshake'
          ? 'var(--line-milkshake)'
          : 'var(--line-hydration)');

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: `${accent}22`,
        color: accent,
        border: `1px solid ${accent}44`,
      }}
    >
      {name}
    </span>
  );
}
