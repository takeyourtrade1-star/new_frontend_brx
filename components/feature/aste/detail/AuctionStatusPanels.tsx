import Link from 'next/link';
import { Package } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';

export interface AuctionStatusPanelsProps {
  isOwner: boolean;
  isEnded: boolean;
  outcome: 'live' | 'sold' | 'unsold';
  winnerUsername: string;
  currentBidEur: number;
  reservePriceEur: number;
  fmtEur: (n: number) => string;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

/** Pannelli di stato del dettaglio asta (esiti venditore/acquirente, CTA spedizione, gestione). */
export function AuctionStatusPanels({
  isOwner,
  isEnded,
  outcome,
  winnerUsername,
  currentBidEur,
  reservePriceEur,
  fmtEur,
  t,
}: AuctionStatusPanelsProps) {
  return (
    <>
      {isOwner && isEnded && outcome === 'sold' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-bold">{t('auctions.sellerEndedWonTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed">
            {t('auctions.sellerEndedWonBody', {
              winner: winnerUsername,
              amount: fmtEur(currentBidEur),
            })}
          </p>
        </div>
      )}

      {isOwner && isEnded && outcome === 'unsold' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">{t('auctions.sellerEndedUnsoldTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed">
            {t('auctions.sellerEndedUnsoldBody', {
              high: fmtEur(currentBidEur),
              reserve: fmtEur(reservePriceEur),
            })}
          </p>
        </div>
      )}

      {!isOwner && isEnded && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          <p className="font-bold uppercase tracking-wide text-gray-600">{t('auctions.buyerAuctionEnded')}</p>
          <p className="mt-2 font-semibold text-gray-900">
            {outcome === 'sold'
              ? t('auctions.buyerEndedSold', { amount: fmtEur(currentBidEur) })
              : t('auctions.buyerEndedUnsold')}
          </p>
        </div>
      )}

      {isOwner && outcome === 'sold' && (
        <Link
          href="/ordini/vendite?tab=da-spedire"
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#FF7300] bg-[#FF7300] py-4 text-center text-base font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#e86800]"
        >
          <Package className="h-5 w-5 shrink-0" aria-hidden />
          {t('auctions.sellerShippingCta')}
        </Link>
      )}

      {isOwner && !isEnded && (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/aste/mie"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[#FF7300]/35 hover:text-[#FF7300]"
          >
            {t('auctions.sellerActionManage')}
          </Link>
          <button
            type="button"
            disabled
            className="self-center text-xs font-medium text-gray-500 underline-offset-2 transition hover:text-[#FF7300] hover:underline disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            {t('auctions.sellerActionEdit')}
          </button>
        </div>
      )}
    </>
  );
}
