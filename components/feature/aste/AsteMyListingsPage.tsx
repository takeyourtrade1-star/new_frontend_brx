'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';
import {
  AuctionListTable,
  AuctionResultsGrid,
  AuctionViewToggle,
  type EnrichedAuction,
} from '@/components/feature/aste/auctions-browse-shared';
import { useAuctionList, useDeleteAuction } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, type AuctionUI } from '@/lib/auction/auction-adapter';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { isAuctionEndedUI } from '@/lib/auction/auction-adapter';
import { formatHMS } from '@/components/feature/aste/auctions-browse-shared';

const STORAGE_KEY = 'mie';

function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function AsteMyListingsPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const now = useNowTick();
  const { data: listData, isLoading } = useAuctionList({ limit: 100 });
  const deleteAuctionMutation = useDeleteAuction();
  const userId = user?.id;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteToast, setDeleteToast] = useState(false);

  const mine: AuctionUI[] = useMemo(() => {
    if (!listData?.data || !userId) return [];
    return listData.data
      .filter((a) => a.created_by_user_id === userId)
      .map((a) => apiToAuctionUI(a));
  }, [listData, userId]);

  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(STORAGE_KEY));
  }, []);
  useEffect(() => {
    setStoredAsteViewMode(STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!deleteToast) return;
    const id = window.setTimeout(() => setDeleteToast(false), 4000);
    return () => window.clearTimeout(id);
  }, [deleteToast]);

  const handleDelete = useCallback(async (auctionId: string) => {
    const numericId = Number(auctionId);
    if (!Number.isFinite(numericId) || numericId <= 0) return;
    setDeletingId(auctionId);
    try {
      await deleteAuctionMutation.mutateAsync(numericId);
      setConfirmDeleteId(null);
      setDeleteToast(true);
    } catch (err) {
      const fallback = 'Impossibile eliminare l’asta. Riprova.';
      // Reuse existing toast/error area with a localized API/backend message when available.
      window.alert(err instanceof Error ? err.message : fallback);
    } finally {
      setDeletingId(null);
    }
  }, [deleteAuctionMutation]);

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '';
  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome'), isCurrent: false },
    { href: '/aste', label: t('pages.auctions.title'), isCurrent: false },
    { label: t('auctions.myListingsTitle'), isCurrent: true },
  ];

  if (!isAuthenticated) {
    return (
      <div className="container-content py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">{t('auctions.loginRequiredTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('auctions.loginRequiredBody')}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#FF7300] px-8 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#e86800]"
          >
            {t('auth.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-16 pt-6">
      <AsteNav />
      <div className="container-content">
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="mb-4 w-auto text-sm"
        />

        <header className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900 md:text-3xl">{t('auctions.myListingsTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            {t('auctions.myListingsSubtitle', { name: displayName })}
          </p>
        </header>

        {/* Demo banner */}
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="font-medium">{t('auctions.demoBanner')}</p>
        </div>

        {/* Toast eliminazione */}
        {deleteToast && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 animate-[fadeInDown_0.3s_ease-out]" role="status">
            {t('auctions.deleteSuccess')}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-4 py-3">
          <p className="text-sm text-gray-700">{t('auctions.resultsCount', { count: mine.length })}</p>
          <AuctionViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            listLabel={t('auctions.viewList')}
            gridLabel={t('auctions.viewGrid')}
          />
        </div>

        <div className="overflow-hidden border border-gray-300 bg-white">
          {mine.length === 0 ? (
            <div className="p-16 text-center text-gray-500">{t('auctions.emptyMyListings')}</div>
          ) : viewMode === 'grid' ? (
            <MyAuctionGrid auctions={mine} now={now} t={t} confirmDeleteId={confirmDeleteId} onConfirmDelete={setConfirmDeleteId} onDelete={handleDelete} deletingId={deletingId} />
          ) : (
            <MyAuctionTable auctions={mine} now={now} t={t} confirmDeleteId={confirmDeleteId} onConfirmDelete={setConfirmDeleteId} onDelete={handleDelete} deletingId={deletingId} />
          )}
        </div>
      </div>
    </div>
  );
}

function MyAuctionGrid({
  auctions,
  now,
  t,
  confirmDeleteId,
  onConfirmDelete,
  onDelete,
  deletingId,
}: {
  auctions: AuctionUI[];
  now: number;
  t: (k: any, v?: any) => string;
  confirmDeleteId: string | null;
  onConfirmDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {auctions.map((a) => {
        const ended = isAuctionEndedUI(a);
        const ms = new Date(a.endsAt).getTime() - now;
        const isConfirming = confirmDeleteId === a.id;
        const isDeleting = deletingId === a.id;
        return (
          <div key={a.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-white/40 bg-white/70 shadow-md backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:border-primary/40 hover:bg-white/85 hover:shadow-lg">
            <Link href={auctionDetailPath(a.id)} scroll prefetch className="flex flex-1 flex-col">
              <div className="relative aspect-[63/88] overflow-hidden bg-gray-100">
                <Image src={a.image} alt="" fill className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" sizes="(max-width:640px) 50vw, 20vw" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 rounded-full border border-white/30 bg-white/20 p-1.5 text-center backdrop-blur-md shadow-lg">
                  <p className="font-mono text-sm font-bold tabular-nums text-white" suppressHydrationWarning>
                    {ended ? '—' : formatHMS(ms)}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-2">
                <p className="line-clamp-2 min-h-[2rem] text-[13px] font-semibold leading-tight text-gray-900">{a.title}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
                      {ended ? t('auctions.finalPriceLabel') : t('auctions.currentBid')}
                    </p>
                    <p className="text-base font-bold text-primary">
                      {a.currentBidEur.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Delete button */}
            <div className="border-t border-gray-100 px-2 py-2">
              {isConfirming ? (
                <div className="space-y-2 rounded-lg bg-red-50 p-2 animate-[fadeIn_0.2s_ease-out]">
                  <p className="text-[11px] font-semibold text-red-800">{t('auctions.deleteConfirmTitle')}</p>
                  <p className="text-[10px] text-red-600">{t('auctions.deleteConfirmBody')}</p>
                  <div className="flex gap-2">
                    <button type="button" disabled={isDeleting} onClick={() => onDelete(a.id)} className="rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-60">
                      {isDeleting ? '...' : t('auctions.deleteConfirm')}
                    </button>
                    <button type="button" onClick={() => onConfirmDelete(null)} className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50 transition">
                      {t('auctions.deleteCancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onConfirmDelete(a.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('auctions.deleteConfirm')}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MyAuctionTable({
  auctions,
  now,
  t,
  confirmDeleteId,
  onConfirmDelete,
  onDelete,
  deletingId,
}: {
  auctions: AuctionUI[];
  now: number;
  t: (k: any, v?: any) => string;
  confirmDeleteId: string | null;
  onConfirmDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <>
      <ul className="divide-y divide-gray-100 bg-white md:hidden">
        {auctions.map((a) => {
          const ended = isAuctionEndedUI(a);
          const ms = new Date(a.endsAt).getTime() - now;
          const isConfirming = confirmDeleteId === a.id;
          const isDeleting = deletingId === a.id;
          return (
            <li key={a.id} className="p-3">
              <div className="flex items-start gap-3">
                <Link
                  href={auctionDetailPath(a.id)}
                  className="relative h-20 w-14 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100"
                >
                  <Image src={a.image} alt="" fill className="object-cover" sizes="56px" unoptimized />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={auctionDetailPath(a.id)} className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-[#FF7300]">
                    {a.title}
                  </Link>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <p className="text-gray-500">{t('auctions.currentBid')}</p>
                    <p className="text-right font-bold text-[#FF7300]">
                      {a.currentBidEur.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-gray-500">{t('auctions.colBids')}</p>
                    <p className="text-right font-semibold text-gray-800">{a.bidCount}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex min-h-9 items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-center font-mono text-xs font-bold tabular-nums text-primary" suppressHydrationWarning>
                  {ended ? t('auctions.ended') : formatHMS(ms)}
                </span>
                {isConfirming ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-1.5 animate-[fadeIn_0.2s_ease-out]">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => onDelete(a.id)}
                      className="inline-flex min-h-9 items-center rounded bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? '...' : t('auctions.deleteConfirm')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirmDelete(null)}
                      className="inline-flex min-h-9 items-center rounded border border-red-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50 transition"
                    >
                      {t('auctions.deleteCancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConfirmDelete(a.id)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('auctions.deleteConfirm')}
                  </button>
                )}
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
              <th className="p-3">{t('auctions.currentBid')}</th>
              <th className="p-3">{t('auctions.colBids')}</th>
              <th className="whitespace-nowrap p-3">{t('auctions.countdownTitle')}</th>
              <th className="w-24 p-3" />
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => {
              const ended = isAuctionEndedUI(a);
              const ms = new Date(a.endsAt).getTime() - now;
              const isConfirming = confirmDeleteId === a.id;
              const isDeleting = deletingId === a.id;
              return (
                <tr key={a.id} className="border-b border-gray-100 transition-colors hover:bg-orange-50/60">
                  <td className="p-3">
                    <Link href={auctionDetailPath(a.id)} className="flex items-center gap-3 font-medium text-gray-900 hover:text-[#FF7300]">
                      <span className="relative h-14 w-10 shrink-0 overflow-hidden bg-gray-100">
                        <Image src={a.image} alt="" fill className="object-cover" sizes="40px" unoptimized />
                      </span>
                      <span className="line-clamp-2">{a.title}</span>
                    </Link>
                  </td>
                  <td className="p-3 font-bold text-[#FF7300]">
                    {a.currentBidEur.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3 font-semibold text-gray-800">{a.bidCount}</td>
                  <td className="p-3">
                    <span className="inline-block min-w-[7rem] rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-center font-mono text-sm font-bold tabular-nums text-primary shadow-lg backdrop-blur-md" suppressHydrationWarning>
                      {ended ? t('auctions.ended') : formatHMS(ms)}
                    </span>
                  </td>
                  <td className="p-3">
                    {isConfirming ? (
                      <div className="space-y-1.5 rounded-lg bg-red-50 p-2 animate-[fadeIn_0.2s_ease-out]">
                        <p className="text-[10px] font-semibold text-red-800">{t('auctions.deleteConfirmTitle')}</p>
                        <div className="flex gap-1.5">
                          <button type="button" disabled={isDeleting} onClick={() => onDelete(a.id)} className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-60">
                            {isDeleting ? '...' : t('auctions.deleteConfirm')}
                          </button>
                          <button type="button" onClick={() => onConfirmDelete(null)} className="rounded border border-red-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-50 transition">
                            {t('auctions.deleteCancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onConfirmDelete(a.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
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
