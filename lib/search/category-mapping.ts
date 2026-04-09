/**
 * Mapping category_key → category_id per gioco.
 * Label neutrali (senza nome gioco) per UX coerente.
 * 
 * @version 1.0.0
 */

export type GameSlug = 'mtg' | 'pokemon' | 'one-piece' | 'yugioh';

export type CategoryKey =
  | 'singles'
  | 'boosters'
  | 'booster_box'
  | 'starter_precon'
  | 'bundle_set'
  | 'tins'
  | 'accessori'
  | 'collezionabili'
  | 'all';

interface CategoryMappingEntry {
  label_it: string;
  label_en: string;
  ids: number[];
}

type GameCategoryMapping = Record<CategoryKey, CategoryMappingEntry>;

export const CATEGORY_MAPPING: Record<GameSlug, GameCategoryMapping> = {
  mtg: {
    singles: {
      label_it: 'Carte singole',
      label_en: 'Single cards',
      ids: [1, 2, 3],
    },
    boosters: {
      label_it: 'Booster',
      label_en: 'Boosters',
      ids: [5],
    },
    booster_box: {
      label_it: 'Booster box',
      label_en: 'Booster boxes',
      ids: [4],
    },
    starter_precon: {
      label_it: 'Mazzi precostruiti',
      label_en: 'Preconstructed decks',
      ids: [7, 17],
    },
    bundle_set: {
      label_it: 'Bundle e set',
      label_en: 'Bundles and sets',
      ids: [6, 10, 13, 23, 24],
    },
    tins: {
      label_it: 'Tin box',
      label_en: 'Tin boxes',
      ids: [271],
    },
    accessori: {
      label_it: 'Accessori',
      label_en: 'Accessories',
      ids: [12, 15, 16, 19, 20, 21, 22, 25, 26, 203, 205, 211],
    },
    collezionabili: {
      label_it: 'Collezionabili',
      label_en: 'Collectibles',
      ids: [8, 9, 18, 43, 164],
    },
    all: {
      label_it: 'Tutte le categorie',
      label_en: 'All categories',
      ids: [],
    },
  },
  pokemon: {
    singles: {
      label_it: 'Carte singole',
      label_en: 'Single cards',
      ids: [73, 78],
    },
    boosters: {
      label_it: 'Booster',
      label_en: 'Boosters',
      ids: [66, 190],
    },
    booster_box: {
      label_it: 'Booster box',
      label_en: 'Booster boxes',
      ids: [67],
    },
    starter_precon: {
      label_it: 'Mazzi precostruiti',
      label_en: 'Preconstructed decks',
      ids: [69],
    },
    bundle_set: {
      label_it: 'Bundle e set',
      label_en: 'Bundles and sets',
      ids: [68, 136],
    },
    tins: {
      label_it: 'Tin box',
      label_en: 'Tin boxes',
      ids: [59],
    },
    accessori: {
      label_it: 'Accessori',
      label_en: 'Accessories',
      ids: [62, 63, 64, 65, 74, 86, 118, 203, 205, 211],
    },
    collezionabili: {
      label_it: 'Collezionabili',
      label_en: 'Collectibles',
      ids: [60, 61, 117],
    },
    all: {
      label_it: 'Tutte le categorie',
      label_en: 'All categories',
      ids: [],
    },
  },
  'one-piece': {
    singles: {
      label_it: 'Carte singole',
      label_en: 'Single cards',
      ids: [255],
    },
    boosters: {
      label_it: 'Booster',
      label_en: 'Boosters',
      ids: [194],
    },
    booster_box: {
      label_it: 'Booster box',
      label_en: 'Booster boxes',
      ids: [193],
    },
    starter_precon: {
      label_it: 'Mazzi precostruiti',
      label_en: 'Preconstructed decks',
      ids: [195],
    },
    bundle_set: {
      label_it: 'Bundle e set',
      label_en: 'Bundles and sets',
      ids: [200, 201],
    },
    tins: {
      label_it: 'Tin box',
      label_en: 'Tin boxes',
      ids: [256],
    },
    accessori: {
      label_it: 'Accessori',
      label_en: 'Accessories',
      ids: [196, 197, 198, 199, 203, 205, 211],
    },
    collezionabili: {
      label_it: 'Collezionabili',
      label_en: 'Collectibles',
      ids: [253, 257],
    },
    all: {
      label_it: 'Tutte le categorie',
      label_en: 'All categories',
      ids: [],
    },
  },
  yugioh: {
    singles: {
      label_it: 'Carte singole',
      label_en: 'Single cards',
      ids: [44, 76],
    },
    boosters: {
      label_it: 'Booster',
      label_en: 'Boosters',
      ids: [53, 117],
    },
    booster_box: {
      label_it: 'Booster box',
      label_en: 'Booster boxes',
      ids: [54],
    },
    starter_precon: {
      label_it: 'Mazzi precostruiti',
      label_en: 'Preconstructed decks',
      ids: [47, 70],
    },
    bundle_set: {
      label_it: 'Bundle e set',
      label_en: 'Bundles and sets',
      ids: [72],
    },
    tins: {
      label_it: 'Tin box',
      label_en: 'Tin boxes',
      ids: [55],
    },
    accessori: {
      label_it: 'Accessori',
      label_en: 'Accessories',
      ids: [45, 46, 49, 50, 75, 56, 203, 205, 211],
    },
    collezionabili: {
      label_it: 'Collezionabili',
      label_en: 'Collectibles',
      ids: [52],
    },
    all: {
      label_it: 'Tutte le categorie',
      label_en: 'All categories',
      ids: [],
    },
  },
};

/**
 * Ordine di visualizzazione delle categorie nel dropdown.
 * Le più rilevanti per l'utente prima.
 */
export const CATEGORY_KEY_ORDER: CategoryKey[] = [
  'singles',
  'boosters',
  'booster_box',
  'starter_precon',
  'bundle_set',
  'tins',
  'accessori',
  'collezionabili',
  'all',
];

const CATEGORY_KEY_ALIASES: Record<string, CategoryKey> = {
  singles: 'singles',
  singole: 'singles',
  'carte-singole': 'singles',
  booster: 'boosters',
  boosters: 'boosters',
  'booster-box': 'booster_box',
  'booster-boxes': 'booster_box',
  booster_box: 'booster_box',
  'starter-precon': 'starter_precon',
  starter_precon: 'starter_precon',
  'mazzi-precostruiti': 'starter_precon',
  mazzi: 'starter_precon',
  'bundle-set': 'bundle_set',
  bundle_set: 'bundle_set',
  'set-lotti-collezioni': 'bundle_set',
  tins: 'tins',
  'tin-box': 'tins',
  tin: 'tins',
  accessori: 'accessori',
  collezionabili: 'collezionabili',
  all: 'all',
  tutte: 'all',
  'tutte-le-categorie': 'all',
};

/**
 * Normalizza una categoria da URL/UI verso una CategoryKey valida.
 */
export function normalizeCategoryKey(key: string | null | undefined): CategoryKey | null {
  if (!key) return null;
  const normalized = key.toLowerCase().trim();
  if (!normalized) return null;
  if (normalized in CATEGORY_KEY_ALIASES) {
    return CATEGORY_KEY_ALIASES[normalized];
  }
  return null;
}

/**
 * Converte uno slug frontend in GameSlug valido.
 */
export function normalizeGameSlug(slug: string | null | undefined): GameSlug | null {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();
  
  const mapping: Record<string, GameSlug> = {
    mtg: 'mtg',
    magic: 'mtg',
    pokemon: 'pokemon',
    pk: 'pokemon',
    'one-piece': 'one-piece',
    op: 'one-piece',
    yugioh: 'yugioh',
    'yu-gi-oh': 'yugioh',
    ygo: 'yugioh',
  };
  
  return mapping[normalized] || null;
}

/**
 * Ritorna gli ID categoria per un dato gioco e chiave.
 */
export function getCategoryIds(game: GameSlug | null | undefined, key: CategoryKey): number[] {
  if (!game) return [];
  const gameMapping = CATEGORY_MAPPING[game];
  if (!gameMapping) return [];
  return gameMapping[key]?.ids || [];
}

/**
 * Ritorna gli ID categoria aggregati su tutti i giochi per una chiave.
 */
export function getCategoryIdsAcrossGames(key: CategoryKey): number[] {
  if (key === 'all') return [];
  const uniqueIds = new Set<number>();
  const games = Object.keys(CATEGORY_MAPPING) as GameSlug[];
  for (const game of games) {
    const ids = CATEGORY_MAPPING[game][key]?.ids ?? [];
    for (const id of ids) uniqueIds.add(id);
  }
  return Array.from(uniqueIds);
}

/**
 * Ritorna le chiavi categoria disponibili per un gioco.
 */
export function getCategoryKeys(game: GameSlug | null | undefined): CategoryKey[] {
  if (!game) return [];
  const gameMapping = CATEGORY_MAPPING[game];
  if (!gameMapping) return [];
  return CATEGORY_KEY_ORDER.filter((key) => key in gameMapping);
}

/**
 * Ritorna la label localizzata per una categoria.
 */
export function getCategoryLabel(
  game: GameSlug | null | undefined,
  key: CategoryKey,
  lang: 'it' | 'en' = 'it'
): string {
  if (!game) return '';
  const gameMapping = CATEGORY_MAPPING[game];
  if (!gameMapping) return '';
  const entry = gameMapping[key];
  if (!entry) return '';
  return lang === 'en' ? entry.label_en : entry.label_it;
}

/**
 * Mappa category_id singolo a category_key.
 * Utile per backward compatibility.
 */
export function mapCategoryIdToKey(
  game: GameSlug | null | undefined,
  categoryId: number | string
): CategoryKey {
  if (!game) return 'all';
  
  const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
  if (isNaN(id)) return 'all';
  
  const gameMapping = CATEGORY_MAPPING[game];
  if (!gameMapping) return 'all';
  
  for (const key of CATEGORY_KEY_ORDER) {
    const entry = gameMapping[key];
    if (entry && entry.ids.includes(id)) {
      return key;
    }
  }
  
  return 'all';
}

/**
 * Verifica se una category_key è valida per un gioco.
 */
export function isValidCategoryKey(
  game: GameSlug | null | undefined,
  key: string
): key is CategoryKey {
  if (!game) return false;
  const gameMapping = CATEGORY_MAPPING[game];
  if (!gameMapping) return false;
  return key in gameMapping;
}

/**
 * Game slug per Meilisearch API (può differire da frontend slug).
 */
export const GAME_TO_MEILISEARCH: Record<GameSlug, string> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  'one-piece': 'one-piece',
  yugioh: 'yugioh',
};

/**
 * Frontend slug → GameSlug (per GameContext compatibility).
 */
export const FRONTEND_TO_GAME_SLUG: Record<string, GameSlug> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  pk: 'pokemon',
  op: 'one-piece',
  'one-piece': 'one-piece',
  yugioh: 'yugioh',
  'yu-gi-oh': 'yugioh',
  ygo: 'yugioh',
};
