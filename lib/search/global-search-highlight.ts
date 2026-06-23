import type { CardSearchHit, HighlightValue, SupportedLang } from '@/lib/search/global-search-types';

const SUPPORTED_LANGS = new Set(['en', 'de', 'es', 'fr', 'it', 'pt'] as const);
const BACKEND_LANG_ORDER = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;

export const HIGHLIGHT_ORANGE = 'rgba(255, 165, 0, 0.22)';

export function normalizeLang(lang: string): SupportedLang {
  return SUPPORTED_LANGS.has(lang as SupportedLang) ? (lang as SupportedLang) : 'en';
}

function backendIndexForLang(lang: SupportedLang): number {
  return BACKEND_LANG_ORDER.indexOf(lang);
}

export function getMatchedHighlightValueForLang(
  hr: HighlightValue | HighlightValue[] | Record<string, HighlightValue> | undefined,
  selectedLang: string
): string | null {
  if (!hr) return null;
  const lang = normalizeLang(selectedLang);
  if (!Array.isArray(hr) && typeof hr === 'object' && hr !== null && lang in hr) {
    const byLang = hr as Record<string, HighlightValue>;
    const entry = byLang[lang];
    if (entry && entry.matchLevel && entry.matchLevel !== 'none') return entry.value;
    return null;
  }
  if (Array.isArray(hr)) {
    const idx = backendIndexForLang(lang);
    if (idx >= 0 && hr[idx] && hr[idx].matchLevel && hr[idx].matchLevel !== 'none')
      return hr[idx].value;
    return null;
  }
  return null;
}

export function hasNameMatch(hr: HighlightValue | undefined): boolean {
  return Boolean(hr && hr.matchLevel && hr.matchLevel !== 'none');
}

export function getLocalizedNameForLang(
  keywords: string | string[] | Record<string, string> | undefined,
  selectedLang: string
): string | null {
  if (!keywords) return null;
  const lang = normalizeLang(selectedLang);
  if (lang === 'en') return null;
  if (!Array.isArray(keywords) && typeof keywords === 'object' && keywords !== null) {
    const byLang = keywords as Record<string, string>;
    const raw = byLang[lang];
    if (!raw || typeof raw !== 'string') return null;
    return raw.replace(/<[^>]+>/g, '').trim() || null;
  }
  if (Array.isArray(keywords)) {
    const idx = backendIndexForLang(lang);
    if (idx < 0 || !keywords[idx]) return null;
    const raw = keywords[idx];
    return (typeof raw === 'string' ? raw : '').replace(/<[^>]+>/g, '').trim() || null;
  }
  return null;
}

export function getTitleAndSubtitle(hit: CardSearchHit, selectedLang: string) {
  const lang = normalizeLang(selectedLang);
  const hr = hit._highlightResult;
  const nameHighlight = hr?.name as HighlightValue | undefined;
  const keywordsHighlight = hr?.keywords_localized as
    | HighlightValue
    | HighlightValue[]
    | Record<string, HighlightValue>
    | undefined;
  const englishName = hit.name;

  const hasNameMatchResult = hasNameMatch(nameHighlight);
  const keywordsMatchedValue = getMatchedHighlightValueForLang(keywordsHighlight, lang);
  const preferLocalized = lang !== 'en';

  if (preferLocalized) {
    const localizedName =
      keywordsMatchedValue?.trim() || getLocalizedNameForLang(hit.keywords_localized, lang);
    if (localizedName) {
      return {
        titleType: 'localized' as const,
        title: localizedName,
        subtitle: `EN: ${englishName}`,
      };
    }
  }

  if (hasNameMatchResult) {
    return { titleType: 'english' as const, title: null, subtitle: null };
  }

  return { titleType: 'fallback' as const, title: englishName, subtitle: null };
}
