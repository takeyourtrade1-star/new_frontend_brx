/** Sync-style condition codes used in sell-single wizard (maps via condition-map.ts). */
export const SELL_SINGLE_CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'heavily_played', label: 'Heavily Played' },
  { value: 'moderately_played', label: 'Moderately Played' },
  { value: 'lightly_played', label: 'Lightly Played' },
  { value: 'damaged', label: 'Damaged' },
];

export const SELL_SINGLE_CONDITION_IMAGES: Record<string, { front: string; back: string }> = {
  near_mint: { front: '/conditions/near-mint-front.jpeg', back: '/conditions/near-mint-back.jpeg' },
  lightly_played: { front: '/conditions/heavily-played-front.jpeg', back: '/conditions/heavily-played-back.jpeg' },
  moderately_played: { front: '/conditions/moderately-played-front.jpeg', back: '/conditions/moderately-played-back.jpeg' },
  heavily_played: { front: '/conditions/light-played-front.jpeg', back: '/conditions/light-played-back.jpeg' },
  damaged: { front: '/conditions/damaged-front.jpeg', back: '/conditions/damaged-back.jpeg' },
};

export function sellSingleConditionLabel(code: string): string {
  return SELL_SINGLE_CONDITION_OPTIONS.find((o) => o.value === code)?.label ?? 'Near Mint';
}
