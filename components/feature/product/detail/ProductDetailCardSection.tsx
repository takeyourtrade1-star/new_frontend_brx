'use client';

import { memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { EBARTEX_LOGO_PLACEHOLDER } from '@/lib/product-detail/product-detail-view-types';
import { ProductDetailMobileLayout } from '@/components/feature/product/detail/ProductDetailMobileLayout';
import { FoilSelector } from '@/components/feature/product/detail/FoilSelector';
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
    soloFoil,
    onSoloFoilChange,
  } = mobile;

  return (
    <section className="w-full bg-[#F0F0F0] px-0 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 pb-4 sm:pb-6 min-h-0">
      <div className="container-content container-content-card-detail">
        {/* Desktop: tab "a cartella" che spuntano sopra il box (stile CardMarket).
            Allineati alla colonna pannello (dopo l'immagine), si sovrappongono
            di 1px al bordo superiore del box per dare l'effetto "incastro". */}
        <div
          className="relative z-[1] hidden items-end gap-1 pl-[180px] sm:flex md:pl-[200px] lg:pl-[220px]"
          role="tablist"
          aria-label="Azioni carta"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'group relative -mb-px flex items-center gap-1.5 rounded-t-xl border border-b-0 px-4 font-bold uppercase tracking-wide transition-all duration-200',
                  isActive
                    ? 'z-10 border-zinc-300/80 bg-white pb-2.5 pt-2.5 text-[11px] text-primary shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'
                    : 'border-zinc-200/90 bg-zinc-100 pb-2 pt-1.5 text-[10px] text-zinc-500 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] hover:bg-zinc-50 hover:text-zinc-700'
                )}
              >
                <Icon
                  className={cn(
                    'shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110',
                    isActive ? 'h-[18px] w-[18px]' : 'h-4 w-4'
                  )}
                  aria-hidden
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
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

          <aside className="hidden w-[180px] flex-shrink-0 flex-col items-center justify-center self-stretch border-r border-zinc-200/50 bg-gradient-to-br from-zinc-50/80 via-white to-zinc-100/60 p-4 sm:flex md:w-[200px] lg:w-[220px]">
            <FoilSelector soloFoil={soloFoil} onChange={onSoloFoilChange} size="sm" className="mb-3" />
            <div
              className="relative my-auto flex w-full max-w-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-300/50 bg-zinc-100/60 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md md:max-w-[200px] md:max-h-[360px] lg:max-w-[220px] lg:max-h-[420px] sm:max-h-[300px]"
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
