'use client';

import type {
  Dispatch,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  RefObject,
  SetStateAction,
  TouchEvent,
} from 'react';
import { CheckCircle2, Shirt } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { FACE_SVG_BY_EXPRESSION, type MascotteExpressionId } from '@/components/dev/card-mascotte/face-svgs';
import {
  getItemOverlayStyle,
  getItemRenderClassName,
  getItemRenderEnhancementStyle,
  type EquippedItems,
  type FaceColorOption,
  type WardrobeItem,
} from '../mascotte-wardrobe';
import { Z_INDEX, type BackVariant, type DressingSparkle } from './constants';

export interface CardMascotteWidgetProps {
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  cardRef: RefObject<HTMLDivElement>;
  faceContainerRef: RefObject<HTMLDivElement>;
  backFaceRef: RefObject<HTMLDivElement>;
  dressingSparklesTimeoutRef: MutableRefObject<number | null>;
  isAssoMini: boolean;
  setIsAssoMini: Dispatch<SetStateAction<boolean>>;
  handleClick: (e: MouseEvent) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchEnd: (e: TouchEvent) => void;
  handleCardMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
  handleCardMouseLeave: () => void;
  setIsCardHovered: Dispatch<SetStateAction<boolean>>;
  justReappeared: boolean;
  easterEggActive: boolean;
  isShiny: boolean;
  isOverlayVisible: boolean;
  isStickyBarVisible: boolean;
  isExternalModalOpen: boolean;
  isFlipping: boolean;
  isFlipped: boolean;
  tilt: { x: number; y: number };
  isMobileView: boolean;
  isModalOpen: boolean;
  mascotteExpression: MascotteExpressionId;
  selectedFaceColor: FaceColorOption;
  equippedWardrobeItems: WardrobeItem[];
  equippedItems: EquippedItems;
  isCardHovered: boolean;
  handleFlipButtonClick: (e: MouseEvent) => void;
  toggleAssoMini: (e: MouseEvent) => void;
  backVariants: BackVariant[];
  backVariant: number;
  holoPos: { x: number; y: number };
  flipCount: number;
  handleAlbumToggle: (e: MouseEvent) => void;
  showAlbum: boolean;
  setIsWardrobeOpen: Dispatch<SetStateAction<boolean>>;
  setIsFlipping: Dispatch<SetStateAction<boolean>>;
  setIsFlipped: Dispatch<SetStateAction<boolean>>;
  setDressingSparkles: Dispatch<SetStateAction<DressingSparkle[]>>;
  showCodingCompanion: boolean;
  codingStatus: 'compiling' | 'received';
}

export function CardMascotteWidget({
  t,
  cardRef,
  faceContainerRef,
  backFaceRef,
  dressingSparklesTimeoutRef,
  isAssoMini,
  setIsAssoMini,
  handleClick,
  handleKeyDown,
  handleTouchStart,
  handleTouchEnd,
  handleCardMouseMove,
  handleCardMouseLeave,
  setIsCardHovered,
  justReappeared,
  easterEggActive,
  isShiny,
  isOverlayVisible,
  isStickyBarVisible,
  isExternalModalOpen,
  isFlipping,
  isFlipped,
  tilt,
  isMobileView,
  isModalOpen,
  mascotteExpression,
  selectedFaceColor,
  equippedWardrobeItems,
  equippedItems,
  isCardHovered,
  handleFlipButtonClick,
  toggleAssoMini,
  backVariants,
  backVariant,
  holoPos,
  flipCount,
  handleAlbumToggle,
  showAlbum,
  setIsWardrobeOpen,
  setIsFlipping,
  setIsFlipped,
  setDressingSparkles,
  showCodingCompanion,
  codingStatus,
}: CardMascotteWidgetProps) {
  return (
    <div
      ref={cardRef}
      onClick={(e) => {
        if (isAssoMini) {
          e.stopPropagation();
          setIsAssoMini(false);
          return;
        }
        handleClick(e);
      }}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      className={`fixed cursor-pointer select-none transition-all duration-300 ${justReappeared ? 'mascotte-reappear' : ''} ${easterEggActive ? 'mascotte-backflip' : ''} ${isShiny ? 'mascotte-shiny' : ''}`}
      style={{
        zIndex: isOverlayVisible ? Z_INDEX.mascotteOverlay : Z_INDEX.mascotteBase,
        bottom: isStickyBarVisible ? '80px' : '20px',
        right: '48px',
        width: '96px',
        height: '128px',
        perspective: '600px',
        filter: isAssoMini
          ? 'drop-shadow(0 2px 6px rgba(255, 115, 0, 0.15))'
          : 'drop-shadow(0 12px 32px rgba(255, 115, 0, 0.35)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))',
        animation: isAssoMini
          ? 'none'
          : justReappeared
            ? 'mascotteReappear 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, mascotteFloat 3s ease-in-out infinite 500ms'
            : 'mascotteFloat 3s ease-in-out infinite',
        transition: 'bottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-in-out, transform 300ms ease-in-out, filter 300ms ease-in-out',
        opacity: isExternalModalOpen ? 0 : 1,
        pointerEvents: isExternalModalOpen ? 'none' : 'auto',
        transform: isAssoMini ? 'scale(0.3)' : 'translateX(0)',
        transformOrigin: 'bottom right',
      }}
      data-asso-mascot="true"
      role="button"
      tabIndex={0}
      aria-label={t('asso.reportBugAria')}
      title={t('asso.reportBugAria')}
    >
      {/* 3D flip inner */}
      <div
        className="mascotte-flip-inner relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: isFlipping || easterEggActive
            ? 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 150ms ease-out',
          transform: `rotateX(${tilt.x}deg) rotateY(${isFlipped ? 180 + tilt.y : tilt.y}deg)`,
        }}
      >

        {/* ── FRONT FACE ── */}
        <div
          className="mascotte-flip-face absolute inset-0"
          style={{
            backfaceVisibility: isMobileView && isFlipped ? 'visible' : 'hidden',
            pointerEvents: isFlipped ? 'none' : 'auto',
            opacity: isMobileView && isFlipped ? 0.3 : 1,
            transform: isMobileView && isFlipped ? 'rotateY(-30deg)' : 'rotateY(0deg)',
            transition: isMobileView ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease' : 'none',
          }}
        >
          {/* Card container — soft charm style */}
          <div
            className="relative h-full w-full overflow-visible rounded-2xl"
            style={{ background: 'transparent' }}
          >
            {/* Soft warm glow */}
            <div
              className="pointer-events-none absolute rounded-2xl"
              style={{
                inset: '-3px',
                zIndex: 0,
                boxShadow: isShiny
                  ? '0 0 28px rgba(168,85,247,0.5), 0 0 56px rgba(59,130,246,0.3), 0 0 84px rgba(236,72,153,0.2)'
                  : `0 6px 24px ${selectedFaceColor.glowSoft}, 0 2px 8px rgba(0,0,0,0.15)`,
                transition: 'box-shadow 300ms ease',
              }}
            />

            {/* Shiny rainbow border overlay */}
            {isShiny && (
              <div
                className="pointer-events-none absolute shiny-border-anim"
                style={{
                  inset: '-3px',
                  zIndex: 12,
                  borderRadius: '18px',
                  padding: '2.5px',
                  background: 'conic-gradient(from var(--shiny-angle, 0deg), #f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7, #ec4899, #f43f5e)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
            )}

            {/* Thin soft border */}
            <div
              className="pointer-events-none absolute rounded-2xl"
              style={{
                inset: '0px',
                zIndex: 2,
                padding: '1.5px',
                background: `linear-gradient(160deg, ${selectedFaceColor.glowMid} 0%, ${selectedFaceColor.glowStrong} 50%, ${selectedFaceColor.glowMid} 100%)`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />

            {/* Bottom pill badge — ASSO */}
            <div
              className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${isCardHovered ? 'asso-pill-hovered' : ''}`}
              style={{ bottom: '5px', zIndex: 8 }}
            >
              <div
                className={`relative flex items-center justify-center overflow-full asso-pill-${mascotteExpression}`}
                style={{
                  height: '14px',
                  paddingInline: '8px',
                  background: mascotteExpression === 'bugReport' || mascotteExpression === 'bugFocus'
                    ? 'linear-gradient(180deg, #DC2626 0%, #EF4444 100%)'
                    : mascotteExpression === 'coding'
                      ? 'linear-gradient(180deg, #7C3AED 0%, #A78BFA 100%)'
                      : mascotteExpression === 'sleeping'
                        ? 'linear-gradient(180deg, #4B5563 0%, #9CA3AF 100%)'
                        : mascotteExpression === 'wink'
                          ? 'linear-gradient(180deg, #EC4899 0%, #F472B6 100%)'
                          : 'linear-gradient(180deg, #FF7300 0%, #FF9A40 100%)',
                  boxShadow: mascotteExpression === 'bugReport' || mascotteExpression === 'bugFocus'
                    ? '0 -1px 4px rgba(220,38,38,0.3), inset 0 -1px 0 rgba(255,255,255,0.25)'
                    : mascotteExpression === 'coding'
                      ? '0 -1px 4px rgba(124,58,237,0.3), inset 0 -1px 0 rgba(255,255,255,0.25)'
                      : mascotteExpression === 'sleeping'
                        ? '0 -1px 4px rgba(75,85,99,0.2), inset 0 -1px 0 rgba(255,255,255,0.2)'
                        : mascotteExpression === 'wink'
                          ? '0 -1px 4px rgba(236,72,153,0.3), inset 0 -1px 0 rgba(255,255,255,0.25)'
                          : '0 -1px 4px rgba(255,100,0,0.2), inset 0 -1px 0 rgba(255,255,255,0.25)',
                  animation: 'asso-pulse 3s ease-in-out infinite',
                  borderRadius: '9999px',
                }}
              >
                <span
                  className="font-comodo text-[7.5px] font-bold leading-none"
                  style={{
                    color: '#fff',
                    textShadow: mascotteExpression === 'sleeping'
                      ? '0 1px 1px rgba(30,30,30,0.35)'
                      : '0 1px 1px rgba(100,30,0,0.45)',
                    letterSpacing: '0.2em',
                    marginLeft: '0.1em',
                  }}
                >
                  {mascotteExpression === 'sleeping' ? 'Zzz' : 'ASSO'}
                </span>
              </div>
            </div>

            {/* Face SVG — parallax offset on hover */}
            <div
              ref={faceContainerRef}
              className={`absolute flex items-center justify-center ${isModalOpen ? 'face-glint-active' : ''} face-fixed-neon`}
              style={{
                top: '4px',
                bottom: '4px',
                left: '3px',
                right: '3px',
                zIndex: 5,
                transition: 'transform 120ms ease-out, opacity 500ms ease-in-out',
                transform: mascotteExpression === 'wink'
                  ? `translate(${tilt.y * 0.25}px, ${tilt.x * -0.2 - 2}px) rotate(-2deg)`
                  : `translate(${tilt.y * 0.25}px, ${tilt.x * -0.2}px)`,
                opacity: mascotteExpression === 'sleeping' ? 0.85 : 1,
                filter: 'none',
              }}
              dangerouslySetInnerHTML={{
                __html: FACE_SVG_BY_EXPRESSION[mascotteExpression],
              }}
            />

            {/* Wardrobe overlays aligned to 96x128 mascot base */}
            {equippedWardrobeItems.map((item) => (
              <div
                key={item.id}
                aria-hidden="true"
                style={getItemOverlayStyle(item, equippedItems.objects)}
              >
                <div
                  className={`equipped-item-layer ${item.category === 'objects'
                      ? 'equipped-item-float'
                      : item.category === 'accessories'
                        ? 'equipped-item-breathe'
                        : ''
                    } ${getItemRenderClassName(item)}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    ...getItemRenderEnhancementStyle(item),
                  }}
                  dangerouslySetInnerHTML={{ __html: item.svg }}
                />
              </div>
            ))}

            {/* Flip button: desktop on hover, mobile always visible when not flipped */}
            {(isMobileView ? !isFlipped : isCardHovered && !isFlipped) && (
              <button
                onClick={handleFlipButtonClick}
                className={`mascotte-flip-btn absolute z-[11] flex items-center justify-center rounded-full border text-white shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:text-white ${isMobileView
                    ? 'h-8 w-8 border-white/45 bg-black/55 text-white'
                    : 'h-5 w-5 border-white/20 bg-zinc-900/60 text-white/70 hover:bg-zinc-800/80'
                  }`}
                style={isMobileView ? { bottom: '6px', left: '6px' } : { bottom: '3px', left: '3px' }}
                title={t('asso.flipCard')}
                aria-label={t('asso.flipCard')}
              >
                <svg
                  width={isMobileView ? '14' : '10'}
                  height={isMobileView ? '14' : '10'}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isMobileView ? '2.2' : '2.5'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
              </button>
            )}

            {/* Shrink / Expand button: bottom-right of the card */}
            {(isMobileView || isCardHovered || isAssoMini) && (
              <button
                onClick={toggleAssoMini}
                className={`mascotte-shrink-btn absolute z-[11] flex items-center justify-center rounded-full border text-white shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:text-white ${isMobileView
                    ? 'h-7 w-7 border-white/45 bg-black/55 text-white'
                    : 'h-6 w-6 border-white/20 bg-zinc-900/60 text-white/70 hover:bg-zinc-800/80'
                  }`}
                style={isMobileView ? { bottom: '6px', right: '6px' } : { bottom: '2px', right: '2px' }}
                title={isAssoMini ? t('asso.expandAsso') : t('asso.shrinkAsso')}
                aria-label={isAssoMini ? t('asso.expandAsso') : t('asso.shrinkAsso')}
              >
                <svg
                  width={isMobileView ? '16' : '14'}
                  height={isMobileView ? '16' : '14'}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  shapeRendering="geometricPrecision"
                >
                  {isAssoMini ? (
                    <>
                      <path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                    </>
                  ) : (
                    <>
                      <path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" />
                    </>
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>{/* end front face */}

        {/* ── BACK FACE ── */}
        <div
          ref={backFaceRef}
          className="mascotte-flip-face absolute inset-0"
          style={{
            backfaceVisibility: isMobileView ? 'visible' : 'hidden',
            transform: isMobileView
              ? (isFlipped ? 'translateX(0)' : 'translateX(120%)')
              : 'rotateY(180deg)',
            opacity: isMobileView ? (isFlipped ? 1 : 0) : 1,
            pointerEvents: isFlipped ? 'auto' : 'none',
            transition: isMobileView
              ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease'
              : 'none',
          }}
        >
          <div
            className="relative h-full w-full overflow-hidden rounded-2xl"
            style={{ background: backVariants[backVariant].gradient }}
          >
            {/* Holographic overlay — GOLD only */}
            {backVariants[backVariant].label === 'GOLD' && (
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl holo-overlay"
                style={{
                  background: `radial-gradient(circle at ${holoPos.x}% ${holoPos.y}%, rgba(255,255,255,0.35) 0%, rgba(168,85,247,0.2) 20%, rgba(59,130,246,0.2) 40%, rgba(16,185,129,0.15) 60%, rgba(245,158,11,0.1) 80%, transparent 100%)`,
                  mixBlendMode: 'overlay',
                  transition: 'background 150ms ease-out',
                }}
              />
            )}

            {/* Flip counter badge (top-right) */}
            <div className="absolute right-2 top-2 inline-flex h-6 min-w-[28px] items-center justify-center rounded-full bg-white/25 px-2 backdrop-blur-sm">
              <span className="text-[9px] font-bold text-white">{flipCount}</span>
            </div>

            {/* Album button (top-left) */}
            <button
              onClick={handleAlbumToggle}
              className={`absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-sm transition-all hover:scale-110 ${showAlbum ? 'bg-white/40' : 'bg-white/25'}`}
              title={t('asso.album.title')}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </button>

            {/* Title block */}
            <div className="pointer-events-none absolute inset-x-2 top-8 flex flex-col items-center text-center">
              <svg className="mascotte-back-sparkle mb-1" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="white" fillOpacity="0.95" />
              </svg>
              <span className="font-comodo text-[12px] font-bold tracking-wide text-white/95">
                {backVariants[backVariant].label}
              </span>
              <span className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.2em] text-white/70">
                {backVariants[backVariant].sub}
              </span>
            </div>

            {/* Action buttons */}
            <div className="absolute inset-x-2 bottom-2.5 flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWardrobeOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setIsFlipping(true);
                      setIsFlipped(false);
                      window.setTimeout(() => setIsFlipping(false), 650);
                      const palette = ['#FF7300', '#FFA246', '#FFB26B', '#fcd34d', '#ffffff'];
                      const sparkles = Array.from({ length: 6 }, (_, i) => ({
                        id: Date.now() + i,
                        left: 18 + Math.random() * 60,
                        top: 12 + Math.random() * 74,
                        delay: i * 55 + Math.floor(Math.random() * 60),
                        size: 9 + Math.random() * 7,
                        color: palette[Math.floor(Math.random() * palette.length)],
                      }));
                      setDressingSparkles(sparkles);
                      if (dressingSparklesTimeoutRef.current !== null) {
                        window.clearTimeout(dressingSparklesTimeoutRef.current);
                      }
                      dressingSparklesTimeoutRef.current = window.setTimeout(() => {
                        setDressingSparkles([]);
                        dressingSparklesTimeoutRef.current = null;
                      }, 1300);
                    }
                    return next;
                  });
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-black/35 text-white transition hover:scale-105 hover:bg-black/50"
                title={t('asso.openWardrobe')}
                aria-label={t('asso.openWardrobe')}
              >
                <Shirt className="h-4 w-4" />
                <span className="sr-only">{t('asso.openWardrobe')}</span>
              </button>

            </div>
          </div>
        </div>{/* end back face */}

      </div>{/* end flip inner */}

      {/* PC Icon - appears when coding mode */}
      {showCodingCompanion && (
        <div
          className="coding-companion absolute -left-[154px] top-1/2 z-[8] -translate-y-1/2"
        >
          <div className="w-36 rounded-xl border border-primary/45 bg-zinc-900/85 p-2 shadow-xl shadow-primary/20 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="h-1.5 w-1.5 rounded-full bg-marquee" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              </div>
              <span className={`text-[10px] font-medium ${codingStatus === 'received' ? 'text-emerald-300' : 'text-zinc-300'}`}>
                {codingStatus === 'received' ? t('asso.coding.received') : t('asso.coding.compiling')}
              </span>
            </div>

            <div className="rounded-md border border-white/10 bg-zinc-950/80 p-2">
              {codingStatus === 'received' ? (
                <div className="coding-received rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold">{t('asso.coding.reportReceived')}</span>
                  </div>
                  <p className="mt-1 text-[9px] leading-relaxed text-zinc-200">
                    push bugfix/report done • ticket creato
                  </p>
                </div>
              ) : (
                <>
                  <div className="coding-line coding-line-1" />
                  <div className="coding-line coding-line-2" />
                  <div className="coding-line coding-line-3" />
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="text-[9px] text-zinc-500">$</span>
                    <span className="coding-cursor h-2.5 w-1 rounded-[2px] bg-primary" />
                  </div>
                </>
              )}
            </div>

            <div className="mx-auto mt-1.5 h-1.5 w-14 rounded-full bg-zinc-500/35" />
          </div>
        </div>
      )}
    </div>
  );
}
