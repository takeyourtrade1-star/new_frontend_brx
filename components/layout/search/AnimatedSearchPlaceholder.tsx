'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const ROTATING_WORDS = [
  'carte singole...',
  'boosters...',
  'espansioni...',
  'mazzi precostruiti...',
  'Pokémon...',
  'Magic...',
  'One Piece...',
  'accessori...',
  'carte rare...',
  'booster box...',
];

const TYPE_SPEED = 60;
const DELETE_SPEED = 35;
const PAUSE_AFTER_TYPE = 2200;
const PAUSE_AFTER_DELETE = 400;

export function AnimatedSearchPlaceholder({
  visible,
  isDark,
}: {
  visible: boolean;
  isDark: boolean;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    const currentWord = ROTATING_WORDS[wordIndex];

    if (!isDeleting) {
      const nextText = currentWord.slice(0, displayText.length + 1);
      setDisplayText(nextText);

      if (nextText === currentWord) {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPE);
        return;
      }
      timeoutRef.current = setTimeout(tick, TYPE_SPEED);
    } else {
      const nextText = currentWord.slice(0, displayText.length - 1);
      setDisplayText(nextText);

      if (nextText === '') {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        timeoutRef.current = setTimeout(tick, PAUSE_AFTER_DELETE);
        return;
      }
      timeoutRef.current = setTimeout(tick, DELETE_SPEED);
    }
  }, [wordIndex, displayText, isDeleting]);

  useEffect(() => {
    if (!visible) return;
    timeoutRef.current = setTimeout(tick, TYPE_SPEED);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, visible]);

  useEffect(() => {
    if (visible) return;
    return () => {
      setDisplayText('');
      setIsDeleting(false);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center whitespace-nowrap overflow-hidden px-3 py-0 md:px-4 md:py-2.5 text-[16px] leading-normal md:text-sm font-sans select-none transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <span className={`mr-1.5 ${isDark ? 'text-gray-400' : 'text-white/50'}`}>Cerca</span>
      <span className="text-[#FF7300]">{displayText}</span>
      <span
        className={`inline-block w-[2px] h-[1.1em] ml-[1px] align-middle animate-blink-caret ${
          isDark ? 'bg-[#FF7300]' : 'bg-[#FF7300]/80'
        }`}
      />
    </div>
  );
}
