import type { MessageKey } from '@/lib/i18n/messages/en';

/**
 * "Scope" di ricerca contestuale per la barra principale dell'header.
 *
 * Quando l'utente è in un flusso che ha uno scope (es. /aste), accanto al
 * selettore categoria appare un toggle: se attivo, premendo Invio la ricerca
 * viene reindirizzata alla pagina di quel flusso (`buildUrl`) invece di passare
 * dalla ricerca carte (Meilisearch) di default.
 *
 * Struttura volutamente generica: aggiungere un nuovo flusso = aggiungere una
 * voce a SEARCH_SCOPES. Oggi è registrato solo "aste".
 */
export interface SearchScope {
  id: string;
  /** Chiave i18n dell'etichetta mostrata sul toggle (es. "Aste"). */
  labelKey: MessageKey;
  /** True se lo scope è attivo per il pathname corrente. */
  matchesPath: (pathname: string) => boolean;
  /** URL di destinazione quando il toggle è ON e l'utente preme Invio. */
  buildUrl: (query: string) => string;
}

export const SEARCH_SCOPES: SearchScope[] = [
  {
    id: 'aste',
    labelKey: 'search.scopeAuctions',
    matchesPath: (p) => p.startsWith('/aste'),
    buildUrl: (q) => `/aste?q=${encodeURIComponent(q.trim())}`,
  },
];

/** Primo scope il cui pathname combacia, altrimenti null. */
export function getActiveScope(pathname: string): SearchScope | null {
  return SEARCH_SCOPES.find((s) => s.matchesPath(pathname)) ?? null;
}
