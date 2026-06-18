/** Mapping lingua UI → codice paese ISO per flagcdn.com (come HamburgerMenu). */
export const FLAG_CDN_BASE = 'https://flagcdn.com';

export const LANG_TO_COUNTRY: Record<string, string> = {
  en: 'gb',
  de: 'de',
  es: 'es',
  fr: 'fr',
  it: 'it',
  pt: 'pt',
};

export function langFlagUrl(lang: string, width: 40 | 20 = 40): string {
  const country = LANG_TO_COUNTRY[lang] ?? lang;
  return `${FLAG_CDN_BASE}/w${width}/${country}.png`;
}
