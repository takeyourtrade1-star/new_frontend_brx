// Mazzo di carte a ventaglio — slot handWide (52×44). Retro brand Ebartex.
export default function CardDeckArt() {
  return (
    <svg viewBox="0 0 52 44" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoDeckBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFA246" />
          <stop offset="100%" stopColor="#FF7300" />
        </linearGradient>
      </defs>
      {/* Carta sinistra */}
      <g transform="rotate(-16 26 40)">
        <rect x="18" y="10" width="16" height="23" rx="2.2" fill="url(#assoDeckBack)" stroke="#4a5548" strokeWidth="1.6" />
        <rect x="20.2" y="12.2" width="11.6" height="18.6" rx="1.2" fill="none" stroke="#faf9f6" strokeWidth="1" opacity="0.85" />
      </g>
      {/* Carta destra */}
      <g transform="rotate(16 26 40)">
        <rect x="18" y="10" width="16" height="23" rx="2.2" fill="url(#assoDeckBack)" stroke="#4a5548" strokeWidth="1.6" />
        <rect x="20.2" y="12.2" width="11.6" height="18.6" rx="1.2" fill="none" stroke="#faf9f6" strokeWidth="1" opacity="0.85" />
      </g>
      {/* Carta centrale */}
      <rect x="18" y="7" width="16" height="23" rx="2.2" fill="url(#assoDeckBack)" stroke="#4a5548" strokeWidth="1.6" />
      <rect x="20.2" y="9.2" width="11.6" height="18.6" rx="1.2" fill="none" stroke="#faf9f6" strokeWidth="1" opacity="0.85" />
      {/* Rombo centrale */}
      <path d="M26 14.5 L29 18.5 L26 22.5 L23 18.5 Z" fill="#faf9f6" stroke="#4a5548" strokeWidth="1" />
    </svg>
  );
}
