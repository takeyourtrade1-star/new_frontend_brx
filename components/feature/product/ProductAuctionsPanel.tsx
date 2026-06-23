'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, type AuctionUI } from '@/lib/auction/auction-adapter';
import { useEnrichedAuctions } from '@/lib/hooks/use-enriched-auctions';
import { AuctionResultsGrid } from '@/components/feature/aste/auctions-browse-shared';
import type { CardDocument } from '@/lib/product-detail';

const PRIMARY = '#FF7300';

export type ProductAuctionsPanelProps = {
  card: CardDocument;
};

export function ProductAuctionsPanel({
  card,
}: ProductAuctionsPanelProps) {
  const { t } = useTranslation();
  const cardName = card.name?.trim() ?? '';

  const cardQuery = useAuctionList(
    {
      q: cardName || undefined,
      status: 'ACTIVE',
      limit: 20,
    },
    { enabled: cardName.length > 0 }
  );

  const baseCardAuctions: AuctionUI[] = useMemo(
    () => (cardQuery.data?.data ?? []).map((a) => apiToAuctionUI(a)),
    [cardQuery.data]
  );

  const enrichedCard = useEnrichedAuctions(baseCardAuctions);

  const shownIds = useMemo(
    () => new Set(enrichedCard.map((a) => a.numericId)),
    [enrichedCard]
  );

  const recommendedQuery = useAuctionList({
    status: 'ACTIVE',
    limit: 12,
  });

  const baseRecommended: AuctionUI[] = useMemo(() => {
    const raw = (recommendedQuery.data?.data ?? []).map((a) => apiToAuctionUI(a));
    return raw.filter((a) => !shownIds.has(a.numericId)).slice(0, 6);
  }, [recommendedQuery.data, shownIds]);

  const enrichedRecommended = useEnrichedAuctions(baseRecommended);

  const loading = cardQuery.isLoading;
  const hasCardAuctions = enrichedCard.length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-4 sm:p-6">
      {loading && (
        <div className="flex min-h-[160px] items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: PRIMARY }} aria-hidden />
          <span>{t('common.loading.shufflingCards')}</span>
        </div>
      )}

      {!loading && !hasCardAuctions && (
        <p className="rounded-xl border border-gray-200 bg-gray-50/80 px-5 py-6 text-center text-sm font-semibold text-gray-800">
          {t('productDetail.auctions.emptyTitle')}
        </p>
      )}

      {!loading && hasCardAuctions && (
        <section aria-labelledby="pd-auctions-for-card">
          <h3 id="pd-auctions-for-card" className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-700">
            {t('productDetail.auctions.forThisCard')}
          </h3>
          <AuctionResultsGrid auctions={enrichedCard} t={t} />
        </section>
      )}

      <section className="mt-8 border-t border-gray-100 pt-6" aria-labelledby="pd-auctions-recommended">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id="pd-auctions-recommended" className="text-xs font-bold uppercase tracking-wide text-gray-700">
            {hasCardAuctions
              ? t('productDetail.auctions.recommendedTitle')
              : t('productDetail.auctions.recommendedTitleEmpty')}
          </h3>
          <Link
            href="/aste"
            className="text-xs font-bold uppercase tracking-wide text-[#FF7300] hover:underline"
          >
            {t('productDetail.auctions.viewAll')}
          </Link>
        </div>
        {recommendedQuery.isLoading && (
          <div className="flex min-h-[80px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" aria-hidden />
          </div>
        )}
        {!recommendedQuery.isLoading && enrichedRecommended.length === 0 && (
          <p className="text-sm text-gray-500">{t('auctions.noResults')}</p>
        )}
        {enrichedRecommended.length > 0 && (
          <AuctionResultsGrid auctions={enrichedRecommended} t={t} />
        )}
      </section>
    </div>
  );
}
