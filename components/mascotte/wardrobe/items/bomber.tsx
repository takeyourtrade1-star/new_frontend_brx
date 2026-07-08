// Bomber — slot body (96×50). Art direction: vedi wardrobe/ART_DIRECTION.md.
export default function BomberArt() {
  return (
    <svg viewBox="0 0 96 50" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoBomberBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      {/* Corpo */}
      <path d="M6 5 Q48 11 90 5 L90 33 Q90 45 78 45 L18 45 Q6 45 6 33 Z" fill="url(#assoBomberBody)" stroke="#4a5548" strokeWidth="2" />
      {/* Colletto a coste */}
      <path d="M32 4 Q48 9 64 4 L64 10 Q48 14 32 10 Z" fill="#312E81" stroke="#4a5548" strokeWidth="1.6" />
      <path d="M38 6 L38 11 M48 8 L48 12.5 M58 6 L58 11" stroke="#818CF8" strokeWidth="1" opacity="0.7" />
      {/* Zip centrale */}
      <path d="M48 13 L48 44" stroke="#c7d2fe" strokeWidth="1.8" />
      <path d="M48 15 L48 43" stroke="#312E81" strokeWidth="0.7" strokeDasharray="1.6 1.6" />
      <circle cx="48" cy="18" r="1.6" fill="#c7d2fe" stroke="#4a5548" strokeWidth="1" />
      {/* Patch brand sul petto */}
      <rect x="60" y="20" width="12" height="9" rx="2" fill="#FF7300" stroke="#4a5548" strokeWidth="1.4" />
      <path d="M63 24.5 L69 24.5" stroke="#faf9f6" strokeWidth="1.6" />
      {/* Tasche oblique */}
      <path d="M16 30 L26 36" stroke="#312E81" strokeWidth="1.8" />
      <path d="M80 30 L70 36" stroke="#312E81" strokeWidth="1.8" />
      {/* Fascia a coste */}
      <rect x="12" y="39" width="72" height="6" rx="2.5" fill="#312E81" stroke="#4a5548" strokeWidth="1.6" />
      <path d="M26 40 L26 44 M40 40 L40 44 M56 40 L56 44 M70 40 L70 44" stroke="#818CF8" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
