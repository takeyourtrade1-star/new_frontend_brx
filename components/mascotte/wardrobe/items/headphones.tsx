// Cuffie — slot ears (104×56): archetto sopra la testa, padiglioni ai lati.
export default function HeadphonesArt() {
  return (
    <svg viewBox="0 0 104 56" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoHpCup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      {/* Archetto */}
      <path d="M15 42 Q15 7 52 7 Q89 7 89 42" stroke="#4a5548" strokeWidth="7.5" fill="none" />
      <path d="M15 42 Q15 7 52 7 Q89 7 89 42" stroke="#4338CA" strokeWidth="5" fill="none" />
      {/* Imbottitura archetto */}
      <path d="M36 11 Q52 8 68 11" stroke="#c7d2fe" strokeWidth="2.2" fill="none" opacity="0.9" />
      {/* Padiglioni */}
      <rect x="7" y="32" width="16" height="21" rx="7" fill="url(#assoHpCup)" stroke="#4a5548" strokeWidth="2" />
      <rect x="81" y="32" width="16" height="21" rx="7" fill="url(#assoHpCup)" stroke="#4a5548" strokeWidth="2" />
      {/* Anelli brand */}
      <circle cx="15" cy="42.5" r="3.6" fill="none" stroke="#FF7300" strokeWidth="1.8" />
      <circle cx="89" cy="42.5" r="3.6" fill="none" stroke="#FF7300" strokeWidth="1.8" />
      {/* Riflessi */}
      <path d="M10.5 36.5 Q11 34.5 13 34" stroke="#e0e7ff" strokeWidth="1.3" opacity="0.85" fill="none" />
      <path d="M84.5 36.5 Q85 34.5 87 34" stroke="#e0e7ff" strokeWidth="1.3" opacity="0.85" fill="none" />
    </svg>
  );
}
