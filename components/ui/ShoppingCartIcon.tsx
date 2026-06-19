import { cn } from '@/lib/utils';

export interface ShoppingCartIconProps {
  className?: string;
  /** Colore stroke. Default: currentColor */
  stroke?: string;
  strokeWidth?: number;
  /**
   * Animazione carrello all'hover (come nell'header).
   * Il genitore interattivo deve avere la classe `group`.
   * Effetto: il carrello oscilla ruotando sulle ruote (wobble con rimbalzo
   * decrescente, come bag-pop/gavel-bang) e tre linee di scia compaiono
   * a sinistra scorrendo indietro = "carrello che sfreccia verso di te".
   */
  animated?: boolean;
}

/**
 * Icona ufficiale del Carrello.
 *
 * Coincide con l'icona usata nell'header (lucide `ShoppingCart`): è la singola
 * fonte di verità per rappresentare il carrello in tutta l'app. Va usata SEMPRE
 * al posto di `ShoppingCart` (lucide) o SVG duplicati.
 */
export function ShoppingCartIcon({
  className,
  stroke = 'currentColor',
  strokeWidth = 2,
  animated = false,
}: ShoppingCartIconProps) {
  const sizeClass = cn('shrink-0', className);

  const cartSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        sizeClass,
        animated && 'origin-bottom group-hover:animate-cart-wobble',
      )}
      aria-hidden
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );

  if (!animated) {
    return cartSvg;
  }

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      aria-hidden
    >
      {cartSvg}
      {/* Linee di scia a sinistra = "carrello che sfreccia". */}
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
          'origin-center opacity-0 group-hover:animate-cart-speed',
        )}
        aria-hidden
      >
        <line x1="1" y1="9" x2="3.5" y2="9" />
        <line x1="0.5" y1="13" x2="3" y2="13" />
        <line x1="1" y1="17" x2="3.5" y2="17" />
      </svg>
    </span>
  );
}
