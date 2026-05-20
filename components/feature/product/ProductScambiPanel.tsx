'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, PlusCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getCardImageUrl } from '@/lib/assets';
import type { CardDocument } from '@/lib/product-detail';
import { ScambiProponiModal } from '@/components/feature/scambi/ScambiProponiModal';
import type { ScambioUI } from '@/components/feature/scambi/scambi-types';
import type { TradePayload } from '@/components/feature/scambi/scambi-types';
import { searchGameSlugToAuctionGame } from '@/lib/auction/auction-create-draft';
import type { ScambioGame } from '@/components/feature/scambi/scambi-types';

const PRIMARY = '#FF7300';

function cardToScambioStub(card: CardDocument): ScambioUI {
  const img = getCardImageUrl(card.image ?? '') ?? '';
  const game = searchGameSlugToAuctionGame(card.game_slug) as ScambioGame;
  return {
    id: `product-${card.id}`,
    numericId: 0,
    title: card.name,
    image: img,
    seller: '',
    sellerCountry: 'IT',
    sellerRating: 0,
    sellerReviewCount: 0,
    game: game === 'other' ? 'mtg' : game,
    description: card.set_name ?? '',
    imageFront: img,
    imageBack: '',
    condition: '',
    createdByUserId: null,
    wantsInReturn: card.name,
  };
}

export type ProductScambiPanelProps = {
  card: CardDocument;
};

export function ProductScambiPanel({ card }: ProductScambiPanelProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const stub = cardToScambioStub(card);

  const handleSubmit = (_payload: TradePayload) => {
    setModalOpen(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-6 sm:p-8">
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-center sm:p-8">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md"
          style={{ backgroundColor: PRIMARY }}
        >
          <ArrowLeftRight className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-sm font-bold uppercase tracking-wide text-gray-800">
          {t('productDetail.scambi.title')}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{t('productDetail.scambi.emptyBody')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:opacity-95"
            style={{ backgroundColor: PRIMARY }}
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            {t('productDetail.scambi.propose')}
          </button>
          <Link
            href="/scambi/nuova"
            className="inline-flex items-center rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
          >
            {t('productDetail.scambi.newTrade')}
          </Link>
          <Link
            href="/scambi"
            className="inline-flex items-center rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#FF7300] ring-1 ring-[#FF7300]/30 transition hover:bg-orange-50"
          >
            {t('productDetail.scambi.exploreAll')}
          </Link>
        </div>
      </div>

      <ScambiProponiModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        scambio={stub}
        mode="propose"
        onSubmit={handleSubmit}
        initialCatalogSearch={card.name}
      />
    </div>
  );
}
