import { getLoadedDictionary, FALLBACK_DICTIONARY } from './dictionaries';
import { DEFAULT_LOCALE, isUiLocale } from './locales';
import type { MessageKey } from './messages/en';

export function getMessage(
  locale: string,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const loc = isUiLocale(locale) ? locale : DEFAULT_LOCALE;
  // Se la lingua non è ancora stata caricata (lazy), si usa il fallback `en`
  // finché LanguageProvider non completa il caricamento e forza il re-render.
  const table = getLoadedDictionary(loc) ?? FALLBACK_DICTIONARY;
  let raw = table[key] ?? FALLBACK_DICTIONARY[key] ?? String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      raw = raw.split(`{${k}}`).join(String(v));
    }
  }
  return raw;
}
