'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Info, Tag, LineChart } from 'lucide-react';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { formatEuroNoSpace } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { getCardImageUrl } from '@/lib/assets';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { getGameLabel, buildBreadcrumbsFromCard } from '@/lib/product-detail';
import { resolveSetPageGameSlug } from '@/lib/search/set-page-url';
import { type ListingItem } from '@/lib/api/sync-client';
import { useMockPurchaseStore } from '@/lib/stores/mock-purchase-store';
import { MarketplaceListingEditModal } from '@/components/feature/vendite/MarketplaceListingEditModal';
import { buildPriceHistoryPoints } from '@/lib/product-detail/build-price-history-points';
import type { ProductPriceStats } from '@/components/feature/product/ProductPriceChart';
import { getCdnImageUrl } from '@/lib/config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { COUNTRIES } from '@/lib/registrati/schema';
import { InventoryEditModal } from '@/components/feature/sync/InventoryEditModal';
import type { AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { type CountryOption } from '@/components/ui/CountrySelect';
import { useUserCountry } from '@/lib/hooks/use-user-country';
import { useFlyToCart } from '@/lib/hooks/use-fly-to-cart';
import { useCartStore } from '@/lib/stores/cart-store';
import { RarityLegendProvider } from '@/components/ui/RarityLegendProvider';
import {
  buildMarketplaceRows,
  filterMarketplaceRows,
  sortMarketplaceRows,
} from '@/lib/product-detail/marketplace-rows';
import { shouldOpenVendiTab } from '@/lib/sell-flow/sell-flow';
import {
  ONE_DAY_MS,
  type ProductDetailTabConfig,
  type ProductDetailTabId,
  type ProductDetailViewProps,
} from '@/lib/product-detail/product-detail-view-types';
import { parseBlueprintId } from '@/lib/product-detail/parse-blueprint-id';
import { useProductReprints } from '@/lib/hooks/use-product-reprints';
import { useMarketplaceListings } from '@/lib/hooks/use-marketplace-listings';
import { useAuctionBlueprintInventory } from '@/lib/hooks/use-auction-blueprint-inventory';
import { useProductAuctions } from '@/hooks/product/useProductAuctions';
import { useProductFilters } from '@/hooks/product/useProductFilters';
import { useProductListingActions } from '@/hooks/product/useProductListingActions';
import { useProductCart } from '@/hooks/product/useProductCart';
import { useProductImageGallery } from '@/hooks/product/useProductImageGallery';
import { ProductDetailTitleSection } from '@/components/feature/product/detail/ProductDetailTitleSection';
import { ProductDetailCardSection } from '@/components/feature/product/detail/ProductDetailCardSection';
import { ProductDetailMarketplaceSection } from '@/components/feature/product/detail/ProductDetailMarketplaceSection';
import { ProductDetailHoverPreview } from '@/components/feature/product/detail/ProductDetailHoverPreview';
import { ProductDetailLightbox } from '@/components/feature/product/detail/ProductDetailLightbox';
import { ProductDetailQtyPopup } from '@/components/feature/product/detail/ProductDetailQtyPopup';
import { ProductDetailPurchaseModal } from '@/components/feature/product/detail/ProductDetailPurchaseModal';

/**
 * FE-REV-020: la pagina dettaglio è un monolite che ri-renderizza a ogni cambio di stato
 * (es. ogni tasto nei filtri marketplace). Memoizzando i figli "pesanti" indipendenti dai filtri
 * e stabilizzando le loro props (useCallback/useMemo), un cambio filtro non ri-renderizza più
 * la sezione superiore (mobile layout, tab, titolo). La MarketplaceSection NON è memoizzata:
 * è corretto che reagisca ai filtri.
 *
 * Piano 1.3: la logica è stata estratta in hook dedicati (hooks/product/*): aste correlate,
 * filtri (useReducer), gestione inserzioni proprie, carrello/acquisto, galleria immagine.
 * Questo componente resta l'orchestratore: composizione + data fetching + cablaggio.
 */
const MemoTitleSection = memo(ProductDetailTitleSection);

export function ProductDetailView(props: ProductDetailViewProps) {
  const { card } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabUserOverride = useRef(false);
  const { selectedLang } = useLanguage();
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
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
  // FE-REV-020: ref stabile così i figli memoizzati che lo ricevono non si ri-renderizzano inutilmente.
  const breadcrumbItems: AppBreadcrumbItem[] = useMemo(() => {
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
    return breadcrumbs.map((item, index) => ({
      href: item.href,
      label: item.label,
      isCurrent: index === breadcrumbs.length - 1,
    }));
  }, [props.breadcrumbs, card]);
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
  const [imageError, setImageError] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartStats, setChartStats] = useState<ProductPriceStats | null>(null);
  const [listingActionMessage, setListingActionMessage] = useState<string | null>(null);

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

  const showImagePlaceholder = imageError || !imageSrc;
  const effectiveImageSrc = showImagePlaceholder ? '' : imageSrc;
  const isLocalImage = effectiveImageSrc.startsWith('/') && !effectiveImageSrc.startsWith('//');
  const gameLabel = card ? getGameLabel(card.game_slug) : null;

  // Piano 1.3 — galleria immagine (lightbox, hover, swipe, share, header offset).
  const {
    headerHeight,
    isLightboxOpen,
    lightboxRef,
    currentImageIndex,
    cardImages,
    hoverPreviewOpen,
    handleLightboxOpen,
    handleLightboxClose,
    handleHoverPreviewOpen,
    handleHoverPreviewClose,
    handleHoverPreviewCancelClose,
    handlePrevImage,
    handleNextImage,
    handleShare,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useProductImageGallery({ effectiveImageSrc, title });

  // Piano 1.3 — filtri marketplace (useReducer + paese + auto-close + memo derivata).
  const {
    hideAuctions,
    condizioneMinima,
    linguaCarta,
    soloFoil,
    firmata,
    alterata,
    quantita,
    posizioneVenditore,
    tipoVenditore,
    listingsSort,
    sellerSubTab,
    filtersOpen,
    setHideAuctions,
    setCondizioneMinima,
    setLinguaCarta,
    setSoloFoil,
    setFirmata,
    setAlterata,
    setQuantita,
    setPosizioneVenditore,
    setTipoVenditore,
    setListingsSort,
    setSellerSubTab,
    setFiltersOpen,
    marketplaceFilters,
  } = useProductFilters({ userCountry: user?.country, detectedCountry });

  // Piano 1.3 — aste correlate alla carta.
  const { enrichedCardAuctions, auctionsLoading } = useProductAuctions(card);

  // Piano 1.3 — gestione inserzioni proprie (modali + mutazioni quantità/modifica).
  const {
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
  } = useProductListingActions({
    userId: user?.id,
    accessToken,
    card,
    refetchListings,
    pollSyncTaskThenRefresh,
    setListingActionMessage,
  });

  // Piano 1.3 — carrello + flusso "compra ora".
  const {
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
  } = useProductCart({
    userId: user?.id,
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
  });

  const isOwnListing = useCallback(
    (item: ListingItem) => Boolean(user?.id && String(user.id) === String(item.seller_id)),
    [user?.id]
  );

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

  const { reprints, reprintsLoading, reprintsDegraded } = useProductReprints(card);

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

  const formatEuro = useCallback((n: number) => formatEuroNoSpace(n, intlLocale), [intlLocale]);

  const cardsInSaleCount = useMemo(
    () => listings.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0),
    [listings]
  );
  const cardsInSaleLabel = listingsLoading ? '…' : new Intl.NumberFormat(intlLocale).format(cardsInSaleCount);

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
  }, [refetchListings, setSellerSubTab]);

  // FE-REV-020: handler stabili per le props dei figli memoizzati (evitano di romperne la memo).
  const handleImageError = useCallback(() => setImageError(true), []);
  const handleAuctionCancel = useCallback(() => setActiveTab('INFO'), []);
  const handleMobileReprintsToggle = useCallback(() => setMobileReprintsOpen((open) => !open), []);
  const handleShowChartToggle = useCallback(() => setShowChart((v) => !v), []);
  const handleSellSinglePublishedSafe = useCallback(
    () => void handleSellSinglePublished(),
    [handleSellSinglePublished]
  );

  const tabs: ProductDetailTabConfig[] = useMemo(
    () => [
      { id: 'INFO', label: 'INFO', mobileLabel: 'INFO', icon: Info },
      { id: 'VENDI', label: 'VENDI', mobileLabel: 'VENDI', icon: Tag },
      { id: 'ASTA', label: "METTI ALL'ASTA", mobileLabel: "METTI ALL'ASTA", icon: AuctionGavelIcon },
      { id: 'GRAFICO', label: 'GRAFICO PREZZI', mobileLabel: 'GRAFICO', icon: LineChart },
    ],
    []
  );

  return (
    <RarityLegendProvider>
      <div className="min-h-screen font-sans bg-[#F0F0F0] text-gray-900">
        <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
          <Header />
        </Suspense>

        <MemoTitleSection
          title={title}
          subtitle={subtitle}
          card={card}
          breadcrumbItems={breadcrumbItems}
          onShare={handleShare}
        />

        <ProductDetailCardSection
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
          onImageError={handleImageError}
          onLightboxOpen={handleLightboxOpen}
          onHoverPreviewOpen={handleHoverPreviewOpen}
          onHoverPreviewClose={handleHoverPreviewClose}
          onSellSinglePublished={handleSellSinglePublishedSafe}
          auctionInventoryLoading={auctionInventoryLoading}
          auctionInventoryItems={auctionInventoryItems}
          onAuctionCancel={handleAuctionCancel}
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
          onMobileReprintsToggle={handleMobileReprintsToggle}
          hideReprintsLabel={t('productDetail.mobile.hideReprints')}
          showReprintsLabel={t('productDetail.mobile.showReprints')}
          reprints={reprints}
          reprintsLoading={reprintsLoading}
          reprintsDegraded={reprintsDegraded}
          reprintsAllHref={reprintsAllHref}
          gameLabel={gameLabel}
          showChart={showChart}
          onShowChartToggle={handleShowChartToggle}
        />

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
          auctionsLoading={auctionsLoading}
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
          <ProductDetailPurchaseModal
            purchaseListing={purchaseListing}
            cardName={card?.name}
            purchaseQty={purchaseQty}
            purchaseSubmitting={purchaseSubmitting}
            t={t}
            onClose={() => setPurchaseListing(null)}
            onQtyChange={(value) => setPurchaseQty(value)}
            onConfirm={() => void handleConfirmPurchase()}
          />
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
