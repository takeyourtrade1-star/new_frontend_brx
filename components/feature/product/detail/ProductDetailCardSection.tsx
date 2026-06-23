'use client';

import { memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { EBARTEX_LOGO_PLACEHOLDER } from '@/lib/product-detail/product-detail-view-types';
import { ProductDetailIconTabBar } from '@/components/feature/product/detail/ProductDetailIconTabBar';
import { ProductDetailMobileLayout } from '@/components/feature/product/detail/ProductDetailMobileLayout';
import { ProductDetailInfoTab } from '@/components/feature/product/detail/ProductDetailInfoTab';
import { ProductDetailSellTab } from '@/components/feature/product/detail/ProductDetailSellTab';
import { ProductDetailAuctionTab } from '@/components/feature/product/detail/ProductDetailAuctionTab';
import { ProductDetailChartTab } from '@/components/feature/product/detail/ProductDetailChartTab';

/**
 * Piano 1.3 — sezione "dettaglio carta" (layout mobile + colonna immagine desktop
 * + pannello tab desktop) estratta da ProductDetailView. Memoizzata: non riceve
 * stato dei filtri marketplace, quindi un cambio filtro non la ri-renderizza
 * (FE-REV-020). I tab interni restano a loro volta memoizzati.
 */
const MemoMobileLayout = memo(ProductDetailMobileLayout);
const MemoIconTabBar = memo(ProductDetailIconTabBar);
const MemoInfoTab = memo(ProductDetailInfoTab);
const MemoSellTab = memo(ProductDetailSellTab);
const MemoAuctionTab = memo(ProductDetailAuctionTab);
const MemoChartTab = memo(ProductDetailChartTab);

type MobileLayoutProps = React.ComponentProps<typeof ProductDetailMobileLayout>;

export type ProductDetailCardSectionProps = MobileLayoutProps & {
  gameLabel: string | null;
  showChart: boolean;
  onShowChartToggle: () => void;
  onHoverPreviewOpen: () => void;
  onHoverPreviewClose: () => void;
};

function ProductDetailCardSectionImpl({
  gameLabel,
  showChart,
  onShowChartToggle,
  onHoverPreviewOpen,
  onHoverPreviewClose,
  ...mobile
}: ProductDetailCardSectionProps) {
  const {
    tabs,
    activeTab,
    onTabChange,
    card,
    title,
    slug,
    blueprintIdForAuction,
    showImagePlaceholder,
    effectiveImageSrc,
    isLocalImage,
    onImageError,
    onLightboxOpen,
    onSellSinglePublished,
    auctionInventoryLoading,
    auctionInventoryItems,
    onAuctionCancel,
    inventoryLoadingLabel,
    trendRangeLabel,
    formatEuro,
    trendPriceValue,
    soldCopiesValue,
    averageSalePriceValue,
    onChartStatsChange,
    setCatalogHref,
    cardsInSaleLabel,
    reprints,
    reprintsLoading,
    reprintsDegraded,
    reprintsAllHref,
  } = mobile;

  return (
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
          <MemoMobileLayout {...mobile} />

          <aside className="hidden w-[180px] flex-shrink-0 flex-col items-center justify-center border-r border-zinc-200/50 bg-gradient-to-br from-zinc-50/80 via-white to-zinc-100/60 p-4 sm:flex sm:h-full md:w-[200px] lg:w-[220px]">
            <div
              className="relative flex w-full max-w-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-300/50 bg-zinc-100/60 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md md:max-w-[200px] md:max-h-[360px] lg:max-w-[220px] lg:max-h-[420px] sm:max-h-[300px]"
              style={{ aspectRatio: '63/88' }}
              onClick={onLightboxOpen}
              onMouseEnter={onHoverPreviewOpen}
              onMouseLeave={onHoverPreviewClose}
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
                  onError={onImageError}
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
                  onError={onImageError}
                  priority
                />
              )}
            </div>
          </aside>

          <div id="product-detail-tab-panel" className="hidden min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50/80 sm:flex sm:h-full">
            <MemoIconTabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              className="hidden sm:flex"
            />

            {activeTab === 'INFO' && (
              <MemoInfoTab
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
                onShowChartToggle={onShowChartToggle}
                trendRangeLabel={trendRangeLabel}
                formatEuro={formatEuro}
                trendPriceValue={trendPriceValue}
                soldCopiesValue={soldCopiesValue}
                averageSalePriceValue={averageSalePriceValue}
                onChartStatsChange={onChartStatsChange}
              />
            )}

            {activeTab === 'VENDI' && (
              <MemoSellTab
                card={card}
                slug={slug}
                blueprintIdForAuction={blueprintIdForAuction}
                showChart={showChart}
                onShowChartToggle={onShowChartToggle}
                trendRangeLabel={trendRangeLabel}
                formatEuro={formatEuro}
                trendPriceValue={trendPriceValue}
                soldCopiesValue={soldCopiesValue}
                averageSalePriceValue={averageSalePriceValue}
                onChartStatsChange={onChartStatsChange}
                onSellSinglePublished={onSellSinglePublished}
              />
            )}

            {activeTab === 'ASTA' && (
              <MemoAuctionTab
                card={card}
                blueprintIdForAuction={blueprintIdForAuction}
                auctionInventoryLoading={auctionInventoryLoading}
                auctionInventoryItems={auctionInventoryItems}
                inventoryLoadingLabel={inventoryLoadingLabel}
                onAuctionCancel={onAuctionCancel}
              />
            )}

            {activeTab === 'GRAFICO' && (
              <MemoChartTab
                slug={slug}
                trendRangeLabel={trendRangeLabel}
                formatEuro={formatEuro}
                trendPriceValue={trendPriceValue}
                soldCopiesValue={soldCopiesValue}
                onChartStatsChange={onChartStatsChange}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const ProductDetailCardSection = memo(ProductDetailCardSectionImpl);
