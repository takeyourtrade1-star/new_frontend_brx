import type { ConditionCode } from '@/components/ui/ConditionBadge';
import type { InventoryFilters } from '@/components/feature/account/InventoryFiltersPanel';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { getGameLabel } from '@/lib/product-detail';

const CONDITION_TEXT_TO_CODE: Record<string, ConditionCode> = {
  'Near Mint': 'NM',
  near_mint: 'NM',
  Mint: 'NM',
  mint: 'NM',
  NM: 'NM',
  'Lightly Played': 'SP',
  lightly_played: 'SP',
  LP: 'SP',
  'Slightly Played': 'SP',
  slightly_played: 'SP',
  SP: 'SP',
  'Moderately Played': 'MP',
  moderately_played: 'MP',
  MP: 'MP',
  'Heavily Played': 'PL',
  heavily_played: 'PL',
  Played: 'PL',
  played: 'PL',
  PL: 'PL',
  Damaged: 'PO',
  damaged: 'PO',
  Poor: 'PO',
  poor: 'PO',
  PO: 'PO',
};

/** Chiavi filtro gioco nel pannello → slug inventario/catalogo accettati */
const GAME_FILTER_ALIASES: Record<string, string[]> = {
  mtg: ['mtg'],
  pokemon: ['pokemon', 'pk'],
  'one-piece': ['one-piece', 'onepiece', 'op'],
  yugioh: ['yugioh', 'yu-gi-oh', 'ygo'],
  sealed: ['sealed', 'sealed_products'],
};

const GAME_FILTER_ORDER = ['mtg', 'pokemon', 'one-piece', 'yugioh', 'sealed'] as const;

export type InventoryGameFilterKey = (typeof GAME_FILTER_ORDER)[number];

const LANG_CODE_TO_LABEL: Record<string, string> = {
  en: 'English',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  ja: '日本語',
  jp: '日本語',
};

export function getInventoryLanguageLabel(code: string | null | undefined): string {
  if (code == null || code === '') return '—';
  const c = String(code).toLowerCase().trim();
  return LANG_CODE_TO_LABEL[c] ?? c;
}

export function getInventoryConditionCode(raw: string | null | undefined): ConditionCode | null {
  if (raw == null || raw === '') return null;
  const trimmed = String(raw).trim();
  if (trimmed in CONDITION_TEXT_TO_CODE) {
    return CONDITION_TEXT_TO_CODE[trimmed];
  }
  const lower = trimmed.toLowerCase();
  for (const [key, code] of Object.entries(CONDITION_TEXT_TO_CODE)) {
    if (key.toLowerCase() === lower) return code;
  }
  return null;
}

/** Distingue singole da oggetti sigillati. */
export function getItemKind(item: InventoryItemWithCatalog): 'singole' | 'oggetti' {
  const id = item.card?.id;
  const gameSlug = item.card?.game_slug;
  if (typeof id === 'string' && id.startsWith('sealed_')) return 'oggetti';
  if (gameSlug === 'sealed' || gameSlug === 'sealed_products') return 'oggetti';
  return 'singole';
}

/** Normalizza slug gioco per chiave filtro pannello. */
export function getInventoryGameKey(item: InventoryItemWithCatalog): InventoryGameFilterKey | 'other' {
  if (getItemKind(item) === 'oggetti') return 'sealed';

  const id = item.card?.id;
  if (typeof id === 'string') {
    if (id.startsWith('sealed_')) return 'sealed';
    if (id.startsWith('pk_')) return 'pokemon';
    if (id.startsWith('op_')) return 'one-piece';
    if (id.startsWith('mtg_')) return 'mtg';
  }

  const slug = (item.card?.game_slug ?? '').toLowerCase().trim();
  if (!slug) return 'other';

  for (const [key, aliases] of Object.entries(GAME_FILTER_ALIASES)) {
    if (aliases.includes(slug)) return key as InventoryGameFilterKey;
  }

  if (slug.includes('pokemon') || slug === 'pk') return 'pokemon';
  if (slug.includes('one-piece') || slug === 'op' || slug === 'onepiece') return 'one-piece';
  if (slug.includes('yugioh') || slug === 'ygo') return 'yugioh';
  if (slug === 'mtg') return 'mtg';

  return 'other';
}

export function matchesGameFilter(
  item: InventoryItemWithCatalog,
  filterGame: string
): boolean {
  if (filterGame === 'all') return true;
  const key = getInventoryGameKey(item);
  if (filterGame === 'sealed') return key === 'sealed';
  return key === filterGame;
}

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mc}/gu, '')
    .replace(/\p{Mn}/gu, '');
}

export function matchInventorySearch(item: InventoryItemWithCatalog, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const qNorm = normalizeForSearch(q);
  const condition =
    item.properties && typeof item.properties.condition === 'string'
      ? item.properties.condition
      : '';
  const langCode =
    item.properties && typeof item.properties.mtg_language === 'string'
      ? item.properties.mtg_language
      : '';
  const langLabel = getInventoryLanguageLabel(langCode);
  const localizedNames = (item.card?.keywords_localized ?? [])
    .filter((s): s is string => typeof s === 'string' && String(s).trim().length > 0)
    .join(' ');
  const searchable = [
    item.card?.name ?? '',
    item.card?.set_name ?? '',
    item.card?.rarity ?? '',
    item.card?.collector_number ?? '',
    localizedNames,
    String(item.blueprint_id),
    item.description ?? '',
    condition,
    langLabel,
    langCode,
  ].join(' ');
  const searchableNorm = normalizeForSearch(searchable);
  const parts = qNorm.split(/\s+/).filter(Boolean);
  return parts.every((part) => searchableNorm.includes(part));
}

const CONDITION_ORDER: Record<ConditionCode, number> = {
  NM: 0,
  SP: 1,
  MP: 2,
  PL: 3,
  PO: 4,
};

function sortInventoryItems(
  list: InventoryItemWithCatalog[],
  sortBy: InventoryFilters['sortBy']
): InventoryItemWithCatalog[] {
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case 'price-desc':
        return (b.price_cents ?? 0) - (a.price_cents ?? 0);
      case 'price-asc':
        return (a.price_cents ?? 0) - (b.price_cents ?? 0);
      case 'condition-desc': {
        const aCode = getInventoryConditionCode(
          a.properties?.condition as string | undefined
        );
        const bCode = getInventoryConditionCode(
          b.properties?.condition as string | undefined
        );
        const aO = aCode ? CONDITION_ORDER[aCode] : 99;
        const bO = bCode ? CONDITION_ORDER[bCode] : 99;
        return aO - bO;
      }
      case 'condition-asc': {
        const aCode = getInventoryConditionCode(
          a.properties?.condition as string | undefined
        );
        const bCode = getInventoryConditionCode(
          b.properties?.condition as string | undefined
        );
        const aO = aCode ? CONDITION_ORDER[aCode] : 99;
        const bO = bCode ? CONDITION_ORDER[bCode] : 99;
        return bO - aO;
      }
      case 'name-asc':
        return (a.card?.name ?? '').localeCompare(b.card?.name ?? '');
      case 'name-desc':
        return (b.card?.name ?? '').localeCompare(a.card?.name ?? '');
      case 'date-desc':
        return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
      default:
        return 0;
    }
  });
}

export function applyInventoryFilters(
  items: InventoryItemWithCatalog[],
  filters: InventoryFilters,
  allItemsForDuplicates?: InventoryItemWithCatalog[]
): InventoryItemWithCatalog[] {
  let list = items;
  const fullList = allItemsForDuplicates ?? items;

  if (filters.kind !== 'all') {
    list = list.filter((item) => getItemKind(item) === filters.kind);
  }

  if (filters.game !== 'all') {
    list = list.filter((item) => matchesGameFilter(item, filters.game));
  }

  if (filters.conditions.length > 0) {
    list = list.filter((item) => {
      const code = getInventoryConditionCode(item.properties?.condition as string | undefined);
      return code ? filters.conditions.includes(code) : false;
    });
  }

  if (filters.languages.length > 0) {
    list = list.filter((item) => {
      const lang = item.properties?.mtg_language as string | undefined;
      return lang ? filters.languages.includes(lang.toLowerCase()) : false;
    });
  }

  if (filters.rarities.length > 0) {
    list = list.filter((item) => {
      const rarity = item.card?.rarity;
      return rarity ? filters.rarities.includes(rarity) : false;
    });
  }

  if (filters.priceMin !== null) {
    list = list.filter((item) => (item.price_cents ?? 0) / 100 >= filters.priceMin!);
  }

  if (filters.priceMax !== null) {
    list = list.filter((item) => (item.price_cents ?? 0) / 100 <= filters.priceMax!);
  }

  if (filters.smartFilter === 'duplicates') {
    list = list.filter((item) => {
      const sameBlueprint = fullList.filter((i) => i.blueprint_id === item.blueprint_id);
      return sameBlueprint.length > 1 || (item.quantity ?? 0) > 1;
    });
  }

  if (filters.search.trim()) {
    list = list.filter((item) => matchInventorySearch(item, filters.search));
  }

  return sortInventoryItems(list, filters.sortBy);
}

export type InventoryFacets = {
  games: { key: InventoryGameFilterKey; label: string; count: number }[];
  conditions: { code: ConditionCode; count: number }[];
  languages: { code: string; label: string; count: number }[];
  rarities: { value: string; count: number }[];
  kinds: { all: number; singole: number; oggetti: number };
};

export function buildInventoryFacets(items: InventoryItemWithCatalog[]): InventoryFacets {
  const gameCounts = new Map<InventoryGameFilterKey, number>();
  const conditionCounts = new Map<ConditionCode, number>();
  const languageCounts = new Map<string, number>();
  const rarityCounts = new Map<string, number>();
  let singole = 0;
  let oggetti = 0;

  for (const item of items) {
    const kind = getItemKind(item);
    if (kind === 'oggetti') oggetti++;
    else singole++;

    const gameKey = getInventoryGameKey(item);
    if (gameKey !== 'other') {
      gameCounts.set(gameKey, (gameCounts.get(gameKey) ?? 0) + 1);
    }

    const condCode = getInventoryConditionCode(item.properties?.condition as string | undefined);
    if (condCode) {
      conditionCounts.set(condCode, (conditionCounts.get(condCode) ?? 0) + 1);
    }

    const lang = item.properties?.mtg_language as string | undefined;
    if (lang) {
      const code = lang.toLowerCase().trim();
      languageCounts.set(code, (languageCounts.get(code) ?? 0) + 1);
    }

    const rarity = item.card?.rarity;
    if (rarity) {
      rarityCounts.set(rarity, (rarityCounts.get(rarity) ?? 0) + 1);
    }
  }

  const games = GAME_FILTER_ORDER.filter((key) => (gameCounts.get(key) ?? 0) > 0).map(
    (key) => ({
      key,
      label: getGameFilterLabel(key),
      count: gameCounts.get(key) ?? 0,
    })
  );

  const conditionOrder: ConditionCode[] = ['NM', 'SP', 'MP', 'PL', 'PO'];
  const conditions = conditionOrder
    .filter((code) => (conditionCounts.get(code) ?? 0) > 0)
    .map((code) => ({ code, count: conditionCounts.get(code) ?? 0 }));

  const languages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({
      code,
      label: getInventoryLanguageLabel(code),
      count,
    }));

  const rarities = [...rarityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));

  return {
    games,
    conditions,
    languages,
    rarities,
    kinds: { all: items.length, singole, oggetti },
  };
}

function getGameFilterLabel(key: InventoryGameFilterKey): string {
  switch (key) {
    case 'mtg':
      return 'Magic: The Gathering';
    case 'pokemon':
      return 'Pokémon';
    case 'one-piece':
      return 'One Piece';
    case 'yugioh':
      return 'Yu-Gi-Oh!';
    case 'sealed':
      return 'Sealed / Buste';
    default:
      return getGameLabel(key);
  }
}

/** Rimuove valori filtro non più presenti nei facet (dopo refresh inventario). */
export function sanitizeInventoryFilters(
  filters: InventoryFilters,
  facets: InventoryFacets
): InventoryFilters {
  let next = filters;

  if (filters.game !== 'all' && !facets.games.some((g) => g.key === filters.game)) {
    next = { ...next, game: 'all' };
  }

  const validConditions = new Set(facets.conditions.map((c) => c.code));
  const conditions = filters.conditions.filter((c) => validConditions.has(c));
  if (conditions.length !== filters.conditions.length) {
    next = { ...next, conditions };
  }

  const validLangs = new Set(facets.languages.map((l) => l.code));
  const languages = filters.languages.filter((l) => validLangs.has(l));
  if (languages.length !== filters.languages.length) {
    next = { ...next, languages };
  }

  const validRarities = new Set(facets.rarities.map((r) => r.value));
  const rarities = filters.rarities.filter((r) => validRarities.has(r));
  if (rarities.length !== filters.rarities.length) {
    next = { ...next, rarities };
  }

  if (filters.kind === 'singole' && facets.kinds.singole === 0) {
    next = { ...next, kind: 'all' };
  }
  if (filters.kind === 'oggetti' && facets.kinds.oggetti === 0) {
    next = { ...next, kind: 'all' };
  }

  return next;
}
