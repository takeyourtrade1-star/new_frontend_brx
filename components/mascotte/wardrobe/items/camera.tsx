// Fotocamera retrò — slot hand (36×48).
export default function CameraArt() {
  return (
    <svg viewBox="0 0 36 48" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="assoCameraBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      {/* Corpo */}
      <rect x="3" y="15" width="30" height="21" rx="4" fill="url(#assoCameraBody)" stroke="#4a5548" strokeWidth="1.8" />
      {/* Piastra superiore */}
      <path d="M3 20 L33 20 L33 19 Q33 15 29 15 L7 15 Q3 15 3 19 Z" fill="#faf9f6" stroke="#4a5548" strokeWidth="1.4" />
      {/* Mirino + pulsante scatto */}
      <rect x="6.5" y="11.5" width="7" height="4.5" rx="1.5" fill="#3f3f46" stroke="#4a5548" strokeWidth="1.4" />
      <rect x="24" y="12" width="6" height="3.6" rx="1.6" fill="#FF7300" stroke="#4a5548" strokeWidth="1.4" />
      {/* Obiettivo */}
      <circle cx="18" cy="27" r="7.5" fill="#18181b" stroke="#4a5548" strokeWidth="1.8" />
      <circle cx="18" cy="27" r="4.4" fill="#3f3f46" stroke="#4a5548" strokeWidth="1.2" />
      <circle cx="16.2" cy="25.2" r="1.4" fill="#faf9f6" opacity="0.9" />
      {/* Spia */}
      <circle cx="29" cy="24" r="1.3" fill="#FF7300" stroke="#4a5548" strokeWidth="0.9" />
    </svg>
  );
}
