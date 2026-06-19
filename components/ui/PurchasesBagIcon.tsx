import { cn } from '@/lib/utils';

export interface PurchasesBagIconProps {
  className?: string;
  /** Colore stroke. Default: currentColor */
  stroke?: string;
  strokeWidth?: number;
  /**
   * Animazione borsa all'hover (come nell'header).
   * Il genitore interattivo deve avere la classe `group`.
   * Effetto: la borsa fa un piccolo "pop" verso l'alto, il manico ad arco
   * si allarga (pacco che si apre) e una scintilla spunta dall'apertura.
   */
  animated?: boolean;
}

/**
 * Icona ufficiale degli Acquisti.
 *
 * Coincide con l'icona usata nell'header: è la singola fonte di verità per
 * rappresentare gli acquisti in tutta l'app. Va usata SEMPRE al posto di
 * `ShoppingBag` (lucide) o SVG duplicati.
 */
export function PurchasesBagIcon({
  className,
  stroke = 'currentColor',
  strokeWidth = 2,
  animated = false,
}: PurchasesBagIconProps) {
  const sizeClass = cn('shrink-0', className);

  const bagSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeClass, animated && 'group-hover:animate-bag-pop')}
      aria-hidden
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
    </svg>
  );

  if (!animated) {
    return bagSvg;
  }

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" aria-hidden>
      {bagSvg}
      {/* Manico ad arco: si allarga = "pacco che si apre".
          origin puntato sulla base dell'arco (y=10 ≈ 42% del viewBox). */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={cn(
          'pointer-events-none absolute inset-0 m-auto',
          sizeClass,
          'origin-[50%_42%] group-hover:animate-bag-handle',
        )}
        aria-hidden
      >
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {/* Scintilla che spunta dall'apertura della borsa. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          'pointer-events-none absolute inset-0 m-auto',
          sizeClass,
          'origin-center opacity-0 group-hover:animate-bag-spark',
        )}
        aria-hidden
      >
        <line x1="12" y1="3" x2="12" y2="5" />
        <line x1="9.6" y1="3.9" x2="10.5" y2="5.3" />
        <line x1="14.4" y1="3.9" x2="13.5" y2="5.3" />
      </svg>
    </span>
  );
}
