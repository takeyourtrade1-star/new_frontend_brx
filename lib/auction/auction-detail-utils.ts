import { roundUpToHalfStep } from '@/lib/auction/bid-math';
import { AUCTION_SHIPPING_REST_OF_WORLD_ISO, isEuShippingCountry } from '@/lib/auction/eu-shipping-regions';
import type { AuctionUI } from '@/lib/auction/auction-adapter';
import { formatEur } from '@/lib/utils';

export const PASTEL_GRADIENTS = [
  { gradient: 'from-rose-300/20 via-rose-200/10 to-transparent', border: 'border-rose-300/60', shadow: 'shadow-rose-200/30' },
  { gradient: 'from-sky-300/20 via-sky-200/10 to-transparent', border: 'border-sky-300/60', shadow: 'shadow-sky-200/30' },
  { gradient: 'from-violet-300/20 via-violet-200/10 to-transparent', border: 'border-violet-300/60', shadow: 'shadow-violet-200/30' },
  { gradient: 'from-emerald-300/20 via-emerald-200/10 to-transparent', border: 'border-emerald-300/60', shadow: 'shadow-emerald-200/30' },
  { gradient: 'from-amber-300/20 via-amber-200/10 to-transparent', border: 'border-amber-300/60', shadow: 'shadow-amber-200/30' },
] as const;

export const HEADER_OFFSET = 80;

export const CALENDAR_GLASS_MENU_CLASS =
  'absolute right-0 z-[320] w-60 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-slate-800/95 via-slate-900/93 to-black/92 p-1.5 text-white backdrop-blur-xl backdrop-saturate-150 shadow-[0_26px_60px_rgba(2,6,23,0.58)] ring-1 ring-white/10 animate-orange-menu-enter';
export const CALENDAR_MENU_ITEM_CLASS =
  'flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] transition hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45';
export const CALENDAR_MENU_BADGE_CLASS = 'rounded-md border border-white/30 bg-white/12 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white';

export function sameUserId(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function formatAuctionEur(value: number): string {
  return formatEur(roundUpToHalfStep(value));
}

export function resolveShippingCost(
  detail: AuctionUI,
  viewerCountryRaw: string | null | undefined
): { included: boolean; label: string } {
  if (detail.shippingPayer === 'seller') {
    return { included: true, label: 'Spedizione inclusa' };
  }
  const viewerCountry = (viewerCountryRaw ?? '').toUpperCase();
  const originCountry = (detail.shippingOriginCountry ?? '').toUpperCase();
  if (!viewerCountry) {
    return {
      included: false,
      label:
        detail.shippingEuDefaultEur != null
          ? `Spedizione da ${formatAuctionEur(detail.shippingEuDefaultEur)}`
          : 'Spedizione da definire',
    };
  }
  if (viewerCountry === originCountry && detail.shippingNationalEur != null) {
    return { included: false, label: `Spedizione ${formatAuctionEur(detail.shippingNationalEur)}` };
  }
  const countryOverride = detail.shippingCountryPrices.find((r) => r.country_iso === viewerCountry);
  if (countryOverride) {
    return { included: false, label: `Spedizione ${formatAuctionEur(countryOverride.price_eur)}` };
  }
  if (isEuShippingCountry(viewerCountry)) {
    if (detail.shippingEuDefaultEur != null) {
      return { included: false, label: `Spedizione ${formatAuctionEur(detail.shippingEuDefaultEur)}` };
    }
  } else {
    const restWorld = detail.shippingCountryPrices.find(
      (r) => r.country_iso === AUCTION_SHIPPING_REST_OF_WORLD_ISO
    );
    if (restWorld) {
      return { included: false, label: `Spedizione ${formatAuctionEur(restWorld.price_eur)}` };
    }
    if (detail.shippingEuDefaultEur != null) {
      return { included: false, label: `Spedizione ${formatAuctionEur(detail.shippingEuDefaultEur)}` };
    }
  }
  return { included: false, label: 'Spedizione da definire' };
}

export function formatIcsDateUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function formatGoogleDateUtc(date: Date): string {
  return formatIcsDateUtc(date);
}
