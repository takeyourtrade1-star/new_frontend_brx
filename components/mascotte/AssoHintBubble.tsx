'use client';

import { X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
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

/**
 * Nuvoletta di pensiero di Asso: centrata sopra la card, palette neutra
 * (niente accenti sgargianti), coda a puntini verso la testa e leggero
 * galleggiamento. I "sogni" in sleep usano la stessa forma, appena più fredda.
 */
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

  const showCta = !isStyleReaction && message.kind !== 'styleReaction' && !isTyping;
  const text = displayedText || (visible && !isTyping ? message.text : '');
  const cloudBg = isSleeping ? 'rgba(241,243,248,0.96)' : 'rgba(252,251,249,0.96)';
  const cloudBorder = '1px solid rgba(60,60,70,0.1)';
  // Centro orizzontale della card (right 48px + metà larghezza 96px).
  const cardCenterFromRight = ASSO_LAYOUT.mascotRight + ASSO_LAYOUT.mascotWidth / 2;

  return (
    <div
      className={`group fixed flex flex-col items-center ${isStyleReaction ? 'cursor-default' : showCta ? 'cursor-pointer' : ''}`}
      style={{
        zIndex: 10003,
        bottom: bubbleBottom,
        right: cardCenterFromRight,
        width: 'max-content',
        maxWidth: `min(calc(100vw - 24px), ${ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX + 30}px)`,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(50%) translateY(0) scale(1)'
          : 'translateX(50%) translateY(6px) scale(0.96)',
        transition:
          'bottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 320ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
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
      <div className="asso-hint-bubble-enter asso-thought-bob flex w-full flex-col items-center">
        {/* Nuvola */}
        <div
          className="relative px-3 py-2 text-center"
          style={{
            background: cloudBg,
            border: cloudBorder,
            borderRadius: '18px',
            boxShadow: '0 4px 14px rgba(20,20,30,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <DismissButton onDismiss={onDismiss} />
          <p className="relative text-[11px] font-normal italic leading-snug text-zinc-600">
            {text}
            {isTyping && <TypewriterCursor />}
          </p>
        </div>

        {/* Coda del pensiero: puntini che scendono verso la testa di Asso */}
        <span
          aria-hidden="true"
          className="asso-thought-dot mt-[3px] h-2 w-2 rounded-full"
          style={{ background: cloudBg, border: cloudBorder, boxShadow: '0 2px 5px rgba(20,20,30,0.08)' }}
        />
        <span
          aria-hidden="true"
          className="asso-thought-dot asso-thought-dot-2 mt-[2px] h-[5px] w-[5px] translate-x-[6px] rounded-full"
          style={{ background: cloudBg, border: cloudBorder, boxShadow: '0 2px 4px rgba(20,20,30,0.07)' }}
        />
      </div>
    </div>
  );
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      data-asso-dismiss
      onClick={(e) => {
        e.stopPropagation();
        onDismiss();
      }}
      className="absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 opacity-0 transition-all hover:text-zinc-700 group-hover:opacity-100"
      style={{
        background: 'rgba(252,251,249,0.97)',
        border: '1px solid rgba(60,60,70,0.1)',
        boxShadow: '0 1px 3px rgba(20,20,30,0.08)',
      }}
      aria-label={t('asso.hint.dismiss')}
      title={t('asso.hint.dismiss')}
    >
      <X className="h-2.5 w-2.5" aria-hidden />
    </button>
  );
}

function TypewriterCursor() {
  return (
    <span
      className="asso-typewriter-cursor ml-0.5 inline-block h-[1em] w-[1.5px] align-[-0.15em] bg-zinc-400"
      aria-hidden
    />
  );
}
