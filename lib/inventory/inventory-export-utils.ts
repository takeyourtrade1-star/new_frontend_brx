import { getCdnImageUrl } from '@/lib/config';
import { safePublicImageUrl } from '@/lib/security/catalog-public-data';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

export function buildImageUrl(raw: string | null | undefined): string | null {
  return safePublicImageUrl(raw, 'card');
}

export const DEFAULT_IMAGE = getCdnImageUrl('Logo%20Principale%20EBARTEX.png');

export function formatPrice(
  priceCents: number | null | undefined,
  locale: string = 'it-IT'
): string {
  const cents = priceCents ?? 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export const LOW_STOCK_THRESHOLD = 5;

/** Oggetto serializzabile per export CSV/JSON (tutti i campi utili, niente riferimenti circolari). */
export function itemToExportRow(item: InventoryItemWithCatalog): Record<string, unknown> {
  const props = (item.properties as Record<string, unknown>) || {};
  return {
    id: item.id,
    blueprint_id: item.blueprint_id,
    quantity: item.quantity,
    price_cents: item.price_cents,
    price_eur: (item.price_cents ?? 0) / 100,
    condition: props.condition ?? '',
    mtg_language: props.mtg_language ?? '',
    description: item.description ?? '',
    graded: item.graded ?? false,
    external_stock_id: item.external_stock_id ?? '',
    updated_at: item.updated_at ?? '',
    created_at: (item as { created_at?: string }).created_at ?? '',
    name: item.card?.name ?? '',
    set_name: item.card?.set_name ?? '',
    rarity: item.card?.rarity ?? '',
    collector_number: item.card?.collector_number ?? '',
    game_slug: item.card?.game_slug ?? '',
    card_id: item.card?.id ?? '',
  };
}

export function escapeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
