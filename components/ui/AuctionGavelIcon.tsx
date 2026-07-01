import { cn } from '@/lib/utils';

export interface AuctionGavelIconProps {
  className?: string;
  /** Colore stroke. Default: currentColor */
  stroke?: string;
  strokeWidth?: number;
  /**
   * Animazione martello all'hover (come nell'header).
   * Il genitore interattivo deve avere la classe `group`.
   */
  animated?: boolean;
  /**
   * Stessa identica animazione di `animated`, ma auto-play in loop (con
   * pausa a riposo) invece che legata all'hover — per usi "ambientali" senza
   * un genitore interattivo (es. il ventaglio della landing).
   */
  loop?: boolean;
  /** Ritardo (s) prima del primo ciclo, per sfalsare più icone in loop. */
  loopDelay?: number;
}

/**
 * Icona ufficiale delle Aste.
 *
 * Coincide con l'icona usata nell'header: è la singola fonte di verità per
 * rappresentare le aste in tutta l'app. Va usata SEMPRE al posto di `Gavel`
 * (lucide) o SVG duplicati.
 */
export function AuctionGavelIcon({
  className,
  stroke = 'currentColor',
  strokeWidth = 2,
  animated = false,
  loop = false,
  loopDelay = 0,
}: AuctionGavelIconProps) {
  const sizeClass = cn('shrink-0', className);
  const delayStyle = loop ? { animationDelay: `${loopDelay}s` } : undefined;

  const gavelSvg = (
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
        (animated || loop) && 'origin-bottom-left',
        animated && 'group-hover:animate-gavel-bang',
        loop && 'animate-gavel-bang-loop'
      )}
      style={delayStyle}
      aria-hidden
    >
      <path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  );

  if (!animated && !loop) {
    return gavelSvg;
  }

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" aria-hidden>
      {gavelSvg}
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
          'origin-[83%_75%] opacity-0',
          animated && 'group-hover:animate-gavel-spark',
          loop && 'animate-gavel-spark-loop'
        )}
        style={delayStyle}
        aria-hidden
      >
        <line x1="20" y1="18.5" x2="20" y2="21" />
        <line x1="21.8" y1="17.6" x2="23.4" y2="19" />
        <line x1="18.2" y1="17.6" x2="16.6" y2="19" />
      </svg>
    </span>
  );
}
