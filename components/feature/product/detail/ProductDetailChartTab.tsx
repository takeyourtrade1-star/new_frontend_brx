'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import type { ProductPriceStats } from '@/components/feature/product/ProductPriceChart';

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

export interface ProductDetailChartTabProps {
  slug: string;
  trendRangeLabel: string;
  formatEuro: (n: number) => string;
  trendPriceValue: number;
  soldCopiesValue: number;
  onChartStatsChange: (stats: ProductPriceStats | null) => void;
}

export function ProductDetailChartTab({
  slug,
  trendRangeLabel,
  formatEuro,
  trendPriceValue,
  soldCopiesValue,
  onChartStatsChange,
}: ProductDetailChartTabProps) {
  const intlLocale = useIntlLocale();
  return (
    <div className="hidden min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto p-2.5 sm:flex sm:p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-800 sm:text-xs">
          {trendRangeLabel}
        </h3>
        <div className="flex gap-1.5 text-[10px] font-bold tabular-nums">
          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700">{formatEuro(trendPriceValue)}</span>
          <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-sky-700">
            {new Intl.NumberFormat(intlLocale).format(soldCopiesValue)} vend.
          </span>
        </div>
      </div>
      <div className="min-h-[220px] flex-1 rounded-xl bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:min-h-[280px]">
        <ProductPriceChart slug={slug} onStatsChange={onChartStatsChange} />
      </div>
    </div>
  );
}
