import { DEFAULT_LOCALE, isUiLocale, type UiLocale } from './locales';

/** Lingua salvata (stesso key di LanguageContext), solo nel browser. */
export function readStoredUiLocale(): UiLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const s = localStorage.getItem('ebartex_preferred_language');
    if (s && isUiLocale(s)) return s;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}
