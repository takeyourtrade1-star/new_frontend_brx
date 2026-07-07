import type { UiLocale } from './locales';
import type { MessageKey } from './messages/en';
import { en } from './messages/en';
import { it } from './messages/it';

export type { MessageKey };

type Dict = Record<MessageKey, string>;

// Bundle iniziale: solo `en` (fallback di default, vedi DEFAULT_LOCALE) e `it`
// (lingua primaria / default della UI). Le altre 4 lingue vengono caricate
// on-demand al primo cambio lingua, così ~66% delle stringhe i18n resta fuori
// dal bundle iniziale senza alcun flash per gli utenti IT/EN.
const loaded: Partial<Record<UiLocale, Dict>> = { en, it };

const loaders: Record<UiLocale, (() => Promise<Dict>) | null> = {
  en: null,
  it: null,
  de: () => import('./messages/de').then((m) => m.de),
  es: () => import('./messages/es').then((m) => m.es),
  fr: () => import('./messages/fr').then((m) => m.fr),
  pt: () => import('./messages/pt').then((m) => m.pt),
};

const inflight: Partial<Record<UiLocale, Promise<Dict>>> = {};

/** Dizionario di fallback, sempre disponibile in modo sincrono. */
export const FALLBACK_DICTIONARY: Dict = en;

/** Restituisce il dizionario già in memoria (sincrono), oppure undefined. */
export function getLoadedDictionary(locale: UiLocale): Dict | undefined {
  return loaded[locale];
}

/**
 * Carica una sola volta il dizionario della lingua richiesta.
 * Risolve immediatamente se già in memoria; deduplica le richieste concorrenti.
 * Se il chunk lazy fallisce (rete), risolve col fallback EN ma NON cachea il
 * fallimento: il prossimo cambio lingua riprova il download.
 */
export async function loadDictionary(locale: UiLocale): Promise<Dict> {
  const cached = loaded[locale];
  if (cached) return cached;

  const loader = loaders[locale];
  if (!loader) return FALLBACK_DICTIONARY;

  if (!inflight[locale]) {
    inflight[locale] = loader()
      .then((dict) => {
        loaded[locale] = dict;
        return dict;
      })
      .catch(() => FALLBACK_DICTIONARY)
      .finally(() => {
        delete inflight[locale];
      });
  }
  return inflight[locale] as Promise<Dict>;
}
