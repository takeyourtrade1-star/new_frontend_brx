/**
 * Validazione, normalizzazione e limiti condivisi per le route handler di ricerca
 * (server-side, mai importato da componenti client).
 *
 * Obiettivi:
 * - Imporre limiti duri su lunghezza query, paginazione, numero di category_id, ecc.
 * - Normalizzare i parametri pubblici prima di costruire filtri Meilisearch
 *   (evita injection nelle filter string e richieste eccessivamente costose).
 * - Centralizzare il fetch verso Meilisearch con timeout, cosi nessuna route
 *   rimane appesa se l'istanza è lenta o irraggiungibile.
 */

export const MAX_QUERY_LENGTH = 200;
export const MAX_LIMIT = 60;
export const DEFAULT_LIMIT = 20;
export const MAX_CATEGORY_IDS = 20;
export const MAX_IDS_BATCH = 100;
export const MAX_AUTOCOMPLETE_REQUESTS = 4;
export const MEILI_FETCH_TIMEOUT_MS = 8000;

/** Slug "game" accettati nei parametri pubblici (allowlist, evita filtri arbitrari). */
export const ALLOWED_GAME_SLUGS = new Set([
  'mtg',
  'pokemon',
  'pk',
  'one-piece',
  'op',
  'yugioh',
]);

/** Chiavi di ordinamento accettate da /api/search; tutto il resto fa fallback su name_asc. */
export const ALLOWED_SORTS = new Set([
  'name_asc',
  'name_desc',
  'set_asc',
  'set_desc',
  'price_asc',
  'price_desc',
]);

/** Campi su cui è permesso filtrare fetchCardsByBlueprintIds (whitelist, evita filter injection). */
export const ALLOWED_ID_FILTER_FIELDS = new Set(['cardtrader_id', 'id']);

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/** Rimuove caratteri di controllo e tronca alla lunghezza massima consentita. */
export function normalizeQuery(raw: string | null | undefined): string {
  if (!raw) return '';
  let result = '';
  for (let i = 0; i < raw.length; i += 1) {
    const code = raw.charCodeAt(i);
    // Esclude caratteri di controllo (0-31 e 127): non hanno senso in una query di ricerca
    // e potrebbero confondere Meilisearch o i log.
    if (code <= 31 || code === 127) continue;
    result += raw[i];
  }
  return result.trim().slice(0, MAX_QUERY_LENGTH);
}

/** Valida lo slug "game" contro un'allowlist; valore non riconosciuto -> stringa vuota (nessun filtro). */
export function normalizeGameSlug(raw: string | null | undefined): string {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return '';
  return ALLOWED_GAME_SLUGS.has(value) ? value : '';
}

/** Nome set: solo lunghezza/trim, l'escaping per la filter string avviene a parte. */
export function normalizeSetName(raw: string | null | undefined): string {
  return (raw ?? '').trim().slice(0, 200);
}

/** Pagina: intero >= 1, senza limite massimo esplicito ma comunque un intero finito ragionevole. */
export function normalizePage(raw: string | null | undefined): number {
  const parsed = parseInt(raw ?? '', 10);
  return clampInt(Number.isNaN(parsed) ? 1 : parsed, 1, 100000);
}

/** Limit: intero tra 1 e MAX_LIMIT (hard cap, evita richieste troppo onerose). */
export function normalizeLimit(
  raw: string | null | undefined,
  fallback: number = DEFAULT_LIMIT,
  max: number = MAX_LIMIT
): number {
  const parsed = parseInt(raw ?? '', 10);
  return clampInt(Number.isNaN(parsed) ? fallback : parsed, 1, max);
}

/** Sort key: deve appartenere all'allowlist, altrimenti fallback su name_asc. */
export function normalizeSort(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  return ALLOWED_SORTS.has(value) ? value : 'name_asc';
}

/**
 * Parsa una lista "1,2,3" di category_id: solo interi positivi, deduplicati,
 * troncata a MAX_CATEGORY_IDS per evitare filtri enormi (`IN [...]`).
 */
export function normalizeCategoryIds(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const ids = raw
    .split(',')
    .map((part) => parseInt(part.trim(), 10))
    .filter((id) => Number.isInteger(id) && id > 0 && id < 1_000_000);
  return Array.from(new Set(ids)).slice(0, MAX_CATEGORY_IDS);
}

/** Singolo category_id legacy: stessa validazione, restituisce null se non valido. */
export function normalizeCategoryId(raw: string | null | undefined): number | null {
  const parsed = parseInt((raw ?? '').trim(), 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed >= 1_000_000) return null;
  return parsed;
}

/** Escapa virgolette/backslash per inserire un valore in una filter string Meilisearch tra doppi apici. */
export function escapeMeiliFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Normalizza e deduplica una lista di id numerici (es. blueprint/cardtrader id),
 * accetta solo interi positivi e tronca a MAX_IDS_BATCH.
 */
export function normalizeIdList(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw
    .map((value) => (typeof value === 'number' ? value : parseInt(String(value).trim(), 10)))
    .filter((id) => Number.isInteger(id) && id > 0 && id < Number.MAX_SAFE_INTEGER);
  return Array.from(new Set(ids)).slice(0, MAX_IDS_BATCH);
}

/** Valida il campo di filtro per la ricerca by-ids contro un'allowlist (mai accettare input libero). */
export function normalizeIdFilterField(raw: unknown, fallback = 'cardtrader_id'): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  return ALLOWED_ID_FILTER_FIELDS.has(value) ? value : fallback;
}

export class MeiliFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'MeiliFetchError';
    this.status = status;
  }
}

/**
 * Esegue una fetch verso Meilisearch con timeout duro (AbortController).
 * In caso di timeout lancia MeiliFetchError con status 504, cosi le route
 * possono distinguere "Meilisearch lento/irraggiungibile" da altri errori.
 */
export async function fetchMeiliWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = MEILI_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new MeiliFetchError('Meilisearch timeout', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/** Mappa uno status HTTP di Meilisearch su uno status pubblico sicuro (502/503/504). */
export function publicStatusForMeiliStatus(status: number): number {
  if (status === 504) return 504;
  if (status >= 500) return 503;
  return 502;
}
