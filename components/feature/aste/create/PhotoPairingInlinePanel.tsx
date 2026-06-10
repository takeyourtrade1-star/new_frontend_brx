'use client';

import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PhotoPairingInlinePanel({
  qrUrl,
  body,
  regenerateLabel,
  closeSessionLabel,
  onRegenerate,
  onCloseSession,
  className,
}: {
  qrUrl: string;
  body: string;
  regenerateLabel: string;
  closeSessionLabel: string;
  onRegenerate: () => void | Promise<void>;
  onCloseSession: () => void | Promise<void>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#1D3160]/15 bg-[#f8f9fb] p-2.5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg border border-zinc-100 bg-white p-2">
          <QRCodeSVG value={qrUrl} size={104} level="M" className="h-[104px] w-[104px]" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] leading-snug text-zinc-700">{body}</p>
          <p className="mt-1 line-clamp-2 break-all text-[9px] leading-snug text-zinc-400" title={qrUrl}>
            {qrUrl}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => void onRegenerate()}
              className="inline-flex items-center gap-1 rounded-full border border-[#1D3160]/15 bg-white px-2 py-1 text-[10px] font-semibold text-[#1D3160] transition hover:border-[#FF7300]/50 hover:bg-orange-50/40"
            >
              <RefreshCw className="h-3 w-3" aria-hidden />
              {regenerateLabel}
            </button>
            <button
              type="button"
              onClick={() => void onCloseSession()}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-500 transition hover:bg-zinc-50"
            >
              <X className="h-3 w-3" aria-hidden />
              {closeSessionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
