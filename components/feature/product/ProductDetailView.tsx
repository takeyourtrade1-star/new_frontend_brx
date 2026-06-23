'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Info, Tag, LineChart } from 'lucide-react';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { getCardImageUrl } from '@/lib/assets';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getGameLabel, buildBreadcrumbsFromCard } from '@/lib/product-detail';
import { resolveSetPageGameSlug } from '@/lib/search/set-page-url';
import { syncClient, type ListingItem } from '@/lib/api/sync-client';
import {
  MarketplaceApiError,
  cancelListing,
  updateListing,
} from '@/lib/api/marketplace-client';
import { buildCartLineFromListingItem } from '@/lib/marketplace/cart-line';
import { useMockPurchaseStore } from '@/lib/stores/mock-purchase-store';
import {
  isMarketplaceListingItem,
  listingRowKey,
} from '@/lib/marketplace/listing-map';
import { MarketplaceListingEditModal } from '@/components/feature/vendite/MarketplaceListingEditModal';
import { buildPriceHistoryPoints } from '@/lib/product-detail/build-price-history-points';
import type { ProductPriceStats } from '@/components/feature/product/ProductPriceChart';
import { listingToInventoryEditItem } from '@/lib/product-detail/listing-to-inventory-item';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { getCdnImageUrl } from '@/lib/config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { COUNTRIES } from '@/lib/registrati/schema';
import { InventoryEditModal } from '@/components/feature/sync/InventoryEditModal';
import type { AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { type CountryOption } from '@/components/ui/CountrySelect';
import { useUserCountry } from '@/lib/hooks/use-user-country';
import { useTimeoutFn } from '@/lib/hooks/use-timeout-fn';
import { useFlyToCart } from '@/lib/hooks/use-fly-to-cart';
import { useCartStore } from '@/lib/stores/cart-store';
import { RarityLegendProvider } from '@/components/ui/RarityLegendProvider';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI } from '@/lib/auction/auction-adapter';
import {
  buildMarketplaceRows,
  filterMarketplaceRows,
  sortMarketplaceRows,
  listingConditionCode,
  type MarketplaceFilterState,
  type MarketplaceSort,
  type SellerTypeFilter,
} from '@/lib/product-detail/marketplace-rows';
import { type ConditionCode } from '@/components/ui/ConditionBadge';
import { shouldOpenVendiTab } from '@/lib/sell-flow/sell-flow';
import { setTradeProposalContext } from '@/lib/scambi/trade-proposal-context';
import {
  EBARTEX_LOGO_PLACEHOLDER,
  ONE_DAY_MS,
  type ProductDetailTabConfig,
  type ProductDetailTabId,
  type ProductDetailViewProps,
} from '@/lib/product-detail/product-detail-view-types';
import { parseBlueprintId } from '@/lib/product-detail/parse-blueprint-id';
import { useProductReprints } from '@/lib/hooks/use-product-reprints';
import { useMarketplaceListings } from '@/lib/hooks/use-marketplace-listings';
import { useAuctionBlueprintInventory } from '@/lib/hooks/use-auction-blueprint-inventory';
import { useEnrichedCardAuctions } from '@/lib/hooks/use-enriched-card-auctions';
import { ProductDetailIconTabBar } from '@/components/feature/product/detail/ProductDetailIconTabBar';
import { ProductDetailTitleSection } from '@/components/feature/product/detail/ProductDetailTitleSection';
import { ProductDetailMobileLayout } from '@/components/feature/product/detail/ProductDetailMobileLayout';
import { ProductDetailInfoTab } from '@/components/feature/product/detail/ProductDetailInfoTab';
import { ProductDetailSellTab } from '@/components/feature/product/detail/ProductDetailSellTab';
import { ProductDetailAuctionTab } from '@/components/feature/product/detail/ProductDetailAuctionTab';
import { ProductDetailChartTab } from '@/components/feature/product/detail/ProductDetailChartTab';
import { ProductDetailMarketplaceSection } from '@/components/feature/product/detail/ProductDetailMarketplaceSection';
import { ProductDetailHoverPreview } from '@/components/feature/product/detail/ProductDetailHoverPreview';
import { ProductDetailLightbox } from '@/components/feature/product/detail/ProductDetailLightbox';
import { ProductDetailQtyPopup } from '@/components/feature/product/detail/ProductDetailQtyPopup';

export function ProductDetailView(props: ProductDetailViewProps) {
  const { card } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabUserOverride = useRef(false);
  const { selectedLang } = useLanguage();
  const { t } = useTranslation();
  const createFromCartLines = useMockPurchaseStore((s) => s.createFromCartLines);
  const displayNames = card ? getCardDisplayNames(card, selectedLang) : null;

  const slug = props.slug ?? card?.id ?? '';
  const title =
    props.title ??
    (displayNames ? displayNames.primary.toUpperCase() : card?.name?.trim() ? card.name.toUpperCase() : "MOWGLI - CUCCIOLO D'UOMO");
  const subtitle =
    props.subtitle ??
    (card && displayNames
      ? (displayNames.secondary ? `${displayNames.secondary} – ${card.set_name}` : card.set_name)
      : card
        ? card.set_name
        : "SUSSURRI NEL POZZO - MOWGLI - MAN CUB - SINGLES");
  const breadcrumbs =
    props.breadcrumbs ??
    (card
      ? buildBreadcrumbsFromCard(card)
      : [
          { label: 'MAGIC: THE GATHERING', href: '#' },
          { label: 'SINGLES', href: '#' },
          { label: 'ECLISSI DI QUALCOSA', href: '#' },
          { label: 'STORMO DELLA SCISSIONE', href: '#' },
        ]);
  const breadcrumbItems: AppBreadcrumbItem[] = breadcrumbs.map((item, index) => ({
    href: item.href,
    label: item.label,
    isCurrent: index === breadcrumbs.length - 1,
  }));
  const imageSrc = props.imageSrc ?? (card?.image != null ? getCardImageUrl(card.image) : null) ?? getCdnImageUrl('kyurem.png');
  const [activeTab, setActiveTab] = useState<ProductDetailTabId>('INFO');

  const handleTabChange = useCallback((id: ProductDetailTabId) => {
    tabUserOverride.current = true;
    setActiveTab(id);
  }, []);

  useEffect(() => {
    if (tabUserOverride.current) return;
    if (shouldOpenVendiTab(searchParams)) {
      setActiveTab('VENDI');
    }
  }, [searchParams]);

  const [mobileReprintsOpen, setMobileReprintsOpen] = useState(false);
  const [sellerSubTab, setSellerSubTab] = useState<'VENDITORI' | 'ASTE' | 'TCG_EXPRESS'>('VENDITORI');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [soloFoil, setSoloFoil] = useState(false);
  const [tipoVenditore, setTipoVenditore] = useState<string | null>(null);
  const [firmata, setFirmata] = useState<'SÌ' | 'NO' | 'ENTRAMBI'>('ENTRAMBI');
  const [alterata, setAlterata] = useState<'SÌ' | 'NO' | 'ENTRAMBI'>('ENTRAMBI');
  const [quantita, setQuantita] = useState(1);
  const [hideAuctions, setHideAuctions] = useState(false);
  const [posizioneVenditore, setPosizioneVenditore] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.getBoundingClientRect().height);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const user = useAuthStore((s) => s.user);
  const accessTokenFromStore = useAuthStore((s) => s.accessToken);
  const accessToken = useMemo(
    () =>
      accessTokenFromStore ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('ebartex_access_token')
        : null),
    [accessTokenFromStore]
  );
  const flyToCart = useFlyToCart();
  const addToCartStore = useCartStore((s) => s.addItem);
  const detectedCountry = useUserCountry();

  const [qtyPopup, setQtyPopup] = useState<{ open: boolean; item?: ListingItem; sourceEl?: HTMLElement; imageSrc?: string }>({ open: false });
  const [qtyValue, setQtyValue] = useState(1);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const setFocusTimeout = useTimeoutFn();

  const openQtyPopup = useCallback((item: ListingItem, sourceEl: HTMLElement, popupImageSrc?: string) => {
    setQtyPopup({ open: true, item, sourceEl, imageSrc: popupImageSrc });
    setQtyValue(1);
    setFocusTimeout(() => qtyInputRef.current?.focus(), 50);
  }, [setFocusTimeout]);

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

  const blueprintIdForAuction = useMemo(
    () => parseBlueprintId(card?.cardtrader_id),
    [card?.cardtrader_id]
  );

  const { auctionInventoryItems, auctionInventoryLoading } = useAuctionBlueprintInventory(
    user?.id,
    accessToken,
    blueprintIdForAuction
  );

  const {
    listings,
    listingsLoading,
    listingsError,
    refetchListings,
    pollSyncTaskThenRefresh,
  } = useMarketplaceListings(blueprintIdForAuction, card?.id);

  const [listingsSort, setListingsSort] = useState<MarketplaceSort>('price_asc');
  const [condizioneMinima, setCondizioneMinima] = useState<ConditionCode | null>(null);
  const [linguaCarta, setLinguaCarta] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItemWithCatalog | null>(null);
  const [editingMarketplace, setEditingMarketplace] = useState<{
    id: string;
    title: string;
    price: string;
    quantity: number;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [listingActionMessage, setListingActionMessage] = useState<string | null>(null);
  const [purchaseListing, setPurchaseListing] = useState<ListingItem | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const [showChart, setShowChart] = useState(false);
  const [chartStats, setChartStats] = useState<ProductPriceStats | null>(null);
  const [hoverPreviewOpen, setHoverPreviewOpen] = useState(false);
  const hoverPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { reprints, reprintsLoading, reprintsDegraded } = useProductReprints(card);

  useEffect(() => {
    const timer = setTimeout(() => setFiltersOpen(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // FE-REV-010: il timeout di chiusura hover preview va pulito allo smontaggio per evitare setState post-unmount.
  useEffect(() => {
    return () => {
      if (hoverPreviewTimeoutRef.current) clearTimeout(hoverPreviewTimeoutRef.current);
    };
  }, []);

  const countryOptions: CountryOption[] = useMemo(
    () => [
      { code: '', label: t('productDetail.filters.allCountries'), flagCode: 'EU' },
      ...COUNTRIES.map((c) => ({
        code: c.code,
        label: c.label,
        flagCode: c.code,
      })),
    ],
    [t]
  );

  const isOwnListing = useCallback(
    (item: ListingItem) => Boolean(user?.id && String(user.id) === String(item.seller_id)),
    [user?.id]
  );

  const handleOwnerQtyDelta = useCallback(
    async (item: ListingItem, delta: -1 | 1) => {
      if (!user?.id || !accessToken) {
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
          const res = await syncClient.deleteInventoryItem(user.id, item.item_id, accessToken);
          await refetchListings();
          if (res.sync_queue_error) setListingActionMessage(res.sync_queue_error);
          else if (res.sync_task_id) void pollSyncTaskThenRefresh(res.sync_task_id, accessToken);
        } else {
          const nextQty = Math.max(0, item.quantity + delta);
          if (nextQty < 1) return;
          const res = await syncClient.updateInventoryItem(
            user.id,
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
    [user?.id, accessToken, refetchListings, pollSyncTaskThenRefresh]
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
    [editingMarketplace, refetchListings],
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
      if (!editingItem || !user?.id || !accessToken) return;
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
          user.id,
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
    [editingItem, user?.id, accessToken, refetchListings, pollSyncTaskThenRefresh]
  );

  const handleConfirmPurchase = useCallback(async () => {
    if (!purchaseListing || !user?.id || !accessToken) return;
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
    user?.id,
    accessToken,
    card?.name,
    card?.id,
    card?.cardtrader_id,
    title,
    imageSrc,
    createFromCartLines,
    router,
  ]);

  // FE-REV-003: imposta il default paese una sola volta, al primo valore disponibile (user o geo).
  // Senza questo guard, la risoluzione tardiva di user/geo sovrascriveva la scelta manuale dell'utente.
  const countryInitializedRef = useRef(false);
  useEffect(() => {
    if (countryInitializedRef.current) return;
    const next = user?.country || detectedCountry;
    if (!next) return;
    countryInitializedRef.current = true;
    setPosizioneVenditore(next);
  }, [user?.country, detectedCountry]);

  const showImagePlaceholder = imageError || !imageSrc;
  const effectiveImageSrc = showImagePlaceholder ? '' : imageSrc;
  const isLocalImage = effectiveImageSrc.startsWith('/') && !effectiveImageSrc.startsWith('//');
  const gameLabel = card ? getGameLabel(card.game_slug) : null;

  const setCatalogHref = useMemo(() => {
    if (!card) return null;
    const name = card.set_name?.trim();
    if (!name) return null;
    const params = new URLSearchParams();
    params.set('game', (card.game_slug ?? 'mtg').trim().toLowerCase() || 'mtg');
    params.set('set', name);
    return `/set?${params.toString()}`;
  }, [card]);

  const reprintsAllHref = useMemo(() => {
    if (!card?.name?.trim()) return null;
    const params = new URLSearchParams();
    params.set('q', card.name.trim());
    const game = resolveSetPageGameSlug(card.game_slug);
    if (game) params.set('game', game);
    return `/search?${params.toString()}`;
  }, [card]);

  const cardNameForAuctions = card?.name?.trim() ?? '';
  const cardAuctionsQuery = useAuctionList(
    { q: cardNameForAuctions || undefined, status: 'ACTIVE', limit: 20 },
    { enabled: cardNameForAuctions.length > 0 }
  );

  const baseCardAuctions = useMemo(
    () => (cardAuctionsQuery.data?.data ?? []).map((a) => apiToAuctionUI(a)),
    [cardAuctionsQuery.data]
  );
  const enrichedCardAuctions = useEnrichedCardAuctions(baseCardAuctions);

  const marketplaceFilters: MarketplaceFilterState = useMemo(
    () => ({
      hideAuctions,
      condizioneMinima,
      linguaCarta,
      soloFoil,
      firmata,
      alterata,
      quantitaMin: quantita,
      posizioneVenditore,
      tipoVenditore: tipoVenditore as SellerTypeFilter | null,
    }),
    [
      hideAuctions,
      condizioneMinima,
      linguaCarta,
      soloFoil,
      firmata,
      alterata,
      quantita,
      posizioneVenditore,
      tipoVenditore,
    ]
  );

  const sortedMarketplaceRows = useMemo(() => {
    const built = buildMarketplaceRows(enrichedCardAuctions, listings);
    const filtered = filterMarketplaceRows(built, marketplaceFilters);
    return sortMarketplaceRows(filtered, listingsSort, hideAuctions, isOwnListing);
  }, [enrichedCardAuctions, listings, marketplaceFilters, listingsSort, hideAuctions, isOwnListing]);

  const marketplaceEmptyMessage = useMemo(() => {
    if (listings.length === 0 && enrichedCardAuctions.length === 0) {
      return 'Presto ci saranno articoli in vendita disponibili.';
    }
    if (sortedMarketplaceRows.length === 0) {
      return t('productDetail.marketplace.emptyFiltered');
    }
    return undefined;
  }, [listings.length, enrichedCardAuctions.length, sortedMarketplaceRows.length, t]);

  const formatEuro = (n: number) => formatEuroNoSpace(n, 'it-IT');

  const cardsInSaleCount = useMemo(
    () => listings.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0),
    [listings]
  );
  const cardsInSaleLabel = listingsLoading ? '…' : new Intl.NumberFormat('it-IT').format(cardsInSaleCount);

  const defaultTrendStats = useMemo<ProductPriceStats>(() => {
    const points = buildPriceHistoryPoints(slug);
    const end = points[points.length - 1]?.t ?? Date.now();
    const start = end - 7 * ONE_DAY_MS;
    const rangePoints = points.filter((point) => point.t >= start && point.t <= end);
    const safePoints = rangePoints.length > 0 ? rangePoints : points.slice(-7);
    const trendPrice = safePoints[safePoints.length - 1]?.price ?? card?.market_price ?? 0;
    const soldCopies = safePoints.reduce((acc, point) => acc + (point.sales ?? 0), 0);
    const averageSalePrice =
      safePoints.length > 0
        ? safePoints.reduce((acc, point) => acc + point.price, 0) / safePoints.length
        : card?.market_price ?? 0;
    return {
      trendPrice,
      soldCopies,
      averageSalePrice,
      rangeLabel: 'Ultimi 7 giorni',
    };
  }, [slug, card?.market_price]);

  const effectiveTrendStats = chartStats ?? defaultTrendStats;
  const trendPriceValue = effectiveTrendStats.trendPrice;
  const soldCopiesValue = effectiveTrendStats.soldCopies;
  const averageSalePriceValue = effectiveTrendStats.averageSalePrice;
  const trendRangeLabel = effectiveTrendStats.rangeLabel;

  const handleSellSinglePublished = useCallback(async () => {
    setListingActionMessage('Inserzione pubblicata con successo.');
    setSellerSubTab('VENDITORI');
    await refetchListings();
    requestAnimationFrame(() => {
      document
        .getElementById('pd-market-panel-VENDITORI')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [refetchListings]);

  const cardImages = useMemo(() => {
    return [effectiveImageSrc];
  }, [effectiveImageSrc]);

  const handleMarketplaceAddToCart = useCallback(
    (item: ListingItem, quantity: number, sourceEl: HTMLElement) => {
      if (!user || !accessToken) {
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
      user,
      accessToken,
      flyToCart,
      cardImages,
      currentImageIndex,
      effectiveImageSrc,
      addToCartStore,
      card?.name,
      blueprintIdForAuction,
    ],
  );

  const handleMarketplaceBuyNow = useCallback(
    (item: ListingItem, quantity: number) => {
      if (!user || !accessToken) {
        setListingActionMessage('Accedi per acquistare.');
        return;
      }
      setPurchaseListing(item);
      setPurchaseQty(Math.max(1, Math.min(quantity, item.quantity)));
      setListingActionMessage(null);
    },
    [user, accessToken],
  );

  const handleProposeTrade = useCallback(
    (item: ListingItem) => {
      if (!card) return;
      const rowImageSrc = cardImages[currentImageIndex] || effectiveImageSrc;
      setTradeProposalContext({
        seller: {
          name: item.seller_display_name,
          isPro: item.seller_account_type === 'business',
          country: item.country ?? null,
        },
        card: {
          id: `product-${card.id}`,
          name: card.name,
          image: rowImageSrc,
          condition: listingConditionCode(item.condition),
          priceEur: item.price_cents / 100,
          game: card.game_slug ?? null,
        },
      });
      router.push('/scambi/proponi');
    },
    [card, cardImages, currentImageIndex, effectiveImageSrc, router],
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

  const handleLightboxOpen = () => setIsLightboxOpen(true);
  const handleLightboxClose = () => setIsLightboxOpen(false);
  const handleHoverPreviewOpen = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return;
    if (hoverPreviewTimeoutRef.current) {
      clearTimeout(hoverPreviewTimeoutRef.current);
      hoverPreviewTimeoutRef.current = null;
    }
    setHoverPreviewOpen(true);
  };
  const handleHoverPreviewClose = () => {
    hoverPreviewTimeoutRef.current = setTimeout(() => {
      setHoverPreviewOpen(false);
    }, 250);
  };
  const handleHoverPreviewCancelClose = () => {
    if (hoverPreviewTimeoutRef.current) {
      clearTimeout(hoverPreviewTimeoutRef.current);
      hoverPreviewTimeoutRef.current = null;
    }
    setHoverPreviewOpen(true);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev: number) => (prev === 0 ? cardImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev: number) => (prev === cardImages.length - 1 ? 0 : prev + 1));
  };

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `Check out ${title} on Ebartex!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copiato negli appunti!');
      } catch {
        // Clipboard failed
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    // FE-REV-011: usa null-check esplicito così uno swipe che parte dal bordo (clientX === 0) non viene scartato.
    if (touchStartX == null || touchEndX == null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNextImage();
    } else if (distance < -minSwipeDistance) {
      handlePrevImage();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const tabs: ProductDetailTabConfig[] = [
    { id: 'INFO', label: 'INFO', mobileLabel: 'INFO', icon: Info },
    { id: 'VENDI', label: 'VENDI', mobileLabel: 'VENDI', icon: Tag },
    { id: 'ASTA', label: "METTI ALL'ASTA", mobileLabel: "METTI ALL'ASTA", icon: AuctionGavelIcon },
    { id: 'GRAFICO', label: 'GRAFICO PREZZI', mobileLabel: 'GRAFICO', icon: LineChart },
  ];

  return (
    <RarityLegendProvider>
      <div className="min-h-screen font-sans bg-[#F0F0F0] text-gray-900">
        <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
          <Header />
        </Suspense>

        <ProductDetailTitleSection
          title={title}
          subtitle={subtitle}
          card={card}
          breadcrumbItems={breadcrumbItems}
          onShare={handleShare}
        />

        <section className="w-full bg-[#F0F0F0] px-0 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 pb-4 sm:pb-6 min-h-0">
          <div className="container-content container-content-card-detail">
            <div
              className={cn(
                'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/95 backdrop-blur-[2px] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.06)] sm:flex-row',
                activeTab === 'ASTA'
                  ? 'sm:min-h-[420px]'
                  : activeTab === 'INFO' || activeTab === 'GRAFICO' || activeTab === 'VENDI'
                    ? 'sm:min-h-[320px] sm:h-auto'
                    : 'sm:h-[320px]'
              )}
            >
              <ProductDetailMobileLayout
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                card={card}
                title={title}
                slug={slug}
                blueprintIdForAuction={blueprintIdForAuction}
                showImagePlaceholder={showImagePlaceholder}
                effectiveImageSrc={effectiveImageSrc}
                isLocalImage={isLocalImage}
                onImageError={() => setImageError(true)}
                onLightboxOpen={handleLightboxOpen}
                onSellSinglePublished={() => void handleSellSinglePublished()}
                auctionInventoryLoading={auctionInventoryLoading}
                auctionInventoryItems={auctionInventoryItems}
                onAuctionCancel={() => setActiveTab('INFO')}
                inventoryLoadingLabel={t('accountPage.itemsLoadingInventory')}
                trendRangeLabel={trendRangeLabel}
                formatEuro={formatEuro}
                trendPriceValue={trendPriceValue}
                soldCopiesValue={soldCopiesValue}
                averageSalePriceValue={averageSalePriceValue}
                onChartStatsChange={setChartStats}
                setCatalogHref={setCatalogHref}
                cardsInSaleLabel={cardsInSaleLabel}
                mobileReprintsOpen={mobileReprintsOpen}
                onMobileReprintsToggle={() => setMobileReprintsOpen((open) => !open)}
                hideReprintsLabel={t('productDetail.mobile.hideReprints')}
                showReprintsLabel={t('productDetail.mobile.showReprints')}
                reprints={reprints}
                reprintsLoading={reprintsLoading}
                reprintsDegraded={reprintsDegraded}
                reprintsAllHref={reprintsAllHref}
              />

              <aside className="hidden w-[180px] flex-shrink-0 flex-col items-center justify-center border-r border-zinc-200/50 bg-gradient-to-br from-zinc-50/80 via-white to-zinc-100/60 p-4 sm:flex sm:h-full md:w-[200px] lg:w-[220px]">
                <div
                  className="relative flex w-full max-w-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-300/50 bg-zinc-100/60 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md md:max-w-[200px] md:max-h-[360px] lg:max-w-[220px] lg:max-h-[420px] sm:max-h-[300px]"
                  style={{ aspectRatio: '63/88' }}
                  onClick={handleLightboxOpen}
                  onMouseEnter={handleHoverPreviewOpen}
                  onMouseLeave={handleHoverPreviewClose}
                  role="button"
                  aria-label="Clicca per ingrandire l'immagine"
                >
                  {showImagePlaceholder ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                      <Image src={EBARTEX_LOGO_PLACEHOLDER} alt="Ebartex" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" unoptimized={false} />
                      <p className="mt-2 text-[10px] font-medium leading-tight text-gray-600">Immagine non disponibile</p>
                    </div>
                  ) : isLocalImage ? (
                    <Image
                      src={effectiveImageSrc}
                      alt={card?.name ?? title}
                      fill
                      className="object-contain"
                      sizes="220px"
                      unoptimized={false}
                      onError={() => setImageError(true)}
                      priority
                    />
                  ) : (
                    <Image
                      src={effectiveImageSrc}
                      alt={card?.name ?? title}
                      fill
                      className="object-contain"
                      sizes="220px"
                      unoptimized
                      onError={() => setImageError(true)}
                      priority
                    />
                  )}
                </div>
              </aside>

              <div id="product-detail-tab-panel" className="hidden min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50/80 sm:flex sm:h-full">
                <ProductDetailIconTabBar
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  className="hidden sm:flex"
                />

                {activeTab === 'INFO' && (
                  <ProductDetailInfoTab
                    card={card}
                    slug={slug}
                    gameLabel={gameLabel}
                    setCatalogHref={setCatalogHref}
                    cardsInSaleLabel={cardsInSaleLabel}
                    reprints={reprints}
                    reprintsLoading={reprintsLoading}
                    reprintsDegraded={reprintsDegraded}
                    reprintsAllHref={reprintsAllHref}
                    showChart={showChart}
                    onShowChartToggle={() => setShowChart((v) => !v)}
                    trendRangeLabel={trendRangeLabel}
                    formatEuro={formatEuro}
                    trendPriceValue={trendPriceValue}
                    soldCopiesValue={soldCopiesValue}
                    averageSalePriceValue={averageSalePriceValue}
                    onChartStatsChange={setChartStats}
                  />
                )}

                {activeTab === 'VENDI' && (
                  <ProductDetailSellTab
                    card={card}
                    slug={slug}
                    blueprintIdForAuction={blueprintIdForAuction}
                    showChart={showChart}
                    onShowChartToggle={() => setShowChart((v) => !v)}
                    trendRangeLabel={trendRangeLabel}
                    formatEuro={formatEuro}
                    trendPriceValue={trendPriceValue}
                    soldCopiesValue={soldCopiesValue}
                    averageSalePriceValue={averageSalePriceValue}
                    onChartStatsChange={setChartStats}
                    onSellSinglePublished={() => void handleSellSinglePublished()}
                  />
                )}

                {activeTab === 'ASTA' && (
                  <ProductDetailAuctionTab
                    card={card}
                    blueprintIdForAuction={blueprintIdForAuction}
                    auctionInventoryLoading={auctionInventoryLoading}
                    auctionInventoryItems={auctionInventoryItems}
                    inventoryLoadingLabel={t('accountPage.itemsLoadingInventory')}
                    onAuctionCancel={() => setActiveTab('INFO')}
                  />
                )}

                {activeTab === 'GRAFICO' && (
                  <ProductDetailChartTab
                    slug={slug}
                    trendRangeLabel={trendRangeLabel}
                    formatEuro={formatEuro}
                    trendPriceValue={trendPriceValue}
                    soldCopiesValue={soldCopiesValue}
                    onChartStatsChange={setChartStats}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <ProductDetailMarketplaceSection
          filtersOpen={filtersOpen}
          onFiltersOpen={() => setFiltersOpen(true)}
          onFiltersClose={() => setFiltersOpen(false)}
          sellerSubTab={sellerSubTab}
          onSellerSubTabChange={setSellerSubTab}
          hideAuctions={hideAuctions}
          onHideAuctionsChange={setHideAuctions}
          listingsSort={listingsSort}
          onListingsSortChange={setListingsSort}
          countryOptions={countryOptions}
          posizioneVenditore={posizioneVenditore}
          onPosizioneVenditoreChange={setPosizioneVenditore}
          tipoVenditore={tipoVenditore}
          onTipoVenditoreChange={setTipoVenditore}
          condizioneMinima={condizioneMinima}
          onCondizioneMinimaChange={setCondizioneMinima}
          linguaCarta={linguaCarta}
          onLinguaCartaChange={setLinguaCarta}
          firmata={firmata}
          onFirmataChange={setFirmata}
          alterata={alterata}
          onAlterataChange={setAlterata}
          quantita={quantita}
          onQuantitaChange={setQuantita}
          soloFoil={soloFoil}
          onSoloFoilChange={setSoloFoil}
          sortLabel={t('productDetail.sort.label')}
          sortPriceAsc={t('productDetail.sort.priceAsc')}
          sortPriceDesc={t('productDetail.sort.priceDesc')}
          sortSeller={t('productDetail.sort.seller')}
          sortCondition={t('productDetail.sort.condition')}
          hideAuctionsLabel={t('productDetail.filters.hideAuctions')}
          minConditionLabel={t('productDetail.filters.minCondition')}
          anyFilterLabel={t('productDetail.filters.any')}
          cardLanguageLabel={t('productDetail.filters.cardLanguage')}
          tabsAriaLabel={t('productDetail.tabs.ariaLabel')}
          inVenditaLabel={t('productDetail.tabs.inVendita')}
          asteLabel={t('productDetail.tabs.aste')}
          brxExpressLabel={t('productDetail.tabs.brxExpress')}
          brxNewLabel={t('productDetail.tabs.brxNew')}
          tabsHint={t('productDetail.tabs.hint')}
          listingActionMessage={listingActionMessage}
          sortedMarketplaceRows={sortedMarketplaceRows}
          listingsLoading={listingsLoading}
          auctionsLoading={cardAuctionsQuery.isLoading}
          listingsError={listingsError}
          marketplaceEmptyMessage={marketplaceEmptyMessage}
          card={card}
          cardImageSrc={cardImages[currentImageIndex]}
          onAddToCart={handleMarketplaceAddToCart}
          onBuyNow={handleMarketplaceBuyNow}
          onProposeTrade={handleProposeTrade}
          isOwnListing={isOwnListing}
          onOwnerEdit={handleMarketplaceOwnerEdit}
          onOwnerQuantityChange={handleOwnerQtyDelta}
          rowBusyId={rowBusyId}
        />

        {editingItem && (
          <InventoryEditModal
            item={editingItem}
            onClose={() => {
              setEditingItem(null);
              setListingActionMessage(null);
            }}
            onSubmit={handleEditSubmit}
            saving={savingEdit}
          />
        )}

        {editingMarketplace && (
          <MarketplaceListingEditModal
            listing={editingMarketplace}
            onClose={() => {
              setEditingMarketplace(null);
              setListingActionMessage(null);
            }}
            onSubmit={handleMarketplaceEditSubmit}
            saving={savingEdit}
          />
        )}

        {purchaseListing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pd-purchase-modal-title"
          >
            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
              <h2 id="pd-purchase-modal-title" className="mb-1 text-lg font-semibold text-gray-900">
                {t('mockCheckout.confirmOrder')}
              </h2>
              <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                <span className="mr-1 inline-flex rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  DEMO
                </span>
                {t('mockCheckout.demoDisclaimer')}
              </div>
              <p className="mb-4 text-sm text-gray-600">
                {card?.name ?? purchaseListing.seller_display_name}
              </p>
              <div className="mb-3 text-sm text-gray-600">
                Carte in vendita: <span className="font-semibold">{purchaseListing.quantity}</span>
              </div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Quantità</label>
              <input
                type="number"
                min={1}
                max={purchaseListing.quantity}
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(Number(e.target.value) || 1)}
                className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
                <button
                  type="button"
                  onClick={() => setPurchaseListing(null)}
                  className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={purchaseSubmitting}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmPurchase()}
                  disabled={purchaseSubmitting}
                  className="rounded bg-[#FF7300] px-4 py-2 text-sm font-medium text-white hover:bg-[#e56500] disabled:opacity-50"
                >
                  {purchaseSubmitting ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                  {t('mockCheckout.confirmOrder')}
                </button>
              </div>
            </div>
          </div>
        )}

        <ProductDetailHoverPreview
          open={hoverPreviewOpen}
          headerHeight={headerHeight}
          showImagePlaceholder={showImagePlaceholder}
          cardImages={cardImages}
          currentImageIndex={currentImageIndex}
          cardName={card?.name}
          title={title}
          onMouseEnter={handleHoverPreviewCancelClose}
          onMouseLeave={handleHoverPreviewClose}
        />

        <ProductDetailLightbox
          isOpen={isLightboxOpen}
          lightboxRef={lightboxRef}
          headerHeight={headerHeight}
          showImagePlaceholder={showImagePlaceholder}
          cardImages={cardImages}
          currentImageIndex={currentImageIndex}
          cardName={card?.name}
          title={title}
          buyNowLabel={t('productDetail.buyNow')}
          onClose={handleLightboxClose}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onPrevImage={handlePrevImage}
          onNextImage={handleNextImage}
          onShare={handleShare}
          onOpenQtyPopup={openQtyPopup}
        />

        <ProductDetailQtyPopup
          open={qtyPopup.open}
          qtyValue={qtyValue}
          qtyInputRef={qtyInputRef}
          onClose={() => setQtyPopup({ open: false })}
          onQtyChange={setQtyValue}
          onDecrement={() => setQtyValue((v) => Math.max(1, v - 1))}
          onIncrement={() => setQtyValue((v) => v + 1)}
          onConfirm={confirmQty}
        />
      </div>
    </RarityLegendProvider>
  );
}
