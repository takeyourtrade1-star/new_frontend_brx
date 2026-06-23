import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { formatAuctionCountdown, isAuctionCountdownLong } from '@/lib/auction/auction-countdown';
import type { AuctionUI } from '@/lib/auction/auction-adapter';
import { formatAuctionEur, PASTEL_GRADIENTS } from '@/lib/auction/auction-detail-utils';
import { useNowTick } from '@/lib/hooks/use-now-tick';

export function SimilarAuctionsSections({
  similarCards,
}: {
  similarCards: AuctionUI[];
}) {
  const { t } = useTranslation();
  const fmtEur = (n: number) => formatAuctionEur(n);
  // FE-REV-001: il tick vive qui, così il countdown delle aste simili non forza
  // un re-render dell'intera pagina dettaglio asta ogni secondo.
  const now = useNowTick();

  return (
    <>
      {/* Oggetti simili — carousel mobile, grid desktop */}
      <div className="mt-10 sm:mt-12">
        <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
          {t('auctions.similarTitle')}
        </h2>

        {/* Mobile: horizontal scroll carousel */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide lg:hidden">
          {similarCards.map((a) => {
            const ms = new Date(a.endsAt).getTime() - now;
            const timeLeft = formatAuctionCountdown(ms);
            return (
              <Link
                key={a.id}
                href={auctionDetailPath(a.id)}
                prefetch
                scroll
                className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:border-[#FF7300] hover:shadow-lg hover:-translate-y-1"
              >
                {/* Immagine verticale */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
                  <Image
                    src={a.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="220px"
                    unoptimized
                  />
                </div>
                {/* Info sotto */}
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-bold uppercase leading-tight text-gray-900">
                    {a.title}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {a.seller}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-base font-extrabold text-[#FF7300]">
                      {fmtEur(a.currentBidEur)}
                    </p>
                    <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                      {timeLeft}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop: grid 3 colonne (invariato) */}
        <div className="hidden gap-5 sm:grid-cols-2 lg:grid lg:grid-cols-3">
          {similarCards.map((a) => {
            const ms = new Date(a.endsAt).getTime() - now;
            const timeLeft = formatAuctionCountdown(ms);
            return (
              <Link
                key={a.id}
                href={auctionDetailPath(a.id)}
                prefetch
                scroll
                className="group flex h-[180px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:border-[#FF7300] hover:shadow-lg"
              >
                <div className="relative h-full w-[45%] shrink-0 overflow-hidden">
                  <Image
                    src={a.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="160px"
                    unoptimized
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="line-clamp-2 text-sm font-bold uppercase leading-tight text-gray-900">
                      {a.title}
                    </p>
                    <p className="mt-1.5 text-xs text-gray-500">
                      {t('auctions.detailSoldBy')}: <span className="font-medium text-gray-700">{a.seller}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-[#FF7300]">
                      {fmtEur(a.currentBidEur)}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                      {timeLeft}
                      {!isAuctionCountdownLong(ms) ? ` ${t('auctions.detailHoursSuffix')}` : null}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Aste in evidenza — lista compatta */}
      <div className="mt-10 sm:mt-12">
        <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
          {t('auctions.tableExchangeTitle')}
        </h2>
        <div className="space-y-2 lg:space-y-3">
          {similarCards.slice(0, 5).map((row, i) => (
            <Link
              key={row.id}
              href={auctionDetailPath(row.id)}
              prefetch
              scroll
              className={`group relative isolate flex h-[80px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 lg:h-[110px] hover:border-primary/40 hover:shadow-sm lg:hover:-translate-y-0.5 lg:hover:${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].border} lg:hover:${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].shadow} lg:hover:shadow-md`}
            >
              {/* Gradient background on hover — desktop only */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden lg:block">
                <div className={`absolute inset-0 bg-gradient-to-r ${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].gradient}`} />
                <div className="absolute inset-y-0 -left-full w-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-700 ease-out group-hover:left-full" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 animate-pulse" />
              </div>

              {/* Immagine */}
              <div className="relative h-full w-[70px] shrink-0 overflow-hidden lg:w-1/6">
                <Image
                  src={row.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 70px, 72px"
                  unoptimized
                />
              </div>

              {/* Info */}
              <div className="relative z-[1] flex min-w-0 flex-1 items-center justify-between gap-2 p-2.5 lg:flex-col lg:items-start lg:justify-between lg:p-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-xs font-bold uppercase leading-tight text-gray-900 sm:text-sm lg:line-clamp-2">
                    {row.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-500 lg:mt-1 lg:text-xs">
                    <FlagIcon country={row.sellerCountry} size="xs" />
                    <span className="font-medium text-gray-700">{row.seller}</span>
                    <span className="text-amber-500">★</span>
                    <span className="text-[10px] text-gray-400">{row.sellerRating}%</span>
                  </p>
                </div>
                {/* Mobile: Pill CTA | Desktop: underline CTA */}
                <span
                  className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary transition-colors group-hover:bg-primary group-hover:text-white lg:self-start lg:rounded-none lg:bg-transparent lg:px-0 lg:py-0 lg:text-[11px] lg:text-gray-800 lg:underline lg:decoration-gray-300 lg:underline-offset-2 lg:group-hover:bg-transparent lg:group-hover:text-primary"
                >
                  {t('auctions.shippingViewAuction')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
