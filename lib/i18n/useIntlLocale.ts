'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { isUiLocale, LOCALE_TO_INTL } from './locales';

/**
 * Restituisce il locale BCP 47 (es. 'it-IT', 'de-DE') corrispondente alla
 * lingua UI attiva, da passare a `Intl.*`, `toLocaleString` e ai formatter di
 * `lib/utils.ts`. Fallback su 'it-IT' se la lingua non è una UiLocale nota.
 */
export function useIntlLocale(): string {
  const { selectedLang } = useLanguage();
  return isUiLocale(selectedLang) ? LOCALE_TO_INTL[selectedLang] : LOCALE_TO_INTL.it;
}
