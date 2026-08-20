'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

type PaginationProps = {
  currentPage: number; // 1-indexed
  totalPages: number;
  buildPageHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
  variant?: 'card-footer' | 'compact' | 'standard';
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

// Design: un'unica pillola segmentata (frecce + numeri + salto pagina) invece
// di tante bolle separate — i tasti sono "ghost", solo la pagina corrente è piena.
const ITEM_BASE =
  'flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs tabular-nums transition-colors';
const ITEM_IDLE = cn(
  ITEM_BASE,
  'font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 active:scale-95'
);
const ITEM_ACTIVE = cn(ITEM_BASE, 'bg-[#1D3160] font-bold text-white shadow-sm');
const ARROW_STYLE =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-30';

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

  const renderArrow = (dir: 'prev' | 'next') => {
    const disabled = dir === 'prev' ? isPrevDisabled : isNextDisabled;
    const page = dir === 'prev' ? prevPage : nextPage;
    const label = dir === 'prev' ? prevLabel : nextLabel;
    const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
    if (buildPageHref && !onPageChange && !disabled) {
      return (
        <Link href={buildPageHref(page)} className={ARROW_STYLE} aria-label={label}>
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </Link>
      );
    }
    return (
      <button type="button" disabled={disabled} onClick={() => goTo(page)} className={ARROW_STYLE} aria-label={label}>
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </button>
    );
  };

  const renderNumbers = (span: number) => (
    <ul className="flex items-center gap-0.5" aria-label={pageText}>
      {buildPageItems(currentPage, totalPages, span).map((item, i) => (
        <li key={item === 'gap' ? `gap-${i}` : item}>
          {item === 'gap' ? (
            <span className="flex h-8 w-5 items-center justify-center text-xs font-bold text-gray-400" aria-hidden>
              …
            </span>
          ) : item === currentPage ? (
            <span aria-current="page" className={ITEM_ACTIVE}>
              {item}
            </span>
          ) : buildPageHref && !onPageChange ? (
            <Link href={buildPageHref(item)} className={ITEM_IDLE}>
              {item}
            </Link>
          ) : (
            <button type="button" onClick={() => goTo(item)} className={ITEM_IDLE}>
              {item}
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  const standardItems = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : Array.from({ length: 7 }, (_, index) => {
        if (currentPage <= 4) return index + 1;
        if (currentPage >= totalPages - 3) return totalPages - 6 + index;
        return currentPage - 3 + index;
      });

  const standardArrowClassName =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 md:h-9 md:w-9 md:rounded-lg';
  const standardPageClassName =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-sm font-medium tabular-nums transition-all md:h-9 md:min-w-9 md:rounded-lg';

  const renderStandardArrow = (dir: 'prev' | 'next') => {
    const disabled = dir === 'prev' ? isPrevDisabled : isNextDisabled;
    const page = dir === 'prev' ? prevPage : nextPage;
    const label = dir === 'prev' ? prevLabel : nextLabel;
    const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;

    if (buildPageHref && !onPageChange && !disabled) {
      return (
        <Link href={buildPageHref(page)} className={standardArrowClassName} aria-label={label}>
          <Icon className="h-4 w-4" />
        </Link>
      );
    }

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => goTo(page)}
        className={standardArrowClassName}
        aria-label={label}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  };

  const renderStandardNumbers = () => (
    <ul className="flex items-center gap-1 px-1" aria-label={pageText}>
      {standardItems.map((page) => (
        <li key={page}>
          {page === currentPage ? (
            <span
              aria-current="page"
              className={cn(
                standardPageClassName,
                'bg-primary text-white shadow-sm shadow-primary/20',
              )}
            >
              {page}
            </span>
          ) : buildPageHref && !onPageChange ? (
            <Link
              href={buildPageHref(page)}
              className={cn(
                standardPageClassName,
                'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
              aria-label={t('search.pageOf', { current: page, total: totalPages })}
            >
              {page}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => goTo(page)}
              className={cn(
                standardPageClassName,
                'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
              aria-label={t('search.pageOf', { current: page, total: totalPages })}
            >
              {page}
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  const pill = (span: number, withGoto: boolean) => (
    <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-gray-200/80 bg-white p-1 shadow-[0_2px_12px_rgba(29,49,96,0.07)]">
      {renderArrow('prev')}
      {renderNumbers(span)}
      {renderArrow('next')}
      {withGoto && (
        <>
          {/* Salto diretto: utile quando le pagine sono tante */}
          <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-gray-200" />
          <form onSubmit={handleGotoSubmit} className="flex shrink-0 items-center">
            <input
              type="number"
              min={1}
              max={totalPages}
              inputMode="numeric"
              value={gotoValue}
              onChange={(e) => setGotoValue(e.target.value)}
              placeholder="n°"
              aria-label={goToLabel}
              className="h-8 w-11 rounded-full bg-transparent text-center text-xs font-semibold tabular-nums text-gray-700 outline-none transition placeholder:text-gray-400 focus:bg-gray-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="submit"
              aria-label={goToLabel}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#FF7300] active:scale-95"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </form>
        </>
      )}
    </div>
  );

  if (variant === 'compact') {
    return (
      <nav className={cn('flex items-center', className)} aria-label={pageText}>
        {pill(1, false)}
      </nav>
    );
  }

  if (variant === 'standard') {
    return (
      <nav
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:justify-between',
          className,
        )}
        aria-label={pageText}
      >
        <span className="text-sm text-gray-500">{pageText}</span>
        <div className="flex max-w-full items-center justify-center overflow-x-auto md:justify-end">
          {renderStandardArrow('prev')}
          {renderStandardNumbers()}
          {renderStandardArrow('next')}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        'flex items-center justify-center border-t border-gray-100 bg-gray-50/50 py-3.5 px-4',
        className
      )}
      aria-label={pageText}
    >
      {pill(2, totalPages > 7)}
    </nav>
  );
}
