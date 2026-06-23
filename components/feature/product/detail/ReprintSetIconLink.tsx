'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { buildSetPageUrl, resolveSetPageGameSlug } from '@/lib/search/set-page-url';

export function ReprintSetIconLink({
  setName,
  setIconSrc,
  gameSlug,
  size = 'md',
}: {
  setName: string;
  setIconSrc: string | null;
  gameSlug?: string;
  size?: 'md' | 'sm';
}) {
  const safeIcon = setIconSrc?.startsWith('https://') ? setIconSrc : null;
  const setHref = setName.trim()
    ? buildSetPageUrl(resolveSetPageGameSlug(gameSlug), setName.trim())
    : null;
  if (!safeIcon || !setHref) return null;

  const circleClass = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div
      className="group/seticon relative z-20"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Link
        href={setHref}
        className={cn(
          'flex items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:ring-1 hover:ring-primary/25',
          circleClass
        )}
        aria-label={`Apri set: ${setName}`}
      >
        <Image
          src={safeIcon}
          alt=""
          width={size === 'sm' ? 14 : 16}
          height={size === 'sm' ? 14 : 16}
          className={cn(iconClass, 'object-contain')}
          unoptimized
        />
      </Link>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-30 mb-1 hidden max-w-[140px] truncate rounded-md bg-zinc-900/95 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover/seticon:block"
      >
        {setName}
      </span>
    </div>
  );
}
