'use client';

import React, { useId } from 'react';
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

/**
 * Ogni bandiera con gradienti/filtri usa `<defs>` con ID. Quando la stessa
 * bandiera compare due volte nella stessa pagina (es. dropdown "Posizione
 * venditore" + filtro "Lingua carta"), gli ID duplicati collidono e in alcuni
 * browser (Safari in primis) le istanze successive non risolvono il gradiente,
 * mostrando la bandiera vuota. Per evitarlo ogni istanza riceve un `uid` univoco
 * (useId) con cui prefissa i propri ID.
 */
type FlagProps = { className?: string; uid: string };

/* ============================================================
   ITALY - Tricolore verde/bianco/rosso
   ============================================================ */
function FlagIT({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}itGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#009246" />
          <stop offset="100%" stopColor="#007a3a" />
        </linearGradient>
        <linearGradient id={`${uid}itRedGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CE2B37" />
          <stop offset="100%" stopColor="#a8222d" />
        </linearGradient>
      </defs>
      <rect width="20" height="40" fill={`url(#${uid}itGrad)`} />
      <rect x="20" width="20" height="40" fill="#F8F9FA" />
      <rect x="40" width="20" height="40" fill={`url(#${uid}itRedGrad)`} />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   GERMANY - Tricolore nero/rosso/oro
   ============================================================ */
function FlagDE({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}deBlack`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <linearGradient id={`${uid}deRed`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DD0000" />
          <stop offset="100%" stopColor="#b80000" />
        </linearGradient>
        <linearGradient id={`${uid}deGold`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFCE00" />
          <stop offset="100%" stopColor="#d4a900" />
        </linearGradient>
      </defs>
      <rect width="60" height="13.33" fill={`url(#${uid}deBlack)`} />
      <rect y="13.33" width="60" height="13.33" fill={`url(#${uid}deRed)`} />
      <rect y="26.67" width="60" height="13.33" fill={`url(#${uid}deGold)`} />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   FRANCE - Tricolore blu/bianco/rosso
   ============================================================ */
function FlagFR({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}frBlue`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0055A4" />
          <stop offset="100%" stopColor="#004080" />
        </linearGradient>
        <linearGradient id={`${uid}frRed`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EF4135" />
          <stop offset="100%" stopColor="#d13328" />
        </linearGradient>
      </defs>
      <rect width="20" height="40" fill={`url(#${uid}frBlue)`} />
      <rect x="20" width="20" height="40" fill="#F8F9FA" />
      <rect x="40" width="20" height="40" fill={`url(#${uid}frRed)`} />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   SPAIN - Strisce oro/rosso con stemma semplificato
   ============================================================ */
function FlagES({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}esGold`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F1BF00" />
          <stop offset="100%" stopColor="#c99f00" />
        </linearGradient>
        <linearGradient id={`${uid}esRed`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#AA151B" />
          <stop offset="100%" stopColor="#7a0f13" />
        </linearGradient>
      </defs>
      <rect width="60" height="10" fill={`url(#${uid}esRed)`} />
      <rect y="10" width="60" height="20" fill={`url(#${uid}esGold)`} />
      <rect y="30" width="60" height="10" fill={`url(#${uid}esRed)`} />
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
function FlagAT({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}atRed`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ED2939" />
          <stop offset="100%" stopColor="#c41e2b" />
        </linearGradient>
      </defs>
      <rect width="60" height="13.33" fill={`url(#${uid}atRed)`} />
      <rect y="13.33" width="60" height="13.33" fill="#F8F9FA" />
      <rect y="26.67" width="60" height="13.33" fill={`url(#${uid}atRed)`} />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   SWITZERLAND - Croce bianca su rosso
   ============================================================ */
function FlagCH({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}chRed`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DA020E" />
          <stop offset="100%" stopColor="#a8000a" />
        </linearGradient>
        <filter id={`${uid}chShadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodOpacity="0.15" />
        </filter>
      </defs>
      <rect width="60" height="40" fill={`url(#${uid}chRed)`} rx="0" />
      {/* White cross */}
      <g filter={`url(#${uid}chShadow)`}>
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
function FlagGB({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}gbBlue`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#012169" />
          <stop offset="100%" stopColor="#001040" />
        </linearGradient>
      </defs>
      <rect width="60" height="40" fill={`url(#${uid}gbBlue)`} />
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
function FlagUS({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}usRed`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B22234" />
          <stop offset="100%" stopColor="#8a1a28" />
        </linearGradient>
        <linearGradient id={`${uid}usBlue`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3C3B6E" />
          <stop offset="100%" stopColor="#2a2950" />
        </linearGradient>
      </defs>
      {/* Red and white stripes */}
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * (40 / 13)} width="60" height={40 / 13} fill={`url(#${uid}usRed)`} />
      ))}
      {/* Blue field */}
      <rect width="24" height="21.5" fill={`url(#${uid}usBlue)`} />
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
function FlagPT({ className, uid }: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}ptGreen`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#006600" />
          <stop offset="100%" stopColor="#004d00" />
        </linearGradient>
        <linearGradient id={`${uid}ptRed`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF0000" />
          <stop offset="100%" stopColor="#cc0000" />
        </linearGradient>
      </defs>
      <rect width="22" height="40" fill={`url(#${uid}ptGreen)`} />
      <rect x="22" width="38" height="40" fill={`url(#${uid}ptRed)`} />
      {/* Simplified armillary sphere emblem */}
      <circle cx="22" cy="20" r="5" fill="#FFFF00" opacity="0.9" />
      <circle cx="22" cy="20" r="5" fill="none" stroke="#800000" strokeWidth="0.8" />
      <circle cx="22" cy="20" r="3.5" fill="none" stroke="#800000" strokeWidth="0.6" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />
    </svg>
  );
}

/* ============================================================
   EU - Bandiera europea stilizzata
   ============================================================ */
function FlagEU({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#1D3160" rx="2" />
      <circle cx="30" cy="20" r="9" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
      <path d="M21 20 L39 20 M30 11 L30 29 M23.5 13.5 L36.5 26.5 M23.5 26.5 L36.5 13.5" stroke="#FFFFFF" strokeWidth="1.1" opacity="0.55" />
      <path d="M30 11 a9 9 0 0 1 0 18 a5.5 9 0 0 0 0-18 Z" fill="#FFFFFF" opacity="0.18" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

/* ============================================================
   WORLD - Globo per l'opzione "Tutti i paesi"
   ============================================================ */
function FlagWorld({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#EAF2FB" rx="2" />
      <circle cx="30" cy="20" r="13" fill="#3D8BD6" />
      {/* Meridiani / paralleli */}
      <g stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.9">
        <circle cx="30" cy="20" r="13" />
        <path d="M17 20 H43" />
        <path d="M19.5 13.5 H40.5 M19.5 26.5 H40.5" />
        <path d="M30 7 V33" />
        <ellipse cx="30" cy="20" rx="5.5" ry="13" />
      </g>
      {/* Continenti stilizzati */}
      <g fill="#2E7D32" opacity="0.95">
        <path d="M22 14 q3 -1 5 1 q1 2 -1 3 q-3 1 -4 -1 q-1 -2 0 -3 Z" />
        <path d="M31 22 q4 -1 6 2 q1 3 -2 4 q-4 1 -5 -2 q-1 -3 1 -4 Z" />
      </g>
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

function FlagJP({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#FFFFFF" rx="2" />
      <circle cx="30" cy="20" r="8" fill="#BC002D" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

function FlagKR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#FFFFFF" rx="2" />
      <circle cx="30" cy="20" r="7" fill="none" stroke="#000000" strokeWidth="0.2" />
      <path d="M30 13 a7 3.5 0 0 1 0 7 a7 3.5 0 0 0 0 7 a3.5 7 0 0 0 0 -14 Z" fill="#CD2E3A" />
      <path d="M30 13 a7 3.5 0 0 0 0 7 a7 3.5 0 0 1 0 7 a3.5 7 0 0 1 0 -14 Z" fill="#0047A0" />
      <g stroke="#000000" strokeWidth="1.1" fill="none">
        <path d="M18 11 L22 11 M18 11 L18 15 M20 11 L20 16 M20 16 L21 17 M20 16 L19 17" />
        <path d="M18 29 L22 29 M18 29 L18 25 M20 29 L20 24 M20 24 L21 23 M20 24 L19 23" />
        <path d="M38 11 L42 11 M42 11 L42 15 M40 11 L40 16 M40 16 L39 17 M40 16 L41 17" />
        <path d="M38 29 L42 29 M42 29 L42 25 M40 29 L40 24 M40 24 L39 23 M40 24 L41 23" />
      </g>
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

function FlagCN({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#DE2910" rx="2" />
      <g fill="#FFDE00">
        <path d="M13 11 L14.18 14.62 L11 12.31 L15 12.31 L11.82 14.62 Z" />
        <path d="M21 7 L21.3 7.93 L20.25 7.17 L21.75 7.17 L20.7 7.93 Z" transform="rotate(-20 21 8)" />
        <path d="M23.5 10.5 L23.8 11.43 L22.75 10.67 L24.25 10.67 L23.2 11.43 Z" transform="rotate(10 23.5 11)" />
        <path d="M23.5 15.5 L23.8 16.43 L22.75 15.67 L24.25 15.67 L23.2 16.43 Z" transform="rotate(35 23.5 16)" />
        <path d="M21 19 L21.3 19.93 L20.25 19.17 L21.75 19.17 L20.7 19.93 Z" transform="rotate(55 21 20)" />
      </g>
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

function FlagTW({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#FE0000" rx="2" />
      <rect width="30" height="20" fill="#000095" rx="2" />
      <g transform="translate(15 10)">
        <circle r="5" fill="#FFFFFF" />
        <g fill="#000095">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect key={deg} x="-0.5" y="-7" width="1" height="3" transform={`rotate(${deg})`} />
          ))}
        </g>
        <circle r="2.5" fill="#FFFFFF" />
        <g fill="#000095">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect key={deg} x="-0.3" y="-3.5" width="0.6" height="1.5" transform={`rotate(${deg})`} />
          ))}
        </g>
      </g>
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

function FlagRU({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="13.33" fill="#FFFFFF" rx="2" />
      <rect y="13.33" width="60" height="13.34" fill="#0039A6" />
      <rect y="26.67" width="60" height="13.33" fill="#D52B1E" />
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

function FlagFallback({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#6B7280" rx="2" />
      <text x="30" y="25" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">?</text>
      <rect width="60" height="40" fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

/** Bandiere con `<defs>`/gradienti: ricevono `uid` per ID univoci. */
const gradientFlags: Record<string, React.FC<FlagProps>> = {
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

/** Bandiere senza ID interni: nessun rischio di collisione tra istanze. */
const plainFlags: Record<string, React.FC<{ className?: string }>> = {
  EU: FlagEU,
  WORLD: FlagWorld,
  ALL: FlagWorld,
  GLOBE: FlagWorld,
  JP: FlagJP,
  JA: FlagJP,
  KR: FlagKR,
  KO: FlagKR,
  CN: FlagCN,
  ZH: FlagCN,
  TW: FlagTW,
  RU: FlagRU,
};

export function FlagIcon({ country, className, size = 'sm', rounded = true, title }: FlagIconProps) {
  const reactId = useId();
  // useId restituisce stringhe con ':' che non sono valide negli ID/anchor SVG.
  const uid = `f${reactId.replace(/:/g, '')}-`;
  const code = country?.toUpperCase() || '';
  const GradientFlag = gradientFlags[code];
  const PlainFlag = plainFlags[code];

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
      {GradientFlag ? (
        <GradientFlag className="h-full w-full" uid={uid} />
      ) : PlainFlag ? (
        <PlainFlag className="h-full w-full" />
      ) : (
        <FlagFallback className="h-full w-full" />
      )}
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
