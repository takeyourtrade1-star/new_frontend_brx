'use client';

/**
 * Lista / griglia aste — stessi pattern della pagina risultati Meilisearch (SearchResults.tsx).
 */

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, LayoutList, SlidersHorizontal, Star } from 'lucide-react';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { FlagIcon } from '@/components/ui/FlagIcon';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { isAuctionEndedUI, type AuctionUI, type AuctionGame } from '@/lib/auction/auction-adapter';
import { roundUpToHalfStep } from '@/lib/auction/bid-math';

export type EnrichedAuction = AuctionUI;

const EURO_PARTS_FORMATTER = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function MoneyWithSmallCents({ value, className = '' }: { value: number; className?: string }) {
  const roundedValue = roundUpToHalfStep(value);
  const parts = EURO_PARTS_FORMATTER.formatToParts(roundedValue);
  const main = parts
    .filter((p) => p.type !== 'fraction' && p.type !== 'currency')
    .map((p) => p.value)
    .join('')
    .trim();
  const fraction = parts.find((p) => p.type === 'fraction')?.value ?? '00';
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? ',';

  return (
    <span className={className}>
      {main}
      <span className="align-top text-[0.65em] font-semibold leading-none">
        {decimal}
        {fraction}
      </span>
      <span className="ml-1">€</span>
    </span>
  );
}

export function formatHMS(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Solo durata leggibile (es. "2g 5h", "3h 12m", "45m") — per badge su immagine. */
function formatCountdownDuration(ms: number): string {
  if (ms <= 0) return '—';
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatSellerLabel(rawSeller: string): string {
  const trimmed = rawSeller.trim();
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(trimmed);

  if (!looksLikeUuid) return trimmed;
  return `Venditore: ${trimmed.slice(0, 4)}...`;
}

const GAME_KEYS: Record<AuctionGame, MessageKey> = {
  mtg: 'auctions.gameMtg',
  lorcana: 'auctions.gameLorcana',
  pokemon: 'auctions.gamePokemon',
  op: 'auctions.gameOp',
  ygo: 'auctions.gameYgo',
  other: 'auctions.gameAll',
};

export function auctionGameLabel(
  t: (k: MessageKey, vars?: Record<string, string | number>) => string,
  g: AuctionGame
): string {
  return t(GAME_KEYS[g]);
}

export type AuctionTranslate = (k: MessageKey, vars?: Record<string, string | number>) => string;

export function AuctionViewToggle({
  viewMode,
  onViewModeChange,
  listLabel = 'Lista',
  gridLabel = 'Griglia',
  variant = 'icons-only',
}: {
  viewMode: 'list' | 'grid';
  onViewModeChange: (v: 'list' | 'grid') => void;
  listLabel?: string;
  gridLabel?: string;
  variant?: 'icons-only' | 'with-labels';
}) {
  if (variant === 'icons-only') {
    return (
      <div className="flex h-10 overflow-hidden rounded-full bg-gray-100">
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          aria-label={listLabel}
          title={listLabel}
          className={`flex h-10 w-12 items-center justify-center transition-colors ${
            viewMode === 'list'
              ? 'bg-primary text-white'
              : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          <LayoutList className="h-4 w-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('grid')}
          aria-label={gridLabel}
          title={gridLabel}
          className={`flex h-10 w-12 items-center justify-center transition-colors ${
            viewMode === 'grid'
              ? 'bg-primary text-white'
              : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden rounded-none border border-[#FF7300]/50">
      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold uppercase transition-colors ${
          viewMode === 'list'
            ? 'bg-[#FF7300] text-white shadow-inner hover:bg-[#e86800]'
            : 'border-r border-[#FF7300]/30 bg-white text-[#FF7300] hover:bg-orange-50/80'
        }`}
      >
        <LayoutList className="h-4 w-4 shrink-0" />
        {listLabel}
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('grid')}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold uppercase transition-colors ${
          viewMode === 'grid'
            ? 'bg-[#FF7300] text-white shadow-inner hover:bg-[#e86800]'
            : 'border-l border-[#FF7300]/30 bg-white text-[#FF7300] hover:bg-orange-50/80'
        }`}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        {gridLabel}
      </button>
    </div>
  );
}

export function AuctionGridCard({
  auction,
  now,
  t,
}: {
  auction: EnrichedAuction;
  now: number;
  t: AuctionTranslate;
}) {
  const ended = isAuctionEndedUI(auction);
  const ms = new Date(auction.endsAt).getTime() - now;
  const isTimerUrgent = !ended && ms > 0 && ms < 2 * 60 * 60 * 1000;
  return (
    <Link
      href={auctionDetailPath(auction.id)}
      scroll
      prefetch={false}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
    >
      {/* Image container */}
      <div className="relative aspect-[63/88] overflow-hidden bg-gray-100">
        <Image
          src={auction.image}
          alt=""
          fill
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          sizes="(max-width:640px) 50vw, 20vw"
          unoptimized
        />
        {/* Fascia scura sotto l’arte: contrasto costante per il badge timer */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/80 via-black/45 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-2 pb-2 pt-6">
          <div
            className={`w-full max-w-[min(100%,14rem)] rounded-lg border px-2.5 py-1.5 text-center shadow-lg backdrop-blur-md ${
              isTimerUrgent
                ? 'border-red-400/45 bg-red-950/90 ring-1 ring-red-500/30'
                : 'border-white/20 bg-black/78 ring-1 ring-black/20'
            }`}
          >
            {ended ? (
              <p className="text-[11px] font-bold uppercase tracking-wide text-white">{t('auctions.ended')}</p>
            ) : (
              <>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/80">Scade tra</p>
                <p
                  className="mt-0.5 text-sm font-bold tabular-nums tracking-tight text-white sm:text-[15px]"
                  suppressHydrationWarning
                >
                  {formatCountdownDuration(ms)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 px-2 pb-2 pt-1.5">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-900">
          {auction.title}
        </p>

        <div className="flex min-w-0 items-center gap-1 text-[10px] leading-tight text-slate-600">
          <FlagIcon country={auction.sellerCountry} size="sm" />
          <span className="min-w-0 max-w-[38%] shrink truncate font-medium text-slate-700">
            {formatSellerLabel(auction.seller)}
          </span>
          <span className="shrink-0 text-slate-300">·</span>
          <span className="flex min-w-0 items-center gap-0.5 truncate text-amber-600">
            <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-500" aria-hidden />
            <span className="truncate">
              {auction.sellerRating}% ({auction.sellerReviewCount})
            </span>
          </span>
        </div>

        <div className="mt-1 flex items-end justify-between gap-2 border-t border-slate-100/90 bg-slate-50/60 px-2 py-1.5 -mx-2">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              {ended ? t('auctions.finalPriceLabel') : t('auctions.currentBid')}
            </p>
            <MoneyWithSmallCents
              value={auction.currentBidEur}
              className="text-lg font-extrabold leading-none text-primary sm:text-xl"
            />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{t('auctions.colBids')}</p>
            <p className="text-xs font-semibold tabular-nums text-slate-700">{auction.bidCount}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function AuctionListTable({
  auctions,
  now,
  t,
  myBidById,
}: {
  auctions: EnrichedAuction[];
  now: number;
  t: AuctionTranslate;
  /** Se presente, colonna aggiuntiva “La tua offerta”. */
  myBidById?: Record<string, number>;
}) {
  const router = useRouter();

  return (
    <>
      <ul className="divide-y divide-gray-100 bg-white md:hidden">
        {auctions.map((a) => {
          const ended = isAuctionEndedUI(a);
          const ms = new Date(a.endsAt).getTime() - now;
          const myBid = myBidById?.[a.id];
          return (
            <li key={a.id} className="p-3">
              <div className="flex items-start gap-3">
                <Link
                  href={auctionDetailPath(a.id)}
                  scroll
                  prefetch={false}
                  className="relative h-20 w-14 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100"
                >
                  <Image src={a.image} alt="" fill className="object-cover" sizes="56px" unoptimized />
                </Link>
                <div className="min-w-0 flex-1">
                <Link
                  href={auctionDetailPath(a.id)}
                  scroll
                  prefetch={false}
                  className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-[#FF7300]"
                  >
                    {a.title}
                  </Link>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase text-gray-400">
                    {auctionGameLabel(t, a.game)}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-700">
                    <FlagIcon country={a.sellerCountry} size="sm" />
                    <span className="truncate">{a.seller}</span>
                    <span className="text-amber-600">★ {a.sellerRating}%</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <p className="text-gray-500">{t('auctions.currentBid')}</p>
                    <div className="text-right">
                      <MoneyWithSmallCents value={a.currentBidEur} className="font-bold text-[#FF7300]" />
                    </div>
                    <p className="text-gray-500">{t('auctions.colBids')}</p>
                    <p className="text-right font-semibold text-gray-800">{a.bidCount}</p>
                    {myBidById && (
                      <>
                        <p className="text-gray-500">{t('auctions.colMyBid')}</p>
                        <div className="text-right font-semibold text-gray-900">
                          {myBid != null ? <MoneyWithSmallCents value={myBid} /> : '—'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex min-h-9 items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-center font-mono text-xs font-bold tabular-nums text-primary" suppressHydrationWarning>
                  {ended ? t('auctions.ended') : formatHMS(ms)}
                </span>
                <Link
                  href={auctionDetailPath(a.id)}
                  scroll
                  prefetch={false}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold uppercase text-header-bg hover:underline"
                >
                  {ended ? t('auctions.viewClosedAuction') : 'Fai la tua offerta'}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold uppercase text-gray-600">
              <th className="p-3">{t('search.thName')}</th>
              <th className="p-3">{t('auctions.seller')}</th>
              <th className="p-3">{t('auctions.currentBid')}</th>
              {myBidById && <th className="whitespace-nowrap p-3">{t('auctions.colMyBid')}</th>}
              <th className="p-3">{t('auctions.colBids')}</th>
              <th className="whitespace-nowrap p-3">{t('auctions.countdownTitle')}</th>
              <th className="w-32 p-3" />
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => {
              const ended = isAuctionEndedUI(a);
              const ms = new Date(a.endsAt).getTime() - now;
              const myBid = myBidById?.[a.id];
              return (
                <tr
                  key={a.id}
                  className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-orange-50/60"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('a')) return;
                    router.push(auctionDetailPath(a.id));
                  }}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={auctionDetailPath(a.id)}
                      className="flex items-center gap-3 font-medium text-gray-900 hover:text-[#FF7300]"
                    >
                      <span className="relative h-14 w-10 shrink-0 overflow-hidden bg-gray-100">
                        <Image src={a.image} alt="" fill className="object-cover" sizes="40px" unoptimized />
                      </span>
                      <span>
                        <span className="line-clamp-2 block">{a.title}</span>
                        <span className="mt-0.5 block text-[10px] font-semibold uppercase text-gray-400">
                          {auctionGameLabel(t, a.game)}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-gray-800">
                        <FlagIcon country={a.sellerCountry} size="sm" />
                        {a.seller}
                      </span>
                      <span className="text-xs text-amber-600">
                        ★ {a.sellerRating}% ({a.sellerReviewCount})
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <MoneyWithSmallCents value={a.currentBidEur} className="font-bold text-[#FF7300]" />
                  </td>
                  {myBidById && (
                    <td className="p-3 font-semibold text-gray-900">
                      {myBid != null ? <MoneyWithSmallCents value={myBid} /> : '—'}
                    </td>
                  )}
                  <td className="p-3 font-semibold text-gray-800">{a.bidCount}</td>
                  <td className="p-3">
                    <span className="inline-block min-w-[7rem] rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-center font-mono text-sm font-bold tabular-nums text-primary shadow-lg backdrop-blur-md" suppressHydrationWarning>
                      {ended ? t('auctions.ended') : formatHMS(ms)}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={auctionDetailPath(a.id)}
                      scroll
                      prefetch
                      className="inline-flex rounded-lg px-3 py-2 text-xs font-bold uppercase text-header-bg hover:underline"
                    >
                      {ended ? t('auctions.viewClosedAuction') : 'Fai la tua offerta'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AuctionResultsGrid({
  auctions,
  now,
  t,
}: {
  auctions: EnrichedAuction[];
  now: number;
  t: AuctionTranslate;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-2.5 sm:p-3.5">
      {auctions.map((a) => (
        <AuctionGridCard key={a.id} auction={a} now={now} t={t} />
      ))}
    </div>
  );
}
