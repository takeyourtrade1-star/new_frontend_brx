import { cn } from '@/lib/utils';

export interface SalesTagIconProps {
  className?: string;
  /** Colore stroke. Default: currentColor */
  stroke?: string;
  strokeWidth?: number;
  /**
   * Animazione tag-prezzo all'hover (come nell'header).
   * Il genitore interattivo deve avere la classe `group`.
   * Effetto: il tag (perfettamente centrato a riposo) si sposta leggermente
   * in basso a sinistra, e da dietro sbuca una moneta scintillante (cerchio
   * con la "E" dell'euro).
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
      className={cn(sizeClass, animated && 'relative z-10 origin-center group-hover:animate-tag-shift')}
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
      className="relative inline-flex shrink-0 items-center justify-center overflow-visible"
      aria-hidden
    >
      {/* Moneta che sbuca da dietro il tag quando questo si sposta, con scintillio.
          Tratto volutamente più sottile di quello del tag: a queste dimensioni
          lo stesso strokeWidth del tag la rendeva un blob illeggibile. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: 'visible' }}
        className={cn(
          'pointer-events-none absolute inset-0 z-0 m-auto',
          sizeClass,
          'origin-center opacity-0 group-hover:animate-coin-peek',
        )}
        aria-hidden
      >
        {/* Bordo moneta */}
        <circle cx="15" cy="15" r="6.2" />
        {/* Simbolo €: arco sinistro + due linee orizzontali */}
        <path d="M15.1 12.4a2.7 2.7 0 1 0 0 5.2" />
        <line x1="12.4" y1="14.2" x2="17.2" y2="14.2" />
        <line x1="12.4" y1="15.8" x2="17.2" y2="15.8" />
      </svg>
      {/* Shine: riflesso che attraversa la moneta mentre sbuca ("scintillante"). */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ overflow: 'visible' }}
        className={cn(
          'pointer-events-none absolute inset-0 z-0 m-auto',
          sizeClass,
          'origin-center opacity-0 group-hover:animate-coin-peek-shine',
        )}
        aria-hidden
      >
        <line x1="12" y1="11" x2="12" y2="19" strokeOpacity="0.9" />
      </svg>
      {tagSvg}
    </span>
  );
}
