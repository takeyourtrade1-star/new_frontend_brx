import { useEffect, useRef, type RefObject } from 'react';

/**
 * Piano 1.6 — hook DRY per chiudere un menu/popover al click esterno.
 * Sostituisce 4 effetti copia-incollati in TopBar. `onClose` è letto da una ref
 * interna, così il listener si ri-sottoscrive solo quando cambia `enabled`
 * (stesso comportamento degli effetti originali, che dipendevano solo
 * dall'apertura del menu).
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean = true,
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [enabled, ref]);
}
