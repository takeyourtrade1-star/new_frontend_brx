'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { Highlight } from 'react-instantsearch';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { getCardImageUrl } from '@/lib/assets';
import { SetIconBadge } from '@/components/ui/SetIconBadge';
import { buildSetPageUrl, resolveSetPageGameSlug } from '@/lib/search/set-page-url';
import type { CardSearchHit } from '@/lib/search/global-search-types';
import { getTitleAndSubtitle } from '@/lib/search/global-search-highlight';
import { firstNonEmptyString } from '@/lib/search/global-search-url';
import { HighlightQueryInText, RenderHighlightedText } from '@/components/layout/search/SearchHighlightText';

export function CardHit({
  hit,
  index,
  gameSlug,
  onNavigate,
  onShowInlinePreview,
  onScheduleClose,
  searchQuery,
  isTyping = false,
  typingKey = 0,
  rowDelay = 80,
  energyLevel = 0,
  typingVelocity = 0,
  streak = 0,
}: {
  hit: CardSearchHit;
  index: number;
  gameSlug: GameSlug;
  onNavigate: () => void;
  onShowInlinePreview: (url: string, name: string, anchorRect: DOMRect) => void;
  onScheduleClose?: () => void;
  searchQuery: string;
  isTyping?: boolean;
  typingKey?: number;
  rowDelay?: number;
  energyLevel?: number;
  typingVelocity?: number;
  streak?: number;
}) {
  const cameraButtonRef = useRef<HTMLButtonElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { selectedLang } = useLanguage();
  const fullImage = useMemo(() => {
    const raw = firstNonEmptyString(
      hit.image,
      hit.image_path,
      hit.image_uri_normal,
      hit.image_uri_small
    );
    return getCardImageUrl(raw);
  }, [hit.image, hit.image_path, hit.image_uri_normal, hit.image_uri_small]);
  const setName = hit.set_name ?? '';
  const setPageGame = resolveSetPageGameSlug(hit.game_slug, gameSlug);
  const setPageHref = setName ? buildSetPageUrl(setPageGame, setName) : null;
  const { titleType, title, subtitle } = getTitleAndSubtitle(hit, selectedLang);

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fullImage && cameraButtonRef.current) {
      onShowInlinePreview(fullImage, hit.name, cameraButtonRef.current.getBoundingClientRect());
    }
  };

  const handleCameraMouseEnter = () => {
    if (fullImage && cameraButtonRef.current) {
      onShowInlinePreview(fullImage, hit.name, cameraButtonRef.current.getBoundingClientRect());
    }
  };

  const handleCameraMouseLeave = () => {
    onScheduleClose?.();
  };

  const plainTitle = title != null ? title.replace(/<[^>]+>/g, '').trim() : '';
  const hasBackendHighlight = title != null && /<em>/i.test(title);

  const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-[#F8F8F8]';
  const rainbowDelay = index * rowDelay;

  const cardIdForColor = hit.id ?? hit.objectID ?? hit.card_print_id ?? hit.name ?? String(index);
  const colorIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < cardIdForColor.length; i++) {
      hash = (hash << 5) - hash + cardIdForColor.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 6;
  }, [cardIdForColor]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate();
        }
      }}
      className={`group relative flex items-center gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 cursor-pointer transition-colors hover:bg-[#EEEEEE] ${rowBg}`}
    >
      {isTyping && (
        <div
          key={`glow-${typingKey}`}
          className={`row-glow-party-${colorIndex}`}
          style={{
            animationDelay: `${rainbowDelay}ms`,
            '--energy': energyLevel,
            '--velocity': typingVelocity,
          } as React.CSSProperties}
          aria-hidden
        />
      )}
      {isTyping && streak > 5 && index < 3 && (
        <div className="streak-sparkles" aria-hidden>
          {[...Array(Math.min(streak - 5, 4))].map((_, i) => (
            <span
              key={i}
              className="sparkle"
              style={{
                left: `${15 + ((index * 17 + i * 23) % 70)}%`,
                top: `${20 + ((index * 13 + i * 31) % 60)}%`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}
      <button
        ref={cameraButtonRef}
        type="button"
        onClick={handleCameraClick}
        onMouseEnter={handleCameraMouseEnter}
        onMouseLeave={handleCameraMouseLeave}
        className="flex-shrink-0 w-8 h-11 rounded-lg overflow-hidden relative group/camera hover:ring-2 hover:ring-orange-400 transition-all"
        aria-label="Anteprima immagine carta"
        title={fullImage ? `Anteprima: ${hit.name}` : 'Immagine non disponibile'}
      >
        {fullImage ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 shimmer-bg animate-pulse" />}
            <Image
              src={fullImage}
              alt=""
              fill
              sizes="44px"
              onLoad={() => setImageLoaded(true)}
              className={`object-cover blur-[2px] scale-110 group-hover/camera:blur-[1px] transition-all duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="absolute inset-0 bg-black/30 group-hover/camera:bg-black/20 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <Camera className="w-4 h-4" />
          </div>
        )}
      </button>

      {(setPageHref || hit.set_name || hit.set_code) &&
        (setPageHref ? (
          <Link
            href={setPageHref}
            title={setName || undefined}
            aria-label={setName ? `Set: ${setName}` : 'Set'}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity rounded focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <SetIconBadge
              setIconUri={hit.set_icon_uri}
              iconSvgUri={hit.icon_svg_uri}
              setCode={hit.set_code}
              setName={hit.set_name}
              gameSlug={hit.game_slug}
            />
          </Link>
        ) : (
          <div className="flex-shrink-0 flex items-center justify-center">
            <SetIconBadge
              setIconUri={hit.set_icon_uri}
              iconSvgUri={hit.icon_svg_uri}
              setCode={hit.set_code}
              setName={hit.set_name}
              gameSlug={hit.game_slug}
            />
          </div>
        ))}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="font-medium text-[#333333] group-hover:text-orange-600 truncate transition-colors"
            title={hit.name}
          >
            {titleType === 'english' && (
              <Highlight hit={hit as Parameters<typeof Highlight>[0]['hit']} attribute="name" />
            )}
            {titleType === 'localized' &&
              title != null &&
              (hasBackendHighlight ? (
                <RenderHighlightedText value={title} />
              ) : (
                <HighlightQueryInText text={plainTitle || title} query={searchQuery} />
              ))}
            {titleType === 'fallback' &&
              title != null &&
              (searchQuery.trim() ? (
                <HighlightQueryInText text={title} query={searchQuery} />
              ) : (
                <span>{title}</span>
              ))}
          </span>
          {hit.collector_number != null && hit.collector_number !== '' && (
            <span className="flex-shrink-0 text-[#333333] font-medium text-sm">{hit.collector_number}</span>
          )}
        </div>
        {subtitle && <div className="text-sm text-[#777777] truncate mt-0.5">{subtitle}</div>}
        {setName && (
          <div className="text-xs text-[#999999] truncate mt-0.5" title={setName}>
            {setName}
          </div>
        )}
      </div>

      <div
        className={`flex-shrink-0 text-xs md:text-sm text-[#777777] ${(hit.type ?? 'Singles') !== 'Singles' ? 'italic' : ''}`}
      >
        {hit.type ?? 'Singles'}
      </div>
    </div>
  );
}
