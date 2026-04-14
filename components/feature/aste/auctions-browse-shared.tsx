'use client';

/**
 * Lista / griglia aste — stessi pattern della pagina risultati Meilisearch (SearchResults.tsx).
 */

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, LayoutList, SlidersHorizontal } from 'lucide-react';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { FlagIcon } from '@/components/ui/FlagIcon';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { isAuctionEndedUI, type AuctionUI, type AuctionGame } from '@/lib/auction/auction-adapter';

export type EnrichedAuction = AuctionUI;

export function formatHMS(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
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
  return (
    <Link
      href={auctionDetailPath(auction.id)}
      scroll
      prefetch
      className="group flex flex-col overflow-hidden rounded-xl border border-white/40 bg-white/70 shadow-md backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:border-primary/40 hover:bg-white/85 hover:shadow-lg"
    >
      {/* Image container - full bleed */}
      <div className="relative aspect-[63/88] overflow-hidden bg-gray-100">
        <Image
          src={auction.image}
          alt=""
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          sizes="(max-width:640px) 50vw, 20vw"
          unoptimized
        />
        {/* Dark gradient overlay for timer readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Game badge - glass, positioned top right */}
        <div className="absolute right-2 top-2 rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-lg backdrop-blur-md">
          {auctionGameLabel(t, auction.game)}
        </div>
        
        {/* Timer - glass style like game badge, white text for readability */}
        <div className="absolute bottom-2 left-2 right-2 rounded-full border border-white/30 bg-white/20 p-1.5 text-center backdrop-blur-md shadow-lg">
          <p className="font-mono text-sm font-bold tabular-nums text-white" suppressHydrationWarning>
            {ended ? '—' : formatHMS(ms)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-2">
        {/* Title */}
        <p className="line-clamp-2 min-h-[2rem] text-[13px] font-semibold leading-tight text-gray-900">
          {auction.title}
        </p>

        {/* Seller info */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <FlagIcon country={auction.sellerCountry} size="sm" />
          <span className="truncate text-[11px] font-medium text-gray-600">{auction.seller}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-medium">{auction.sellerRating}%</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">({auction.sellerReviewCount})</span>
        </div>

        {/* Price & Bids row */}
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
              {ended ? t('auctions.finalPriceLabel') : t('auctions.currentBid')}
            </p>
            <p className="text-base font-bold text-primary">
              {auction.currentBidEur.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">{t('auctions.colBids')}</p>
            <p className="text-base font-bold text-gray-800">{auction.bidCount}</p>
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
    <div className="overflow-x-auto">
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
                <td className="p-3 font-bold text-[#FF7300]">
                  {a.currentBidEur.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </td>
                {myBidById && (
                  <td className="p-3 font-semibold text-gray-900">
                    {myBid != null
                      ? myBid.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                      : '—'}
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
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {auctions.map((a) => (
        <AuctionGridCard key={a.id} auction={a} now={now} t={t} />
      ))}
    </div>
  );
}
