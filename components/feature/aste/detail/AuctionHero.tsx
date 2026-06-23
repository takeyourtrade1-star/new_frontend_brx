import Link from 'next/link';
import { ArrowLeft, Bookmark, Eye, Users } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { AuctionQrButton } from '@/components/feature/aste/AuctionQrButton';
import { AuctionShareButton } from '@/components/feature/aste/AuctionShareButton';

export interface AuctionHeroProps {
  title: string;
  isOwner: boolean;
  isSaved: boolean;
  sellerDisplayName: string;
  sellerAccountType: string;
  sellerCountry: string;
  sellerRating: number;
  statsViewsCount: number;
  statsWatchingCount: number;
  heroTitleRef: React.RefObject<HTMLDivElement>;
  onToggleSave: () => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

/** Hero del dettaglio asta: back link, titolo + azioni (salva/QR/condividi), venditore + stats. */
export function AuctionHero({
  title,
  isOwner,
  isSaved,
  sellerDisplayName,
  sellerAccountType,
  sellerCountry,
  sellerRating,
  statsViewsCount,
  statsWatchingCount,
  heroTitleRef,
  onToggleSave,
  t,
}: AuctionHeroProps) {
  return (
    <section className="w-full border-b border-gray-200 bg-white">
      <div className="container-content container-content-card-detail py-2 sm:py-2.5 lg:py-3">
        {/* Back link */}
        <Link
          href="/aste"
          className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-[#FF7300] sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('auctions.backToAuctions')}
        </Link>

        {/* Titolo prodotto + azioni */}
        <div ref={heroTitleRef} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            {/* Riga Titolo + Azioni Compatte dentro una singola Pill */}
            <div className="flex w-full items-center justify-between gap-2 rounded-[1.75rem] border border-gray-100/80 bg-gray-50/80 p-1 pl-3 shadow-sm backdrop-blur-sm sm:pl-4">
              <div className="min-w-0 flex-1">
                <h1 className="break-words py-0.5 text-[20px] font-black uppercase leading-[1.05] tracking-tight text-gray-900 sm:text-[22px] md:text-[26px] lg:text-[28px]">
                  {title}
                </h1>
              </div>

              {/* Salva per dopo + Condividi (Icon-only compatte a destra) */}
              <div className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5">
                {!isOwner && (
                  <button
                    type="button"
                    onClick={onToggleSave}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-md ${isSaved ? 'text-[#FF7300]' : 'text-gray-400 hover:text-[#FF7300]'}`}
                    aria-label={t('auctions.detailSaveLater')}
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                )}
                <AuctionQrButton auctionTitle={title} compact />
                <AuctionShareButton auctionTitle={title} compact />
              </div>
            </div>

            {/* Venditore / Meta & Stats */}
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              {isOwner ? (
                <p className="inline-flex max-w-fit items-center rounded bg-[#FFF4EC] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a3412]">
                  {t('auctions.sellerBanner')}
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 sm:text-xs">
                  <span>{t('auctions.detailSoldBy')}: <span className="font-bold text-gray-900">{sellerDisplayName}</span></span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-600">
                    {sellerAccountType === 'business' ? 'Business' : 'Privato'}
                  </span>
                  <FlagIcon country={sellerCountry} size="sm" />
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center">
                    <span className="text-[12px] tracking-[0.1em] text-[#FFB800] drop-shadow-[0_1px_1px_rgba(255,184,0,0.5)]">{'★'.repeat(Math.min(5, Math.round((sellerRating / 100) * 5)))}</span>
                    <span className="ml-[2px] font-bold text-gray-700">{sellerRating}%</span>
                  </div>
                </div>
              )}

              {/* Statistiche visualizzazioni & live */}
              <div className="flex items-center gap-3 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1.5" title={t('auctions.statsViews', { count: statsViewsCount })}>
                  <Eye className="h-4 w-4 text-gray-400" aria-hidden />
                  <span className="font-bold text-gray-700">{statsViewsCount}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-[#FF7300]" title={t('auctions.statsWatching', { count: statsWatchingCount })}>
                  <Users className="h-4 w-4" aria-hidden />
                  <span>{statsWatchingCount} Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
