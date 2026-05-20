/**
 * Set / edition metadata for auctions when the API does not persist catalog fields.
 * Parses title and description heuristics; optional catalog hints from product detail.
 */

export type AuctionSetCatalogHint = {
  setName?: string | null;
  gameSlug?: string | null;
  setCode?: string | null;
};

/** Common pattern: "Card Name — Set Name" or "Card Name - Set Name". */
export function parseSetNameFromAuctionText(title: string, description?: string | null): string | null {
  const sources = [title, description ?? ''].filter(Boolean);
  for (const raw of sources) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const dashParts = trimmed.split(/\s+[—–-]\s+/);
    if (dashParts.length >= 2) {
      const tail = dashParts[dashParts.length - 1]?.trim();
      if (tail && tail.length >= 2 && tail.length <= 120) return tail;
    }
    const pipeParts = trimmed.split('|').map((p) => p.trim());
    if (pipeParts.length >= 2) {
      const tail = pipeParts[pipeParts.length - 1];
      if (tail && tail.length >= 2 && tail.length <= 120) return tail;
    }
  }
  return null;
}

export function buildSetCatalogHref(
  setName: string,
  gameSlug?: string | null
): string {
  const params = new URLSearchParams();
  params.set('game', (gameSlug ?? 'mtg').trim().toLowerCase() || 'mtg');
  params.set('set', setName.trim());
  return `/set?${params.toString()}`;
}

export function resolveAuctionSetMetadata(
  title: string,
  description?: string | null,
  hint?: AuctionSetCatalogHint
): { setName: string | null; setHref: string | null; gameSlug: string | null } {
  const fromHint = hint?.setName?.trim() || null;
  const parsed = parseSetNameFromAuctionText(title, description);
  const setName = fromHint ?? parsed;
  const gameSlug = hint?.gameSlug?.trim().toLowerCase() || null;
  const setHref = setName ? buildSetCatalogHref(setName, gameSlug) : null;
  return { setName, setHref, gameSlug };
}
