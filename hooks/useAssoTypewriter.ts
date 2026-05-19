'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ASSO_MESSAGE_TYPEWRITER_MS } from '@/lib/asso-messages';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function charDelay(char: string): number {
  if (char === ' ') return ASSO_MESSAGE_TYPEWRITER_MS.space;
  if (/[.!?]/.test(char)) return ASSO_MESSAGE_TYPEWRITER_MS.punctStrong;
  if (/[,;:]/.test(char)) return ASSO_MESSAGE_TYPEWRITER_MS.punctSoft;
  return ASSO_MESSAGE_TYPEWRITER_MS.base;
}

export type UseAssoTypewriterOptions = {
  onComplete?: () => void;
};

export function useAssoTypewriter(options: UseAssoTypewriterOptions = {}) {
  const { onComplete } = options;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [fullText, setFullText] = useState('');

  const sequenceRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const fullTextRef = useRef('');
  const indexRef = useRef(0);
  const charsRef = useRef<string[]>([]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimer();
    setIsTyping(false);
    onCompleteRef.current?.();
  }, [clearTimer]);

  const completeInstant = useCallback((text: string) => {
    sequenceRef.current += 1;
    clearTimer();
    fullTextRef.current = text;
    setFullText(text);
    setDisplayedText(text);
    setIsTyping(false);
    onCompleteRef.current?.();
  }, [clearTimer]);

  const skip = useCallback(() => {
    const text = fullTextRef.current;
    if (!text) return;
    sequenceRef.current += 1;
    clearTimer();
    setDisplayedText(text);
    setIsTyping(false);
    onCompleteRef.current?.();
  }, [clearTimer]);

  const cancel = useCallback(() => {
    sequenceRef.current += 1;
    clearTimer();
    setIsTyping(false);
    setDisplayedText('');
    setFullText('');
    fullTextRef.current = '';
  }, [clearTimer]);

  const start = useCallback(
    (text: string) => {
      sequenceRef.current += 1;
      const sequenceId = sequenceRef.current;
      clearTimer();

      fullTextRef.current = text;
      setFullText(text);

      if (!text) {
        setDisplayedText('');
        setIsTyping(false);
        return;
      }

      if (prefersReducedMotion()) {
        completeInstant(text);
        return;
      }

      const chars = Array.from(text);
      charsRef.current = chars;
      indexRef.current = 0;
      setDisplayedText('');
      setIsTyping(true);

      const typeNext = () => {
        if (sequenceId !== sequenceRef.current) return;

        if (indexRef.current < chars.length) {
          indexRef.current += 1;
          setDisplayedText(chars.slice(0, indexRef.current).join(''));
          const delay = charDelay(chars[indexRef.current - 1] ?? '');
          timeoutRef.current = window.setTimeout(typeNext, delay);
        } else {
          timeoutRef.current = null;
          finish();
        }
      };

      timeoutRef.current = window.setTimeout(typeNext, ASSO_MESSAGE_TYPEWRITER_MS.initial);
    },
    [clearTimer, completeInstant, finish],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    displayedText,
    fullText,
    isTyping,
    start,
    skip,
    cancel,
    completeInstant,
  };
}
