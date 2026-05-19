'use client';

import { ArrowRight, X } from 'lucide-react';
import { ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX } from '@/lib/asso-messages';
import type { AssoBubblePayload } from '@/hooks/useAssoBubbleQueue';

type AssoHintBubbleProps = {
  visible: boolean;
  message: AssoBubblePayload | null;
  displayedText: string;
  isTyping: boolean;
  isSleeping: boolean;
  isStyleReaction: boolean;
  isStickyBarVisible: boolean;
  onDismiss: () => void;
  onSkipTyping: () => void;
  onPromoClick?: () => void;
};

export function AssoHintBubble({
  visible,
  message,
  displayedText,
  isTyping,
  isSleeping,
  isStyleReaction,
  isStickyBarVisible,
  onDismiss,
  onSkipTyping,
  onPromoClick,
}: AssoHintBubbleProps) {
  if (!message) return null;

  const accent = isStyleReaction ? '#FF7300' : message.accent ?? null;
  const showCta = !isStyleReaction && message.kind !== 'styleReaction';
  const text = displayedText || (visible && !isTyping ? message.text : '');
  const bottom = isStickyBarVisible ? '210px' : '154px';

  return (
    <div
      className={`group fixed hidden sm:flex flex-col items-stretch ${isStyleReaction ? 'cursor-default' : showCta ? 'cursor-pointer' : ''}`}
      style={{
        zIndex: isStyleReaction ? 10009 : 10003,
        bottom,
        right: '20px',
        width: `min(92vw, ${ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX}px)`,
        maxWidth: ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.94)',
        transition:
          'bottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 420ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-asso-dismiss]')) return;
        if (isTyping) {
          e.stopPropagation();
          onSkipTyping();
          return;
        }
        if (!isStyleReaction && showCta) onPromoClick?.();
      }}
    >
      {isSleeping ? (
        <div className="relative asso-hint-bubble-enter">
          <div
            className="relative rounded-2xl px-4 py-3 text-left shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #f5f3ff 0%, #ddd6fe 55%, #c4b5fd 100%)',
              border: '1.5px solid rgba(124,58,237,0.35)',
              boxShadow: '0 8px 28px rgba(91,33,182,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <DismissButton onDismiss={onDismiss} variant="violet" />
            <p className="pr-7 text-[13px] font-semibold leading-relaxed text-violet-950">
              {text}
              {isTyping && <TypewriterCursor variant="violet" />}
            </p>
            {showCta && !isTyping && (
              <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-violet-600">
                Scopri nel sogno
                <ArrowRight className="h-3 w-3" aria-hidden />
              </div>
            )}
          </div>
          <CloudTail />
        </div>
      ) : (
        <div className="relative asso-hint-bubble-enter">
          <div
            className="relative overflow-hidden rounded-2xl px-4 py-3.5 text-left shadow-xl backdrop-blur-md"
            style={{
              background: accent
                ? `linear-gradient(145deg, ${accent}22 0%, rgba(24,24,27,0.94) 48%)`
                : 'rgba(24,24,27,0.94)',
              border: accent ? `1px solid ${accent}55` : '1px solid rgba(255,255,255,0.18)',
              boxShadow: accent
                ? `0 10px 32px ${accent}30, 0 4px 12px rgba(0,0,0,0.35)`
                : '0 10px 28px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {accent && (
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.14] blur-xl"
                style={{ background: accent }}
                aria-hidden
              />
            )}
            <DismissButton onDismiss={onDismiss} variant="glass" />
            <p
              className="relative pr-7 text-[13px] font-medium leading-relaxed tracking-[0.01em] text-zinc-50"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
            >
              {text}
              {isTyping && <TypewriterCursor variant="glass" />}
            </p>
            {isTyping && (
              <p className="relative mt-1.5 text-[10px] text-zinc-400">Tocca per mostrare tutto</p>
            )}
            {showCta && !isTyping && (
              <div className="relative mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-white/90">
                Scopri di più
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            )}
          </div>
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 rotate-45"
            style={{
              width: '10px',
              height: '10px',
              background: accent
                ? `linear-gradient(135deg, ${accent}28 0%, rgba(24,24,27,0.95) 100%)`
                : 'rgba(24,24,27,0.95)',
              borderBottom: accent ? `1px solid ${accent}55` : '1px solid rgba(255,255,255,0.16)',
              borderRight: accent ? `1px solid ${accent}55` : '1px solid rgba(255,255,255,0.16)',
            }}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}

function DismissButton({
  onDismiss,
  variant,
}: {
  onDismiss: () => void;
  variant: 'glass' | 'violet';
}) {
  const base =
    variant === 'violet'
      ? 'text-violet-500 hover:bg-violet-200/60 hover:text-violet-800'
      : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100';

  return (
    <button
      type="button"
      data-asso-dismiss
      onClick={(e) => {
        e.stopPropagation();
        onDismiss();
      }}
      className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${base}`}
      aria-label="Chiudi messaggio di Asso"
      title="Chiudi"
    >
      <X className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function TypewriterCursor({ variant }: { variant: 'glass' | 'violet' }) {
  return (
    <span
      className={`asso-typewriter-cursor ml-0.5 inline-block h-[1em] w-[2px] align-[-0.1em] ${
        variant === 'violet' ? 'bg-violet-700' : 'bg-primary'
      }`}
      aria-hidden
    />
  );
}

function CloudTail() {
  return (
    <>
      <span
        className="absolute"
        style={{
          bottom: '-8px',
          right: '28px',
          width: '11px',
          height: '11px',
          borderRadius: '50%',
          background: '#ddd6fe',
          border: '1.5px solid rgba(124,58,237,0.35)',
        }}
        aria-hidden
      />
      <span
        className="absolute"
        style={{
          bottom: '-15px',
          right: '18px',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#ede9fe',
          border: '1px solid rgba(124,58,237,0.28)',
        }}
        aria-hidden
      />
    </>
  );
}
