'use client';

import dynamic from 'next/dynamic';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import type { CardDocument } from '@/lib/product-detail';
import type { ProductPriceStats } from '@/components/feature/product/ProductPriceChart';

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

export interface ProductDetailSellTabProps {
  card?: CardDocument;
  slug: string;
  blueprintIdForAuction: number | null;
  showChart: boolean;
  onShowChartToggle: () => void;
  trendRangeLabel: string;
  formatEuro: (n: number) => string;
  trendPriceValue: number;
  soldCopiesValue: number;
  averageSalePriceValue: number;
  onChartStatsChange: (stats: ProductPriceStats | null) => void;
  onSellSinglePublished: () => void;
}

export function ProductDetailSellTab({
  card,
  slug,
  blueprintIdForAuction,
  showChart,
  onShowChartToggle,
  trendRangeLabel,
  formatEuro,
  trendPriceValue,
  soldCopiesValue,
  averageSalePriceValue,
  onChartStatsChange,
  onSellSinglePublished,
}: ProductDetailSellTabProps) {
  const intlLocale = useIntlLocale();
  if (!card) {
    return (
      <div className="hidden flex-1 flex-col items-center justify-center p-6 min-w-0 w-full sm:flex">
        <p className="text-xs text-zinc-400 text-center max-w-[260px] leading-relaxed">
          Seleziona un prodotto dal catalogo per vendere.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'hidden h-full min-h-0 w-full min-w-0 gap-3 p-3 sm:grid sm:grid-cols-1 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        showChart ? 'lg:grid-cols-[1.3fr_1fr]' : 'lg:grid-cols-[2.8fr_1fr]'
      )}
    >
      <div className="min-h-0">
        <SellSingleWizard
          key={`desktop-sell-${card.id}`}
          variant="embedded"
          embeddedCard={card}
          blueprintId={blueprintIdForAuction}
          onPublished={onSellSinglePublished}
          className="!max-w-full"
        />
      </div>

      <div className={cn('flex min-h-0 w-full flex-col rounded-xl bg-white/85 p-2.5 sm:col-span-2 md:col-span-2 lg:col-span-1', !showChart && 'lg:self-start')}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{trendRangeLabel}</span>
          <button
            type="button"
            onClick={onShowChartToggle}
            className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100/80 px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            {showChart ? <><EyeOff className="h-3 w-3" /> Nascondi</> : <><Eye className="h-3 w-3" /> Grafico</>}
          </button>
        </div>

        {showChart ? (
          <div key="stats-row" className="grid grid-cols-3 gap-1 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-1 rounded-md border border-[#FF7300]/25 bg-orange-50/70 px-1.5 py-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#e86800]/80">Trend</span>
              <span className="text-[11px] font-extrabold tabular-nums text-[#e86800]">{formatEuro(trendPriceValue)}</span>
            </div>
            <div className="flex items-center justify-between gap-1 rounded-md border border-[#1D3160]/15 bg-[#1D3160]/[0.06] px-1.5 py-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#1D3160]/70">Vendute</span>
              <span className="text-[11px] font-extrabold tabular-nums text-[#1D3160]">{new Intl.NumberFormat(intlLocale).format(soldCopiesValue)}</span>
            </div>
            <div className="flex items-center justify-between gap-1 rounded-md border border-emerald-200/70 bg-emerald-50/60 px-1.5 py-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700/80">Prezzo medio</span>
              <span className="text-[11px] font-extrabold tabular-nums text-emerald-700">{formatEuro(averageSalePriceValue)}</span>
            </div>
          </div>
        ) : (
          <div key="stats-stack" className="space-y-1 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-2 rounded-md border border-[#FF7300]/25 bg-orange-50/70 px-2.5 py-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#e86800]/80">Trend</span>
              <span className="text-[13px] font-extrabold tabular-nums text-[#e86800]">{formatEuro(trendPriceValue)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-[#1D3160]/15 bg-[#1D3160]/[0.06] px-2.5 py-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#1D3160]/70">Vendute</span>
              <span className="text-[13px] font-extrabold tabular-nums text-[#1D3160]">{new Intl.NumberFormat(intlLocale).format(soldCopiesValue)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200/70 bg-emerald-50/60 px-2.5 py-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700/80">Prezzo medio</span>
              <span className="text-[13px] font-extrabold tabular-nums text-emerald-700">{formatEuro(averageSalePriceValue)}</span>
            </div>
          </div>
        )}

        <div
          className={cn(
            'overflow-hidden transition-[max-height,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            showChart ? 'mt-1.5 max-h-[270px] opacity-100' : 'mt-0 max-h-0 opacity-0'
          )}
        >
          {showChart && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="h-[250px] w-full rounded-lg bg-white/60">
                <ProductPriceChart slug={slug} onStatsChange={onChartStatsChange} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
