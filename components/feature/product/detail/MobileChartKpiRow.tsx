'use client';

import { useIntlLocale } from '@/lib/i18n/useIntlLocale';

export function MobileChartKpiRow({
  formatEuro,
  trendPriceValue,
  soldCopiesValue,
  averageSalePriceValue,
}: {
  formatEuro: (n: number) => string;
  trendPriceValue: number;
  soldCopiesValue: number;
  averageSalePriceValue: number;
}) {
  const intlLocale = useIntlLocale();
  return (
    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold tabular-nums">
      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700">{formatEuro(trendPriceValue)}</span>
      <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-sky-700">
        {new Intl.NumberFormat(intlLocale).format(soldCopiesValue)} vend.
      </span>
      <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-zinc-800">{formatEuro(averageSalePriceValue)}</span>
    </div>
  );
}
