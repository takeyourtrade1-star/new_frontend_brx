'use client';

import { useNowTick } from '@/lib/hooks/use-now-tick';
import { formatAuctionCountdown, isAuctionCountdownLong } from '@/lib/auction/auction-countdown';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * FE-REV-001: countdown live isolato.
 * Il tick `useNowTick` vive qui (non nel parent ~1000 righe), così ogni secondo
 * si ri-renderizza solo questo testo e non l'intero albero della pagina asta.
 * Passare `endsAt` invece di `msLeft` evita di propagare il valore che cambia ogni secondo.
 */
export function AuctionCountdown({
  endsAt,
  variant,
}: {
  endsAt: string;
  variant: 'mobile' | 'desktop';
}) {
  const { t } = useTranslation();
  const now = useNowTick();
  const msLeft = new Date(endsAt).getTime() - now;
  const countdownIsLong = isAuctionCountdownLong(msLeft);

  if (variant === 'desktop') {
    return (
      <p
        className="mt-2 flex items-baseline justify-center gap-1.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-[#9A3412] leading-none xl:text-3xl"
        suppressHydrationWarning
      >
        {formatAuctionCountdown(msLeft)}
        {!countdownIsLong && (
          <span className="text-xl font-black tracking-widest text-orange-800/80 xl:text-2xl">
            {t('auctions.detailHoursSuffix').toUpperCase()}
          </span>
        )}
      </p>
    );
  }

  return (
    <>
      <p
        className="mt-1 font-mono text-lg font-bold tabular-nums tracking-tight text-gray-900 sm:text-xl"
        suppressHydrationWarning
      >
        {formatAuctionCountdown(msLeft)}
      </p>
      {!countdownIsLong && (
        <p className="text-[10px] font-medium text-gray-400">{t('auctions.detailHoursSuffix')}</p>
      )}
    </>
  );
}
