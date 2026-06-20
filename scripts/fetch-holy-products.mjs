const COLLECTIONS = [
  { line: 'energy', slug: 'energy', url: 'https://de.holy.com/collections/holy-energy/products.json?limit=250' },
  { line: 'iced-tea', slug: 'iced-tea', url: 'https://de.holy.com/collections/holy-iced-tea/products.json?limit=250' },
  { line: 'hydration', slug: 'hydration', url: 'https://de.holy.com/collections/holy-hydration/products.json?limit=250' },
  { line: 'milkshake', slug: 'milkshake', url: 'https://de.holy.com/collections/milkshake/products.json?limit=250' },
];

const SKIP = /box|starter|probe|probier|sachet|shaker|merch|bundle|pack|mix &/i;

function isTub(product) {
  if (SKIP.test(product.title)) return false;
  const has50 = product.variants?.some(
    (v) =>
      /50\s*drinks|50\s*portion|1\s*dose/i.test(v.title) ||
      v.title === 'Default Title',
  );
  return has50 && product.images?.[0]?.src;
}

async function fetchCollection(col) {
  const res = await fetch(col.url, {
    headers: { 'User-Agent': 'HolyRanking/1.0' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${col.url}: ${res.status}`);
  const data = await res.json();
  return data.products
    .filter(isTub)
    .map((p) => ({
      line: col.line,
      handle: p.handle,
      name: p.title.replace(/\s*®.*$/, '').trim(),
      description: (p.body_html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300),
      image_url: p.images[0].src,
      tags: p.tags,
    }));
}

const all = [];
for (const col of COLLECTIONS) {
  try {
    const items = await fetchCollection(col);
    console.error(`${col.line}: ${items.length} products`);
    all.push(...items);
  } catch (e) {
    console.error(`${col.line} failed:`, e.message);
  }
}
console.log(JSON.stringify(all, null, 2));
