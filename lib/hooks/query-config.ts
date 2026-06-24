/**
 * `staleTime` per famiglia di dati (React Query): single source of truth per le
 * durate di freschezza, così l'invalidazione resta coerente e documentata.
 *
 * NB: i dati "live" (aste, offerte, listing in vendita) restano con `staleTime`
 * GRANULARI nei rispettivi hook (5-60s) perché la freschezza varia per query e
 * sono scelte deliberate — NON vanno centralizzati qui.
 */
export const STALE = {
  /** Catalogo carte/set: cambia di rado. */
  catalog: 60_000,
  /** Ristampe di una carta: dato di catalogo praticamente immutabile. */
  reprints: 24 * 60 * 60 * 1000,
} as const;
