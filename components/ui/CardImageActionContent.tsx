'use client';

import Image from 'next/image';
import { Bookmark, ShoppingCart, Share2 } from 'lucide-react';
import { EBARTEX_LOGO_PLACEHOLDER } from '@/lib/product-detail/product-detail-view-types';

export interface CardImageActionContentProps {
  /** URL immagine carta; ignorato se showPlaceholder è true. */
  imageUrl?: string | null;
  /** Mostra il logo Ebartex al posto della carta (immagine mancante/errore). */
  showPlaceholder?: boolean;
  /** Nome carta per alt/aria. */
  name: string;
  /** Etichetta del bottone d'acquisto (es. t('productDetail.buyNow')). */
  buyLabel: string;
  /** Click sul bottone COMPRA. Riceve l'evento per ancorare animazioni (fly-to-cart). */
  onBuy: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Condividi; se assente il bottone resta visibile ma inerte. */
  onShare?: () => void;
}

/**
 * Grafica condivisa del lightbox carta (mobile): immagine ingrandita + barra a 3
 * bottoni (salva / compra / condividi). Non include overlay né bottone di chiusura:
 * ogni chiamante fornisce il proprio backdrop. Usato dal dettaglio prodotto e dai
 * lightbox immagine in Singles/Ricerca per garantire la stessa resa visiva.
 */
export function CardImageActionContent({
  imageUrl,
  showPlaceholder = false,
  name,
  buyLabel,
  onBuy,
  onShare,
}: CardImageActionContentProps) {
  return (
    <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
      {!showPlaceholder && imageUrl && (
        <div className="relative aspect-[63/88] w-[min(96vw,calc(82vh*63/88))] max-h-[82vh]">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain rounded-sm shadow-2xl"
            sizes="96vw"
            unoptimized
            draggable={false}
          />
        </div>
      )}
      {showPlaceholder && (
        <div className="flex flex-col items-center justify-center text-white/70">
          <Image
            src={EBARTEX_LOGO_PLACEHOLDER}
            alt="Ebartex"
            width={96}
            height={96}
            className="w-24 h-24 object-contain opacity-50"
            draggable={false}
            unoptimized={false}
          />
          <p className="mt-4 text-sm">Immagine non disponibile</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 ring-1 ring-white/10 backdrop-blur-xl text-white transition-all hover:bg-white/20 active:scale-95"
          aria-label="Salva"
        >
          <Bookmark className="h-5 w-5" />
        </button>
        <button
          onClick={onBuy}
          className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#FF7300]/40 bg-[#FF7300]/20 px-6 text-sm font-bold uppercase tracking-wide text-white ring-1 ring-[#FF7300]/20 backdrop-blur-xl transition-all hover:bg-[#FF7300]/30 active:scale-95"
          aria-label={buyLabel}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{buyLabel}</span>
        </button>
        <button
          onClick={onShare}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 ring-1 ring-white/10 backdrop-blur-xl text-white transition-all hover:bg-white/20 active:scale-95"
          aria-label="Condividi"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
