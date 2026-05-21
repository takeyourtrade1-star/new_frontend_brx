'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { RARITY_DEFINITIONS } from '@/lib/rarity';
import { useTranslation } from '@/lib/i18n/useTranslation';

type RarityLegendModalProps = {
  open: boolean;
  onClose: () => void;
};

export function RarityLegendModal({ open, onClose }: RarityLegendModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rarity-legend-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label={t('rarity.legendClose')}
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200/90 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <h2 id="rarity-legend-title" className="text-sm font-bold uppercase tracking-wide text-gray-900">
              {t('rarity.legendTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{t('rarity.legendDescription')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label={t('rarity.legendClose')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <ul className="divide-y divide-gray-100 px-2 py-1">
          {RARITY_DEFINITIONS.map((def) => (
            <li key={def.key} className="flex items-center gap-3 px-2 py-2.5">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: def.color }}
                aria-hidden
              />
              <span className="text-sm font-semibold text-gray-900">{t(def.labelKey)}</span>
            </li>
          ))}
          <li className="flex items-center gap-3 px-2 py-2.5">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full bg-gray-400 ring-1 ring-black/10"
              aria-hidden
            />
            <span className="text-sm font-medium text-gray-600">{t('rarity.unknown')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
