import { useCallback, useState } from 'react';
import { syncClient, type ListingItem } from '@/lib/api/sync-client';
import {
  MarketplaceApiError,
  cancelListing,
  updateListing,
} from '@/lib/api/marketplace-client';
import {
  isMarketplaceListingItem,
  listingRowKey,
} from '@/lib/marketplace/listing-map';
import { listingToInventoryEditItem } from '@/lib/product-detail/listing-to-inventory-item';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import type { CardDocument } from '@/lib/product-detail';

/**
 * Piano 1.3 — seam "gestione inserzioni proprie" estratto da ProductDetailView.
 * Raccoglie lo stato dei modali di modifica (inventario sync + marketplace) e i
 * relativi handler (incremento/decremento quantità, cancellazione, submit di
 * modifica). Comportamento identico all'inline precedente; il messaggio di stato
 * condiviso (`listingActionMessage`) resta nel componente e viene passato come
 * `setListingActionMessage`.
 *
 * Nota (correzione piano): il piano cita una "duplicazione di handleOwnerQtyDelta
 * con OggettiContent", ma OggettiContent non ha tale handler — usa gli helper
 * `updateInventoryOrListing`/`deleteInventoryOrListing` tipizzati su
 * `InventoryItemWithCatalog`, mentre qui si opera su `ListingItem` (campo
 * `item_id`, dialoghi di conferma, polling sync). I tipi divergono, quindi la
 * logica è stata spostata fedelmente senza forzare un merge rischioso.
 */

interface UseProductListingActionsArgs {
  userId: string | undefined;
  accessToken: string | null;
  card: CardDocument | undefined;
  refetchListings: () => Promise<void>;
  pollSyncTaskThenRefresh: (taskId: string, accessToken: string) => Promise<void>;
  setListingActionMessage: (message: string | null) => void;
}

export function useProductListingActions({
  userId,
  accessToken,
  card,
  refetchListings,
  pollSyncTaskThenRefresh,
  setListingActionMessage,
}: UseProductListingActionsArgs) {
  const [editingItem, setEditingItem] = useState<InventoryItemWithCatalog | null>(null);
  const [editingMarketplace, setEditingMarketplace] = useState<{
    id: string;
    title: string;
    price: string;
    quantity: number;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  const handleOwnerQtyDelta = useCallback(
    async (item: ListingItem, delta: -1 | 1) => {
      if (!userId || !accessToken) {
        setListingActionMessage('Accedi per gestire le tue inserzioni.');
        return;
      }
      setListingActionMessage(null);
      setRowBusyId(listingRowKey(item));
      try {
        if (isMarketplaceListingItem(item) && item.marketplace_listing_id) {
          if (delta === -1 && item.quantity <= 1) {
            if (
              !confirm(
                'Annullare questa inserzione marketplace? Non sarà più visibile agli acquirenti.',
              )
            ) {
              return;
            }
            await cancelListing(item.marketplace_listing_id);
          } else {
            const nextQty = Math.max(0, item.quantity + delta);
            if (nextQty < 1) return;
            await updateListing(item.marketplace_listing_id, { quantity: nextQty });
          }
          await refetchListings();
          return;
        }

        if (delta === -1 && item.quantity <= 1) {
          if (
            !confirm(
              'Rimuovere questo articolo dall’inventario? Se la sincronizzazione esterna è attiva, verrà aggiornata anche lì.'
            )
          ) {
            return;
          }
          const res = await syncClient.deleteInventoryItem(userId, item.item_id, accessToken);
          await refetchListings();
          if (res.sync_queue_error) setListingActionMessage(res.sync_queue_error);
          else if (res.sync_task_id) void pollSyncTaskThenRefresh(res.sync_task_id, accessToken);
        } else {
          const nextQty = Math.max(0, item.quantity + delta);
          if (nextQty < 1) return;
          const res = await syncClient.updateInventoryItem(
            userId,
            item.item_id,
            { quantity: nextQty },
            accessToken
          );
          await refetchListings();
          if (res.sync_queue_error) setListingActionMessage(res.sync_queue_error);
          else if (res.sync_task_id) void pollSyncTaskThenRefresh(res.sync_task_id, accessToken);
        }
      } catch (e) {
        setListingActionMessage(e instanceof Error ? e.message : 'Operazione non riuscita');
      } finally {
        setRowBusyId(null);
      }
    },
    [userId, accessToken, refetchListings, pollSyncTaskThenRefresh, setListingActionMessage]
  );

  const handleMarketplaceEditSubmit = useCallback(
    async (form: { price: number; quantity: number }) => {
      if (!editingMarketplace) return;
      setSavingEdit(true);
      setListingActionMessage(null);
      try {
        await updateListing(editingMarketplace.id, {
          price: form.price,
          quantity: form.quantity,
        });
        setEditingMarketplace(null);
        await refetchListings();
      } catch (e) {
        const msg =
          e instanceof MarketplaceApiError
            ? e.detail
            : e instanceof Error
              ? e.message
              : 'Salvataggio non riuscito';
        setListingActionMessage(msg);
      } finally {
        setSavingEdit(false);
      }
    },
    [editingMarketplace, refetchListings, setListingActionMessage],
  );

  const handleEditSubmit = useCallback(
    async (form: {
      quantity: number;
      price_cents: number;
      condition: string;
      mtg_language: string;
      description: string;
      graded: boolean;
      signed?: boolean;
      altered?: boolean;
      mtg_foil?: boolean;
    }) => {
      if (!editingItem || !userId || !accessToken) return;
      setSavingEdit(true);
      setListingActionMessage(null);
      try {
        const properties: Record<string, unknown> = {
          ...(editingItem.properties as Record<string, unknown> | undefined),
          condition: form.condition || undefined,
          mtg_language: form.mtg_language || undefined,
          signed: form.signed ?? (editingItem.properties && (editingItem.properties as Record<string, unknown>).signed),
          altered: form.altered ?? (editingItem.properties && (editingItem.properties as Record<string, unknown>).altered),
          mtg_foil: form.mtg_foil ?? (editingItem.properties && (editingItem.properties as Record<string, unknown>).mtg_foil),
        };
        const res = await syncClient.updateInventoryItem(
          userId,
          editingItem.id,
          {
            quantity: form.quantity,
            price_cents: form.price_cents,
            description: form.description || null,
            graded: form.graded,
            properties,
          },
          accessToken
        );
        setEditingItem(null);
        await refetchListings();
        if (res.sync_queue_error) setListingActionMessage(res.sync_queue_error);
        else if (res.sync_task_id) void pollSyncTaskThenRefresh(res.sync_task_id, accessToken);
      } catch (e) {
        setListingActionMessage(e instanceof Error ? e.message : 'Salvataggio non riuscito');
      } finally {
        setSavingEdit(false);
      }
    },
    [editingItem, userId, accessToken, refetchListings, pollSyncTaskThenRefresh, setListingActionMessage]
  );

  const handleMarketplaceOwnerEdit = useCallback(
    (item: ListingItem) => {
      if (isMarketplaceListingItem(item) && item.marketplace_listing_id) {
        setEditingMarketplace({
          id: item.marketplace_listing_id,
          title: item.description?.trim() || card?.name || 'Inserzione marketplace',
          price: (item.price_cents / 100).toFixed(2),
          quantity: item.quantity,
        });
        return;
      }
      setEditingItem(listingToInventoryEditItem(item, card ?? null));
    },
    [card],
  );

  return {
    editingItem,
    editingMarketplace,
    savingEdit,
    rowBusyId,
    setEditingItem,
    setEditingMarketplace,
    handleOwnerQtyDelta,
    handleMarketplaceEditSubmit,
    handleEditSubmit,
    handleMarketplaceOwnerEdit,
  };
}
