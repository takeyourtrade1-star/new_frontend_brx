import { cn } from '@/lib/utils';

interface PriceTagIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Icona tag prezzi: contorno arancione-marrone, piccolo anello in alto a sinistra,
 * elementi a fiore/stella in diagonale dall'alto-sinistra al basso-destra.
 */
export function PriceTagIcon({ className, style }: PriceTagIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      style={style}
      aria-hidden
    >
      {/* Contorno del tag (solo stroke) */}
      <path
        d="M8 14.5L22 4h18v18L14 44 4 34 8 14.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Piccolo anello in alto a sinistra (per attacco) */}
      <ellipse
        cx="12"
        cy="9"
        rx="2"
        ry="2.2"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M12 6.8v-1"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      {/* Elementi a fiore/stella in diagonale (top-left → bottom-right) */}
      <g fill="currentColor" stroke="currentColor" strokeWidth="0.5" opacity="0.95">
        {/* Elemento 1 - alto-sinistra (stella 4 punte) */}
        <g transform="translate(20, 18)">
          <circle r="1" fill="currentColor" />
          <path d="M0-1.4v2.8M-1.4 0h2.8M-1-1l2 2M-1 1l2-2" stroke="currentColor" strokeWidth="0.5" fill="none" />
        </g>
        {/* Elemento 2 - centro */}
        <g transform="translate(26, 22)">
          <circle r="0.9" fill="currentColor" />
          <path d="M0-1.2v2.4M-1.2 0h2.4M-0.85-0.85l1.7 1.7M-0.85 0.85l1.7-1.7" stroke="currentColor" strokeWidth="0.5" fill="none" />
        </g>
        {/* Elemento 3 - basso-destra */}
        <g transform="translate(32, 26)">
          <circle r="0.9" fill="currentColor" />
          <path d="M0-1.2v2.4M-1.2 0h2.4M-0.85-0.85l1.7 1.7M-0.85 0.85l1.7-1.7" stroke="currentColor" strokeWidth="0.5" fill="none" />
        </g>
      </g>
    </svg>
  );
}
