import { syncClient } from '@/lib/api/sync-client';
import {
  cancelListing,
  updateListing,
  type ListingUpdate,
} from '@/lib/api/marketplace-client';
import {
  syncConditionToMarketplace,
  syncLanguageToMarketplace,
} from '@/lib/marketplace/condition-map';
import {
  isMarketplaceInventoryItem,
  type InventoryItemWithCatalog,
} from '@/lib/sync/inventory-types';

export async function deleteInventoryOrListing(
  userId: string,
  item: InventoryItemWithCatalog,
  accessToken: string
): Promise<{ sync_task_id?: string | null; sync_queue_error?: string | null }> {
  if (isMarketplaceInventoryItem(item) && item.marketplace_listing_id) {
    await cancelListing(item.marketplace_listing_id);
    return {};
  }
  return syncClient.deleteInventoryItem(userId, item.id, accessToken);
}

export async function updateInventoryOrListing(
  userId: string,
  item: InventoryItemWithCatalog,
  accessToken: string,
  body: {
    quantity: number;
    price_cents: number;
    condition: string;
    mtg_language: string;
    description: string;
    graded: boolean;
    properties?: Record<string, unknown>;
  }
): Promise<{ sync_task_id?: string | null; sync_queue_error?: string | null }> {
  if (isMarketplaceInventoryItem(item) && item.marketplace_listing_id) {
    const patch: ListingUpdate = {
      quantity: body.quantity,
      price: body.price_cents / 100,
      condition: syncConditionToMarketplace(body.condition),
      language: syncLanguageToMarketplace(body.mtg_language),
      title: body.description || undefined,
    };
    await updateListing(item.marketplace_listing_id, patch);
    return {};
  }
  return syncClient.updateInventoryItem(
    userId,
    item.id,
    {
      quantity: body.quantity,
      price_cents: body.price_cents,
      description: body.description || null,
      graded: body.graded,
      properties: body.properties,
    },
    accessToken
  );
}

export async function updateInventoryOrListingQuantity(
  userId: string,
  item: InventoryItemWithCatalog,
  accessToken: string,
  quantity: number
): Promise<{ sync_task_id?: string | null; sync_queue_error?: string | null }> {
  if (isMarketplaceInventoryItem(item) && item.marketplace_listing_id) {
    await updateListing(item.marketplace_listing_id, { quantity });
    return {};
  }
  return syncClient.updateInventoryItem(userId, item.id, { quantity }, accessToken);
}
