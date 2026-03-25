/**
 * Route Next.js per il dettaglio asta (mock o API: stesso path).
 * Usare sempre questo helper per evitare href errati.
 */
export function auctionDetailPath(auctionId: string): string {
  const id = encodeURIComponent(auctionId);
  return `/aste/${id}`;
}
