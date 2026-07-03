import type { AuctionCreateDraft, AuctionCreateShippingPayer } from '@/lib/auction/auction-create-draft';

const TTL_MS = 3_600_000;

const RESERVE_ENABLED_KEY = 'ebartex:auction-wizard-reserve-enabled';
const BUY_NOW_ENABLED_KEY = 'ebartex:auction-wizard-buynow-enabled';
const SHIPPING_KEY = 'ebartex:auction-wizard-shipping';

type TimedPayload<T> = T & { expiresAt: number };

function readTimed<T extends Record<string, unknown>>(
  key: string,
  isValid: (value: Record<string, unknown>) => value is T
): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimedPayload<Record<string, unknown>>;
    if (!parsed || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() >= parsed.expiresAt) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    const { expiresAt: _expiresAt, ...rest } = parsed;
    if (!isValid(rest)) return null;
    return rest;
  } catch {
    return null;
  }
}

function writeTimed<T extends Record<string, unknown>>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: TimedPayload<T> = {
      ...value,
      expiresAt: Date.now() + TTL_MS,
    };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* sessionStorage non disponibile */
  }
}

type EnabledPreference = { enabled: boolean };

function isEnabledPreference(value: Record<string, unknown>): value is EnabledPreference {
  return typeof value.enabled === 'boolean';
}

export function readAuctionReserveEnabledPreference(): boolean | null {
  const value = readTimed(RESERVE_ENABLED_KEY, isEnabledPreference);
  return value?.enabled ?? null;
}

export function writeAuctionReserveEnabledPreference(enabled: boolean): void {
  writeTimed(RESERVE_ENABLED_KEY, { enabled });
}

export function clearAuctionReserveEnabledPreference(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(RESERVE_ENABLED_KEY);
  } catch {
    /* sessionStorage non disponibile */
  }
}

export function readAuctionBuyNowEnabledPreference(): boolean | null {
  const value = readTimed(BUY_NOW_ENABLED_KEY, isEnabledPreference);
  return value?.enabled ?? null;
}

export function writeAuctionBuyNowEnabledPreference(enabled: boolean): void {
  writeTimed(BUY_NOW_ENABLED_KEY, { enabled });
}

export function clearAuctionBuyNowEnabledPreference(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(BUY_NOW_ENABLED_KEY);
  } catch {
    /* sessionStorage non disponibile */
  }
}

export type AuctionShippingPreference = {
  shippingPayer: AuctionCreateShippingPayer;
  shippingNationalEur: string;
  shippingEuDefaultEur: string;
  shippingRestOfWorldEur: string;
};

function isShippingPreference(value: Record<string, unknown>): value is AuctionShippingPreference {
  if (value.shippingPayer !== 'buyer' && value.shippingPayer !== 'seller') return false;
  return (
    typeof value.shippingNationalEur === 'string' &&
    typeof value.shippingEuDefaultEur === 'string' &&
    typeof value.shippingRestOfWorldEur === 'string'
  );
}

export function readAuctionShippingPreference(): AuctionShippingPreference | null {
  return readTimed(SHIPPING_KEY, isShippingPreference);
}

export function writeAuctionShippingPreference(pref: AuctionShippingPreference): void {
  writeTimed(SHIPPING_KEY, pref);
}

export function clearAuctionShippingPreference(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SHIPPING_KEY);
  } catch {
    /* sessionStorage non disponibile */
  }
}

export function shippingPreferenceFromDraft(
  draft: Pick<
    AuctionCreateDraft,
    | 'shippingPayer'
    | 'shippingNationalEur'
    | 'shippingEuDefaultEur'
    | 'shippingRestOfWorldEur'
  >
): AuctionShippingPreference {
  return {
    shippingPayer: draft.shippingPayer,
    shippingNationalEur: draft.shippingNationalEur,
    shippingEuDefaultEur: draft.shippingEuDefaultEur,
    shippingRestOfWorldEur: draft.shippingRestOfWorldEur,
  };
}

export function persistAuctionShippingFromDraft(
  draft: Pick<
    AuctionCreateDraft,
    | 'shippingPayer'
    | 'shippingNationalEur'
    | 'shippingEuDefaultEur'
    | 'shippingRestOfWorldEur'
  >
): void {
  writeAuctionShippingPreference(shippingPreferenceFromDraft(draft));
}

/** Applica preferenze wizard (sessionStorage, TTL 1h) al draft iniziale. */
export function mergeAuctionWizardPreferences(draft: AuctionCreateDraft): AuctionCreateDraft {
  const reserveEnabled = readAuctionReserveEnabledPreference();
  const buyNowEnabled = readAuctionBuyNowEnabledPreference();
  const shipping = readAuctionShippingPreference();

  const next: AuctionCreateDraft = {
    ...draft,
    reserveEnabled: draft.reserveEnabled ?? reserveEnabled,
    buyNowEnabled:
      draft.inventoryListPriceEur.trim() !== ''
        ? draft.buyNowEnabled
        : draft.buyNowEnabled ?? buyNowEnabled,
  };

  if (!shipping) return next;

  next.shippingPayer = shipping.shippingPayer;
  if (shipping.shippingPayer === 'buyer') {
    next.shippingNationalEur = shipping.shippingNationalEur;
    next.shippingEuDefaultEur = shipping.shippingEuDefaultEur;
    next.shippingRestOfWorldEur = shipping.shippingRestOfWorldEur;
  }

  return next;
}
