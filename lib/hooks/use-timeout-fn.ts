'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * setTimeout con cleanup automatico allo smontaggio.
 * Ogni chiamata a `set` annulla il timer precedente, evitando timer orfani.
 */
export function useTimeoutFn() {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const set = useCallback((fn: () => void, ms: number) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(fn, ms);
  }, []);
  useEffect(() => () => { if (ref.current) clearTimeout(ref.current); }, []);
  return set;
}

/**
 * Pianifica più setTimeout concorrenti, tutti ripuliti allo smontaggio.
 * A differenza di useTimeoutFn, le chiamate non si annullano a vicenda
 * (adatto a sequenze/animazioni sovrapposte).
 */
export function useTimeouts() {
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
    return id;
  }, []);
  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);
  return schedule;
}
