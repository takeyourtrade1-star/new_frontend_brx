import type { MessageKey } from '@/lib/i18n/messages/en';

/** Chiavi rarità normalizzate (allineate a Scryfall). */
export type RarityKey = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'unknown';

export type RarityDefinition = {
  key: RarityKey;
  color: string;
  labelKey: MessageKey;
  /** Alias in inglese, italiano e varianti Meilisearch. */
  aliases: string[];
};

/** Palette rarità / ricerca avanzata Ebartex. */
export const RARITY_DEFINITIONS: readonly RarityDefinition[] = [
  {
    key: 'common',
    color: '#1a1a1a',
    labelKey: 'searchAdvanced.rarity.common',
    aliases: ['common', 'comune', 'häufig', 'haufig', 'común', 'comun', 'commune', 'comum'],
  },
  {
    key: 'uncommon',
    color: '#707883',
    labelKey: 'searchAdvanced.rarity.uncommon',
    aliases: [
      'uncommon',
      'non comune',
      'non-comune',
      'noncomune',
      'ungewöhnlich',
      'ungewohnlich',
      'peu commune',
      'poco común',
      'poco comun',
      'incomum',
      'incomune',
    ],
  },
  {
    key: 'rare',
    color: '#d7b03e',
    labelKey: 'searchAdvanced.rarity.rare',
    aliases: ['rare', 'rara', 'selten', 'rare'],
  },
  {
    key: 'mythic',
    color: '#e85f1c',
    labelKey: 'searchAdvanced.rarity.mythic',
    aliases: [
      'mythic',
      'mythic rare',
      'mythicrare',
      'rara mitica',
      'rare mythique',
      'rara mítica',
      'rara mitica',
      'mythisch selten',
      'mythisch',
      'mythic rare',
    ],
  },
  {
    key: 'special',
    color: '#c25ae6',
    labelKey: 'searchAdvanced.rarity.special',
    aliases: [
      'special',
      'speciale',
      'spéciale',
      'speciale',
      'especial',
      'spezial',
      'bonus',
      'promo',
      'promotional',
    ],
  },
] as const;

const ALIAS_TO_KEY: Map<string, RarityKey> = new Map();

for (const def of RARITY_DEFINITIONS) {
  for (const alias of def.aliases) {
    ALIAS_TO_KEY.set(normalizeAlias(alias), def.key);
  }
  ALIAS_TO_KEY.set(normalizeAlias(def.key), def.key);
}

function normalizeAlias(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Normalizza stringa rarità da Meilisearch/Scryfall verso una chiave nota. */
export function normalizeRarity(raw?: string | null): RarityKey {
  if (!raw?.trim()) return 'unknown';
  const normalized = normalizeAlias(raw);
  const direct = ALIAS_TO_KEY.get(normalized);
  if (direct) return direct;

  if (normalized.includes('mythic')) return 'mythic';
  if (normalized.includes('uncommon') || normalized.includes('non comune')) return 'uncommon';
  if (normalized.includes('common') || normalized.includes('comune')) return 'common';
  if (normalized.includes('special') || normalized.includes('bonus') || normalized.includes('promo')) {
    return 'special';
  }
  if (normalized.includes('rare') || normalized.includes('rara')) return 'rare';

  return 'unknown';
}

export function getRarityDefinition(key: RarityKey): RarityDefinition | undefined {
  return RARITY_DEFINITIONS.find((d) => d.key === key);
}

export function getRarityInfo(raw?: string | null): {
  key: RarityKey;
  color: string;
  labelKey: MessageKey;
  rawLabel: string | null;
} {
  const key = normalizeRarity(raw);
  const def = getRarityDefinition(key);
  if (def) {
    return { key, color: def.color, labelKey: def.labelKey, rawLabel: raw?.trim() || null };
  }
  return {
    key: 'unknown',
    color: '#9ca3af',
    labelKey: 'rarity.unknown',
    rawLabel: raw?.trim() || null,
  };
}

/** Per filtri avanzati (checkbox con value slug). */
export const RARITY_FILTER_OPTIONS = RARITY_DEFINITIONS.map((d) => ({
  value: d.key,
  labelKey: d.labelKey,
  color: d.color,
}));
