'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { CardDocument } from '@/lib/product-detail';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

const AuctionCreateWizard = dynamic(
  () => import('@/components/feature/aste/create/AuctionCreateWizard').then((mod) => mod.AuctionCreateWizard),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2.5 text-xs text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      </div>
    ),
  }
);

export interface ProductDetailAuctionTabProps {
  card?: CardDocument;
  blueprintIdForAuction: number | null;
  auctionInventoryLoading: boolean;
  auctionInventoryItems: InventoryItemWithCatalog[];
  inventoryLoadingLabel: string;
  onAuctionCancel: () => void;
}

export function ProductDetailAuctionTab({
  card,
  blueprintIdForAuction,
  auctionInventoryLoading,
  auctionInventoryItems,
  inventoryLoadingLabel,
  onAuctionCancel,
}: ProductDetailAuctionTabProps) {
  if (card && blueprintIdForAuction) {
    return (
      <div className="hidden min-h-0 bg-zinc-50/30 p-2 sm:block sm:p-2.5">
        {auctionInventoryLoading ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2.5 text-xs text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
            <span>{inventoryLoadingLabel}</span>
          </div>
        ) : (
          <AuctionCreateWizard
            key={`${card.id}-${auctionInventoryItems.length}`}
            variant="embedded"
            embeddedCard={card}
            embeddedInventoryItems={auctionInventoryItems}
            onEmbeddedCancel={onAuctionCancel}
            className="!max-w-full"
          />
        )}
      </div>
    );
  }

  return (
    <div className="hidden flex-1 flex-col items-center justify-center p-6 min-w-0 w-full sm:flex">
      <p className="text-xs text-zinc-400 text-center max-w-[260px] leading-relaxed">
        {!card
          ? 'Seleziona un prodotto dal catalogo per creare un’asta.'
          : 'Identificativo prodotto non disponibile per questo articolo: usa la pagina Nuova asta dal menu Aste.'}
      </p>
    </div>
  );
}
