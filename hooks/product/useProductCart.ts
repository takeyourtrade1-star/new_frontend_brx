import { useCallback, useRef, useState } from 'react';
import { type ListingItem } from '@/lib/api/sync-client';
import type { MarketplaceCartLine } from '@/types';
import { buildCartLineFromListingItem } from '@/lib/marketplace/cart-line';
import { listingRowKey } from '@/lib/marketplace/listing-map';
import { listingConditionCode } from '@/lib/product-detail/marketplace-rows';
import { setTradeProposalContext } from '@/lib/scambi/trade-proposal-context';
import { parseBlueprintId } from '@/lib/product-detail/parse-blueprint-id';
import { useTimeoutFn } from '@/lib/hooks/use-timeout-fn';
import type { CardDocument } from '@/lib/product-detail';

/**
 * Piano 1.3 — seam "carrello / acquisto" estratto da ProductDetailView.
 * Raggruppa il popup quantità del lightbox, l'aggiunta al carrello, la proposta
 * di scambio e l'intero flusso "compra ora" (modale demo + conferma). Logica
 * identica all'inline precedente: stessi guard auth, stessa animazione fly-to-cart,
 * stesse cart line.
 */

interface UseProductCartArgs {
  userId: string | undefined;
  accessToken: string | null;
  card: CardDocument | undefined;
  title: string;
  imageSrc: string | null;
  effectiveImageSrc: string;
  cardImages: string[];
  currentImageIndex: number;
  blueprintIdForAuction: number | null;
  flyToCart: (startElement: HTMLElement, options?: { imageSrc?: string }) => void;
  addToCartStore: (line: MarketplaceCartLine) => void;
  createFromCartLines: (
    lines: MarketplaceCartLine[],
    source: 'buy_now',
    options?: { cardId?: string }
  ) => unknown;
  router: { push: (href: string) => void };
  setListingActionMessage: (message: string | null) => void;
}

export function useProductCart({
  userId,
  accessToken,
  card,
  title,
  imageSrc,
  effectiveImageSrc,
  cardImages,
  currentImageIndex,
  blueprintIdForAuction,
  flyToCart,
  addToCartStore,
  createFromCartLines,
  router,
  setListingActionMessage,
}: UseProductCartArgs) {
  const [qtyPopup, setQtyPopup] = useState<{
    open: boolean;
    item?: ListingItem;
    sourceEl?: HTMLElement;
    imageSrc?: string;
  }>({ open: false });
  const [qtyValue, setQtyValue] = useState(1);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const setFocusTimeout = useTimeoutFn();

  const openQtyPopup = useCallback(
    (item: ListingItem, sourceEl: HTMLElement, popupImageSrc?: string) => {
      setQtyPopup({ open: true, item, sourceEl, imageSrc: popupImageSrc });
      setQtyValue(1);
      setFocusTimeout(() => qtyInputRef.current?.focus(), 50);
    },
    [setFocusTimeout]
  );

  const confirmQty = useCallback(() => {
    if (!qtyPopup.item || !qtyPopup.sourceEl) return;
    flyToCart(qtyPopup.sourceEl, { imageSrc: qtyPopup.imageSrc });
    if (qtyPopup.item.item_id > 0 && qtyPopup.item.seller_id !== 'lightbox') {
      const bp = parseBlueprintId(card?.cardtrader_id);
      addToCartStore(
        buildCartLineFromListingItem(qtyPopup.item, qtyValue, {
          title: card?.name ?? qtyPopup.item.seller_display_name,
          imageUrl: qtyPopup.imageSrc ?? imageSrc ?? '',
          blueprintId: bp ?? undefined,
        }),
      );
    }
    setQtyPopup({ open: false });
  }, [qtyPopup, qtyValue, flyToCart, addToCartStore, card, imageSrc]);

  const handleMarketplaceAddToCart = useCallback(
    (item: ListingItem, quantity: number, sourceEl: HTMLElement) => {
      if (!userId || !accessToken) {
        setListingActionMessage('Accedi per aggiungere al carrello.');
        return;
      }
      const rowImageSrc = cardImages[currentImageIndex] || effectiveImageSrc;
      flyToCart(sourceEl, { imageSrc: rowImageSrc });
      addToCartStore(
        buildCartLineFromListingItem(item, quantity, {
          title: card?.name ?? item.seller_display_name,
          imageUrl: rowImageSrc,
          blueprintId: blueprintIdForAuction ?? undefined,
        }),
      );
      setListingActionMessage(null);
    },
    [
      userId,
      accessToken,
      flyToCart,
      cardImages,
      currentImageIndex,
      effectiveImageSrc,
      addToCartStore,
      card?.name,
      blueprintIdForAuction,
      setListingActionMessage,
    ],
  );

  const handleProposeTrade = useCallback(
    (item: ListingItem) => {
      if (!card) return;
      const rowImageSrc = cardImages[currentImageIndex] || effectiveImageSrc;
      const blueprintId = blueprintIdForAuction ?? parseBlueprintId(card.cardtrader_id) ?? 0;
      setTradeProposalContext({
        seller: {
          name: item.seller_display_name,
          isPro: item.seller_account_type === 'business',
          country: item.country ?? null,
        },
        listing: {
          id: listingRowKey(item),
          source: item.listing_source ?? 'sync',
          sellerId: item.seller_id,
          quantity: item.quantity,
        },
        card: {
          blueprintId,
          id: listingRowKey(item),
          name: card.name,
          image: rowImageSrc,
          condition: listingConditionCode(item.condition),
          priceEur: item.price_cents / 100,
          game: card.game_slug ?? null,
        },
      });
      router.push('/scambi/proponi');
    },
    [blueprintIdForAuction, card, cardImages, currentImageIndex, effectiveImageSrc, router],
  );

  // Flusso "compra ora" (modale demo)
  const [purchaseListing, setPurchaseListing] = useState<ListingItem | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);

  const handleMarketplaceBuyNow = useCallback(
    (item: ListingItem, quantity: number) => {
      if (!userId || !accessToken) {
        setListingActionMessage('Accedi per acquistare.');
        return;
      }
      setPurchaseListing(item);
      setPurchaseQty(Math.max(1, Math.min(quantity, item.quantity)));
      setListingActionMessage(null);
    },
    [userId, accessToken, setListingActionMessage],
  );

  const handleConfirmPurchase = useCallback(async () => {
    if (!purchaseListing || !userId || !accessToken) return;
    const safeQty = Math.max(1, Math.min(purchaseQty, purchaseListing.quantity));
    setPurchaseSubmitting(true);
    setListingActionMessage(null);
    try {
      const cartLine = buildCartLineFromListingItem(purchaseListing, safeQty, {
        title: card?.name ?? purchaseListing.seller_display_name ?? title,
        imageUrl: imageSrc ?? '',
        blueprintId: card?.cardtrader_id,
      });
      createFromCartLines([cartLine], 'buy_now', { cardId: card?.id });
      setPurchaseListing(null);
      router.push('/ordini/acquisti?tab=da-pagare');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore durante l\'acquisto demo';
      setListingActionMessage(msg);
    } finally {
      setPurchaseSubmitting(false);
    }
  }, [
    purchaseListing,
    purchaseQty,
    userId,
    accessToken,
    card?.name,
    card?.id,
    card?.cardtrader_id,
    title,
    imageSrc,
    createFromCartLines,
    router,
    setListingActionMessage,
  ]);

  return {
    qtyPopup,
    qtyValue,
    qtyInputRef,
    setQtyValue,
    setQtyPopup,
    openQtyPopup,
    confirmQty,
    handleMarketplaceAddToCart,
    handleProposeTrade,
    purchaseListing,
    purchaseQty,
    purchaseSubmitting,
    setPurchaseListing,
    setPurchaseQty,
    handleMarketplaceBuyNow,
    handleConfirmPurchase,
  };
}
