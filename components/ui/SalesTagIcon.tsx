import { cn } from '@/lib/utils';

export interface SalesTagIconProps {
  className?: string;
  /** Colore stroke. Default: currentColor */
  stroke?: string;
  strokeWidth?: number;
  /**
   * Animazione tag-prezzo all'hover (come nell'header).
   * Il genitore interattivo deve avere la classe `group`.
   * Effetto: il tag oscilla a scatti (wobble) e una moneta/€ appare
   * in basso a destra facendo un flip 3D ad arco con rimbalzo + shine
   * ("appare il soldo").
   */
  animated?: boolean;
}

/**
 * Icona ufficiale delle Vendite.
 *
 * Coincide con l'icona usata nell'header: è la singola fonte di verità per
 * rappresentare le vendite in tutta l'app. Va usata SEMPRE al posto di `Tag`
 * (lucide) o SVG duplicati.
 */
export function SalesTagIcon({
  className,
  stroke = 'currentColor',
  strokeWidth = 2,
  animated = false,
}: SalesTagIconProps) {
  const sizeClass = cn('shrink-0', className);

  const tagSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeClass, animated && 'origin-[30%_30%] group-hover:animate-tag-tilt')}
      aria-hidden
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );

  if (!animated) {
    return tagSvg;
  }

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center [perspective:240px]"
      aria-hidden
    >
      {tagSvg}
      {/* Moneta/€ in overlay: flip 3D mentre vola ad arco e rimbalza = "appare il soldo". */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          'pointer-events-none absolute inset-0 m-auto [transform-style:preserve-3d] [backface-visibility:visible]',
          sizeClass,
          'origin-center opacity-0 group-hover:animate-coin-pop',
        )}
        aria-hidden
      >
        {/* Bordo moneta */}
        <circle cx="18" cy="17" r="3.1" />
        {/* Bordo interno (spessore) */}
        <circle cx="18" cy="17" r="2.1" strokeOpacity="0.55" />
        {/* Simbolo €: arco sinistro + due linee orizzontali */}
        <path d="M17.9 15.5a1.5 1.5 0 1 0 0 3" />
        <line x1="16.2" y1="16.3" x2="19.4" y2="16.3" />
        <line x1="16.2" y1="17.7" x2="19.4" y2="17.7" />
      </svg>
      {/* Shine: riflesso che attraversa la moneta al culmine del salto. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        className={cn(
          'pointer-events-none absolute inset-0 m-auto',
          sizeClass,
          'origin-center opacity-0 group-hover:animate-coin-shine',
        )}
        aria-hidden
      >
        <line x1="15.5" y1="14.5" x2="15.5" y2="19.5" strokeOpacity="0.85" />
      </svg>
    </span>
  );
}
