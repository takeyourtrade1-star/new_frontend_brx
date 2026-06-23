'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { savedApi } from '@/lib/api/auction-client';
import { apiToAuctionUI } from '@/lib/auction/auction-adapter';
import { formatEuroNoSpace } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AsteSalvateContent() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['saved-auctions', 'list', 'me'],
    queryFn: () => savedApi.listSaved({ limit: 50, offset: 0 }),
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500">{t('savedAuctions.loading')}</p>;
  }

  const auctions = (data?.data ?? []).map((a) => apiToAuctionUI(a));
  if (auctions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t('savedAuctions.empty')}</p>
        <Link
          href="/aste"
          className="mt-4 inline-flex rounded-full bg-[#FF7300] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
        >
          {t('savedAuctions.explore')}
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
            <Image
              src={auction.image}
              alt={auction.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
            />
          </div>
          <div className="p-3">
            <p className="line-clamp-2 text-sm font-bold text-gray-900">{auction.title}</p>
            <p className="mt-2 text-xs text-gray-500">{t('auctions.currentBid')}</p>
            <p className="text-sm font-semibold text-[#1D3160]">{formatEuroNoSpace(auction.currentBidEur)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
