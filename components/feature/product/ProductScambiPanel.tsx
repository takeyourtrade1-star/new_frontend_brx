'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { CardDocument } from '@/lib/product-detail';

export type ProductScambiPanelProps = { card: CardDocument };

export function ProductScambiPanel({ card }: ProductScambiPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 p-6 duration-300 sm:p-8">
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF7300] text-white shadow-md">
          <ScambiIcon className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-sm font-bold uppercase tracking-wide text-gray-800">
          {t('productDetail.scambi.title')}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          {t('trades.chooseRealListing')}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/search?q=${encodeURIComponent(card.name)}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#e66800]"
          >
            <Search className="h-4 w-4" aria-hidden />
            {t('trades.findSeller')}
          </Link>
          <Link
            href="/scambi"
            className="inline-flex items-center rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#FF7300] ring-1 ring-[#FF7300]/30 transition hover:bg-orange-50"
          >
            {t('productDetail.scambi.exploreAll')}
          </Link>
        </div>
      </div>
    </div>
  );
}
