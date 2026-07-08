// Occhiali da sole — slot eyes (96×24), lenti centrate sugli occhi (x≈33/63).
export default function SunglassesWayfarerArt() {
  return (
    <svg viewBox="0 0 96 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoSunLens" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#131316" />
        </linearGradient>
      </defs>
      {/* Aste */}
      <path d="M20 8 L6 5" stroke="#18181b" strokeWidth="2.4" />
      <path d="M76 8 L90 5" stroke="#18181b" strokeWidth="2.4" />
      {/* Ponte */}
      <path d="M43 8.5 Q48 6.5 53 8.5" stroke="#18181b" strokeWidth="2.6" fill="none" />
      {/* Lenti */}
      <rect x="21" y="3" width="23" height="17" rx="6" fill="url(#assoSunLens)" stroke="#18181b" strokeWidth="2.6" />
      <rect x="52" y="3" width="23" height="17" rx="6" fill="url(#assoSunLens)" stroke="#18181b" strokeWidth="2.6" />
      {/* Riflessi */}
      <path d="M25.5 8 L31 5.5" stroke="#faf9f6" strokeWidth="1.6" opacity="0.85" />
      <path d="M56.5 8 L62 5.5" stroke="#faf9f6" strokeWidth="1.6" opacity="0.85" />
      <path d="M27 12 L35 8" stroke="#faf9f6" strokeWidth="0.9" opacity="0.4" />
      <path d="M58 12 L66 8" stroke="#faf9f6" strokeWidth="0.9" opacity="0.4" />
    </svg>
  );
}
