export function formatDistanceToNow(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `vor ${diffD} Tag${diffD === 1 ? '' : 'en'}`;
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}
