// Laptop — slot hand (36×48).
export default function LaptopArt() {
  return (
    <svg viewBox="0 0 36 48" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoLaptopBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e4e4e7" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </linearGradient>
      </defs>
      {/* Schermo */}
      <rect x="4" y="9" width="28" height="21" rx="2.5" fill="#18181b" stroke="#4a5548" strokeWidth="1.8" />
      {/* Righe di codice */}
      <path d="M8 14 L18 14" stroke="#FF7300" strokeWidth="1.8" />
      <path d="M10 18 L24 18" stroke="#34d399" strokeWidth="1.8" />
      <path d="M10 22 L20 22" stroke="#faf9f6" strokeWidth="1.8" opacity="0.75" />
      <path d="M8 26 L14 26" stroke="#818CF8" strokeWidth="1.8" />
      {/* Cursore */}
      <rect x="16" y="24.8" width="1.6" height="2.6" rx="0.5" fill="#FF7300" />
      {/* Base */}
      <path d="M2 30 L34 30 L32 36 Q18 38 4 36 Z" fill="url(#assoLaptopBase)" stroke="#4a5548" strokeWidth="1.8" />
      <rect x="14" y="31.5" width="8" height="2.4" rx="1.2" fill="#71717a" opacity="0.7" />
    </svg>
  );
}
