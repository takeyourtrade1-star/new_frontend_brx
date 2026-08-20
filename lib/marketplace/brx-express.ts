import type { ListingItem } from '@/lib/api/sync-client';

/**
 * Compatibilita con i nomi usati dalle diverse versioni del backend per
 * indicare che una carta e fisicamente gestita dal fulfillment BRX Express.
 */
export function isBrxExpressListing(item: ListingItem): boolean {
  return Boolean(
    item.is_express ||
      item.express ||
      item.brx_express ||
      item.delivery_speed === 'express' ||
      item.is_tcg_express ||
      item.shipping_method === 'express' ||
      item.shipping_method === 'brx_express'
  );
}
