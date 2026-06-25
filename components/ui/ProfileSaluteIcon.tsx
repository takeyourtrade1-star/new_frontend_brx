import { cn } from '@/lib/utils';

export interface ProfileSaluteIconProps {
  className?: string;
  /** Colore stroke. Default: currentColor */
  stroke?: string;
  strokeWidth?: number;
  /**
   * Animazione "saluto militare" all'hover (come le altre icone dell'header).
   * Il genitore interattivo deve avere la classe `group`.
   *
   * Il braccio è a due segmenti: il braccio (spalla→gomito) resta fermo mentre
   * l'avambraccio (gomito→mano) fa cerniera sul gomito e sale fino alla fronte,
   * con la mano piatta. Movimento morbido, così sembra davvero un saluto.
   */
  animated?: boolean;
}

/**
 * Icona profilo dell'header (omino: testa + spalle), con saluto militare all'hover.
 * Stessa fonte di verità dell'icona account usata nella TopBar.
 */
export function ProfileSaluteIcon({
  className,
  stroke = 'currentColor',
  strokeWidth = 2,
  animated = false,
}: ProfileSaluteIconProps) {
  const sizeClass = cn('shrink-0', className);

  const personSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeClass, 'origin-bottom', animated && 'group-hover:animate-salute-bob')}
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  if (!animated) {
    return personSvg;
  }

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" aria-hidden>
      {personSvg}
      {/* Braccio del saluto, sovrapposto. Tutto il gruppo compare/svanisce (fade),
          mentre solo l'avambraccio ruota: cerniera sul gomito (transform-box:
          fill-box → origine sull'angolo in basso a sinistra = il gomito). */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('pointer-events-none absolute inset-0 m-auto', sizeClass)}
        aria-hidden
      >
        <g className="opacity-0 group-hover:animate-salute-fade">
          {/* Braccio: spalla → gomito (fermo) */}
          <path d="M7 15L3.5 12" />
          {/* Avambraccio + mano: fa cerniera sul gomito (3.5, 12) */}
          <g
            className="group-hover:animate-salute-forearm"
            style={{ transformBox: 'fill-box', transformOrigin: '0% 100%' }}
          >
            {/* gomito → fronte */}
            <path d="M3.5 12L10 5.8" />
            {/* mano piatta appoggiata alla fronte (taglio perpendicolare al polso) */}
            <path d="M9.4 5.1L10.6 6.5" />
          </g>
        </g>
      </svg>
    </span>
  );
}
