'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import type { CardDocument } from '@/lib/product-detail';
import type { ProductPriceStats } from '@/components/feature/product/ProductPriceChart';
import {
  MAX_VISIBLE_REPRINTS,
  REPRINT_GRID_SCROLL_CLASS,
  REPRINT_LIST_SCROLL_CLASS,
  REPRINT_TILE_CLASS,
  type ReprintCard,
} from '@/lib/product-detail/product-detail-view-types';
import { RarityIndicator } from '@/components/ui/RarityIndicator';
import { CardLanguageFlags } from '@/components/ui/CardLanguageFlags';
import { ReprintThumbnail } from '@/components/feature/product/detail/ReprintThumbnail';
import { ReprintListRow } from '@/components/feature/product/detail/ReprintListRow';

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

export interface ProductDetailInfoTabProps {
  card?: CardDocument;
  slug: string;
  gameLabel: string | null;
  setCatalogHref: string | null;
  cardsInSaleLabel: string;
  reprints: ReprintCard[];
  reprintsLoading: boolean;
  reprintsDegraded: boolean;
  reprintsAllHref: string | null;
  showChart: boolean;
  onShowChartToggle: () => void;
  trendRangeLabel: string;
  formatEuro: (n: number) => string;
  trendPriceValue: number;
  soldCopiesValue: number;
  averageSalePriceValue: number;
  onChartStatsChange: (stats: ProductPriceStats | null) => void;
}

export function ProductDetailInfoTab({
  card,
  slug,
  gameLabel,
  setCatalogHref,
  cardsInSaleLabel,
  reprints,
  reprintsLoading,
  reprintsDegraded,
  reprintsAllHref,
  showChart,
  onShowChartToggle,
  trendRangeLabel,
  formatEuro,
  trendPriceValue,
  soldCopiesValue,
  averageSalePriceValue,
  onChartStatsChange,
}: ProductDetailInfoTabProps) {
  const intlLocale = useIntlLocale();
  return (
    <div
      className={cn(
        'hidden sm:grid min-w-0 w-full items-stretch transition-all duration-500',
        showChart
          ? 'gap-2.5 p-2.5 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.22fr_0.28fr_1.5fr]'
          : 'gap-2.5 p-2.5 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.35fr_0.7fr_0.95fr]'
      )}
    >
      <div className="flex min-h-0 flex-col rounded-xl bg-white/85 p-3 lg:min-h-[280px]">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-800">Dati carta</h3>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
            {gameLabel ?? 'Gioco N/D'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Rarità</p>
            <div className="mt-1">
              <RarityIndicator rarity={card?.rarity} showLabel size="md" />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Numero</p>
            <p className="mt-1 text-sm font-extrabold tabular-nums text-zinc-900">{card?.collector_number ?? '015'}</p>
          </div>
          {setCatalogHref ? (
            <Link
              href={setCatalogHref}
              className="col-span-2 block rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2 transition-colors hover:border-primary/45 hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={`Apri pagina set: ${card?.set_name ?? ''}`}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Set</p>
              <p className="mt-1 truncate text-sm font-extrabold text-primary">{card?.set_name ?? 'SUSSURRI NEL POZZO'}</p>
            </Link>
          ) : (
            <div className="col-span-2 rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Set</p>
              <p className="mt-1 truncate text-sm font-extrabold text-zinc-900">{card?.set_name ?? 'SUSSURRI NEL POZZO'}</p>
            </div>
          )}
          <div className="col-span-2 rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Lingue disponibili</p>
            <div className="mt-1.5">
              {card?.game_slug === 'mtg' ? (
                <CardLanguageFlags languages={card?.available_languages} size="sm" showActiveLabel />
              ) : (
                <span className="text-[12px] font-semibold text-zinc-500">N/D</span>
              )}
            </div>
          </div>
          <div className="col-span-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-primary/70">In vendita</p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-primary">{cardsInSaleLabel}</p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-white/85 lg:min-h-[280px]',
          showChart ? 'p-1' : 'p-3'
        )}
      >
        <div className={cn('flex shrink-0 items-center justify-between gap-1', showChart ? 'mb-1' : 'mb-2')}>
          <h3 className={cn('font-extrabold uppercase tracking-wider text-zinc-800 truncate', showChart ? 'text-[9px]' : 'text-[10px]')}>Ristampe</h3>
          {reprints.length > 0 && reprintsAllHref ? (
            <Link
              href={reprintsAllHref}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 font-bold text-primary transition-colors hover:bg-primary/10',
                showChart ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
              )}
            >
              <span>Vedi tutte</span>
              <span className={cn('rounded-full bg-primary/15 font-extrabold tabular-nums', showChart ? 'px-1.5 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]')}>{reprints.length}</span>
            </Link>
          ) : (
            <span className={cn('shrink-0 rounded-full bg-zinc-100 font-bold text-zinc-400 tabular-nums', showChart ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[9px]')}>{reprints.length}</span>
          )}
        </div>

        {reprintsLoading ? (
          showChart ? (
            <div
              className={cn(
                'flex shrink-0 flex-col gap-1 overflow-hidden',
                REPRINT_LIST_SCROLL_CLASS
              )}
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 min-h-14 shrink-0 rounded-md bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : (
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
          )
        ) : reprints.length > 0 ? (
          showChart ? (
            <div
              className={cn(
                'flex shrink-0 flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5',
                REPRINT_LIST_SCROLL_CLASS
              )}
            >
              {reprints.slice(0, MAX_VISIBLE_REPRINTS).map((reprint, i) => (
                <ReprintListRow
                  key={reprint.id}
                  reprint={reprint}
                  rowIndex={i}
                  totalRows={Math.min(reprints.length, MAX_VISIBLE_REPRINTS)}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'grid shrink-0 grid-cols-2 auto-rows-min gap-2 overflow-y-auto overscroll-contain pr-0.5',
                REPRINT_GRID_SCROLL_CLASS
              )}
            >
              {reprints.slice(0, MAX_VISIBLE_REPRINTS).map((reprint, i) => (
                <ReprintThumbnail key={reprint.id} reprint={reprint} columnIndex={i} />
              ))}
            </div>
          )
        ) : reprintsDegraded ? (
          <div className={cn('flex flex-1 items-center justify-center rounded-lg border border-dashed border-amber-200/80 bg-amber-50/40 text-center', showChart ? 'px-1.5 py-2' : 'px-2 py-3')}>
            <p className={cn('text-amber-800', showChart ? 'text-[9px] leading-tight' : 'text-xs')}>Ristampe non disponibili.</p>
          </div>
        ) : (
          <div className={cn('flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-center', showChart ? 'px-1.5 py-2' : 'px-2 py-3')}>
            <p className={cn('text-zinc-400', showChart ? 'text-[9px] leading-tight' : 'text-xs')}>Nessuna ristampa trovata.</p>
          </div>
        )}
      </div>

      <div className={cn('flex min-h-0 flex-col rounded-xl bg-white/85 sm:col-span-2 md:col-span-2 lg:col-span-1', showChart ? 'p-2.5' : 'p-3')}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{trendRangeLabel}</span>
          <button
            type="button"
            onClick={onShowChartToggle}
            className="flex items-center gap-1 rounded-full bg-zinc-100/80 px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
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
          <div key="stats-stack" className="space-y-1.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#FF7300]/25 bg-orange-50/70 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#e86800]/80">Trend</p>
              <p className="text-base font-extrabold tabular-nums text-[#e86800]">{formatEuro(trendPriceValue)}</p>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1D3160]/15 bg-[#1D3160]/[0.06] px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#1D3160]/70">Vendute</p>
              <p className="text-base font-extrabold tabular-nums text-[#1D3160]">{new Intl.NumberFormat(intlLocale).format(soldCopiesValue)}</p>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700/80">Prezzo medio</p>
              <p className="text-base font-extrabold tabular-nums text-emerald-700">{formatEuro(averageSalePriceValue)}</p>
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
