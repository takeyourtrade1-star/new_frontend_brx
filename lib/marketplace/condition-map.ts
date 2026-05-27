import { normalizeCardLanguageCode } from '@/lib/card-languages';
import type { CardCondition } from '@/lib/api/marketplace-client';

export type SyncConditionCode =
  | 'near_mint'
  | 'lightly_played'
  | 'moderately_played'
  | 'heavily_played'
  | 'damaged';

const SYNC_TO_MARKETPLACE: Record<string, CardCondition> = {
  near_mint: 'NM',
  'near mint': 'NM',
  nm: 'NM',
  lightly_played: 'EX',
  'lightly played': 'EX',
  lp: 'EX',
  sp: 'EX',
  slightly_played: 'EX',
  'slightly played': 'EX',
  moderately_played: 'VG',
  'moderately played': 'VG',
  mp: 'VG',
  heavily_played: 'G',
  'heavily played': 'G',
  hp: 'G',
  played: 'G',
  pl: 'G',
  damaged: 'P',
  poor: 'P',
  po: 'P',
  ex: 'EX',
  vg: 'VG',
  g: 'G',
  p: 'P',
};

const MARKETPLACE_TO_SYNC: Record<CardCondition, SyncConditionCode> = {
  NM: 'near_mint',
  EX: 'lightly_played',
  VG: 'moderately_played',
  G: 'heavily_played',
  P: 'damaged',
};

/** Map sync / CardTrader condition strings to marketplace NM|EX|VG|G|P. */
export function syncConditionToMarketplace(
  condition: string | null | undefined,
): CardCondition {
  const key = (condition ?? 'near_mint').trim().toLowerCase().replace(/\s+/g, '_');
  return SYNC_TO_MARKETPLACE[key] ?? 'NM';
}

/** Map marketplace condition back to sync inventory condition code. */
export function marketplaceConditionToSync(condition: CardCondition): SyncConditionCode {
  return MARKETPLACE_TO_SYNC[condition];
}

/** Normalize sync/card language codes for marketplace listing API. */
export function syncLanguageToMarketplace(language: string | null | undefined): string {
  return normalizeCardLanguageCode(language) || 'en';
}
