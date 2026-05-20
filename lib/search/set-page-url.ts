/** Slug frontend (GameContext) → slug DB / pagina /set (mtg, pokemon, one-piece). */
const FRONTEND_TO_DB_SLUG: Record<string, string> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  op: 'one-piece',
};

/** Slug per URL pagina set: preferisce game_slug da hit (già DB), altrimenti mappa frontend. */
export function resolveSetPageGameSlug(
  hitGameSlug?: string | null,
  frontendGameSlug?: string | null
): string {
  const fromHit = hitGameSlug?.trim();
  if (fromHit) return fromHit;
  const frontend = frontendGameSlug?.trim();
  if (frontend) return FRONTEND_TO_DB_SLUG[frontend] ?? frontend;
  return 'mtg';
}

export function buildSetPageUrl(gameSlug: string | undefined, setName: string): string {
  const game = gameSlug?.trim() || 'mtg';
  return `/set?game=${encodeURIComponent(game)}&set=${encodeURIComponent(setName)}`;
}
