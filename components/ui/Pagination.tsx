'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
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

/**
 * Elenco pagine da mostrare: prima, ultima e una finestra attorno alla
 * corrente; i salti diventano 'gap' (…). Così da pagina 20 si torna
 * indietro con un click invece di scorrere una pagina alla volta.
 */
function buildPageItems(current: number, total: number, span: number): (number | 'gap')[] {
  const pages = new Set<number>([1, total]);
  for (let p = current - span; p <= current + span; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: (number | 'gap')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev > 0) {
      if (p - prev === 2) items.push(prev + 1);
      else if (p - prev > 2) items.push('gap');
    }
    items.push(p);
    prev = p;
  }
  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  buildPageHref,
  onPageChange,
  variant = 'card-footer',
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [gotoValue, setGotoValue] = useState('');

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  const prevLabel = t('search.prevPage') || 'Pagina precedente';
  const nextLabel = t('search.nextPage') || 'Pagina successiva';
  const pageText = t('search.pageOf', { current: currentPage, total: totalPages }) || `Pagina ${currentPage} di ${totalPages}`;
  const goToLabel = t('search.goToPage') || 'Vai alla pagina';

  const goTo = (page: number) => {
    const target = Math.min(totalPages, Math.max(1, page));
    if (target === currentPage) return;
    if (onPageChange) onPageChange(target);
    else if (buildPageHref) router.push(buildPageHref(target));
  };

  const handleGotoSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(gotoValue, 10);
    if (!Number.isNaN(parsed)) {
      goTo(parsed);
      setGotoValue('');
    }
  };

  const arrowStyle =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40';

  const renderArrow = (dir: 'prev' | 'next') => {
    const disabled = dir === 'prev' ? isPrevDisabled : isNextDisabled;
    const page = dir === 'prev' ? prevPage : nextPage;
    const label = dir === 'prev' ? prevLabel : nextLabel;
    const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
    if (buildPageHref && !onPageChange && !disabled) {
      return (
        <Link href={buildPageHref(page)} className={arrowStyle} aria-label={label}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </Link>
      );
    }
    return (
      <button type="button" disabled={disabled} onClick={() => goTo(page)} className={arrowStyle} aria-label={label}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </button>
    );
  };

  const renderNumbers = (span: number) => (
    <ul className="flex items-center gap-1" aria-label={pageText}>
      {buildPageItems(currentPage, totalPages, span).map((item, i) => (
        <li key={item === 'gap' ? `gap-${i}` : item}>
          {item === 'gap' ? (
            <span className="px-0.5 text-xs font-bold text-gray-400" aria-hidden>
              …
            </span>
          ) : item === currentPage ? (
            <span
              aria-current="page"
              className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-[#1D3160] px-1.5 text-xs font-bold tabular-nums text-white shadow-sm"
            >
              {item}
            </span>
          ) : buildPageHref && !onPageChange ? (
            <Link
              href={buildPageHref(item)}
              className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border border-gray-200 bg-white px-1.5 text-xs font-semibold tabular-nums text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
            >
              {item}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => goTo(item)}
              className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border border-gray-200 bg-white px-1.5 text-xs font-semibold tabular-nums text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
            >
              {item}
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  if (variant === 'compact') {
    return (
      <nav className={cn('flex items-center gap-1.5', className)} aria-label={pageText}>
        {renderArrow('prev')}
        {renderNumbers(1)}
        {renderArrow('next')}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        'flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 bg-gray-50/50 py-3.5 px-4',
        className
      )}
      aria-label={pageText}
    >
      {renderArrow('prev')}
      {renderNumbers(2)}
      {renderArrow('next')}
      {/* Salto diretto: utile quando le pagine sono tante */}
      {totalPages > 7 && (
        <form onSubmit={handleGotoSubmit} className="ml-1 flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={totalPages}
            inputMode="numeric"
            value={gotoValue}
            onChange={(e) => setGotoValue(e.target.value)}
            placeholder="n°"
            aria-label={goToLabel}
            className="h-9 w-14 rounded-full border border-gray-200 bg-white px-2 text-center text-xs font-semibold tabular-nums text-gray-700 shadow-sm outline-none transition focus:border-[#FF7300] focus:ring-2 focus:ring-[#FF7300]/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="submit"
            className="flex h-9 items-center justify-center rounded-full border border-gray-200 bg-white px-3 text-xs font-bold uppercase tracking-wide text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
          >
            {t('search.goToPageCta') || 'Vai'}
          </button>
        </form>
      )}
    </nav>
  );
}
