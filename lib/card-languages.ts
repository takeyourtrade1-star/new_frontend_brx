/**
 * Codici lingua carta (Meilisearch / inventario / blueprint) → etichetta e bandiera.
 * Usato in ProductDetailView, inventario, tabella venditori, aste.
 */

export const CARD_LANGUAGE_LABEL_BY_CODE: Readonly<Record<string, string>> = {
  en: 'English',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  ja: '日本語',
  jp: '日本語',
  ko: '한국어',
  kr: '한국어',
  zh: '中文',
  'zh-hans': '中文 (简体)',
  'zh-hant': '中文 (繁體)',
  'zh-cn': '中文 (简体)',
  'zh-tw': '中文 (繁體)',
  ru: 'Русский',
  pl: 'Polski',
  cs: 'Čeština',
  hu: 'Magyar',
  ro: 'Română',
};

const CARD_LANGUAGE_TO_FLAG: Readonly<Record<string, string>> = {
  en: 'GB',
  it: 'IT',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  pt: 'PT',
  ja: 'JP',
  jp: 'JP',
  ko: 'KR',
  kr: 'KR',
  ru: 'RU',
  pl: 'PL',
  cs: 'CZ',
  hu: 'HU',
  ro: 'RO',
  zh: 'CN',
  'zh-hans': 'CN',
  'zh-cn': 'CN',
  'zh-hant': 'TW',
  'zh-tw': 'TW',
};

export type CardLanguageOption = {
  /** Codice conservato per API (primo alias visto in available_languages). */
  code: string;
  /** Chiave canonica per label/flag (es. kr → ko). */
  canonical: string;
  label: string;
  flagCode: string;
};

/** Normalizza per label/flag/dedupe; non altera il valore inviato all’API se si usa `code` grezzo. */
export function normalizeCardLanguageCode(value: string | null | undefined): string {
  const raw = (value ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'jp') return 'ja';
  if (raw === 'kr') return 'ko';
  if (raw === 'zh-cn') return 'zh-hans';
  if (raw === 'zh-tw') return 'zh-hant';
  return raw;
}

export function getCardLanguageLabel(code: string | null | undefined): string {
  if (code == null || code === '') return '—';
  const key = normalizeCardLanguageCode(code);
  return CARD_LANGUAGE_LABEL_BY_CODE[key] ?? CARD_LANGUAGE_LABEL_BY_CODE[code.trim().toLowerCase()] ?? code;
}

export function getCardLanguageFlagCode(code: string | null | undefined): string {
  if (code == null || code === '') return 'GB';
  const key = normalizeCardLanguageCode(code);
  return CARD_LANGUAGE_TO_FLAG[key] ?? key.toUpperCase().slice(0, 2);
}

/**
 * Tutte le lingue disponibili per una carta, senza limite numerico.
 * Deduplica per chiave canonica (es. jp+ja → una voce).
 */
export function buildCardLanguageOptions(
  langs: string[] | undefined | null
): CardLanguageOption[] {
  if (!langs?.length) {
    return [
      {
        code: 'en',
        canonical: 'en',
        label: 'English',
        flagCode: 'GB',
      },
    ];
  }

  const seen = new Set<string>();
  const options: CardLanguageOption[] = [];

  for (const raw of langs) {
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    const canonical = normalizeCardLanguageCode(trimmed);
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    const flagCode = getCardLanguageFlagCode(canonical);
    options.push({
      code: trimmed.toLowerCase(),
      canonical,
      label: getCardLanguageLabel(canonical),
      flagCode,
    });
  }

  return options.length > 0
    ? options
    : [
        {
          code: 'en',
          canonical: 'en',
          label: 'English',
          flagCode: 'GB',
        },
      ];
}
