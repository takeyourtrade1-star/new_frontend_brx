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
 * Bubble discreto ancorato alla mascotte Asso.
 * Pensata per essere poco invasiva: dimensioni ridotte, palette neutra,
 * niente gradienti colorati.
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

  return (
    <div
      className={`group fixed flex flex-col items-end ${isStyleReaction ? 'cursor-default' : showCta ? 'cursor-pointer' : ''}`}
      style={{
        zIndex: 10003,
        bottom: bubbleBottom,
        right: ASSO_LAYOUT.bubbleRight,
        width: 'max-content',
        maxWidth: `min(calc(100vw - ${ASSO_LAYOUT.bubbleRight * 2}px - ${ASSO_LAYOUT.mascotRight}px), ${ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX}px)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
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
      <div className="relative asso-hint-bubble-enter w-full">
        <div
          className="relative rounded-lg px-2.5 py-1.5 text-left"
          style={{
            background: isSleeping ? 'rgba(244,244,245,0.96)' : 'rgba(250,250,250,0.97)',
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <DismissButton onDismiss={onDismiss} />
          <p className="relative pr-5 text-[11px] font-normal leading-snug text-zinc-700">
            {text}
            {isTyping && <TypewriterCursor />}
          </p>
        </div>
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
      className="absolute right-0.5 top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-zinc-700"
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
