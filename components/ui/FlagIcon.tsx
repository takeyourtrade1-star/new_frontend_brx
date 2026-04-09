'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type CountryCode = 'IT' | 'DE' | 'FR' | 'ES' | 'AT' | 'CH' | 'GB' | 'US' | 'PT' | string;

interface FlagIconProps {
  country: CountryCode;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
  title?: string;
}

const sizeMap = {
  xs: 'h-3 w-4',
  sm: 'h-4 w-6',
  md: 'h-5 w-7',
  lg: 'h-6 w-9',
};

/* ============================================================
   ITALY - Tricolore verde/bianco/rosso
   ============================================================ */
function FlagIT({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="itGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#009246" />
          <stop offset="100%" stopColor="#007a3a" />
        </linearGradient>
        <linearGradient id="itRedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CE2B37" />
          <stop offset="100%" stopColor="#a8222d" />
        </linearGradient>
      </defs>
      <rect width="20" height="40" fill="url(#itGrad)" />
      <rect x="20" width="20" height="40" fill="#F8F9FA" />
      <rect x="40" width="20" height="40" fill="url(#itRedGrad)" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   GERMANY - Tricolore nero/rosso/oro
   ============================================================ */
function FlagDE({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="deBlack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="deRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DD0000" />
          <stop offset="100%" stopColor="#b80000" />
        </linearGradient>
        <linearGradient id="deGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFCE00" />
          <stop offset="100%" stopColor="#d4a900" />
        </linearGradient>
      </defs>
      <rect width="60" height="13.33" fill="url(#deBlack)" />
      <rect y="13.33" width="60" height="13.33" fill="url(#deRed)" />
      <rect y="26.67" width="60" height="13.33" fill="url(#deGold)" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   FRANCE - Tricolore blu/bianco/rosso
   ============================================================ */
function FlagFR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="frBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0055A4" />
          <stop offset="100%" stopColor="#004080" />
        </linearGradient>
        <linearGradient id="frRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EF4135" />
          <stop offset="100%" stopColor="#d13328" />
        </linearGradient>
      </defs>
      <rect width="20" height="40" fill="url(#frBlue)" />
      <rect x="20" width="20" height="40" fill="#F8F9FA" />
      <rect x="40" width="20" height="40" fill="url(#frRed)" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   SPAIN - Strisce oro/rosso con stemma semplificato
   ============================================================ */
function FlagES({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="esGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F1BF00" />
          <stop offset="100%" stopColor="#c99f00" />
        </linearGradient>
        <linearGradient id="esRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#AA151B" />
          <stop offset="100%" stopColor="#7a0f13" />
        </linearGradient>
      </defs>
      <rect width="60" height="10" fill="url(#esRed)" />
      <rect y="10" width="60" height="20" fill="url(#esGold)" />
      <rect y="30" width="60" height="10" fill="url(#esRed)" />
      {/* Simplified coat of arms area */}
      <rect x="15" y="13" width="12" height="14" rx="1" fill="#AA151B" opacity="0.9" />
      <rect x="16" y="14" width="10" height="12" rx="0.5" fill="#F1BF00" opacity="0.3" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   AUSTRIA - Tricolore rosso/bianco/rosso
   ============================================================ */
function FlagAT({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="atRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ED2939" />
          <stop offset="100%" stopColor="#c41e2b" />
        </linearGradient>
      </defs>
      <rect width="60" height="13.33" fill="url(#atRed)" />
      <rect y="13.33" width="60" height="13.33" fill="#F8F9FA" />
      <rect y="26.67" width="60" height="13.33" fill="url(#atRed)" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   SWITZERLAND - Croce bianca su rosso
   ============================================================ */
function FlagCH({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="chRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DA020E" />
          <stop offset="100%" stopColor="#a8000a" />
        </linearGradient>
        <filter id="chShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodOpacity="0.15" />
        </filter>
      </defs>
      <rect width="60" height="40" fill="url(#chRed)" rx="0" />
      {/* White cross */}
      <g filter="url(#chShadow)">
        <rect x="25" y="8" width="10" height="24" fill="#FFFFFF" />
        <rect x="14" y="15" width="32" height="10" fill="#FFFFFF" />
      </g>
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   UNITED KINGDOM - Union Jack semplificato
   ============================================================ */
function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="gbBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#012169" />
          <stop offset="100%" stopColor="#001040" />
        </linearGradient>
      </defs>
      <rect width="60" height="40" fill="url(#gbBlue)" />
      {/* White diagonal stripes */}
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#FFFFFF" strokeWidth="8" />
      {/* Red diagonal stripes */}
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="4" />
      {/* White vertical/horizontal */}
      <path d="M30 0 V40 M0 20 H60" stroke="#FFFFFF" strokeWidth="12" />
      {/* Red vertical/horizontal */}
      <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="7" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   UNITED STATES - Stars and Stripes semplificato
   ============================================================ */
function FlagUS({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="usRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B22234" />
          <stop offset="100%" stopColor="#8a1a28" />
        </linearGradient>
        <linearGradient id="usBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3C3B6E" />
          <stop offset="100%" stopColor="#2a2950" />
        </linearGradient>
      </defs>
      {/* Red and white stripes */}
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * (40 / 13)} width="60" height={40 / 13} fill="url(#usRed)" />
      ))}
      {/* Blue field */}
      <rect width="24" height="21.5" fill="url(#usBlue)" />
      {/* Simplified stars grid */}
      <g fill="#FFFFFF" opacity="0.9">
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3, 4, 5].map((col) => {
            const x = 2 + col * 3.8;
            const y = 2 + row * 4;
            const offset = row % 2 === 1 ? 1.9 : 0;
            if (col === 5 && row % 2 === 1) return null;
            return <circle key={`${row}-${col}`} cx={x + offset} cy={y} r="0.8" />;
          })
        )}
      </g>
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   PORTUGAL - Verde/rosso con stemma semplificato
   ============================================================ */
function FlagPT({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="ptGreen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#006600" />
          <stop offset="100%" stopColor="#004d00" />
        </linearGradient>
        <linearGradient id="ptRed" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF0000" />
          <stop offset="100%" stopColor="#cc0000" />
        </linearGradient>
      </defs>
      <rect width="22" height="40" fill="url(#ptGreen)" />
      <rect x="22" width="38" height="40" fill="url(#ptRed)" />
      {/* Simplified armillary sphere emblem */}
      <circle cx="22" cy="20" r="5" fill="#FFFF00" opacity="0.9" />
      <circle cx="22" cy="20" r="5" fill="none" stroke="#800000" strokeWidth="0.8" />
      <circle cx="22" cy="20" r="3.5" fill="none" stroke="#800000" strokeWidth="0.6" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   FALLBACK - Bandiera generica grigia
   ============================================================ */
function FlagFallback({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#6B7280" rx="2" />
      <text x="30" y="25" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">?</text>
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

const flagComponents: Record<string, React.FC<{ className?: string }>> = {
  IT: FlagIT,
  DE: FlagDE,
  FR: FlagFR,
  ES: FlagES,
  AT: FlagAT,
  CH: FlagCH,
  GB: FlagGB,
  US: FlagUS,
  PT: FlagPT,
  UK: FlagGB,
  EN: FlagGB,
};

export function FlagIcon({ country, className, size = 'sm', rounded = true, title }: FlagIconProps) {
  const code = country?.toUpperCase() || '';
  const FlagComponent = flagComponents[code] || FlagFallback;

  return (
    <span
      className={cn(
        'inline-block overflow-hidden shadow-sm',
        sizeMap[size],
        rounded && 'rounded-sm',
        className
      )}
      aria-hidden
      title={title}
    >
      <FlagComponent className="h-full w-full" />
    </span>
  );
}

/* ============================================================
   HOOK per compatibilità con codice esistente
   ============================================================ */
export function useCountryFlag() {
  return {
    FlagIcon,
    getFlag: (country: CountryCode, size?: 'xs' | 'sm' | 'md' | 'lg') => (
      <FlagIcon country={country} size={size || 'sm'} />
    ),
  };
}

export default FlagIcon;
