/** Demo price history series — shared so ProductDetailView can lazy-load ProductPriceChart. */
function hashSlug(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function prng(seed: number, i: number): number {
  const x = Math.sin(seed * 0.001 + i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Serie storica demo (~3 anni, un punto ogni ~5 giorni) — sostituibile con API reale. */
export function buildPriceHistoryPoints(slug: string): { t: number; price: number; sales?: number }[] {
  const seed = hashSlug(slug || 'default');
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 38);
  const daysTotal = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const step = 12;
  const out: { t: number; price: number; sales: number }[] = [];
  for (let d = 0; d <= daysTotal; d += step) {
    const t = start.getTime() + d * 86400000;
    const progress = d / Math.max(daysTotal, 1);
    const wave = 16 + Math.sin(progress * 14 + seed * 0.0001) * 6 + Math.sin(progress * 28) * 2.5;
    const noise = (prng(seed, d) - 0.5) * 5;
    let price = wave + noise;
    if (progress > 0.82 && progress < 0.88) price += (progress - 0.82) * 280;
    if (progress > 0.88 && progress < 0.92) price -= (progress - 0.88) * 120;
    price = Math.max(8, Math.min(48, price));
    const baseSales = 50 + Math.sin(progress * 8 + seed * 0.001) * 30;
    const priceFactor = Math.max(0, (50 - price) * 2);
    const salesNoise = (prng(seed, d + 1000) - 0.5) * 20;
    let sales = Math.round(Math.max(5, Math.min(200, baseSales + priceFactor + salesNoise)));
    if (progress > 0.8 && progress < 0.92) sales += Math.round((progress - 0.8) * 300);
    out.push({ t, price: Math.round(price * 100) / 100, sales });
  }
  out.push({ t: end.getTime(), price: out[out.length - 1]?.price ?? 18, sales: out[out.length - 1]?.sales ?? 50 });
  return out;
}
