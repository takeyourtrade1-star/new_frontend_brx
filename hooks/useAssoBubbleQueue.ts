'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ASSO_MESSAGE_BUBBLE_HOLD_MS,
  ASSO_MESSAGE_BUBBLE_CYCLE_MS,
} from '@/lib/asso-messages';
import { useAssoTypewriter } from '@/hooks/useAssoTypewriter';

export type AssoBubblePayload = {
  id: string;
  text: string;
  accent?: string | null;
  kind: 'promo' | 'styleReaction' | 'sleepDream';
  /** Interrompe il messaggio corrente e va in testa alla coda */
  priority?: boolean;
  promoId?: string;
  route?: string;
};

function holdMsForKind(kind: AssoBubblePayload['kind']): number {
  switch (kind) {
    case 'styleReaction':
      return ASSO_MESSAGE_BUBBLE_HOLD_MS.styleReaction;
    case 'sleepDream':
      return ASSO_MESSAGE_BUBBLE_HOLD_MS.sleepDream;
    default:
      return ASSO_MESSAGE_BUBBLE_HOLD_MS.promo;
  }
}

export function useAssoBubbleQueue(enabled: boolean) {
  const queueRef = useRef<AssoBubblePayload[]>([]);
  const processingRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const cycleTimerRef = useRef<number | null>(null);
  const dismissedRef = useRef(false);
  const currentRef = useRef<AssoBubblePayload | null>(null);

  const [current, setCurrent] = useState<AssoBubblePayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'typing' | 'hold' | 'out'>('idle');

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const clearCycleTimer = useCallback(() => {
    if (cycleTimerRef.current !== null) {
      window.clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
  }, []);

  const beginHold = useCallback(() => {
    if (dismissedRef.current) {
      processingRef.current = false;
      return;
    }
    setPhase('hold');
    const kind = currentRef.current?.kind ?? 'promo';
    clearHoldTimer();
    clearExitTimer();
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      processingRef.current = false;
      setPhase('out');
      setIsVisible(false);
      setCurrent(null);
      currentRef.current = null;
      clearExitTimer();
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        if (queueRef.current.length > 0) {
          processNextRef.current();
        } else {
          setPhase('idle');
        }
      }, 320);
    }, holdMsForKind(kind));
  }, [clearExitTimer, clearHoldTimer]);

  const typewriter = useAssoTypewriter({ onComplete: beginHold });

  const typewriterCancelRef = useRef(typewriter.cancel);
  typewriterCancelRef.current = typewriter.cancel;

  const interruptCurrent = useCallback(() => {
    clearHoldTimer();
    clearExitTimer();
    typewriterCancelRef.current();
    processingRef.current = false;
    setPhase('out');
    setIsVisible(false);
    setCurrent(null);
    currentRef.current = null;
  }, [clearExitTimer, clearHoldTimer]);

  const hideAndReset = useCallback(() => {
    interruptCurrent();
    dismissedRef.current = true;
  }, [interruptCurrent]);

  const processNextRef = useRef<() => void>(() => {});

  processNextRef.current = () => {
    if (!enabled || processingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      setPhase('idle');
      return;
    }

    processingRef.current = true;
    dismissedRef.current = false;
    currentRef.current = next;
    setCurrent(next);
    setPhase('typing');
    setIsVisible(true);
    typewriter.start(next.text);
  };

  const processNext = useCallback(() => {
    processNextRef.current();
  }, [enabled]);

  const enqueue = useCallback(
    (message: AssoBubblePayload) => {
      if (message.priority && processingRef.current) {
        queueRef.current = [message, ...queueRef.current.filter((m) => m.id !== message.id)];
        interruptCurrent();
        window.setTimeout(() => processNextRef.current(), 360);
        return;
      }
      if (message.priority) {
        queueRef.current.unshift(message);
      } else {
        queueRef.current.push(message);
      }
      if (!processingRef.current) {
        processNextRef.current();
      }
    },
    [interruptCurrent],
  );

  const dismiss = useCallback(() => {
    queueRef.current = [];
    hideAndReset();
    setPhase('idle');
  }, [hideAndReset]);

  const skipTyping = useCallback(() => {
    if (phase === 'typing' && typewriter.isTyping) {
      typewriter.skip();
    }
  }, [phase, typewriter]);

  const scheduleCycle = useCallback(
    (producer: () => AssoBubblePayload | null, gapMs = ASSO_MESSAGE_BUBBLE_CYCLE_MS.gapBetween) => {
      clearCycleTimer();
      const tick = () => {
        if (!enabled) return;
        const msg = producer();
        if (msg) enqueue(msg);
        cycleTimerRef.current = window.setTimeout(tick, gapMs);
      };
      cycleTimerRef.current = window.setTimeout(tick, ASSO_MESSAGE_BUBBLE_CYCLE_MS.initialDelay);
    },
    [clearCycleTimer, enabled, enqueue],
  );

  const stopCycle = useCallback(() => {
    clearCycleTimer();
    queueRef.current = [];
    interruptCurrent();
    dismissedRef.current = false;
    setPhase('idle');
  }, [clearCycleTimer, interruptCurrent]);

  useEffect(() => {
    if (!enabled) {
      stopCycle();
    }
  }, [enabled, stopCycle]);

  useEffect(
    () => () => {
      clearHoldTimer();
      clearExitTimer();
      clearCycleTimer();
      typewriterCancelRef.current();
    },
    [clearCycleTimer, clearExitTimer, clearHoldTimer],
  );

  return {
    current,
    isVisible,
    phase,
    displayedText: typewriter.displayedText,
    isTyping: typewriter.isTyping,
    enqueue,
    dismiss,
    skipTyping,
    scheduleCycle,
    stopCycle,
  };
}
