'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { savedApi } from '@/lib/api/auction-client';
import { apiToAuctionUI } from '@/lib/auction/auction-adapter';
import { formatEuroNoSpace } from '@/lib/utils';

export function AsteSalvateContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['saved-auctions', 'list', 'me'],
    queryFn: () => savedApi.listSaved({ limit: 50, offset: 0 }),
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500">Caricamento aste salvate…</p>;
  }

  const auctions = (data?.data ?? []).map((a) => apiToAuctionUI(a));
  if (auctions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Nessuna asta salvata</p>
        <Link
          href="/aste"
          className="mt-4 inline-flex rounded-full bg-[#FF7300] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
        >
          Esplora le aste
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {auctions.map((auction) => (
        <Link
          key={auction.id}
          href={`/aste/${auction.id}`}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
        >
          <div className="relative aspect-[4/3] bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={auction.image} alt={auction.title} className="h-full w-full object-cover" />
          </div>
          <div className="p-3">
            <p className="line-clamp-2 text-sm font-bold text-gray-900">{auction.title}</p>
            <p className="mt-2 text-xs text-gray-500">Offerta attuale</p>
            <p className="text-sm font-semibold text-[#1D3160]">{formatEuroNoSpace(auction.currentBidEur)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
