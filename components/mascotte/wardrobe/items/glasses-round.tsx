// Occhiali tondi — slot eyesTall (96×28), lenti centrate sugli occhi (x≈33/63).
export default function GlassesRoundArt() {
  return (
    <svg viewBox="0 0 96 28" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Aste */}
      <path d="M23 12 L7 8" stroke="#b8860b" strokeWidth="1.8" />
      <path d="M73 12 L89 8" stroke="#b8860b" strokeWidth="1.8" />
      {/* Ponte */}
      <path d="M43 12 Q48 9 53 12" stroke="#d4a94e" strokeWidth="2" fill="none" />
      {/* Montatura + lenti */}
      <circle cx="33" cy="14" r="10.5" fill="#e0f2fe" fillOpacity="0.18" stroke="#d4a94e" strokeWidth="2.2" />
      <circle cx="63" cy="14" r="10.5" fill="#e0f2fe" fillOpacity="0.18" stroke="#d4a94e" strokeWidth="2.2" />
      {/* Riflessi */}
      <path d="M27.5 10 Q30 7 34 6.5" stroke="#faf9f6" strokeWidth="1.4" opacity="0.8" fill="none" />
      <path d="M57.5 10 Q60 7 64 6.5" stroke="#faf9f6" strokeWidth="1.4" opacity="0.8" fill="none" />
    </svg>
  );
}
