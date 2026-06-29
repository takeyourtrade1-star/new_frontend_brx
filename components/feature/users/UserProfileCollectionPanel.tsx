'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Archive, ChevronLeft, ChevronRight, Loader2, PackageOpen } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { usePublicUserCollection } from '@/lib/hooks/use-public-user-collection';
import { useMeilisearchCards } from '@/lib/hooks/use-meilisearch-cards';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { getInventoryConditionCode } from '@/lib/inventory/inventory-filter-utils';
import { ASSETS, getCdnImageUrl } from '@/lib/config';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import type { PublicInventoryItem } from '@/types';

const PAGE_SIZE = 24;
const DEFAULT_IMAGE = getCdnImageUrl('Logo%20Principale%20EBARTEX.png');

function buildImageUrl(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_IMAGE;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('http')) return trimmed;
  const path = trimmed.replace(/^\/img\//, '').replace(/^img\//, '');
  if (!path) return DEFAULT_IMAGE;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return ASSETS.cdnUrl ? `${ASSETS.cdnUrl}${withSlash}` : withSlash;
}

function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

interface UserProfileCollectionPanelProps {
  username: string;
}

export function UserProfileCollectionPanel({ username }: UserProfileCollectionPanelProps) {
  const intlLocale = useIntlLocale();
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data, isLoading, isError, refetch } = usePublicUserCollection(username, {
    limit: PAGE_SIZE,
    offset,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const blueprintIds = useMemo(
    () => [...new Set((data?.items ?? []).map((i) => i.blueprint_id).filter((id) => id > 0))],
    [data?.items],
  );

  const { data: catalog = {}, isLoading: catalogLoading } = useMeilisearchCards(blueprintIds);

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border border-white/60 bg-white/50 px-6 py-16 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7300]" />
        <p className="text-sm font-medium text-slate-500">Caricamento collezione…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-100/80 bg-red-50/60 px-6 py-12 text-center backdrop-blur-xl">
        <p className="mb-4 text-sm text-red-700">Impossibile caricare la collezione.</p>
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

  if (total === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/40 px-8 py-16 text-center backdrop-blur-xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100/80">
          <PackageOpen className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-base font-semibold text-slate-800">Collezione vuota</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          @{username} non ha ancora oggetti in collezione.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Archive className="h-4 w-4 text-[#ff7300]" />
          <span>
            <span className="font-bold text-slate-900">{total}</span> oggetti in collezione
          </span>
          {catalogLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        </p>
        {totalPages > 1 && (
          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
            variant="compact"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => {
          const card = catalog[item.blueprint_id];
          const names = card
            ? getCardDisplayNames(
                { name: card.name ?? '', keywords_localized: card.keywords_localized },
                'it'
              )
            : null;
          const title = names?.primary ?? card?.name ?? `Carta #${item.blueprint_id}`;
          const imageUrl = buildImageUrl(card?.image ?? null);
          const condition = getInventoryConditionCode(
            ((item.properties as Record<string, unknown>)?.condition ??
              (item.properties as Record<string, unknown>)?.card_condition) as string | undefined
          );
          const searchHref = card?.id
            ? `/search?q=${encodeURIComponent(card.name ?? title)}`
            : '/search';

          return (
            <Link
              key={item.id}
              href={searchHref}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#ff7300]/25 hover:bg-white/80 hover:shadow-[0_16px_40px_rgba(255,115,0,0.12)]"
            >
              <div className="relative aspect-[63/88] overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-contain p-2 transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:640px) 50vw, 20vw"
                  unoptimized
                />
                {item.quantity > 1 && (
                  <span className="absolute right-2 top-2 rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    ×{item.quantity}
                  </span>
                )}
                {item.graded && (
                  <span className="absolute left-2 top-2 rounded-full bg-[#ff7300]/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Graded
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 min-h-[2.25rem] text-[13px] font-semibold leading-snug text-slate-900">
                  {title}
                </p>
                {card?.set_name && (
                  <p className="line-clamp-1 text-[11px] font-medium text-slate-500">{card.set_name}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100/90 pt-2">
                  <span className="text-sm font-bold text-[#ff7300]">{formatPrice(item.price_cents, intlLocale)}</span>
                  {condition && <ConditionBadge condition={condition} size="sm" />}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
