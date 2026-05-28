import { getCardImageUrl } from '@/lib/assets';

/** True se il path Meilisearch produce un URL CDN utilizzabile. */
export function hasResolvableCardImage(raw: string | null | undefined): boolean {
  return getCardImageUrl(raw ?? null) !== null;
}

/** Verifica lato client che l'immagine sia effettivamente caricabile (no broken image). */
export function verifyCardImageLoads(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(true);
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export async function filterHitsWithLoadableImages<T extends { image?: string | null }>(
  hits: T[],
  targetCount: number
): Promise<Array<T & { imageUrl: string }>> {
  const valid: Array<T & { imageUrl: string }> = [];

  for (const hit of hits) {
    if (valid.length >= targetCount) break;
    const imageUrl = getCardImageUrl(hit.image ?? null);
    if (!imageUrl) continue;
    const loads = await verifyCardImageLoads(imageUrl);
    if (loads) valid.push({ ...hit, imageUrl });
  }

  return valid;
}
