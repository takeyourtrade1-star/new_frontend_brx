import type { CSSProperties } from 'react';

export type Category = 'clothing' | 'accessories' | 'objects' | 'color';
export type FaceColorId = 'neon-orange' | 'electric-cyan' | 'acid-lime' | 'hot-pink' | 'violet-burst';

export interface WardrobeItem {
  id: string;
  name: string;
  category: Category;
  svg: string;
  position: 'body' | 'head' | 'hands' | 'background';
  zIndex: number;
}

export interface EquippedItems {
  clothing: string | null;
  accessories: string[];
  objects: string[];
  faceColor: FaceColorId;
}

export interface FaceColorOption {
  id: FaceColorId;
  name: string;
  line: string;
  pupil: string;
  highlight: string;
  glowStrong: string;
  glowMid: string;
  glowSoft: string;
}

export const DEFAULT_FACE_COLOR_ID: FaceColorId = 'neon-orange';

export const FACE_COLOR_OPTIONS: FaceColorOption[] = [
  {
    id: 'neon-orange',
    name: 'Arancio Neon',
    line: '#ff6a00',
    pupil: '#ff7f11',
    highlight: '#fff2bf',
    glowStrong: 'rgba(255, 120, 10, 0.95)',
    glowMid: 'rgba(255, 106, 0, 0.75)',
    glowSoft: 'rgba(255, 106, 0, 0.45)',
  },
  {
    id: 'electric-cyan',
    name: 'Ciano Elettrico',
    line: '#00d5ff',
    pupil: '#22e6ff',
    highlight: '#d7fbff',
    glowStrong: 'rgba(0, 213, 255, 0.92)',
    glowMid: 'rgba(20, 193, 255, 0.72)',
    glowSoft: 'rgba(20, 193, 255, 0.4)',
  },
  {
    id: 'acid-lime',
    name: 'Lime Acid',
    line: '#95ff00',
    pupil: '#b7ff3f',
    highlight: '#f3ffd1',
    glowStrong: 'rgba(149, 255, 0, 0.92)',
    glowMid: 'rgba(120, 232, 22, 0.72)',
    glowSoft: 'rgba(120, 232, 22, 0.42)',
  },
  {
    id: 'hot-pink',
    name: 'Pink Pop',
    line: '#ff2ea6',
    pupil: '#ff4eb6',
    highlight: '#ffd9ee',
    glowStrong: 'rgba(255, 46, 166, 0.94)',
    glowMid: 'rgba(255, 62, 182, 0.74)',
    glowSoft: 'rgba(255, 62, 182, 0.43)',
  },
  {
    id: 'violet-burst',
    name: 'Viola Burst',
    line: '#9a5cff',
    pupil: '#b17bff',
    highlight: '#e6dcff',
    glowStrong: 'rgba(154, 92, 255, 0.94)',
    glowMid: 'rgba(167, 110, 255, 0.73)',
    glowSoft: 'rgba(167, 110, 255, 0.42)',
  },
];

export const CLOTHING_ITEMS: WardrobeItem[] = [
  {
    id: 'hoodie',
    name: 'Hoodie Street',
    category: 'clothing',
    position: 'body',
    zIndex: 10010,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hoodieBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#7c7cf5"/>
          <stop offset="50%" style="stop-color:#6366f1"/>
          <stop offset="100%" style="stop-color:#4f46e5"/>
        </linearGradient>
        <linearGradient id="hoodieDark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#4338ca;stop-opacity:0.6"/>
          <stop offset="30%" style="stop-color:#4338ca;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="hoodieDarkR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#4338ca;stop-opacity:0.6"/>
          <stop offset="30%" style="stop-color:#4338ca;stop-opacity:0"/>
        </linearGradient>
        <filter id="hoodieTex"><feGaussianBlur stdDeviation="0.2"/></filter>
      </defs>
      <path d="M20 0 Q48 -8 76 0 Q62 5 48 4 Q34 5 20 0" fill="#4338ca" stroke="#3730a3" stroke-width="0.8"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#hoodieBody)" stroke="#3730a3" stroke-width="0.8"/>
      <path d="M4 2 L4 34 Q4 46 16 46 L24 46 L24 6" fill="url(#hoodieDark)"/>
      <path d="M92 2 L92 34 Q92 46 80 46 L72 46 L72 6" fill="url(#hoodieDarkR)"/>
      <path d="M26 20 Q48 27 70 20 L70 36 Q48 40 26 36 Z" fill="#5553e8" stroke="#4338ca" stroke-width="0.6"/>
      <path d="M26 20 Q48 27 70 20" stroke="#7c7cf5" stroke-width="0.4" fill="none" opacity="0.6"/>
      <path d="M36 28 Q48 30 60 28" stroke="#3730a3" stroke-width="0.8" fill="none"/>
      <path d="M40 0 Q39 6 38 14" stroke="#e0e7ff" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M56 0 Q57 6 58 14" stroke="#e0e7ff" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="38" cy="15" r="1.2" fill="#c7d2fe"/>
      <circle cx="58" cy="15" r="1.2" fill="#c7d2fe"/>
      <rect x="10" y="40" width="76" height="4" rx="1" fill="#4338ca" opacity="0.7"/>
      <line x1="18" y1="40" x2="18" y2="44" stroke="#3730a3" stroke-width="0.4"/>
      <line x1="30" y1="40" x2="30" y2="44" stroke="#3730a3" stroke-width="0.4"/>
      <line x1="42" y1="40" x2="42" y2="44" stroke="#3730a3" stroke-width="0.4"/>
      <line x1="54" y1="40" x2="54" y2="44" stroke="#3730a3" stroke-width="0.4"/>
      <line x1="66" y1="40" x2="66" y2="44" stroke="#3730a3" stroke-width="0.4"/>
      <line x1="78" y1="40" x2="78" y2="44" stroke="#3730a3" stroke-width="0.4"/>
      <path d="M20 10 Q26 14 24 20" stroke="#5553e8" stroke-width="0.4" fill="none" filter="url(#hoodieTex)"/>
      <path d="M76 10 Q70 14 72 20" stroke="#5553e8" stroke-width="0.4" fill="none" filter="url(#hoodieTex)"/>
      <path d="M30 3 Q48 8 66 3" stroke="#8b8bf7" stroke-width="0.5" fill="none" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'leather-jacket',
    name: 'Giacca Pelle',
    category: 'clothing',
    position: 'body',
    zIndex: 10011,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="leatherMain" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2a"/>
          <stop offset="30%" style="stop-color:#1a1a1a"/>
          <stop offset="60%" style="stop-color:#0f0f0f"/>
          <stop offset="100%" style="stop-color:#1a1a1a"/>
        </linearGradient>
        <linearGradient id="leatherShine" x1="40%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" style="stop-color:#444;stop-opacity:0.4"/>
          <stop offset="50%" style="stop-color:#222;stop-opacity:0"/>
          <stop offset="100%" style="stop-color:#444;stop-opacity:0.3"/>
        </linearGradient>
        <linearGradient id="zipperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#888"/>
          <stop offset="50%" style="stop-color:#555"/>
          <stop offset="100%" style="stop-color:#888"/>
        </linearGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#leatherMain)" stroke="#000" stroke-width="0.8"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#leatherShine)"/>
      <path d="M28 0 Q48 5 68 0 L68 -3 Q48 1 28 -3 Z" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
      <path d="M30 -1 Q48 3 66 -1" stroke="#444" stroke-width="0.4" fill="none"/>
      <path d="M30 0 L46 30 L30 42 L24 36 L38 24 L30 0" fill="#181818" stroke="#333" stroke-width="0.5"/>
      <path d="M66 0 L50 30 L66 42 L72 36 L58 24 L66 0" fill="#181818" stroke="#333" stroke-width="0.5"/>
      <path d="M30 0 L46 30" stroke="#3a3a3a" stroke-width="0.4"/>
      <path d="M66 0 L50 30" stroke="#3a3a3a" stroke-width="0.4"/>
      <line x1="48" y1="4" x2="48" y2="38" stroke="url(#zipperGrad)" stroke-width="1.5"/>
      <line x1="48" y1="4" x2="48" y2="38" stroke="#666" stroke-width="0.5" stroke-dasharray="1.5,1.5"/>
      <rect x="46" y="6" width="4" height="5" rx="1" fill="#777" stroke="#555" stroke-width="0.5"/>
      <circle cx="48" cy="12" r="0.8" fill="#999"/>
      <path d="M62 12 L78 14" stroke="#555" stroke-width="0.8"/>
      <rect x="76" y="13" width="3" height="2" rx="0.5" fill="#666"/>
      <rect x="12" y="36" width="72" height="4" rx="1" fill="#111" stroke="#333" stroke-width="0.5"/>
      <rect x="42" y="35" width="12" height="6" rx="1.5" fill="#555" stroke="#777" stroke-width="0.5"/>
      <rect x="46" y="36.5" width="4" height="3" rx="0.5" fill="#888"/>
      <rect x="5" y="3" width="10" height="3" rx="1" fill="#222" stroke="#444" stroke-width="0.4"/>
      <circle cx="13" cy="4.5" r="0.8" fill="#666"/>
      <rect x="81" y="3" width="10" height="3" rx="1" fill="#222" stroke="#444" stroke-width="0.4"/>
      <circle cx="83" cy="4.5" r="0.8" fill="#666"/>
      <circle cx="20" cy="18" r="0.3" fill="#1a1a1a"/>
      <circle cx="35" cy="22" r="0.3" fill="#1a1a1a"/>
      <circle cx="76" cy="20" r="0.3" fill="#1a1a1a"/>
      <circle cx="60" cy="16" r="0.3" fill="#1a1a1a"/>
    </svg>`
  },
  {
    id: 'sweater',
    name: 'Maglione Cozy',
    category: 'clothing',
    position: 'body',
    zIndex: 10010,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sweaterBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#e09422"/>
          <stop offset="50%" style="stop-color:#d97706"/>
          <stop offset="100%" style="stop-color:#b45309"/>
        </linearGradient>
        <pattern id="cableKnit" x="0" y="0" width="8" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 3 Q2 0 4 3 Q6 6 8 3" stroke="#a0620a" stroke-width="0.5" fill="none"/>
          <path d="M0 6 Q2 3 4 6 Q6 9 8 6" stroke="#a0620a" stroke-width="0.3" fill="none" opacity="0.5"/>
        </pattern>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#sweaterBody)" stroke="#92400e" stroke-width="0.7"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#cableKnit)" opacity="0.6"/>
      <rect x="28" y="-6" width="40" height="10" rx="4" fill="#d97706" stroke="#92400e" stroke-width="0.6"/>
      <line x1="32" y1="-5" x2="32" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="36" y1="-5" x2="36" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="40" y1="-5" x2="40" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="44" y1="-5" x2="44" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="48" y1="-5" x2="48" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="52" y1="-5" x2="52" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="56" y1="-5" x2="56" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="60" y1="-5" x2="60" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="64" y1="-5" x2="64" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <rect x="10" y="38" width="76" height="6" rx="1" fill="#b45309"/>
      <line x1="18" y1="38" x2="18" y2="44" stroke="#92400e" stroke-width="0.5"/>
      <line x1="26" y1="38" x2="26" y2="44" stroke="#92400e" stroke-width="0.5"/>
      <line x1="34" y1="38" x2="34" y2="44" stroke="#92400e" stroke-width="0.5"/>
      <line x1="42" y1="38" x2="42" y2="44" stroke="#92400e" stroke-width="0.5"/>
      <line x1="50" y1="38" x2="50" y2="44" stroke="#92400e" stroke-width="0.5"/>
      <line x1="58" y1="38" x2="58" y2="44" stroke="#92400e" stroke-width="0.5"/>
      <line x1="66" y1="38" x2="66" y2="44" stroke="#92400e" stroke-width="0.5"/>
      <line x1="74" y1="38" x2="74" y2="44" stroke="#92400e" stroke-width="0.5"/>
      <path d="M30 4 Q48 8 66 4" stroke="#f0ad30" stroke-width="0.6" fill="none" opacity="0.5"/>
      <path d="M24 12 Q30 16 28 24" stroke="#b45309" stroke-width="0.3" fill="none" opacity="0.5"/>
      <path d="M72 12 Q66 16 68 24" stroke="#b45309" stroke-width="0.3" fill="none" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'tuxedo',
    name: 'Smoking Elegant',
    category: 'clothing',
    position: 'body',
    zIndex: 10012,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tuxBody" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" style="stop-color:#181818"/>
          <stop offset="50%" style="stop-color:#0d0d0d"/>
          <stop offset="100%" style="stop-color:#151515"/>
        </linearGradient>
        <linearGradient id="satinLapel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3a3a3a"/>
          <stop offset="50%" style="stop-color:#1a1a1a"/>
          <stop offset="100%" style="stop-color:#3a3a3a"/>
        </linearGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#tuxBody)" stroke="#000" stroke-width="0.8"/>
      <path d="M30 0 L46 30 L30 42 L24 36 L38 22 L30 0" fill="url(#satinLapel)"/>
      <path d="M66 0 L50 30 L66 42 L72 36 L58 22 L66 0" fill="url(#satinLapel)"/>
      <path d="M30 0 L38 14" stroke="#4a4a4a" stroke-width="0.6" opacity="0.6"/>
      <path d="M66 0 L58 14" stroke="#4a4a4a" stroke-width="0.6" opacity="0.6"/>
      <path d="M36 -2 L28 -6 L28 2 Z" fill="#111"/>
      <path d="M60 -2 L68 -6 L68 2 Z" fill="#111"/>
      <rect x="34" y="-4" width="28" height="5" rx="2.5" fill="#0a0a0a" stroke="#333" stroke-width="0.4"/>
      <rect x="45" y="-3" width="6" height="3" rx="1.5" fill="#222"/>
      <path d="M38 0 L48 28 L58 0 Q48 4 38 0" fill="#fff"/>
      <path d="M48 3 L48 26" stroke="#eee" stroke-width="0.4"/>
      <circle cx="48" cy="8" r="1" fill="#d4af37" stroke="#b8941f" stroke-width="0.3"/>
      <circle cx="48" cy="15" r="1" fill="#d4af37" stroke="#b8941f" stroke-width="0.3"/>
      <circle cx="48" cy="22" r="1" fill="#d4af37" stroke="#b8941f" stroke-width="0.3"/>
      <circle cx="48" cy="34" r="1.3" fill="#222" stroke="#444" stroke-width="0.4"/>
      <path d="M72 10 L75 8 L78 11 L76 14 L73 12 Z" fill="#fff"/>
      <path d="M73 10 L75 9 L77 11" stroke="#eee" stroke-width="0.3" fill="none"/>
      <path d="M50 4 Q70 8 88 4" stroke="#222" stroke-width="0.4" fill="none" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'bomber',
    name: 'Bomber Vintage',
    category: 'clothing',
    position: 'body',
    zIndex: 10011,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bomberBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#087355"/>
          <stop offset="50%" style="stop-color:#065f46"/>
          <stop offset="100%" style="stop-color:#047857"/>
        </linearGradient>
        <linearGradient id="bomberRib" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#fb923c"/>
          <stop offset="50%" style="stop-color:#f97316"/>
          <stop offset="100%" style="stop-color:#ea580c"/>
        </linearGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#bomberBody)" stroke="#064e3b" stroke-width="0.8"/>
      <path d="M4 2 L4 34 Q4 46 16 46 L22 46 L22 6" fill="#054e3b" opacity="0.4"/>
      <path d="M92 2 L92 34 Q92 46 80 46 L74 46 L74 6" fill="#054e3b" opacity="0.4"/>
      <rect x="28" y="-4" width="40" height="8" rx="3" fill="url(#bomberRib)"/>
      <rect x="28" y="-2" width="40" height="2" fill="#065f46" opacity="0.6"/>
      <rect x="10" y="38" width="76" height="6" rx="2" fill="url(#bomberRib)"/>
      <rect x="10" y="40" width="76" height="2" fill="#065f46" opacity="0.6"/>
      <line x1="48" y1="5" x2="48" y2="38" stroke="#aee5cc" stroke-width="2"/>
      <line x1="48" y1="5" x2="48" y2="38" stroke="#6ee7b7" stroke-width="0.8" stroke-dasharray="1.5,1"/>
      <rect x="45.5" y="7" width="5" height="6" rx="1.5" fill="#6ee7b7" stroke="#10b981" stroke-width="0.4"/>
      <circle cx="48" cy="14" r="0.7" fill="#10b981"/>
      <rect x="62" y="15" width="14" height="10" rx="1.5" fill="#065f46" stroke="#047857" stroke-width="0.5"/>
      <path d="M62 15 L76 15 L76 18 L62 18 Z" fill="#054e3b"/>
      <circle cx="69" cy="16.5" r="0.6" fill="#047857"/>
      <rect x="7" y="10" width="8" height="6" rx="1" fill="#047857" stroke="#065f46" stroke-width="0.4"/>
      <path d="M22 10 Q28 16 26 24" stroke="#065f46" stroke-width="0.3" fill="none" opacity="0.5"/>
      <path d="M74 10 Q68 16 70 24" stroke="#065f46" stroke-width="0.3" fill="none" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'hawaiian',
    name: 'Camicia Hawaii',
    category: 'clothing',
    position: 'body',
    zIndex: 10010,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="tropicalFlower" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="#1e40af"/>
          <circle cx="9" cy="9" r="4" fill="#f472b6"/>
          <circle cx="9" cy="9" r="2" fill="#fcd34d"/>
          <circle cx="9" cy="4" r="2.2" fill="#fb7185"/>
          <circle cx="9" cy="14" r="2.2" fill="#fb7185"/>
          <circle cx="4" cy="9" r="2.2" fill="#fb7185"/>
          <circle cx="14" cy="9" r="2.2" fill="#fb7185"/>
          <path d="M2 3 Q5 2 3 5" stroke="#22c55e" stroke-width="0.6" fill="none"/>
          <path d="M14 14 Q16 13 15 16" stroke="#22c55e" stroke-width="0.6" fill="none"/>
        </pattern>
        <linearGradient id="hawaiiShadow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#172554;stop-opacity:0.3"/>
          <stop offset="20%" style="stop-color:#172554;stop-opacity:0"/>
        </linearGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#tropicalFlower)" stroke="#1e3a8a" stroke-width="0.7"/>
      <path d="M4 2 L4 34 Q4 46 16 46 L24 46 L24 6" fill="url(#hawaiiShadow)"/>
      <path d="M34 0 Q48 5 62 0 L60 -4 Q48 0 36 -4 Z" fill="#1e40af" stroke="#1e3a8a" stroke-width="0.4"/>
      <rect x="46" y="2" width="4" height="38" fill="#1e40af" opacity="0.4"/>
      <circle cx="48" cy="10" r="2" fill="#5c4033" stroke="#3b2618" stroke-width="0.4"/>
      <line x1="47" y1="10" x2="49" y2="10" stroke="#3b2618" stroke-width="0.3"/>
      <line x1="48" y1="9" x2="48" y2="11" stroke="#3b2618" stroke-width="0.3"/>
      <circle cx="48" cy="22" r="2" fill="#5c4033" stroke="#3b2618" stroke-width="0.4"/>
      <line x1="47" y1="22" x2="49" y2="22" stroke="#3b2618" stroke-width="0.3"/>
      <circle cx="48" cy="34" r="2" fill="#5c4033" stroke="#3b2618" stroke-width="0.4"/>
      <rect x="60" y="8" width="12" height="9" rx="1" fill="url(#tropicalFlower)" stroke="#1e3a8a" stroke-width="0.5"/>
      <path d="M60 8 L72 8" stroke="#1e3a8a" stroke-width="0.6"/>
      <path d="M12 42 Q48 45 84 42" stroke="#1e3a8a" stroke-width="0.5" fill="none"/>
    </svg>`
  },
  {
    id: 'cardigan',
    name: 'Cardigan Soft',
    category: 'clothing',
    position: 'body',
    zIndex: 10011,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cardiganBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#b8b0a8"/>
          <stop offset="50%" style="stop-color:#a8a29e"/>
          <stop offset="100%" style="stop-color:#78716c"/>
        </linearGradient>
        <linearGradient id="goldBtn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fde68a"/>
          <stop offset="50%" style="stop-color:#fbbf24"/>
          <stop offset="100%" style="stop-color:#d97706"/>
        </linearGradient>
        <pattern id="cardiganRib" x="0" y="0" width="3" height="6" patternUnits="userSpaceOnUse">
          <line x1="1.5" y1="0" x2="1.5" y2="6" stroke="#8d8680" stroke-width="0.8"/>
        </pattern>
      </defs>
      <path d="M6 0 L48 4 L48 46 L16 46 Q6 46 6 36 Z" fill="url(#cardiganBody)" stroke="#57534e" stroke-width="0.6"/>
      <path d="M90 0 L48 4 L48 46 L80 46 Q90 46 90 36 Z" fill="url(#cardiganBody)" stroke="#57534e" stroke-width="0.6"/>
      <line x1="48" y1="4" x2="48" y2="46" stroke="#57534e" stroke-width="0.8"/>
      <path d="M30 -2 Q48 6 66 -2" stroke="#78716c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M30 -2 Q48 6 66 -2" stroke="#6b6560" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <rect x="12" y="38" width="72" height="6" rx="1" fill="#78716c"/>
      <rect x="12" y="38" width="72" height="6" fill="url(#cardiganRib)" opacity="0.5"/>
      <circle cx="44" cy="10" r="2.5" fill="url(#goldBtn)" stroke="#b8941f" stroke-width="0.5"/>
      <circle cx="44" cy="10" r="1" fill="#fef3c7" opacity="0.6"/>
      <circle cx="44" cy="22" r="2.5" fill="url(#goldBtn)" stroke="#b8941f" stroke-width="0.5"/>
      <circle cx="44" cy="22" r="1" fill="#fef3c7" opacity="0.6"/>
      <circle cx="44" cy="34" r="2.5" fill="url(#goldBtn)" stroke="#b8941f" stroke-width="0.5"/>
      <circle cx="44" cy="34" r="1" fill="#fef3c7" opacity="0.6"/>
      <rect x="16" y="22" width="14" height="12" rx="1.5" fill="#9a9490" stroke="#78716c" stroke-width="0.5"/>
      <path d="M16 22 L30 22" stroke="#78716c" stroke-width="0.8"/>
      <rect x="66" y="22" width="14" height="12" rx="1.5" fill="#9a9490" stroke="#78716c" stroke-width="0.5"/>
      <path d="M66 22 L80 22" stroke="#78716c" stroke-width="0.8"/>
      <path d="M20 8 Q26 12 24 18" stroke="#8d8680" stroke-width="0.3" fill="none" opacity="0.4"/>
      <path d="M76 8 Q70 12 72 18" stroke="#8d8680" stroke-width="0.3" fill="none" opacity="0.4"/>
    </svg>`
  },
  {
    id: 'poncho',
    name: 'Poncho Boho',
    category: 'clothing',
    position: 'body',
    zIndex: 10012,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ponchoMain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#c2410c"/>
          <stop offset="50%" style="stop-color:#9a3412"/>
          <stop offset="100%" style="stop-color:#7c2d12"/>
        </linearGradient>
        <linearGradient id="ponchoGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#fbbf24"/>
          <stop offset="50%" style="stop-color:#f59e0b"/>
          <stop offset="100%" style="stop-color:#fbbf24"/>
        </linearGradient>
        <linearGradient id="ponchoGreen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#84cc16"/>
          <stop offset="50%" style="stop-color:#65a30d"/>
          <stop offset="100%" style="stop-color:#84cc16"/>
        </linearGradient>
        <pattern id="weaveTex" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="4" y2="2" stroke="#7c2d12" stroke-width="0.3"/>
          <line x1="2" y1="0" x2="2" y2="4" stroke="#7c2d12" stroke-width="0.2"/>
        </pattern>
      </defs>
      <path d="M0 0 Q48 8 96 0 L96 34 Q96 46 84 46 L12 46 Q0 46 0 34 Z" fill="url(#ponchoMain)" stroke="#7c2d12" stroke-width="0.7"/>
      <path d="M0 0 Q48 8 96 0 L96 34 Q96 46 84 46 L12 46 Q0 46 0 34 Z" fill="url(#weaveTex)" opacity="0.4"/>
      <path d="M4 10 Q48 16 92 10 L94 18 Q48 24 2 18 Z" fill="url(#ponchoGold)" opacity="0.85"/>
      <path d="M10 13 Q48 18 86 13" stroke="#d97706" stroke-width="0.5" fill="none" stroke-dasharray="3,2"/>
      <path d="M2 26 Q48 32 94 26 L96 34 Q48 40 0 34 Z" fill="url(#ponchoGreen)" opacity="0.8"/>
      <path d="M10 20 L14 22 L18 20 L22 22 L26 20 L30 22 L34 20 L38 22 L42 20 L46 22 L50 20 L54 22 L58 20 L62 22 L66 20 L70 22 L74 20 L78 22 L82 20 L86 22" stroke="#f59e0b" stroke-width="0.6" fill="none"/>
      <line x1="10" y1="45" x2="10" y2="50" stroke="#9a3412" stroke-width="1.2"/>
      <line x1="18" y1="46" x2="18" y2="50" stroke="#9a3412" stroke-width="1"/>
      <line x1="26" y1="46" x2="26" y2="50" stroke="#9a3412" stroke-width="1"/>
      <line x1="34" y1="46" x2="34" y2="50" stroke="#9a3412" stroke-width="1"/>
      <line x1="42" y1="46" x2="42" y2="50" stroke="#9a3412" stroke-width="1"/>
      <line x1="54" y1="46" x2="54" y2="50" stroke="#9a3412" stroke-width="1"/>
      <line x1="62" y1="46" x2="62" y2="50" stroke="#9a3412" stroke-width="1"/>
      <line x1="70" y1="46" x2="70" y2="50" stroke="#9a3412" stroke-width="1"/>
      <line x1="78" y1="46" x2="78" y2="50" stroke="#9a3412" stroke-width="1"/>
      <line x1="86" y1="45" x2="86" y2="50" stroke="#9a3412" stroke-width="1.2"/>
      <ellipse cx="48" cy="0" rx="10" ry="3" fill="#3b1508"/>
      <circle cx="48" cy="4" r="2" fill="#f59e0b" stroke="#d97706" stroke-width="0.4"/>
      <line x1="48" y1="6" x2="48" y2="10" stroke="#f59e0b" stroke-width="0.8"/>
    </svg>`
  }
];

export const ACCESSORY_ITEMS: WardrobeItem[] = [
  {
    id: 'sunglasses-wayfarer',
    name: 'Occhiali Wayfarer',
    category: 'accessories',
    position: 'head',
    zIndex: 10020,
    svg: `<svg viewBox="0 0 96 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1f1f1f"/><stop offset="50%" style="stop-color:#000"/><stop offset="100%" style="stop-color:#1f1f1f"/>
        </linearGradient>
      </defs>
      <rect x="17" y="3" width="20" height="14" rx="3" fill="url(#lensGrad)" stroke="#000" stroke-width="1.5"/>
      <rect x="19" y="5" width="8" height="5" rx="1.5" fill="#333" opacity="0.3"/>
      <rect x="55" y="3" width="20" height="14" rx="3" fill="url(#lensGrad)" stroke="#000" stroke-width="1.5"/>
      <rect x="57" y="5" width="8" height="5" rx="1.5" fill="#333" opacity="0.3"/>
      <path d="M37 8 Q48 12 55 8" stroke="#0f0f0f" stroke-width="2.5" fill="none"/>
      <rect x="17" y="2" width="20" height="3" rx="1" fill="#111"/><rect x="55" y="2" width="20" height="3" rx="1" fill="#111"/>
      <line x1="17" y1="8" x2="6" y2="7" stroke="#111" stroke-width="2" stroke-linecap="round"/>
      <line x1="75" y1="8" x2="90" y2="7" stroke="#111" stroke-width="2" stroke-linecap="round"/>
      <circle cx="17" cy="8" r="1.2" fill="#666"/><circle cx="75" cy="8" r="1.2" fill="#666"/>
    </svg>`
  },
  {
    id: 'cap-baseball',
    name: 'Berretto Baseball',
    category: 'accessories',
    position: 'head',
    zIndex: 10017,
    svg: `<svg viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1e40af"/><stop offset="100%" style="stop-color:#1e3a8a"/></linearGradient>
        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#2563eb"/><stop offset="100%" style="stop-color:#1d4ed8"/></linearGradient>
      </defs>
      <path d="M14 24 Q14 4 48 2 Q82 4 82 24" fill="url(#capGrad)" stroke="#1e3a8a" stroke-width="1"/>
      <path d="M48 3 L48 24" stroke="#1e3a8a" stroke-width="0.5" opacity="0.5"/>
      <circle cx="48" cy="3" r="2.5" fill="#1e3a8a"/>
      <path d="M14 24 Q48 28 82 24 L88 29 Q48 36 8 29 Z" fill="url(#visorGrad)" stroke="#1e3a8a" stroke-width="0.8"/>
      <path d="M14 26 Q48 30 82 26" stroke="#60a5fa" stroke-width="0.5" stroke-dasharray="2,2" fill="none"/>
    </svg>`
  },
  {
    id: 'earrings-hoop',
    name: 'Orecchini Cerchio',
    category: 'accessories',
    position: 'head',
    zIndex: 10020,
    svg: `<svg viewBox="0 0 96 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="goldGradEar" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#fcd34d"/><stop offset="100%" style="stop-color:#f59e0b"/></linearGradient></defs>
      <circle cx="5" cy="14" r="6" stroke="url(#goldGradEar)" stroke-width="2.5" fill="none"/>
      <circle cx="91" cy="14" r="6" stroke="url(#goldGradEar)" stroke-width="2.5" fill="none"/>
    </svg>`
  },
  {
    id: 'necklace-pendant',
    name: 'Collana Pendente',
    category: 'accessories',
    position: 'body',
    zIndex: 10015,
    svg: `<svg viewBox="0 0 96 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chainGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#c0c0c0"/><stop offset="100%" style="stop-color:#c0c0c0"/></linearGradient>
        <linearGradient id="pendantGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#60a5fa"/><stop offset="100%" style="stop-color:#2563eb"/></linearGradient>
      </defs>
      <path d="M28 0 Q48 22 68 0" stroke="url(#chainGrad)" stroke-width="1.5" fill="none" stroke-dasharray="3,1"/>
      <ellipse cx="48" cy="22" rx="7" ry="9" fill="#c0c0c0" stroke="#a0a0a0"/>
      <ellipse cx="48" cy="22" rx="5" ry="7" fill="url(#pendantGrad)"/>
    </svg>`
  },
  {
    id: 'hair-bow',
    name: 'Fiocco Cute',
    category: 'accessories',
    position: 'head',
    zIndex: 10021,
    svg: `<svg viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 10 Q8 2 4 12 Q8 24 23 16" fill="#f472b6" stroke="#be185d" stroke-width="0.8"/>
      <path d="M27 10 Q42 2 46 12 Q42 24 27 16" fill="#ec4899" stroke="#be185d" stroke-width="0.8"/>
      <rect x="23" y="10" width="4" height="6" rx="1.5" fill="#db2777"/>
    </svg>`
  },
  {
    id: 'headphones',
    name: 'Cuffie Pro',
    category: 'accessories',
    position: 'head',
    zIndex: 10018,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 38 Q10 4 48 0 Q86 4 86 38" stroke="#374151" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="2" y="32" width="14" height="18" rx="4" fill="#1f2937" stroke="#374151"/>
      <rect x="80" y="32" width="14" height="18" rx="4" fill="#1f2937" stroke="#374151"/>
    </svg>`
  },
  {
    id: 'headband',
    name: 'Cerchietto Pearl',
    category: 'accessories',
    position: 'head',
    zIndex: 10016,
    svg: `<svg viewBox="0 0 96 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 18 Q48 0 88 18" stroke="#d4af37" stroke-width="2" fill="none"/>
      <circle cx="48" cy="4" r="3.5" fill="#fff" stroke="#c0c0c0" stroke-width="0.5"/>
    </svg>`
  },
  {
    id: 'glasses-round',
    name: 'Occhiali Vintage',
    category: 'accessories',
    position: 'head',
    zIndex: 10020,
    svg: `<svg viewBox="0 0 96 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="27" cy="12" r="11" fill="none" stroke="#8b4513" stroke-width="2.5"/>
      <circle cx="65" cy="12" r="11" fill="none" stroke="#8b4513" stroke-width="2.5"/>
      <path d="M38 10 Q48 6 54 10" stroke="#654321" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    id: 'bandana',
    name: 'Bandana Cool',
    category: 'accessories',
    position: 'head',
    zIndex: 10015,
    svg: `<svg viewBox="0 0 96 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6 Q48 0 92 6 L92 15 Q48 8 4 15 Z" fill="#dc2626" stroke="#991b1b" stroke-width="0.8"/>
    </svg>`
  },
  {
    id: 'ski-goggles',
    name: 'Maschera Sci',
    category: 'accessories',
    position: 'head',
    zIndex: 10020,
    svg: `<svg viewBox="0 0 96 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="4" width="68" height="22" rx="10" fill="#1f2937" stroke="#000" stroke-width="1"/>
      <path d="M16 6 Q48 2 80 6 Q84 8 84 14 Q84 22 80 24 Q48 28 16 24 Q12 22 12 14 Q12 8 16 6" fill="#06b6d4" stroke="#374151" stroke-width="0.8"/>
    </svg>`
  }
];

export const OBJECT_ITEMS: WardrobeItem[] = [
  {
    id: 'smartphone',
    name: 'Smartphone Latest',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="24" height="40" rx="4" fill="#1f2937" stroke="#4b5563" stroke-width="0.8"/>
      <rect x="4" y="5" width="20" height="33" rx="2.5" fill="#3b82f6"/>
    </svg>`
  },
  {
    id: 'coffee',
    name: 'Caffe Caldo',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 10 L3.5 36 Q14 40 24.5 36 L23 10 Z" fill="#fff" stroke="#ccc" stroke-width="0.8"/>
      <rect x="4" y="22" width="20" height="10" rx="1" fill="#ef4444"/>
    </svg>`
  },
  {
    id: 'laptop',
    name: 'Laptop Pro',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 38 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="0" width="34" height="20" rx="2" fill="#d1d5db" stroke="#6b7280" stroke-width="0.8"/>
      <path d="M0 20 L38 20 L35 26.5 L3 26.5 Z" fill="#9ca3af" stroke="#9ca3af" stroke-width="0.5"/>
    </svg>`
  },
  {
    id: 'book',
    name: 'Libro Vintage',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="0" width="24" height="35" rx="2" fill="#92400e" stroke="#451a03" stroke-width="1"/>
    </svg>`
  },
  {
    id: 'camera',
    name: 'Fotocamera Retro',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="32" height="18" rx="2" fill="#374151" stroke="#1f2937" stroke-width="0.8"/>
      <circle cx="20" cy="15" r="8" fill="#1f2937" stroke="#4b5563" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: 'balloon',
    name: 'Palloncino Party',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 30 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="15" cy="19" rx="13.5" ry="18" fill="#f87171"/>
      <path d="M15 38 Q17 42 15 44 Q13 46 15 48 Q17 50 15 52" stroke="#d4d4d4" stroke-width="0.8" fill="none"/>
    </svg>`
  },
  {
    id: 'bag',
    name: 'Borsa Trendy',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 14 Q8 4 15 2 Q22 4 22 14" stroke="#d4af37" stroke-width="2.5" fill="none"/>
      <rect x="2" y="14" width="26" height="20" rx="3" fill="#a855f7" stroke="#6d28d9" stroke-width="0.8"/>
    </svg>`
  },
  {
    id: 'ice-cream',
    name: 'Gelato Estate',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 26 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 26 L13 48 L20 26" fill="#f59e0b"/>
      <circle cx="13" cy="23" r="10" fill="#fef08a"/>
      <circle cx="13" cy="14" r="8" fill="#f9a8d4"/>
    </svg>`
  },
  {
    id: 'trophy',
    name: 'Trofeo Gold',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 6 Q7 24 18 26 Q29 24 29 6" fill="#fbbf24" stroke="#b45309" stroke-width="0.6"/>
      <rect x="7" y="37" width="22" height="4" rx="1.5" fill="#5c3d00"/>
    </svg>`
  },
  {
    id: 'yugioh-deck',
    name: 'Disco Duello',
    category: 'objects',
    position: 'hands',
    zIndex: 10025,
    svg: `<svg viewBox="-6 -2 58 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-4 19 L0 12 L4 10 L33 9 L35 12 L35 28 L33 31 L4 30 L0 28 L-4 21 Z" fill="#d1d5db" stroke="#9ca3af" stroke-width="0.7"/>
      <circle cx="40" cy="20" r="10" fill="#e5e7eb" stroke="#9ca3af" stroke-width="0.8"/>
    </svg>`
  }
];

export const ALL_WARDROBE_ITEMS: WardrobeItem[] = [
  ...CLOTHING_ITEMS,
  ...ACCESSORY_ITEMS,
  ...OBJECT_ITEMS,
];

/**
 * Utility to calculate the position and style of a wardrobe item
 */
export function getItemOverlayStyle(
  item: WardrobeItem,
  equippedObjects: string[] = []
): CSSProperties {
  const base: CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: item.zIndex,
  };

  if (item.position === 'body' && item.category === 'clothing') {
    return { ...base, top: '78px', left: '0', width: '96px', height: '50px' };
  }

  if (item.id === 'necklace-pendant') {
    return { ...base, top: '72px', left: '0', width: '96px', height: '36px' };
  }

  if (item.position === 'head') {
    if (item.id === 'sunglasses-wayfarer') return { ...base, top: '40px', left: '0', width: '96px', height: '24px' };
    if (item.id === 'glasses-round') return { ...base, top: '37px', left: '0', width: '96px', height: '28px' };
    if (item.id === 'cap-baseball') return { ...base, top: '-2px', left: '0', width: '96px', height: '32px' };
    if (item.id === 'headband') return { ...base, top: '4px', left: '0', width: '96px', height: '20px' };
    if (item.id === 'bandana') return { ...base, top: '18px', left: '0', width: '96px', height: '20px' };
    if (item.id === 'headphones') return { ...base, top: '-6px', left: '-4px', width: '104px', height: '56px' };
    if (item.id === 'hair-bow') return { ...base, top: '-8px', right: '-10px', width: '44px', height: '36px' };
    if (item.id === 'earrings-hoop') return { ...base, top: '36px', left: '-6px', width: '108px', height: '40px' };
    if (item.id === 'ski-goggles') return { ...base, top: '36px', left: '-4px', width: '104px', height: '30px' };
  }

  if (item.id === 'yugioh-deck') {
    const objIndex = equippedObjects.indexOf(item.id);
    const isRight = objIndex % 2 === 0;
    return { ...base, top: '48px', [isRight ? 'right' : 'left']: '-38px', width: '52px', height: '44px' };
  }

  if (item.position === 'hands') {
    const objIndex = equippedObjects.indexOf(item.id);
    const isRight = objIndex % 2 === 0;
    return { ...base, top: '60px', [isRight ? 'right' : 'left']: '-24px', width: '36px', height: '48px' };
  }

  return base;
}
