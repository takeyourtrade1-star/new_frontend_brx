import { type RefObject } from 'react';
import { CalendarPlus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { formatAuctionEur, CALENDAR_GLASS_MENU_CLASS } from '@/lib/auction/auction-detail-utils';
import { CalendarAddMenu } from '@/components/feature/aste/detail/CalendarAddMenu';
import { AntiSnipeInfoButton } from '@/components/feature/aste/detail/AntiSnipeInfoButton';
import { AuctionCountdown } from '@/components/feature/aste/detail/AuctionCountdown';

/** Card unificata prezzo + timer (solo mobile, `lg:hidden`). */
export function AuctionTimerCardMobile({
  isEnded,
  endsAt,
  currentBidEur,
  effectiveCurrentBidEur,
  startingBidEur,
  bidCount,
  reserveMet,
  antiSnipeLabel,
  calendarRef,
  calendarMenuOpen,
  onToggleCalendar,
  onIos,
  onGoogle,
}: {
  isEnded: boolean;
  endsAt: string;
  currentBidEur: number;
  effectiveCurrentBidEur: number;
  startingBidEur: number;
  bidCount: number;
  reserveMet: boolean;
  antiSnipeLabel: string;
  calendarRef: RefObject<HTMLDivElement>;
  calendarMenuOpen: boolean;
  onToggleCalendar: () => void;
  onIos: () => void;
  onGoogle: () => void;
}) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const fmtEur = (n: number) => formatAuctionEur(n);

  return (
    <div className="lg:hidden">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-orange-50/40 p-3 shadow-sm">
        {isEnded ? (
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              {t('auctions.detailAuctionClosed')}
            </p>
            <p className="mt-2 text-2xl font-extrabold text-[#FF7300]">
              {fmtEur(currentBidEur)}
            </p>
            <p className="mt-1.5 text-xs font-medium text-gray-500">
              {new Date(endsAt).toLocaleString(intlLocale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              {/* Left: Price */}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {t('auctions.currentBid')}
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                  {fmtEur(effectiveCurrentBidEur)}
                </p>
              </div>
              {/* Right: Timer */}
              <div className="shrink-0 text-right">
                <div ref={calendarRef} className="relative flex items-center justify-end gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#FF7300]">
                    {t('auctions.detailClosesIn')}
                  </p>
                  <button
                    type="button"
                    onClick={onToggleCalendar}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#FF7300]/30 bg-white/70 text-[#FF7300] transition hover:border-[#FF7300] hover:bg-white"
                    aria-label={t('auctions.calendar.openMenuAria')}
                    title={t('auctions.calendar.addTitle')}
                    aria-haspopup="menu"
                    aria-expanded={calendarMenuOpen}
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                  </button>
                  {calendarMenuOpen && (
                    <CalendarAddMenu
                      menuClassName={`${CALENDAR_GLASS_MENU_CLASS} top-7`}
                      onIos={onIos}
                      onGoogle={onGoogle}
                    />
                  )}
                </div>
                <AuctionCountdown endsAt={endsAt} variant="mobile" />
                {!isEnded && (
                  <p className="mt-1.5 inline-flex flex-wrap items-center justify-end gap-1 text-[10px] font-medium text-gray-500">
                    <span className="font-semibold text-gray-600">{t('auctions.detailAntiSnipe')}:</span>
                    <span className="text-gray-700">{antiSnipeLabel}</span>
                    <AntiSnipeInfoButton
                      hint={t('auctions.createAntiSnipeHint')}
                      ariaLabel={t('auctions.detailAntiSnipeInfoAria')}
                    />
                  </p>
                )}
              </div>
            </div>
            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2.5 text-xs text-gray-500">
              <span>{t('auctions.detailFrom')}: <span className="font-semibold text-gray-700">{fmtEur(startingBidEur)}</span></span>
              <span className="inline-flex items-center gap-1 text-gray-600">
                <span className="font-semibold text-gray-800">{bidCount}</span> {t('auctions.detailBidsCount')}
              </span>
              <span className={`text-[11px] font-medium ${reserveMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                {reserveMet ? t('auctions.detailReserveYes') : t('auctions.detailReserveNo')}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
