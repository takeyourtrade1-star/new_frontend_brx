'use client';

import { CardLanguageFlags } from '@/components/ui/CardLanguageFlags';
import { RarityIndicator } from '@/components/ui/RarityIndicator';
import {
  AUCTION_CREATE_GAMES,
  searchGameSlugToAuctionGame,
  type AuctionCreateCardSelection,
} from '@/lib/auction/auction-create-draft';
import { useTranslation } from '@/lib/i18n/useTranslation';

export type AuctionCreateCardDataPanelProps = {
  selection: AuctionCreateCardSelection;
};

export function AuctionCreateCardDataPanel({ selection }: AuctionCreateCardDataPanelProps) {
  const { t } = useTranslation();
  const game = searchGameSlugToAuctionGame(selection.gameSlug);
  const gameLabelKey = AUCTION_CREATE_GAMES.find((g) => g.value === game)?.labelKey;

  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white/85 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-800">
          {t('auctions.createCardDataTitle')}
        </h3>
        {gameLabelKey ? (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
            {t(gameLabelKey)}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            {t('auctions.createCardDataRarity')}
          </p>
          <div className="mt-1">
            <RarityIndicator rarity={selection.rarity} showLabel size="md" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2 text-right">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            {t('auctions.createCardDataNumber')}
          </p>
          <p className="mt-1 text-sm font-extrabold tabular-nums text-zinc-900">
            {selection.collectorNumber ?? '—'}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            {t('auctions.createCatalogSetLabel')}
          </p>
          <p className="mt-1 truncate text-sm font-extrabold text-zinc-900">
            {selection.setName ?? '—'}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            {t('auctions.createCardDataLanguages')}
          </p>
          <div className="mt-1.5">
            {selection.availableLanguages?.length ? (
              <CardLanguageFlags languages={selection.availableLanguages} size="sm" showActiveLabel />
            ) : (
              <span className="text-[12px] font-semibold text-zinc-500">N/D</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
