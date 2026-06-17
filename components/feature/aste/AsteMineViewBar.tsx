'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AuctionTranslate } from '@/components/feature/aste/auctions-browse-shared';

export type MyListingsTab = 'ongoing' | 'ended';

function MyListingsStatusSwitch({
  value,
  onChange,
  ongoingCount,
  endedCount,
  t,
}: {
  value: MyListingsTab;
  onChange: (tab: MyListingsTab) => void;
  ongoingCount: number;
  endedCount: number;
  t: AuctionTranslate;
}) {
  const tabs: { id: MyListingsTab; label: string; count: number }[] = [
    { id: 'ongoing', label: t('auctions.myListingsTabOngoing'), count: ongoingCount },
    { id: 'ended', label: t('auctions.myListingsTabEnded'), count: endedCount },
  ];

  return (
    <div
      role="tablist"
      aria-label={t('auctions.myListingsStatusLabel')}
      className="relative grid w-full max-w-[17rem] grid-cols-2 rounded-full border border-white/70 bg-white/55 p-1 shadow-[0_10px_28px_rgba(29,49,96,0.14)] backdrop-blur-xl backdrop-saturate-150 ring-1 ring-[#1D3160]/10 sm:max-w-xs"
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]',
          value === 'ongoing'
            ? 'translate-x-0 bg-gradient-to-br from-[#FF7300] to-[#ff8f40] shadow-[0_4px_16px_rgba(255,115,0,0.38)]'
            : 'translate-x-full bg-gradient-to-br from-[#1D3160] to-[#2a4480] shadow-[0_4px_16px_rgba(29,49,96,0.32)]',
        )}
      />
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors duration-300 sm:px-3',
              active ? 'text-white' : 'text-[#1D3160]/70 hover:text-[#1D3160]',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                active ? 'bg-white/20 text-white' : 'bg-[#1D3160]/8 text-[#1D3160]/80',
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const PARTICIPATIONS_LINK_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-full border-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-300 sm:px-4 sm:py-2.5 sm:text-[11px]';

type AsteMineViewBarProps =
  | {
      variant: 'published';
      statusTab: MyListingsTab;
      onStatusTabChange: (tab: MyListingsTab) => void;
      ongoingCount: number;
      endedCount: number;
      t: AuctionTranslate;
    }
  | {
      variant: 'participations';
      t: AuctionTranslate;
    };

export function AsteMineViewBar(props: AsteMineViewBarProps) {
  const { t, variant } = props;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {variant === 'published' ? (
        <MyListingsStatusSwitch
          value={props.statusTab}
          onChange={props.onStatusTabChange}
          ongoingCount={props.ongoingCount}
          endedCount={props.endedCount}
          t={t}
        />
      ) : (
        <Link
          href="/aste/mie"
          className={cn(
            PARTICIPATIONS_LINK_CLASS,
            'border-gray-200 bg-white text-gray-600 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.15)]',
          )}
        >
          {t('auctions.myPublishedLink')}
        </Link>
      )}

      {variant === 'published' ? (
        <Link
          href="/aste/partecipazioni"
          className={cn(
            PARTICIPATIONS_LINK_CLASS,
            'border-gray-200 bg-white text-gray-600 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.15)]',
          )}
        >
          {t('auctions.myParticipationsLink')}
        </Link>
      ) : (
        <span
          className={cn(
            PARTICIPATIONS_LINK_CLASS,
            'border-[#FF7300] bg-[#FFF4EC] text-[#FF7300] shadow-[0_0_10px_rgba(255,115,0,0.2)]',
          )}
          aria-current="page"
        >
          {t('auctions.myParticipationsLink')}
        </span>
      )}
    </div>
  );
}
