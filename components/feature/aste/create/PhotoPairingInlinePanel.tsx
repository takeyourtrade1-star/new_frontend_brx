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
  compact = false,
}: {
  qrUrl: string;
  body: string;
  regenerateLabel: string;
  closeSessionLabel: string;
  onRegenerate: () => void | Promise<void>;
  onCloseSession: () => void | Promise<void>;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#1D3160]/15 bg-[#f8f9fb] p-2.5 shadow-sm',
        compact && 'rounded-lg p-2',
        className,
      )}
    >
      <div className={cn('flex items-start gap-3', compact && 'flex-col gap-2.5 sm:flex-row sm:gap-2')}>
        <div className={cn('shrink-0 rounded-lg border border-zinc-100 bg-white p-2', compact && 'p-1.5 self-start')}>
          <QRCodeSVG value={qrUrl} size={compact ? 72 : 104} level="M" className={cn(compact ? 'h-[72px] w-[72px]' : 'h-[104px] w-[104px]')} />
        </div>
        <div className={cn('min-w-0 flex-1 pt-0.5', compact && 'pt-0')}>          
          <p className={cn('font-medium leading-snug text-zinc-800', compact ? 'text-[12px]' : 'text-[13px]')}>{body}</p>
          <div className={cn('flex flex-wrap gap-1.5', compact ? 'mt-1.5' : 'mt-2')}>            
            <button
              type="button"
              onClick={() => void onRegenerate()}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-[#1D3160]/15 bg-white font-semibold text-[#1D3160] transition hover:border-[#FF7300]/50 hover:bg-orange-50/40',
                compact ? 'px-2 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
              )}
            >
              <RefreshCw className={cn('shrink-0', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} aria-hidden />
              {regenerateLabel}
            </button>
            <button
              type="button"
              onClick={() => void onCloseSession()}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white font-semibold text-zinc-500 transition hover:bg-zinc-50',
                compact ? 'px-2 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
              )}
            >
              <X className={cn('shrink-0', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} aria-hidden />
              {closeSessionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
