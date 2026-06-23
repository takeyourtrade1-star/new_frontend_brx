'use client';

import { X } from 'lucide-react';

/** Piano 1.4 — banner esito sync, estratto da OggettiContent. Presentazionale. */
export function OggettiSyncBanner({
  banner,
  onClose,
}: {
  banner: { type: 'success' | 'error' | 'info'; message: string };
  onClose: () => void;
}) {
  return (
    <div
      className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
        banner.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : banner.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-sky-200 bg-sky-50 text-sky-700'
      }`}
    >
      <span>
        {banner.message || (banner.type === 'success' ? 'Sincronizzazione completata' : '')}
      </span>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
