'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tile della vista griglia nella scelta carta del wizard asta: immagine della
 * carta a tutta area, sfocata, con i dati in overlay su gradiente scuro; al
 * passaggio del mouse l'immagine va a fuoco e l'overlay scompare. Su touch
 * (niente hover) resta lo stato di default e il tap seleziona la carta.
 */
export function AuctionCardGridTile({
  imageUrl,
  name,
  setName,
  meta,
  active,
  activeLabel,
  onSelect,
  ariaLabel,
  sizes = '(max-width: 768px) 50vw, 180px',
}: {
  imageUrl: string | null;
  name: string;
  setName?: string | null;
  /** Badge extra in overlay (icona set, condizione, quantità…). */
  meta?: ReactNode;
  active: boolean;
  activeLabel?: string;
  onSelect: () => void;
  ariaLabel?: string;
  sizes?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel ?? name}
      aria-pressed={active}
      className={cn(
        'group relative aspect-[63/88] w-full overflow-hidden rounded-xl border bg-white text-left transition-all',
        active
          ? 'border-[#FF7300] ring-2 ring-[#FF7300] ring-offset-2'
          : 'border-gray-200 hover:border-[#FF7300]/40 hover:shadow-md'
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={sizes}
          className="scale-[1.06] object-cover blur-[3px] transition-all duration-300 ease-out group-hover:scale-100 group-hover:blur-0"
          unoptimized
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300">
          <Camera className="h-6 w-6" aria-hidden />
        </span>
      )}

      {/* Overlay dati: sparisce in hover per mostrare la carta a fuoco. */}
      <span
        className={cn(
          'absolute inset-0 flex flex-col justify-end gap-0.5 bg-gradient-to-t from-[#0b1220]/85 via-[#0b1220]/35 to-transparent p-2.5 transition-opacity duration-200',
          imageUrl && 'group-hover:opacity-0'
        )}
      >
        <span className="line-clamp-2 text-xs font-bold leading-snug text-white drop-shadow-sm">{name}</span>
        {setName ? <span className="line-clamp-1 text-[10px] text-white/80">{setName}</span> : null}
        {meta ? <span className="mt-1 flex flex-wrap items-center gap-1">{meta}</span> : null}
      </span>

      {/* Badge selezione: sempre visibile, anche in hover. */}
      {active && activeLabel ? (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-[#FF7300] px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow">
          {activeLabel}
        </span>
      ) : null}
    </button>
  );
}
