'use client';

/**
 * Dock offerta mobile — pillola glass fissa in basso (< lg). Tap → bottom sheet con AuctionBidPanel.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Gavel, X } from 'lucide-react';
import { AuctionBidPanel } from '@/components/feature/aste/AuctionBidPanel';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { formatEur, cn } from '@/lib/utils';

type AuctionMobileBidDockProps = {
  /** Mostra la pillola (il sheet resta indipendente da questo flag). */
  visible: boolean;
  auctionId: number;
  currentBidEur: number;
  isWinning: boolean;
  reserveMet: boolean;
  maxBidEur: number | null;
  proxyBidOutbid: boolean;
  buyNowEnabled: boolean;
  buyNowPrice: number | null;
  buyNowUrl: string | null;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onOpenMaxBid: () => void;
  onSubmitOffer: (amountEur: number) => void;
  onSubmitMaxBid: (amountEur: number) => void;
};

export function AuctionMobileBidDock({
  visible,
  auctionId,
  currentBidEur,
  isWinning,
  reserveMet,
  maxBidEur,
  proxyBidOutbid,
  buyNowEnabled,
  buyNowPrice,
  buyNowUrl,
  isAuthenticated,
  onRequireAuth,
  onOpenMaxBid,
  onSubmitOffer,
  onSubmitMaxBid,
}: AuctionMobileBidDockProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigando client-side su un'altra asta il sheet aperto va chiuso.
  useEffect(() => {
    setSheetOpen(false);
  }, [auctionId]);

  // Scroll lock + chiusura con Escape quando il sheet è aperto.
  useEffect(() => {
    if (!sheetOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const showPill = visible && !sheetOpen;

  const pill = (
    <div
      className={cn(
        'fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[9998] transition-all duration-200 lg:hidden',
        showPill
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      )}
    >
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full border border-white/60 bg-white/80 py-1.5 pl-5 pr-1.5 shadow-[0_10px_28px_rgba(29,49,96,0.25)] backdrop-blur-xl backdrop-saturate-150 transition active:scale-[0.98]"
      >
        <span className="min-w-0 text-left">
          <span className="block text-[9px] font-semibold uppercase tracking-wide text-gray-500">
            {t('auctions.currentBid')}
          </span>
          <span
            className={cn(
              'block truncate text-base font-extrabold leading-tight',
              isWinning ? 'text-emerald-700' : 'text-[#1D3160]'
            )}
          >
            {formatEur(currentBidEur)}
          </span>
        </span>
        <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#FF7300] px-4 text-sm font-bold text-white shadow-sm">
          <Gavel className="h-4 w-4" aria-hidden />
          {t('auctions.bidPanel.makeBid')}
        </span>
      </button>
    </div>
  );

  const sheet =
    sheetOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[7000] flex items-end justify-center bg-black/55 backdrop-blur-[2px] lg:hidden"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSheetOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t('auctions.bidModalTitle')}
              className="w-full max-w-lg animate-slide-up rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-2.5">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center justify-between px-4 pt-1.5">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1D3160]">
                  {t('auctions.bidModalTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label={t('auctions.bidPanel.closeAria')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-y-auto px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
                <AuctionBidPanel
                  auctionId={auctionId}
                  currentBidEur={currentBidEur}
                  isWinning={isWinning}
                  reserveMet={reserveMet}
                  maxBidEur={maxBidEur}
                  proxyBidOutbid={proxyBidOutbid}
                  buyNowEnabled={buyNowEnabled}
                  buyNowPrice={buyNowPrice}
                  buyNowUrl={buyNowUrl}
                  isAuthenticated={isAuthenticated}
                  inputId="bid-dock-input"
                  onRequireAuth={() => {
                    setSheetOpen(false);
                    onRequireAuth();
                  }}
                  onOpenMaxBid={() => {
                    setSheetOpen(false);
                    onOpenMaxBid();
                  }}
                  onSubmitOffer={(amountEur) => {
                    setSheetOpen(false);
                    onSubmitOffer(amountEur);
                  }}
                  onSubmitMaxBid={(amountEur) => {
                    setSheetOpen(false);
                    onSubmitMaxBid(amountEur);
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {mounted ? createPortal(pill, document.body) : null}
      {sheet}
    </>
  );
}
