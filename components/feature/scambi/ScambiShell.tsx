'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCardImageUrl } from '@/lib/assets';

export const scambiGlass =
  'border border-white/12 bg-[#0B1935]/72 shadow-[0_24px_70px_rgba(3,9,24,0.28)] backdrop-blur-2xl backdrop-saturate-150';

export const scambiGlassLight =
  'border border-white/70 bg-white/[0.94] text-slate-900 shadow-[0_18px_48px_rgba(3,9,24,0.14)] backdrop-blur-xl backdrop-saturate-150';

export function ScambiShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative min-h-screen overflow-x-clip bg-[#071226] text-white', className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(255,115,0,0.18),transparent_28rem),radial-gradient(circle_at_92%_8%,rgba(74,111,219,0.22),transparent_32rem),linear-gradient(180deg,#0A1935_0%,#071226_45%,#050D1D_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:44px_44px]" />
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
