'use client';

// Card della mascotte (desktop): fronte con faccia + item, retro con varianti
// sbloccabili. Design "charm" trasparente confermato (PLAN/13).

import type { Dispatch, KeyboardEvent, MouseEvent, RefObject, SetStateAction } from 'react';
import { CheckCircle2, Shirt, Volume2, VolumeX } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { AssoFace } from './AssoFace';
import type { AssoExpression } from './machine';
import type { FaceColorOption } from './faceColors';
import { EquippedItemsLayer } from './wardrobe/EquippedItemsLayer';
import type { EquippedItems } from './wardrobe/manifest';
import { BACK_VARIANTS, Z_INDEX } from './constants';

export interface AssoCardProps {
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  cardRef: RefObject<HTMLDivElement>;
  backFaceRef: RefObject<HTMLDivElement>;
  expression: AssoExpression;
  faceColor: FaceColorOption;
  equipped: EquippedItems;
  isMini: boolean;
  setIsMini: Dispatch<SetStateAction<boolean>>;
  isHovered: boolean;
  setIsHovered: Dispatch<SetStateAction<boolean>>;
  isFlipped: boolean;
  isFlipping: boolean;
  isSleeping: boolean;
  isShiny: boolean;
  isOverlayVisible: boolean;
  isStickyBarVisible: boolean;
  isExternalModalOpen: boolean;
  isBugModalOpen: boolean;
  justReappeared: boolean;
  /** Auto-scontro in corso: la card svanisce e lascia spazio ai due lottatori. */
  isFighting: boolean;
  /** Se valorizzato, sostituisce il bottom standard (es. sopra il popup promo). */
  bottomOverridePx?: number | null;
  tilt: { x: number; y: number };
  holoPos: { x: number; y: number };
  backVariant: number;
  flipCount: number;
  muted: boolean;
  showCodingCompanion: boolean;
  codingStatus: 'compiling' | 'received';
  onActivate: (e: MouseEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onFlip: (e: MouseEvent) => void;
  onToggleMini: (e: MouseEvent) => void;
  onOpenWardrobe: (e: MouseEvent) => void;
  onToggleMute: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
}

export function AssoCard({
  t,
  cardRef,
  backFaceRef,
  expression,
  faceColor,
  equipped,
  isMini,
  setIsMini,
  isHovered,
  setIsHovered,
  isFlipped,
  isFlipping,
  isSleeping,
  isShiny,
  isOverlayVisible,
  isStickyBarVisible,
  isExternalModalOpen,
  isBugModalOpen,
  justReappeared,
  isFighting,
  bottomOverridePx,
  tilt,
  holoPos,
  backVariant,
  flipCount,
  muted,
  showCodingCompanion,
  codingStatus,
  onActivate,
  onKeyDown,
  onFlip,
  onToggleMini,
  onOpenWardrobe,
  onToggleMute,
  onMouseMove,
  onMouseLeave,
}: AssoCardProps) {
  const variant = BACK_VARIANTS[backVariant] ?? BACK_VARIANTS[0];

  return (
    <div
      ref={cardRef}
      onClick={(e) => {
        if (isMini) {
          e.stopPropagation();
          setIsMini(false);
          return;
        }
        onActivate(e);
      }}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`fixed cursor-pointer select-none ${justReappeared ? 'mascotte-reappear' : ''}`}
      style={{
        zIndex: isOverlayVisible ? Z_INDEX.mascotteOverlay : Z_INDEX.mascotteBase,
        bottom: bottomOverridePx != null ? `${bottomOverridePx}px` : isStickyBarVisible ? '80px' : '20px',
        right: '48px',
        width: '96px',
        height: '128px',
        perspective: '600px',
        filter: isMini
          ? 'drop-shadow(0 2px 6px rgba(255, 115, 0, 0.15))'
          : 'drop-shadow(0 8px 20px rgba(255, 115, 0, 0.3))',
        animation: isMini
          ? 'none'
          : justReappeared
            ? 'assoReappear 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, assoFloat 4s ease-in-out infinite 500ms'
            : 'assoFloat 4s ease-in-out infinite',
        transition: 'bottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-in-out, transform 300ms ease-in-out, filter 300ms ease-in-out',
        opacity: isExternalModalOpen || isFighting ? 0 : 1,
        pointerEvents: isExternalModalOpen || isFighting ? 'none' : 'auto',
        transform: isMini ? 'scale(0.3)' : 'translateX(0)',
        transformOrigin: 'bottom right',
      }}
      data-asso-mascot="true"
      data-asso-sleeping={isSleeping ? 'true' : 'false'}
      role="button"
      tabIndex={0}
      aria-label={t('asso.reportBugAria')}
      title={t('asso.reportBugAria')}
    >
      {/* 3D flip inner */}
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: isFlipping
            ? 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 150ms ease-out',
          transform: `rotateX(${tilt.x}deg) rotateY(${isFlipped ? 180 + tilt.y : tilt.y}deg) scale(${isHovered && !isMini ? 1.05 : 1})`,
        }}
      >
        {/* ── Fronte ── */}
        <div
          className="mascotte-flip-face absolute inset-0"
          style={{ pointerEvents: isFlipped ? 'none' : 'auto' }}
        >
          <div className="relative h-full w-full overflow-visible rounded-2xl" style={{ background: 'transparent' }}>
            {/* Glow morbido con respiro */}
            <div
              className="asso-glow-breathe pointer-events-none absolute rounded-2xl"
              style={{
                inset: '-3px',
                zIndex: 0,
                boxShadow: isShiny
                  ? '0 0 28px rgba(168,85,247,0.5), 0 0 56px rgba(59,130,246,0.3)'
                  : `0 6px 24px ${faceColor.glowSoft}, 0 0 10px ${faceColor.glowMid}, 0 2px 8px rgba(0,0,0,0.15)`,
                transition: 'box-shadow 300ms ease',
              }}
            />

            {/* Texture carta collezionabile: trama a rombi appena percettibile */}
            <div
              className="pointer-events-none absolute rounded-2xl"
              style={{
                inset: '1.5px',
                zIndex: 1,
                background: `
                  radial-gradient(ellipse at 28% 14%, rgba(250,249,246,0.09) 0%, rgba(250,249,246,0) 55%),
                  repeating-linear-gradient(45deg, rgba(250,249,246,0.028) 0 2px, transparent 2px 9px),
                  repeating-linear-gradient(-45deg, rgba(250,249,246,0.028) 0 2px, transparent 2px 9px)
                `,
              }}
            />

            {/* Bordo arcobaleno shiny */}
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

            {/* Bordo shimmer: gradiente conico che ruota lento (glow-up 13.6) */}
            <div
              className="asso-border-shimmer pointer-events-none absolute rounded-2xl"
              style={{
                inset: '0px',
                zIndex: 2,
                padding: '1.5px',
                background: `conic-gradient(from var(--asso-border-angle, 0deg), ${faceColor.glowMid} 0%, ${faceColor.glowStrong} 18%, rgba(255,232,200,0.95) 26%, ${faceColor.glowStrong} 34%, ${faceColor.glowMid} 55%, ${faceColor.glowStrong} 78%, ${faceColor.glowMid} 100%)`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />

            {/* Stellina glint periodica (angolo alto-destra) */}
            <svg
              className="asso-glint-star pointer-events-none absolute"
              style={{ top: '-7px', right: '-6px', zIndex: 12 }}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#fff6e8" />
              <path d="M12 6 L13.2 10.8 L18 12 L13.2 13.2 L12 18 L10.8 13.2 L6 12 L10.8 10.8 Z" fill={faceColor.line} opacity="0.85" />
            </svg>

            {/* Pill badge ASSO */}
            <div
              className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${isHovered ? 'asso-pill-hovered' : ''}`}
              style={{ bottom: '5px', zIndex: 8 }}
            >
              <div
                className="asso-pill-anim relative flex items-center justify-center overflow-hidden"
                style={{
                  height: '14px',
                  paddingInline: '8px',
                  background: expression === 'bugReport' || expression === 'bugFocus'
                    ? 'linear-gradient(180deg, #DC2626 0%, #EF4444 100%)'
                    : expression === 'sleeping'
                      ? 'linear-gradient(180deg, #4B5563 0%, #9CA3AF 100%)'
                      : expression === 'wink'
                        ? 'linear-gradient(180deg, #EC4899 0%, #F472B6 100%)'
                        : 'linear-gradient(180deg, #FF7300 0%, #FF9A40 100%)',
                  animation: 'asso-pulse 3s ease-in-out infinite',
                  borderRadius: '9999px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.15)',
                }}
              >
                {/* Sheen periodica sul badge */}
                <span
                  className="asso-pill-sheen pointer-events-none absolute inset-y-0 w-4"
                  style={{
                    background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)',
                  }}
                  aria-hidden="true"
                />
                <span
                  className="font-comodo text-[7.5px] font-bold leading-none"
                  style={{
                    color: '#fff',
                    textShadow: '0 1px 1px rgba(100,30,0,0.45)',
                    letterSpacing: '0.2em',
                    marginLeft: '0.1em',
                  }}
                >
                  {expression === 'sleeping' ? 'Zzz' : 'ASSO'}
                </span>
              </div>
            </div>

            {/* Faccia (parallax leggero su hover) */}
            <div
              className={`absolute flex items-center justify-center ${isBugModalOpen ? 'face-glint-active' : ''} face-fixed-neon`}
              style={{
                top: '4px',
                bottom: '4px',
                left: '3px',
                right: '3px',
                zIndex: 5,
                transition: 'transform 120ms ease-out, opacity 500ms ease-in-out',
                transform: expression === 'wink'
                  ? `translate(${tilt.y * 0.25}px, ${tilt.x * -0.2 - 2}px) rotate(-2deg)`
                  : `translate(${tilt.y * 0.25}px, ${tilt.x * -0.2}px)`,
                opacity: expression === 'sleeping' ? 0.85 : 1,
              }}
            >
              <AssoFace expression={expression} />
            </div>

            {/* Item equipaggiati (lazy, allineati alla griglia slot) */}
            <EquippedItemsLayer equipped={equipped} />

            {/* Bottone flip (hover) */}
            {isHovered && !isFlipped && (
              <button
                onClick={onFlip}
                className="mascotte-flip-btn absolute z-[11] flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-zinc-900/60 text-white/70 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-zinc-800/80 hover:text-white"
                style={{ bottom: '3px', left: '3px' }}
                title={t('asso.flipCard')}
                aria-label={t('asso.flipCard')}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
              </button>
            )}

            {/* Bottone riduci/espandi */}
            {(isHovered || isMini) && (
              <button
                onClick={onToggleMini}
                className="mascotte-flip-btn absolute z-[11] flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-zinc-900/60 text-white/70 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-zinc-800/80 hover:text-white"
                style={{ bottom: '2px', right: '2px' }}
                title={isMini ? t('asso.expandAsso') : t('asso.shrinkAsso')}
                aria-label={isMini ? t('asso.expandAsso') : t('asso.shrinkAsso')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision">
                  {isMini ? (
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
        </div>

        {/* ── Retro ── */}
        <div
          ref={backFaceRef}
          className="mascotte-flip-face absolute inset-0"
          style={{ transform: 'rotateY(180deg)', pointerEvents: isFlipped ? 'auto' : 'none' }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-2xl" style={{ background: variant.gradient }}>
            {/* Holo — solo GOLD */}
            {variant.label === 'GOLD' && (
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl holo-overlay"
                style={{
                  background: `radial-gradient(circle at ${holoPos.x}% ${holoPos.y}%, rgba(255,255,255,0.35) 0%, rgba(168,85,247,0.2) 20%, rgba(59,130,246,0.2) 40%, rgba(16,185,129,0.15) 60%, rgba(245,158,11,0.1) 80%, transparent 100%)`,
                  mixBlendMode: 'overlay',
                  transition: 'background 150ms ease-out',
                }}
              />
            )}

            {/* Contatore flip */}
            <div className="absolute right-2 top-2 inline-flex h-6 min-w-[28px] items-center justify-center rounded-full bg-white/25 px-2 backdrop-blur-sm">
              <span className="text-[9px] font-bold text-white">{flipCount}</span>
            </div>

            {/* Mute suoni */}
            <button
              onClick={onToggleMute}
              className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/40"
              title={muted ? t('asso.unmute') : t('asso.mute')}
              aria-label={muted ? t('asso.unmute') : t('asso.mute')}
            >
              {muted ? <VolumeX className="h-3 w-3 text-white" /> : <Volume2 className="h-3 w-3 text-white" />}
            </button>

            {/* Titolo variante */}
            <div className="pointer-events-none absolute inset-x-2 top-8 flex flex-col items-center text-center">
              <svg className="mascotte-back-sparkle mb-1" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="white" fillOpacity="0.95" />
              </svg>
              <span className="font-comodo text-[12px] font-bold tracking-wide text-white/95">{variant.label}</span>
              <span className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.2em] text-white/70">{t(variant.subKey)}</span>
            </div>

            {/* Apri guardaroba */}
            <div className="absolute inset-x-2 bottom-2.5 flex items-center justify-center">
              <button
                type="button"
                onClick={onOpenWardrobe}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-black/35 text-white transition hover:scale-105 hover:bg-black/50"
                title={t('asso.openWardrobe')}
                aria-label={t('asso.openWardrobe')}
              >
                <Shirt className="h-4 w-4" />
                <span className="sr-only">{t('asso.openWardrobe')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Companion PC durante il flusso bug */}
      {showCodingCompanion && (
        <div className="coding-companion absolute -left-[154px] top-1/2 z-[8] -translate-y-1/2">
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
