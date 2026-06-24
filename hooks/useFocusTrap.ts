'use client';

import { useCallback, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Focus trap per modali/dialog.
 *
 * - Quando `active` diventa `true`: memorizza l'elemento attualmente a fuoco,
 *   poi sposta il focus sul primo elemento focusabile dentro il container.
 * - Mentre è attivo: Tab / Shift+Tab restano confinati nel container (cicla).
 * - Quando `active` torna `false` (o al cleanup): ripristina il focus
 *   sull'elemento di partenza (es. il bottone che ha aperto il modale).
 *
 * Uso:
 * ```tsx
 * const trapRef = useFocusTrap<HTMLDivElement>(open);
 * return open ? <div ref={trapRef} role="dialog" aria-modal="true">…</div> : null;
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(active: boolean) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const getFocusable = useCallback((): HTMLElement[] => {
    const container = containerRef.current;
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  }, []);

  useEffect(() => {
    if (!active) return;

    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;

    // Sposta il focus sul primo elemento focusabile (o sul container stesso).
    const focusables = getFocusable();
    const container = containerRef.current;
    if (focusables.length > 0) {
      focusables[0].focus();
    } else if (container) {
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (activeEl === first || !containerRef.current?.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !containerRef.current?.contains(activeEl)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // Ripristina il focus al trigger di apertura.
      const toRestore = previouslyFocused.current;
      if (toRestore && typeof toRestore.focus === 'function') {
        toRestore.focus();
      }
    };
  }, [active, getFocusable]);

  return containerRef;
}
