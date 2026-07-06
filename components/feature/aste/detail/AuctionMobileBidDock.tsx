'use client';

/**
 * Dock offerta mobile — due pillole glass (< lg): prezzo a sinistra, CTA offerta a destra.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AuctionBidPanel } from '@/components/feature/aste/AuctionBidPanel';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn, formatEur } from '@/lib/utils';
import { dispatchStickyBottomBar } from '@/lib/asso-layout';

/** Stile glass condiviso con AuctionMobileActionsBar. */
const GLASS_SURFACE =
  'border border-white/60 bg-white/70 shadow-[0_10px_24px_rgba(29,49,96,0.15)] backdrop-blur-xl backdrop-saturate-150';

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

function dispatchBidDockVisibility(visible: boolean) {
  dispatchStickyBottomBar({ visible, kind: 'bidDock' });
}

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

  useEffect(() => {
    setSheetOpen(false);
  }, [auctionId]);

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

  // Sposta Aiuto sopra il dock (evento globale + fallback route in AssoMobileHelpButton).
  useEffect(() => {
    if (!mounted) return;
    dispatchBidDockVisibility(showPill);
    return () => dispatchBidDockVisibility(false);
  }, [showPill, mounted]);

  const pill = (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] z-[9998] transition-all duration-200 lg:hidden',
        showPill ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      )}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div
          className={cn(
            GLASS_SURFACE,
            'shrink-0 rounded-2xl px-4 py-2.5',
            showPill && 'pointer-events-auto'
          )}
          aria-live="polite"
        >
          <p className="text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-gray-500">
            {t('auctions.currentBid')}
          </p>
          <p
            className={cn(
              'mt-1 whitespace-nowrap text-lg font-extrabold leading-none tabular-nums',
              isWinning ? 'text-emerald-700' : 'text-[#1D3160]'
            )}
          >
            {formatEur(currentBidEur)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            GLASS_SURFACE,
            'inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-2xl px-7 py-3 transition active:scale-[0.98]',
            showPill ? 'pointer-events-auto' : 'pointer-events-none'
          )}
          aria-label={t('auctions.bidPanel.makeBid')}
        >
          <span className="whitespace-nowrap text-base font-bold text-[#FF7300]">
            {t('auctions.bidPanel.offerCta')}
          </span>
        </button>
      </div>
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
