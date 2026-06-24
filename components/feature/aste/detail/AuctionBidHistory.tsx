import { Crown, ChevronDown } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import type { BidRowUI } from '@/lib/auction/auction-adapter';
import { formatAuctionEur, sameUserId } from '@/lib/auction/auction-detail-utils';

export function AuctionBidHistory({
  bidRows,
  bidsExpanded,
  onToggleExpanded,
  isOwner,
  highestBidderId,
  currentUserId,
}: {
  bidRows: BidRowUI[];
  bidsExpanded: boolean;
  onToggleExpanded: () => void;
  isOwner: boolean;
  highestBidderId: string | null | undefined;
  currentUserId: string | null;
}) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const fmtEur = (n: number) => formatAuctionEur(n);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-gray-100 bg-gray-50/50 px-3 py-2 sm:px-3.5">
        <h3 className="min-w-0 flex-1 text-[10px] font-black uppercase leading-snug tracking-[0.08em] text-gray-900 sm:text-[11px] sm:tracking-[0.1em]">
          {isOwner ? t('auctions.sellerBidHistoryTitle') : t('auctions.detailBidHistory')}
        </h3>
        <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#1D3160] px-2 py-0.5 text-[10px] font-bold leading-none text-white">
          {bidRows.length} {t('auctions.detailBidsCount')}
        </span>
      </div>

      <div className={`overflow-y-auto py-0.5 ${bidRows.length === 0 ? 'min-h-[3rem]' : 'max-h-60'}`}>
        {bidRows.length === 0 && (
          <p className="px-3 py-2 text-center text-xs text-gray-400">
            Nessuna offerta ancora.
          </p>
        )}
        {/* Bids List */}
        {(() => {
          let crownShown = false;
          const visibleBids = bidsExpanded ? bidRows : bidRows.slice(0, 3);

          return visibleBids.map((b, i) => {
            const isLeader = sameUserId(b.userId, highestBidderId);
            const showCrown = isLeader && !crownShown;
            if (showCrown) crownShown = true;
            const isMine = currentUserId != null && sameUserId(b.userId, currentUserId);
            const bidderCountry = b.countryCode || 'IT';
            const animationDelay = `${i * 0.05}s`;
            const bidDate = new Date(b.createdAt);
            const timeStr = bidDate.toLocaleString(intlLocale, {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={b.bidId}
                style={{ animationDelay }}
                className={`group flex items-center justify-between px-3 py-2 transition-all duration-300 hover:bg-gray-50 animate-[fadeInUp_0.4s_ease-out_both] xl:px-4 xl:py-2.5 ${i !== visibleBids.length - 1 ? 'border-b border-gray-50' : ''} ${isMine ? 'border-l-4 border-l-[#FF7300] bg-orange-50/60' : 'border-l-4 border-l-transparent hover:border-l-gray-300'}`}
              >
                <div className="flex items-center gap-3 min-w-0 transition-transform duration-300 group-hover:translate-x-1">
                  <div className="shrink-0 overflow-hidden rounded-sm ring-1 ring-black/5">
                    <FlagIcon country={bidderCountry} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs xl:text-[13px] ${isLeader ? 'font-black text-[#1D3160]' : 'font-bold text-gray-700'}`}>
                        {b.displayName}
                      </span>
                      {showCrown && (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-[#FFB800] drop-shadow-sm" aria-hidden />
                      )}
                    </div>
                    <span suppressHydrationWarning className="block mt-0.5 text-[10px] tracking-wide text-gray-400">
                      {timeStr}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-black text-gray-900 transition-transform duration-300 group-hover:-translate-x-1 xl:text-[15px]">
                   {fmtEur(b.amountEur)}
                 </span>
              </div>
            );
          });
        })()}

        {/* Expand/Collapse Toggle */}
        {bidRows.length > 3 && (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex w-full items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50/50 py-2.5 text-xs font-extrabold uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#FF7300]"
          >
            {bidsExpanded ? 'Vedi meno' : `Vedi tutte (${bidRows.length})`}
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${bidsExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
