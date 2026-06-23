import { TrendingUp, Users } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';

export interface AuctionSellerStatsProps {
  bidCount: number;
  bids24hCount: number;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

/** Box statistiche venditore (offerenti unici, offerte 24h) per asta live. */
export function AuctionSellerStats({ bidCount, bids24hCount, t }: AuctionSellerStatsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('auctions.sellerStatsTitle')}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7300]" aria-hidden />
          <div>
            <p className="text-lg font-bold text-gray-900">{bidCount}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {t('auctions.sellerUniqueBidders')}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7300]" aria-hidden />
          <div>
            <p className="text-lg font-bold text-gray-900">{bids24hCount}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {t('auctions.sellerBids24h')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
