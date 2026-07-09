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
 * Nuvoletta di pensiero di Asso, in stile fumetto: silhouette a gobbe
 * (blob solidi dello stesso colore unificati da un drop-shadow sul wrapper,
 * così il contorno segue la sagoma senza cuciture interne), coda a puntini
 * verso la testa, galleggiamento lento. Palette neutra; in sleep vira fredda.
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
  const cloud = isSleeping ? '#eef2f8' : '#fbfaf7';
  // Centro orizzontale della card (right 48px + metà larghezza 96px).
  const cardCenterFromRight = ASSO_LAYOUT.mascotRight + ASSO_LAYOUT.mascotWidth / 2;

  const bump = (style: React.CSSProperties) => (
    <span
      aria-hidden="true"
      className="absolute rounded-full"
      style={{ background: cloud, ...style }}
    />
  );

  return (
    <div
      className={`group fixed flex flex-col items-center ${isStyleReaction ? 'cursor-default' : showCta ? 'cursor-pointer' : ''}`}
      style={{
        zIndex: 10003,
        bottom: bubbleBottom,
        right: cardCenterFromRight,
        width: 'max-content',
        maxWidth: `min(calc(100vw - 24px), ${ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX + 40}px)`,
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
      {/* Il drop-shadow sul wrapper disegna il contorno dell'intera sagoma
          (nuvola + gobbe + puntini), senza bordi che si incrociano dentro. */}
      <div
        className="asso-hint-bubble-enter asso-thought-bob flex w-full flex-col items-center"
        style={{
          filter: isSleeping
            ? 'drop-shadow(0 1px 2px rgba(50,60,90,0.18)) drop-shadow(0 8px 18px rgba(40,50,80,0.14))'
            : 'drop-shadow(0 1px 2px rgba(40,38,32,0.16)) drop-shadow(0 8px 18px rgba(30,28,24,0.13))',
        }}
      >
        <div className="relative">
          {/* Gobbe della nuvola (dietro al corpo, stesso colore = nessuna cucitura) */}
          {bump({ top: '-7px', left: '12%', width: '20px', height: '20px' })}
          {bump({ top: '-10px', left: '38%', width: '27px', height: '27px' })}
          {bump({ top: '-6px', right: '13%', width: '16px', height: '16px' })}
          {bump({ top: '35%', left: '-6px', width: '15px', height: '15px' })}
          {bump({ top: '42%', right: '-6px', width: '13px', height: '13px' })}
          {bump({ bottom: '-5px', left: '22%', width: '14px', height: '14px' })}
          {bump({ bottom: '-5px', right: '26%', width: '12px', height: '12px' })}

          {/* Corpo */}
          <div
            className="relative z-[1] px-3.5 py-2 text-center"
            style={{ background: cloud, borderRadius: '20px' }}
          >
            <p className={`relative text-[11px] font-normal italic leading-snug ${isSleeping ? 'text-slate-500' : 'text-zinc-600'}`}>
              {text}
              {isTyping && <TypewriterCursor />}
            </p>
          </div>

          <DismissButton cloud={cloud} onDismiss={onDismiss} />
        </div>

        {/* Coda: puntini che scendono verso la testa di Asso */}
        <span className="asso-thought-dot mt-[4px]" aria-hidden="true">
          <span className="block h-2 w-2 rounded-full" style={{ background: cloud }} />
        </span>
        <span className="asso-thought-dot asso-thought-dot-2 mt-[3px] translate-x-[7px]" aria-hidden="true">
          <span className="block h-[5px] w-[5px] rounded-full" style={{ background: cloud }} />
        </span>
      </div>
    </div>
  );
}

function DismissButton({ cloud, onDismiss }: { cloud: string; onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      data-asso-dismiss
      onClick={(e) => {
        e.stopPropagation();
        onDismiss();
      }}
      className="absolute -right-2.5 -top-2.5 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full text-zinc-400 opacity-0 transition-all hover:text-zinc-700 focus-visible:opacity-100 group-hover:opacity-100"
      style={{ background: cloud }}
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
