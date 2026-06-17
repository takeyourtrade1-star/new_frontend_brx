'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';

import {
  AuctionListTable,
  AuctionResultsGrid,
  AuctionViewToggle,
} from '@/components/feature/aste/auctions-browse-shared';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';
import { apiToAuctionUI } from '@/lib/auction/auction-adapter';
import { enrichAuctionsWithPublicUsers } from '@/lib/auction/public-user-enrichment';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { AuctionUI } from '@/lib/auction/auction-adapter';

const STORAGE_KEY = 'profile';

function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

interface UserProfileAuctionsPanelProps {
  userId: string;
  username: string;
}

export function UserProfileAuctionsPanel({ userId, username }: UserProfileAuctionsPanelProps) {
  const { t } = useTranslation();
  const now = useNowTick();
  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');

  const { data, isLoading, isError, refetch } = useAuctionList(
    { created_by_user_id: userId, limit: 100 },
    { enabled: Boolean(userId) },
  );

  const baseAuctions: AuctionUI[] = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((a) => apiToAuctionUI(a));
  }, [data]);

  const [auctions, setAuctions] = useState<AuctionUI[]>([]);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (baseAuctions.length === 0) {
        setAuctions([]);
        return;
      }
      const enriched = await enrichAuctionsWithPublicUsers(baseAuctions);
      if (!cancelled) setAuctions(enriched);
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [baseAuctions]);

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(STORAGE_KEY));
  }, []);

  useEffect(() => {
    setStoredAsteViewMode(STORAGE_KEY, viewMode);
  }, [viewMode]);

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border border-white/60 bg-white/50 px-6 py-16 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7300]" />
        <p className="text-sm font-medium text-slate-500">Caricamento aste…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-100/80 bg-red-50/60 px-6 py-12 text-center backdrop-blur-xl">
        <p className="mb-4 text-sm text-red-700">Impossibile caricare le aste.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/40 px-8 py-16 text-center backdrop-blur-xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100/80">
          <AuctionGavelIcon className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-base font-semibold text-slate-800">Nessuna asta</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          @{username} non ha aste pubblicate al momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-3 backdrop-blur-xl">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <AuctionGavelIcon className="h-4 w-4 text-[#ff7300]" />
          <span>
            <span className="font-bold text-slate-900">{auctions.length}</span> aste
          </span>
        </p>
        <AuctionViewToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          listLabel={t('auctions.viewList')}
          gridLabel={t('auctions.viewGrid')}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/55 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        {viewMode === 'grid' ? (
          <AuctionResultsGrid auctions={auctions} now={now} t={t} />
        ) : (
          <AuctionListTable auctions={auctions} now={now} t={t} />
        )}
      </div>
    </div>
  );
}
