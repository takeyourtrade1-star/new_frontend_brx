import { type RefObject } from 'react';
import { CalendarPlus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { formatAuctionEur, CALENDAR_GLASS_MENU_CLASS } from '@/lib/auction/auction-detail-utils';
import { CalendarAddMenu } from '@/components/feature/aste/detail/CalendarAddMenu';
import { AntiSnipeInfoButton } from '@/components/feature/aste/detail/AntiSnipeInfoButton';
import { AuctionCountdown } from '@/components/feature/aste/detail/AuctionCountdown';

/** Card timer "glass arancio" (solo desktop, `lg:flex`). */
export function AuctionTimerCardDesktop({
  isEnded,
  endsAt,
  currentBidEur,
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
  antiSnipeLabel: string;
  calendarRef: RefObject<HTMLDivElement>;
  calendarMenuOpen: boolean;
  onToggleCalendar: () => void;
  onIos: () => void;
  onGoogle: () => void;
}) {
  const { t } = useTranslation();
  const fmtEur = (n: number) => formatAuctionEur(n);

  return (
    <div className="hidden relative flex-col items-center justify-center rounded-2xl border border-[#FF7300]/30 bg-[#FF7300]/10 p-3 px-4 xl:p-4 xl:px-5 backdrop-blur-md shadow-[0_8px_32px_rgba(255,115,0,0.12)] lg:flex overflow-visible min-w-0 w-full">
      {/* Subtle inner highlight to enhance the glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>

      {isEnded ? (
        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-800/60">
            {t('auctions.detailAuctionClosed')}
          </p>
          <p className="mt-3 text-[13px] font-semibold text-[#9A3412]">
            {new Date(endsAt).toLocaleString('it-IT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-2 text-2xl font-black text-[#FF7300]">
            {t('auctions.finalPriceLabel')}: {fmtEur(currentBidEur)}
          </p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF7300] drop-shadow-sm">
              {t('auctions.detailClosesIn')}
            </p>
            <div ref={calendarRef} className="relative">
              <button
                type="button"
                onClick={onToggleCalendar}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#FF7300]/35 bg-white/70 text-[#FF7300] transition hover:border-[#FF7300] hover:bg-white"
                aria-label="Apri menu calendario"
                title="Aggiungi al calendario"
                aria-haspopup="menu"
                aria-expanded={calendarMenuOpen}
              >
                <CalendarPlus className="h-4 w-4" />
              </button>
              {calendarMenuOpen && (
                <CalendarAddMenu
                  menuClassName={`${CALENDAR_GLASS_MENU_CLASS} top-9 text-left`}
                  onIos={onIos}
                  onGoogle={onGoogle}
                />
              )}
            </div>
          </div>
          <AuctionCountdown endsAt={endsAt} variant="desktop" />
          <p className="mt-2 inline-flex flex-wrap items-center justify-center gap-1 text-[11px] font-semibold text-orange-900/75">
            <span className="uppercase tracking-wide text-orange-800/60">{t('auctions.detailAntiSnipe')}:</span>
            <span>{antiSnipeLabel}</span>
            <AntiSnipeInfoButton
              hint={t('auctions.createAntiSniperHint')}
              ariaLabel={t('auctions.detailAntiSnipeInfoAria')}
              buttonClassName="text-orange-700/55 hover:bg-orange-100/80 hover:text-orange-900"
            />
          </p>
        </div>
      )}
    </div>
  );
}
