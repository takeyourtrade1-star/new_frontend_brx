'use client';

import { useState } from 'react';
import { getSetIconUrl, getSetCodeDisplay } from '@/lib/assets';

export type SetIconBadgeProps = {
  setIconUri?: string | null;
  iconSvgUri?: string | null;
  setCode?: string | null;
  setName?: string | null;
  gameSlug?: string | null;
  imageClassName?: string;
};

/**
 * Logo set (CDN / Scryfall) con fallback testuale sempre visibile se l'immagine manca o fallisce.
 */
export function SetIconBadge({
  setIconUri,
  iconSvgUri,
  setCode,
  setName,
  gameSlug,
  imageClassName = 'h-8 w-8 md:h-10 md:w-10 object-contain',
}: SetIconBadgeProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const setCodeDisplay = getSetCodeDisplay(setCode, setName);
  const iconUrl = iconFailed
    ? null
    : getSetIconUrl(setIconUri ?? iconSvgUri ?? undefined, {
        gameSlug: gameSlug ?? undefined,
        setCode: setCode ?? undefined,
      });

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className={imageClassName}
        loading="lazy"
        onError={() => setIconFailed(true)}
      />
    );
  }

  return (
    <span
      className="inline-flex min-w-[2rem] items-center justify-center text-[10px] font-bold uppercase tracking-wide text-zinc-600"
      title={setName ?? setCodeDisplay}
      aria-hidden
    >
      {setCodeDisplay.slice(0, 3)}
    </span>
  );
}
