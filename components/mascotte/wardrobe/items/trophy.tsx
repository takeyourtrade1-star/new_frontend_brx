// Trofeo — slot hand (36×48).
export default function TrophyArt() {
  return (
    <svg viewBox="0 0 36 48" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoTrophyCup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Manici */}
      <path d="M9.5 12 Q3 12 3.5 18 Q4 23 10.5 23.5" stroke="#F59E0B" strokeWidth="2.4" fill="none" />
      <path d="M26.5 12 Q33 12 32.5 18 Q32 23 25.5 23.5" stroke="#F59E0B" strokeWidth="2.4" fill="none" />
      {/* Coppa */}
      <path d="M8.5 9 L27.5 9 L26 24 Q18 30 10 24 Z" fill="url(#assoTrophyCup)" stroke="#4a5548" strokeWidth="1.8" />
      {/* Stella */}
      <path d="M18 13 L19.4 16 L22.6 16.4 L20.3 18.6 L20.9 21.8 L18 20.2 L15.1 21.8 L15.7 18.6 L13.4 16.4 L16.6 16 Z" fill="#faf9f6" stroke="#4a5548" strokeWidth="1" />
      {/* Riflesso */}
      <path d="M11.5 12 Q11 17 12.5 21.5" stroke="#fffbeb" strokeWidth="1.4" opacity="0.85" fill="none" />
      {/* Stelo e base */}
      <path d="M16 28 L20 28 L21 34 L15 34 Z" fill="#F59E0B" stroke="#4a5548" strokeWidth="1.4" />
      <rect x="10" y="34" width="16" height="4.5" rx="1.5" fill="#b45309" stroke="#4a5548" strokeWidth="1.6" />
      <rect x="8" y="38.5" width="20" height="4" rx="1.5" fill="#92400e" stroke="#4a5548" strokeWidth="1.6" />
    </svg>
  );
}
