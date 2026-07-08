// Cappellino — slot headTop (96×32). Art direction: vedi wardrobe/ART_DIRECTION.md.
export default function CapBaseballArt() {
  return (
    <svg viewBox="0 0 96 32" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoCapCrown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFA246" />
          <stop offset="100%" stopColor="#FF7300" />
        </linearGradient>
      </defs>
      {/* Visiera */}
      <path d="M12 25 Q48 35 84 25 Q66 29 48 29 Q30 29 12 25 Z" fill="#E05F00" stroke="#4a5548" strokeWidth="1.8" />
      {/* Corona */}
      <path d="M18 26 Q18 6 48 6 Q78 6 78 26 Q48 31 18 26 Z" fill="url(#assoCapCrown)" stroke="#4a5548" strokeWidth="2" />
      {/* Cuciture */}
      <path d="M34 8.5 Q33 17 33 25" stroke="#E05F00" strokeWidth="1.2" opacity="0.8" />
      <path d="M62 8.5 Q63 17 63 25" stroke="#E05F00" strokeWidth="1.2" opacity="0.8" />
      {/* Pannello frontale */}
      <path d="M38 26.5 Q38 11 48 11 Q58 11 58 26.5 Q48 29 38 26.5 Z" fill="#faf9f6" stroke="#4a5548" strokeWidth="1.6" />
      {/* Stella brand */}
      <path d="M48 14.5 L49.6 18 L53.3 18.4 L50.6 20.9 L51.3 24.5 L48 22.7 L44.7 24.5 L45.4 20.9 L42.7 18.4 L46.4 18 Z" fill="#FF7300" stroke="#4a5548" strokeWidth="1" />
      {/* Bottone */}
      <circle cx="48" cy="6" r="2" fill="#E05F00" stroke="#4a5548" strokeWidth="1.2" />
    </svg>
  );
}
