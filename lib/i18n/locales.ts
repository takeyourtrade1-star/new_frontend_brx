/** Lingue allineate a LanguageContext (AVAILABLE_LANGS). */
export const UI_LOCALES = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export const DEFAULT_LOCALE: UiLocale = 'en';

export function isUiLocale(v: string): v is UiLocale {
  return (UI_LOCALES as readonly string[]).includes(v);
}

/** BCP 47 per Intl (numeri, date). */
export const LOCALE_TO_INTL: Record<UiLocale, string> = {
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
};
