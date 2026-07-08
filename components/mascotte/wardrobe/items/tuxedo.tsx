// Smoking — slot body (96×50). Art direction: vedi wardrobe/ART_DIRECTION.md.
export default function TuxedoArt() {
  return (
    <svg viewBox="0 0 96 50" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoTuxedoBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f2f36" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
      </defs>
      {/* Giacca */}
      <path d="M6 5 Q48 11 90 5 L90 33 Q90 45 78 45 L18 45 Q6 45 6 33 Z" fill="url(#assoTuxedoBody)" stroke="#4a5548" strokeWidth="2" />
      {/* Camicia a V */}
      <path d="M34 6 L48 30 L62 6 Q48 10 34 6 Z" fill="#faf9f6" stroke="#4a5548" strokeWidth="1.6" />
      {/* Bottoni camicia */}
      <circle cx="48" cy="34" r="1.4" fill="#faf9f6" opacity="0.9" />
      <circle cx="48" cy="40" r="1.4" fill="#faf9f6" opacity="0.9" />
      {/* Revers */}
      <path d="M34 6 L44 20 L38 26 Q30 16 34 6 Z" fill="#3f3f46" stroke="#4a5548" strokeWidth="1.4" />
      <path d="M62 6 L52 20 L58 26 Q66 16 62 6 Z" fill="#3f3f46" stroke="#4a5548" strokeWidth="1.4" />
      {/* Papillon */}
      <path d="M42 6 L48 10 L54 6 L54 13 L48 10 L42 13 Z" fill="#FF7300" stroke="#4a5548" strokeWidth="1.6" />
      <rect x="46.4" y="7.2" width="3.2" height="4.4" rx="1" fill="#E05F00" stroke="#4a5548" strokeWidth="1" />
      {/* Pochette */}
      <path d="M66 26 L74 24 L72 30 Z" fill="#FF7300" stroke="#4a5548" strokeWidth="1.2" />
    </svg>
  );
}
