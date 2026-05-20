'use client';

import { ArrowRight, X } from 'lucide-react';
import { ASSO_LAYOUT } from '@/lib/asso-layout';
import { ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX } from '@/lib/asso-messages';
import type { AssoBubblePayload } from '@/hooks/useAssoBubbleQueue';

type AssoHintBubbleProps = {
  visible: boolean;
  message: AssoBubblePayload | null;
  displayedText: string;
  isTyping: boolean;
  isSleeping: boolean;
  isStyleReaction: boolean;
  bubbleBottom: number;
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
  bubbleBottom,
  onDismiss,
  onSkipTyping,
  onPromoClick,
}: AssoHintBubbleProps) {
  if (!message) return null;

  const accent = isStyleReaction ? '#FF7300' : message.accent ?? null;
  const showCta = !isStyleReaction && message.kind !== 'styleReaction';
  const text = displayedText || (visible && !isTyping ? message.text : '');

  return (
    <div
      className={`group fixed flex flex-col items-end ${isStyleReaction ? 'cursor-default' : showCta ? 'cursor-pointer' : ''}`}
      style={{
        zIndex: isStyleReaction ? 10009 : 10003,
        bottom: bubbleBottom,
        right: ASSO_LAYOUT.bubbleRight,
        width: 'max-content',
        maxWidth: `min(calc(100vw - ${ASSO_LAYOUT.bubbleRight * 2}px - ${ASSO_LAYOUT.mascotRight}px), ${ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX}px)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)',
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
        <div className="relative asso-hint-bubble-enter w-full">
          <div
            className="relative rounded-2xl px-3.5 py-2.5 text-left shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #f5f3ff 0%, #ddd6fe 55%, #c4b5fd 100%)',
              border: '1.5px solid rgba(124,58,237,0.35)',
              boxShadow: '0 6px 20px rgba(91,33,182,0.14), 0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <DismissButton onDismiss={onDismiss} variant="violet" />
            <p className="pr-7 text-[12px] font-semibold leading-snug text-violet-950">
              {text}
              {isTyping && <TypewriterCursor variant="violet" />}
            </p>
            {showCta && !isTyping && (
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-violet-600">
                Scopri nel sogno
                <ArrowRight className="h-3 w-3" aria-hidden />
              </div>
            )}
          </div>
          <CloudTail />
        </div>
      ) : (
        <div className="relative asso-hint-bubble-enter w-full">
          <div
            className="relative overflow-hidden rounded-xl px-3.5 py-2.5 text-left shadow-lg backdrop-blur-md"
            style={{
              background: accent
                ? `linear-gradient(145deg, ${accent}18 0%, rgba(24,24,27,0.92) 52%)`
                : 'rgba(24,24,27,0.92)',
              border: accent ? `1px solid ${accent}44` : '1px solid rgba(255,255,255,0.14)',
              boxShadow: accent
                ? `0 6px 20px ${accent}22, 0 2px 8px rgba(0,0,0,0.25)`
                : '0 6px 18px rgba(0,0,0,0.28)',
            }}
          >
            {accent && (
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.1] blur-lg"
                style={{ background: accent }}
                aria-hidden
              />
            )}
            <DismissButton onDismiss={onDismiss} variant="glass" />
            <p
              className="relative pr-7 text-[12px] font-medium leading-snug tracking-[0.01em] text-zinc-50"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
            >
              {text}
              {isTyping && <TypewriterCursor variant="glass" />}
            </p>
            {isTyping && (
              <p className="relative mt-1 text-[9px] text-zinc-400">Tocca per mostrare tutto</p>
            )}
            {showCta && !isTyping && (
              <div className="relative mt-2 flex items-center gap-1 text-[10px] font-semibold text-white/85">
                Scopri di più
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            )}
          </div>
          <span
            className="absolute right-6 top-full -translate-y-1/2 rotate-45"
            style={{
              width: '8px',
              height: '8px',
              background: accent
                ? `linear-gradient(135deg, ${accent}22 0%, rgba(24,24,27,0.92) 100%)`
                : 'rgba(24,24,27,0.92)',
              borderBottom: accent ? `1px solid ${accent}44` : '1px solid rgba(255,255,255,0.12)',
              borderRight: accent ? `1px solid ${accent}44` : '1px solid rgba(255,255,255,0.12)',
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
      className={`absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${base}`}
      aria-label="Chiudi messaggio di Asso"
      title="Chiudi"
    >
      <X className="h-3 w-3" aria-hidden />
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
          bottom: '-6px',
          right: '20px',
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          background: '#ddd6fe',
          border: '1.5px solid rgba(124,58,237,0.35)',
        }}
        aria-hidden
      />
      <span
        className="absolute"
        style={{
          bottom: '-11px',
          right: '14px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#ede9fe',
          border: '1px solid rgba(124,58,237,0.28)',
        }}
        aria-hidden
      />
    </>
  );
}
