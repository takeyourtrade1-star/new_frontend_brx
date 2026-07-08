// Caffè da asporto — slot hand (36×48).
export default function CoffeeArt() {
  return (
    <svg viewBox="0 0 36 48" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Vapore */}
      <path d="M14 4 Q12.5 6.5 14 9 Q15.5 11 14 13" stroke="#a1a1aa" strokeWidth="1.6" opacity="0.75" fill="none" />
      <path d="M21 3 Q19.5 5.5 21 8 Q22.5 10 21 12" stroke="#a1a1aa" strokeWidth="1.6" opacity="0.55" fill="none" />
      {/* Coperchio */}
      <rect x="7.5" y="14" width="21" height="5" rx="2" fill="#3f3f46" stroke="#4a5548" strokeWidth="1.6" />
      <rect x="12" y="11.5" width="12" height="3.4" rx="1.5" fill="#52525b" stroke="#4a5548" strokeWidth="1.4" />
      {/* Bicchiere */}
      <path d="M9 19 L27 19 L25.2 42 Q18 44.8 10.8 42 Z" fill="#faf9f6" stroke="#4a5548" strokeWidth="1.8" />
      {/* Fascia brand */}
      <path d="M9.6 26 L26.4 26 L25.7 35 Q18 37.4 10.3 35 Z" fill="#FF7300" stroke="#4a5548" strokeWidth="1.4" />
      <path d="M14 30.5 Q18 32.5 22 30.5" stroke="#faf9f6" strokeWidth="1.6" fill="none" />
      <circle cx="18" cy="29.4" r="0.9" fill="#faf9f6" />
    </svg>
  );
}
