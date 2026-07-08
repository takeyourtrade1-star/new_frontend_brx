// Hoodie brand — slot body (96×50). Art direction: vedi wardrobe/ART_DIRECTION.md.
export default function HoodieArt() {
  return (
    <svg viewBox="0 0 96 50" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoHoodieBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFA246" />
          <stop offset="100%" stopColor="#FF7300" />
        </linearGradient>
      </defs>
      {/* Cappuccio ripiegato dietro le spalle */}
      <path d="M22 3 Q48 -5 74 3 Q61 9 48 8 Q35 9 22 3 Z" fill="#E05F00" stroke="#4a5548" strokeWidth="2" />
      {/* Corpo */}
      <path d="M6 5 Q48 11 90 5 L90 33 Q90 45 78 45 L18 45 Q6 45 6 33 Z" fill="url(#assoHoodieBody)" stroke="#4a5548" strokeWidth="2" />
      {/* Tasca a marsupio */}
      <path d="M30 22 Q48 27 66 22 L66 35 Q48 39 30 35 Z" fill="#E05F00" stroke="#4a5548" strokeWidth="1.6" />
      <path d="M30 22 Q48 27 66 22" stroke="#FFC98F" strokeWidth="1.2" fill="none" opacity="0.8" />
      {/* Lacci */}
      <path d="M40 8 Q39 12 38.5 16" stroke="#faf9f6" strokeWidth="1.8" />
      <path d="M56 8 Q57 12 57.5 16" stroke="#faf9f6" strokeWidth="1.8" />
      <circle cx="38.5" cy="17.5" r="1.7" fill="#faf9f6" stroke="#4a5548" strokeWidth="1" />
      <circle cx="57.5" cy="17.5" r="1.7" fill="#faf9f6" stroke="#4a5548" strokeWidth="1" />
      {/* Fascia a coste */}
      <rect x="12" y="39" width="72" height="6" rx="2.5" fill="#E05F00" stroke="#4a5548" strokeWidth="1.6" />
      <path d="M26 40 L26 44 M40 40 L40 44 M56 40 L56 44 M70 40 L70 44" stroke="#4a5548" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
