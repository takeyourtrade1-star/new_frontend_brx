'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { CardDocument } from '@/lib/product-detail';

export type ProductScambiPanelProps = { card: CardDocument };

export function ProductScambiPanel({ card }: ProductScambiPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 p-6 duration-300 sm:p-8">
      <div className="flex flex-col gap-5 border-y border-slate-200/80 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-7">
        <div className="max-w-lg">
          <p className="text-sm font-black uppercase tracking-wide text-[#1D3160]">
            {t('productDetail.scambi.title')}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {t('trades.chooseRealListing')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/search?q=${encodeURIComponent(card.name)}`}
            className="inline-flex items-center rounded-xl bg-[#FF7300] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#e66800] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300]/35 motion-reduce:transform-none"
          >
            {t('trades.findSeller')}
          </Link>
          <Link
            href="/scambi"
            className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[#1D3160] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3160]/25"
          >
            {t('productDetail.scambi.exploreAll')}
          </Link>
        </div>
      </div>
    </div>
  );
}
