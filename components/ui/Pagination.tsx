'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

type PaginationProps = {
  currentPage: number; // 1-indexed
  totalPages: number;
  buildPageHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
  variant?: 'card-footer' | 'compact';
  className?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  buildPageHref,
  onPageChange,
  variant = 'card-footer',
  className,
}: PaginationProps) {
  const { t } = useTranslation();

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  const prevLabel = t('search.prevPage') || 'Pagina precedente';
  const nextLabel = t('search.nextPage') || 'Pagina successiva';

  // Label text formatted for i18n
  const pageText = t('search.pageOf', { current: currentPage, total: totalPages }) || `Pagina ${currentPage} di ${totalPages}`;

  const buttonStyle =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40';

  const renderPrev = () => {
    if (buildPageHref && !isPrevDisabled) {
      return (
        <Link href={buildPageHref(prevPage)} className={buttonStyle} aria-label={prevLabel}>
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </Link>
      );
    }
    return (
      <button
        type="button"
        disabled={isPrevDisabled}
        onClick={() => onPageChange?.(prevPage)}
        className={buttonStyle}
        aria-label={prevLabel}
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2} />
      </button>
    );
  };

  const renderNext = () => {
    if (buildPageHref && !isNextDisabled) {
      return (
        <Link href={buildPageHref(nextPage)} className={buttonStyle} aria-label={nextLabel}>
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </Link>
      );
    }
    return (
      <button
        type="button"
        disabled={isNextDisabled}
        onClick={() => onPageChange?.(nextPage)}
        className={buttonStyle}
        aria-label={nextLabel}
      >
        <ChevronRight className="w-5 h-5" strokeWidth={2} />
      </button>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {renderPrev()}
        <span className="min-w-[4rem] text-center text-xs font-semibold uppercase tracking-wider text-gray-500 tabular-nums">
          {currentPage} / {totalPages}
        </span>
        {renderNext()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between border-t border-gray-100 bg-gray-50/50 py-3.5 px-6',
        className
      )}
    >
      {renderPrev()}
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500 tabular-nums">
        {pageText}
      </span>
      {renderNext()}
    </div>
  );
}
