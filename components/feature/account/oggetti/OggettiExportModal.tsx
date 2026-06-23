'use client';

import { ChevronRight, Download, FileJson, FileSpreadsheet, X } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Piano 1.4 — modale export (CSV/JSON), estratto da OggettiContent. Presentazionale. */
export function OggettiExportModal({
  itemCount,
  t,
  onClose,
  onExportCSV,
  onExportJSON,
}: {
  itemCount: number;
  t: T;
  onClose: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600">
              <Download className="h-5 w-5" />
            </div>
            <h2 id="export-modal-title" className="text-lg font-bold text-gray-900">
              {t('accountPage.itemsExport')}
            </h2>
            <p className="text-sm text-gray-500">
              {itemCount.toLocaleString()} {t('accountPage.itemsItemsInView')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
            aria-label={t('accountPage.itemsClose')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid gap-3">
          <button
            type="button"
            onClick={onExportCSV}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{t('accountPage.itemsExportCSV')}</p>
              <p className="text-xs text-gray-500">{t('accountPage.itemsExportCSVDesc')}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
          <button
            type="button"
            onClick={onExportJSON}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
              <FileJson className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{t('accountPage.itemsExportJSON')}</p>
              <p className="text-xs text-gray-500">{t('accountPage.itemsExportJSONDesc')}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <p className="text-xs text-center text-gray-400">{t('accountPage.itemsExportHint')}</p>
      </div>
    </div>
  );
}
