'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardDocument } from '@/lib/product-detail';
import type { ProductPriceStats } from '@/components/feature/product/ProductPriceChart';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import {
  EBARTEX_LOGO_PLACEHOLDER,
  REPRINT_GRID_SCROLL_CLASS,
  REPRINT_TILE_CLASS,
  type ProductDetailTabConfig,
  type ProductDetailTabId,
  type ReprintCard,
} from '@/lib/product-detail/product-detail-view-types';
import { ProductDetailIconTabBar } from '@/components/feature/product/detail/ProductDetailIconTabBar';
import { MobileCardGeneralInfo } from '@/components/feature/product/detail/MobileCardGeneralInfo';
import { MobileChartKpiRow } from '@/components/feature/product/detail/MobileChartKpiRow';
import { ReprintThumbnail } from '@/components/feature/product/detail/ReprintThumbnail';

const AuctionCreateWizard = dynamic(
  () => import('@/components/feature/aste/create/AuctionCreateWizard').then((mod) => mod.AuctionCreateWizard),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2.5 text-xs text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      </div>
    ),
  }
);

const SellSingleWizard = dynamic(
  () => import('@/components/feature/vendi/singles/SellSingleWizard').then((mod) => mod.SellSingleWizard),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-2.5 text-xs text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      </div>
    ),
  }
);

const ProductPriceChart = dynamic(
  () => import('@/components/feature/product/ProductPriceChart').then((mod) => mod.ProductPriceChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      </div>
    ),
  }
);

export interface ProductDetailMobileLayoutProps {
  tabs: ProductDetailTabConfig[];
  activeTab: ProductDetailTabId;
  onTabChange: (id: ProductDetailTabId) => void;
  card?: CardDocument;
  title: string;
  slug: string;
  blueprintIdForAuction: number | null;
  showImagePlaceholder: boolean;
  effectiveImageSrc: string;
  isLocalImage: boolean;
  onImageError: () => void;
  onLightboxOpen: () => void;
  onSellSinglePublished: () => void;
  auctionInventoryLoading: boolean;
  auctionInventoryItems: InventoryItemWithCatalog[];
  onAuctionCancel: () => void;
  inventoryLoadingLabel: string;
  trendRangeLabel: string;
  formatEuro: (n: number) => string;
  trendPriceValue: number;
  soldCopiesValue: number;
  averageSalePriceValue: number;
  onChartStatsChange: (stats: ProductPriceStats | null) => void;
  setCatalogHref: string | null;
  cardsInSaleLabel: string;
  mobileReprintsOpen: boolean;
  onMobileReprintsToggle: () => void;
  hideReprintsLabel: string;
  showReprintsLabel: string;
  reprints: ReprintCard[];
  reprintsLoading: boolean;
  reprintsDegraded: boolean;
  reprintsAllHref: string | null;
}

export function ProductDetailMobileLayout({
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
  mobileReprintsOpen,
  onMobileReprintsToggle,
  hideReprintsLabel,
  showReprintsLabel,
  reprints,
  reprintsLoading,
  reprintsDegraded,
  reprintsAllHref,
}: ProductDetailMobileLayoutProps) {
  return (
    <div className="flex w-full flex-col sm:hidden">
      <ProductDetailIconTabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} compact />
      <div
        className={cn(
          'bg-gradient-to-br from-zinc-50/80 via-white to-zinc-100/60',
          activeTab === 'INFO'
            ? 'flex justify-center px-0.5 py-2.5'
            : activeTab === 'VENDI'
              ? 'p-2'
              : 'min-h-[200px] overflow-y-auto p-2.5',
          activeTab === 'ASTA' && 'min-h-[280px]'
        )}
      >
        {activeTab === 'INFO' && (
          <div
            className="relative w-[min(62vw,11.5rem)] cursor-pointer overflow-hidden rounded-lg border border-zinc-300/50 bg-zinc-100/60 shadow-sm transition-transform active:scale-[0.99]"
            style={{ aspectRatio: '63/88' }}
            onClick={onLightboxOpen}
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
                sizes="(max-width: 640px) 62vw, 200px"
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
                sizes="(max-width: 640px) 62vw, 200px"
                unoptimized
                onError={onImageError}
                priority
              />
            )}
          </div>
        )}

        {activeTab === 'VENDI' && card && (
          <SellSingleWizard
            key={`mobile-sell-${card.id}`}
            variant="embedded"
            embeddedCard={card}
            blueprintId={blueprintIdForAuction}
            onPublished={onSellSinglePublished}
            className="!max-w-full"
          />
        )}
        {activeTab === 'VENDI' && !card && (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl bg-white p-4 text-center text-xs text-zinc-400">
            Seleziona un prodotto dal catalogo per vendere.
          </div>
        )}

        {activeTab === 'ASTA' && card && blueprintIdForAuction && (
          <div className="rounded-xl bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            {auctionInventoryLoading ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-2.5 text-xs text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
                <span>{inventoryLoadingLabel}</span>
              </div>
            ) : (
              <AuctionCreateWizard
                key={`mobile-${card.id}-${auctionInventoryItems.length}`}
                variant="embedded"
                embeddedCard={card}
                embeddedInventoryItems={auctionInventoryItems}
                onEmbeddedCancel={onAuctionCancel}
                className="!max-w-full"
              />
            )}
          </div>
        )}
        {activeTab === 'ASTA' && (!card || !blueprintIdForAuction) && (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-white p-4">
            <p className="max-w-[260px] text-center text-xs leading-relaxed text-zinc-400">
              {!card
                ? 'Seleziona un prodotto dal catalogo per creare un’asta.'
                : 'Identificativo prodotto non disponibile per questo articolo: usa la pagina Nuova asta dal menu Aste.'}
            </p>
          </div>
        )}

        {activeTab === 'GRAFICO' && (
          <div className="flex w-full flex-col gap-2 rounded-xl bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-800">{trendRangeLabel}</h3>
              <MobileChartKpiRow
                formatEuro={formatEuro}
                trendPriceValue={trendPriceValue}
                soldCopiesValue={soldCopiesValue}
                averageSalePriceValue={averageSalePriceValue}
              />
            </div>
            <div className="min-h-[200px] rounded-lg bg-white/60">
              <ProductPriceChart slug={slug} onStatsChange={onChartStatsChange} />
            </div>
          </div>
        )}
      </div>

      <MobileCardGeneralInfo
        card={card}
        setCatalogHref={setCatalogHref}
        cardsInSaleLabel={cardsInSaleLabel}
      />

      {activeTab === 'INFO' && (
        <div className="border-b border-zinc-100 bg-white px-2.5 py-2">
          <button
            type="button"
            onClick={onMobileReprintsToggle}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-zinc-700 transition-colors hover:bg-zinc-100/80"
            aria-expanded={mobileReprintsOpen}
          >
            {mobileReprintsOpen ? (
              <>
                <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {hideReprintsLabel}
              </>
            ) : (
              <>
                {showReprintsLabel}
                {reprints.length > 0 && (
                  <span className="rounded-full bg-zinc-200/80 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-zinc-500">
                    {reprints.length}
                  </span>
                )}
              </>
            )}
          </button>
          {mobileReprintsOpen && (
            <div className="mt-2 rounded-xl bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-800">Ristampe</span>
                {reprints.length > 0 && reprintsAllHref && (
                  <Link
                    href={reprintsAllHref}
                    className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] font-semibold text-primary hover:bg-primary/10"
                  >
                    Vedi tutte
                  </Link>
                )}
              </div>
              {reprintsLoading ? (
                <div
                  className={cn(
                    'grid shrink-0 grid-cols-2 gap-2 overflow-hidden',
                    REPRINT_GRID_SCROLL_CLASS
                  )}
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={cn(REPRINT_TILE_CLASS, 'rounded-lg bg-zinc-100 animate-pulse')} />
                  ))}
                </div>
              ) : reprints.length > 0 ? (
                <div
                  className={cn(
                    'grid shrink-0 grid-cols-2 auto-rows-min gap-2 overflow-y-auto overscroll-contain pr-0.5',
                    REPRINT_GRID_SCROLL_CLASS
                  )}
                >
                  {reprints.map((r, i) => (
                    <ReprintThumbnail key={r.id} reprint={r} columnIndex={i} />
                  ))}
                </div>
              ) : reprintsDegraded ? (
                <p className="text-[11px] text-amber-700">Ristampe non disponibili.</p>
              ) : (
                <p className="text-[11px] text-zinc-400">Nessuna ristampa.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
