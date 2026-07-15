'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCardImageUrl } from '@/lib/assets';

export const scambiGlass =
  'border border-white/15 bg-white/[0.075] shadow-[0_16px_48px_rgba(6,14,35,0.16)] backdrop-blur-xl backdrop-saturate-150';

export const scambiGlassLight =
  'border border-white/60 bg-white/[0.84] text-slate-900 shadow-[0_12px_36px_rgba(6,14,35,0.11)] backdrop-blur-xl backdrop-saturate-150';

export function ScambiShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative min-h-screen overflow-x-clip text-white', className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(255,115,0,0.10),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(90,137,255,0.15),transparent_34%),linear-gradient(180deg,rgba(9,20,48,0.10),rgba(9,20,48,0.48))]" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function TradeCardThumb({
  image,
  name,
  className,
  priority = false,
}: {
  image?: string | null;
  name: string;
  className?: string;
  priority?: boolean;
}) {
  const src = getCardImageUrl(image ?? null);

  return (
    <span
      className={cn(
        'relative block aspect-[63/88] overflow-hidden rounded-lg border border-white/55 bg-slate-200 shadow-[0_5px_14px_rgba(15,23,42,0.18)]',
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="72px"
          className="object-cover"
          unoptimized
          priority={priority}
        />
      ) : (
        <span className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300 text-slate-400">
          <ImageOff className="h-4 w-4" aria-hidden />
        </span>
      )}
    </span>
  );
}
