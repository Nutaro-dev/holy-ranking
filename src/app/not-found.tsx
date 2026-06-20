import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-6xl font-bold text-white/20">404</h1>
      <p className="mt-4 text-lg text-muted">Seite nicht gefunden</p>
      <Link
        href="/"
        className="mt-6 touch-target px-6 py-3 rounded-xl bg-[var(--line-energy)] text-white font-medium"
      >
        Zum Ranking
      </Link>
    </div>
  );
}
