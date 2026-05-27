'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function DemoListingBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div ref={panelRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800 ring-1 ring-blue-200 transition hover:bg-blue-200"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Info className="h-3 w-3" aria-hidden />
        {t('accountPage.itemsBadgeDemo')}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('accountPage.itemsDemoPopoverTitle')}
          className="absolute left-0 top-full z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-blue-200 bg-white p-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">{t('accountPage.itemsDemoPopoverTitle')}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
              aria-label="Chiudi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">{t('accountPage.itemsDemoExplain')}</p>
          <Link
            href="/account/sincronizzazione"
            className="mt-3 inline-flex text-sm font-semibold text-[#FF7300] hover:underline"
            onClick={() => setOpen(false)}
          >
            {t('accountPage.itemsDemoChangeMode')} →
          </Link>
        </div>
      )}
    </div>
  );
}
