'use client';

import { useCallback, useRef, type KeyboardEvent } from 'react';

/**
 * Navigazione da tastiera per un tablist conforme a WAI-ARIA.
 *
 * Gestisce: ←/→ (e ↑/↓) per spostarsi tra i tab con wrap, Home/End per
 * primo/ultimo, roving tabindex (solo il tab attivo è in tab order) e focus
 * sul tab selezionato.
 *
 * Uso:
 * ```tsx
 * const { onKeyDown, registerTab, getTabIndex } = useTabListKeyboard(ids, active, onChange);
 * // su ogni <button role="tab">:
 * ref={registerTab(id)} tabIndex={getTabIndex(id)} onKeyDown={onKeyDown}
 * ```
 */
export function useTabListKeyboard<T extends string>(
  tabs: readonly T[],
  activeTab: T,
  onTabChange: (tab: T) => void
) {
  const tabRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      const current = tabs.indexOf(activeTab);
      if (current === -1 || tabs.length === 0) return;

      let next: number | null = null;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = (current + 1) % tabs.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (current - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = tabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      const nextTab = tabs[next];
      onTabChange(nextTab);
      tabRefs.current[nextTab]?.focus();
    },
    [tabs, activeTab, onTabChange]
  );

  const registerTab = useCallback(
    (id: T) => (el: HTMLButtonElement | null) => {
      tabRefs.current[id] = el;
    },
    []
  );

  const getTabIndex = useCallback(
    (id: T) => (id === activeTab ? 0 : -1),
    [activeTab]
  );

  return { onKeyDown, registerTab, getTabIndex };
}
