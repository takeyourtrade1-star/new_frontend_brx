'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const GLASS_PILL =
  'inline-block max-w-full rounded-md bg-black/25 px-1.5 py-0.5 backdrop-blur-sm text-white';

/**
 * Tile della vista griglia nella scelta carta del wizard asta: immagine nitida
 * a tutta area con i dati in overlay su pill glass (nome, set, meta).
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
  /** Badge extra in overlay (condizione, lingua, quantità…). */
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
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300">
          <Camera className="h-6 w-6" aria-hidden />
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-2">
        <span className={cn(GLASS_PILL, 'line-clamp-2 text-xs font-bold leading-snug')}>{name}</span>
        {setName ? (
          <span className={cn(GLASS_PILL, 'line-clamp-1 text-[10px] font-medium')}>{setName}</span>
        ) : null}
        {meta ? <span className="flex flex-wrap items-center gap-1">{meta}</span> : null}
      </span>

      {active && activeLabel ? (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-[#FF7300] px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow">
          {activeLabel}
        </span>
      ) : null}
    </button>
  );
}
