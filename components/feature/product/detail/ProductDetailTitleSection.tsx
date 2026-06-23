'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { CardDocument } from '@/lib/product-detail';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

export interface ProductDetailTitleSectionProps {
  title: string;
  subtitle: string;
  card?: CardDocument;
  breadcrumbItems: AppBreadcrumbItem[];
  onShare: () => void;
}

export function ProductDetailTitleSection({
  title,
  subtitle,
  card,
  breadcrumbItems,
  onShare,
}: ProductDetailTitleSectionProps) {
  return (
    <section className="w-full bg-[#F0F0F0] border-b border-gray-300">
      <div className="container-content container-content-card-detail py-3 sm:py-2.5 lg:py-3">
        {/* MOBILE: Titolo grande, edizione sotto, aiuto in fondo - in colonna */}
        <div className="flex flex-col gap-2 sm:hidden">
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-gray-900 break-words leading-tight">
            {title}
          </h1>
          <p className="text-sm font-bold uppercase tracking-tight text-gray-700 break-words">
            {card?.set_name ?? subtitle.split(' – ').pop()?.split(' - ').pop() ?? 'SUSSURRI NEL POZZO'}
          </p>
          <Link href="/aiuto" className="text-xs font-medium text-gray-500 hover:text-[#FF8800] mt-1">
            HAI BISOGNO DI AIUTO?
          </Link>
        </div>

        {/* DESKTOP: Layout originale con bottoni azione a destra del titolo */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <AppBreadcrumb
            items={breadcrumbItems}
            ariaLabel="Breadcrumb"
            variant="default"
            className="w-auto text-xs font-medium sm:text-sm min-w-0"
          />
          <Link href="/aiuto" className="text-xs font-medium text-gray-600 hover:text-gray-900 sm:text-sm shrink-0">
            HAI BISOGNO DI AIUTO?
          </Link>
        </div>
        <div className="hidden sm:flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 text-left">
            <h1 className="text-lg font-bold uppercase tracking-tight text-gray-900 sm:text-xl md:text-2xl lg:text-3xl break-words">
              {title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-tight text-gray-700 break-words">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-[#FF8800] hover:text-[#FF8800] shadow-sm"
              aria-label="Aggiungi ai preferiti"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onShare}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-[#FF8800] hover:text-[#FF8800] shadow-sm"
              aria-label="Condividi"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
