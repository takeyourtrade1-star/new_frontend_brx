import type { ListingCreate } from '@/lib/api/marketplace-client';
import {
  syncConditionToMarketplace,
  syncLanguageToMarketplace,
} from '@/lib/marketplace/condition-map';
import type { ScanSessionItem } from '@/hooks/scanner/scanner-types';

export interface ScannerListingGroup {
  itemIds: string[];
  body: ListingCreate;
}

export function parseScannerPrice(raw: string): number {
  const normalized = raw.trim().replace(',', '.').replace(/[^\d.]/g, '');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

export function isScannerItemReadyToPublish(item: ScanSessionItem): boolean {
  return (
    item.status === 'confirmed' &&
    item.sale.publishStatus !== 'published' &&
    item.sale.publishStatus !== 'publishing' &&
    item.sale.selectedCard !== null &&
    Boolean(item.sale.language) &&
    Boolean(item.sale.condition) &&
    Number.isFinite(item.quantity) &&
    item.quantity >= 1 &&
    parseScannerPrice(item.sale.price) > 0
  );
}

/**
 * Copie commercialmente identiche diventano una sola listing con quantità
 * aggregata: meno richieste e nessun costo infrastrutturale aggiuntivo.
 */
export function buildScannerListingGroups(items: ScanSessionItem[]): ScannerListingGroup[] {
  const groups = new Map<string, ScannerListingGroup>();
  for (const item of items) {
    if (!isScannerItemReadyToPublish(item)) continue;
    const card = item.sale.selectedCard;
    if (!card) continue;
    const price = parseScannerPrice(item.sale.price);
    const condition = syncConditionToMarketplace(item.sale.condition);
    const language = syncLanguageToMarketplace(item.sale.language);
    const key = [
      card.cardId,
      card.blueprintId ?? '',
      price.toFixed(2),
      condition,
      language,
    ].join('|');
    const existing = groups.get(key);
    if (existing) {
      existing.itemIds.push(item.id);
      existing.body.quantity += Math.max(1, Math.trunc(item.quantity));
      continue;
    }
    groups.set(key, {
      itemIds: [item.id],
      body: {
        card_id: card.cardId,
        cardtrader_blueprint_id: card.blueprintId,
        title: card.name,
        price,
        quantity: Math.max(1, Math.trunc(item.quantity)),
        condition,
        language,
      },
    });
  }
  return [...groups.values()];
}
