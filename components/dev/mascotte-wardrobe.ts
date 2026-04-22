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
        <linearGradient id="hoodieBody" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" style="stop-color:#a5a6fb"/>
          <stop offset="35%" style="stop-color:#6366f1"/>
          <stop offset="75%" style="stop-color:#4338ca"/>
          <stop offset="100%" style="stop-color:#312e81"/>
        </linearGradient>
        <radialGradient id="hoodieHL" cx="32%" cy="18%" r="55%">
          <stop offset="0%" style="stop-color:#e0e7ff;stop-opacity:0.55"/>
          <stop offset="55%" style="stop-color:#c7d2fe;stop-opacity:0.08"/>
          <stop offset="100%" style="stop-color:#c7d2fe;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="hoodieDark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:0.75"/>
          <stop offset="40%" style="stop-color:#1e1b4b;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="hoodieDarkR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:0.75"/>
          <stop offset="40%" style="stop-color:#1e1b4b;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="pocketG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#312e81"/>
          <stop offset="50%" style="stop-color:#5b54f0"/>
          <stop offset="100%" style="stop-color:#312e81"/>
        </linearGradient>
        <radialGradient id="cordTip" cx="40%" cy="35%" r="65%">
          <stop offset="0%" style="stop-color:#ffffff"/>
          <stop offset="55%" style="stop-color:#c7d2fe"/>
          <stop offset="100%" style="stop-color:#4338ca"/>
        </radialGradient>
      </defs>
      <path d="M20 0 Q48 -8 76 0 Q62 5 48 4 Q34 5 20 0" fill="#312e81" stroke="#1e1b4b" stroke-width="0.8"/>
      <path d="M24 -2 Q48 -6 72 -2" stroke="#6366f1" stroke-width="0.4" fill="none" opacity="0.7"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#hoodieBody)" stroke="#1e1b4b" stroke-width="0.8"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#hoodieHL)"/>
      <path d="M4 2 L4 34 Q4 46 16 46 L24 46 L24 6" fill="url(#hoodieDark)"/>
      <path d="M92 2 L92 34 Q92 46 80 46 L72 46 L72 6" fill="url(#hoodieDarkR)"/>
      <path d="M14 6 Q16 22 14 42" stroke="#c7d2fe" stroke-width="0.7" fill="none" opacity="0.3" stroke-linecap="round"/>
      <path d="M82 6 Q80 22 82 42" stroke="#1e1b4b" stroke-width="0.5" fill="none" opacity="0.35" stroke-linecap="round"/>
      <path d="M26 20 Q48 27 70 20 L70 36 Q48 40 26 36 Z" fill="url(#pocketG)" stroke="#1e1b4b" stroke-width="0.7"/>
      <path d="M26 20 Q48 27 70 20" stroke="#1e1b4b" stroke-width="0.4" fill="none" opacity="0.9" transform="translate(0,0.8)"/>
      <path d="M26 20 Q48 27 70 20" stroke="#a5a6fb" stroke-width="0.5" fill="none" opacity="0.8"/>
      <path d="M36 28 Q48 31 60 28" stroke="#1e1b4b" stroke-width="0.9" fill="none" opacity="0.85"/>
      <path d="M36 28 Q48 31 60 28" stroke="#a5a6fb" stroke-width="0.35" fill="none" opacity="0.55" transform="translate(0,-0.7)"/>
      <path d="M40 0 Q39 6 38 14" stroke="#1e1b4b" stroke-width="1.7" stroke-linecap="round" opacity="0.4"/>
      <path d="M40 0 Q39 6 38 14" stroke="#e0e7ff" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M39.7 1 Q38.9 6 38 12" stroke="#ffffff" stroke-width="0.35" stroke-linecap="round" opacity="0.85"/>
      <path d="M56 0 Q57 6 58 14" stroke="#1e1b4b" stroke-width="1.7" stroke-linecap="round" opacity="0.4"/>
      <path d="M56 0 Q57 6 58 14" stroke="#e0e7ff" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M56.3 1 Q57.1 6 58 12" stroke="#ffffff" stroke-width="0.35" stroke-linecap="round" opacity="0.85"/>
      <circle cx="38" cy="15" r="1.6" fill="url(#cordTip)" stroke="#1e1b4b" stroke-width="0.3"/>
      <circle cx="37.5" cy="14.5" r="0.4" fill="#ffffff" opacity="0.95"/>
      <circle cx="58" cy="15" r="1.6" fill="url(#cordTip)" stroke="#1e1b4b" stroke-width="0.3"/>
      <circle cx="57.5" cy="14.5" r="0.4" fill="#ffffff" opacity="0.95"/>
      <rect x="10" y="40" width="76" height="4" rx="1" fill="#312e81"/>
      <rect x="10" y="40" width="76" height="1.3" fill="#6366f1" opacity="0.7"/>
      <rect x="10" y="42.8" width="76" height="1.2" fill="#1e1b4b" opacity="0.6"/>
      <line x1="18" y1="40" x2="18" y2="44" stroke="#1e1b4b" stroke-width="0.4"/>
      <line x1="30" y1="40" x2="30" y2="44" stroke="#1e1b4b" stroke-width="0.4"/>
      <line x1="42" y1="40" x2="42" y2="44" stroke="#1e1b4b" stroke-width="0.4"/>
      <line x1="54" y1="40" x2="54" y2="44" stroke="#1e1b4b" stroke-width="0.4"/>
      <line x1="66" y1="40" x2="66" y2="44" stroke="#1e1b4b" stroke-width="0.4"/>
      <line x1="78" y1="40" x2="78" y2="44" stroke="#1e1b4b" stroke-width="0.4"/>
      <circle cx="22" cy="14" r="0.2" fill="#c7d2fe" opacity="0.5"/>
      <circle cx="34" cy="10" r="0.2" fill="#c7d2fe" opacity="0.5"/>
      <circle cx="62" cy="12" r="0.2" fill="#c7d2fe" opacity="0.5"/>
      <circle cx="78" cy="14" r="0.2" fill="#c7d2fe" opacity="0.5"/>
      <circle cx="82" cy="26" r="0.2" fill="#c7d2fe" opacity="0.4"/>
      <circle cx="16" cy="32" r="0.2" fill="#c7d2fe" opacity="0.4"/>
      <path d="M30 3 Q48 8 66 3" stroke="#a5a6fb" stroke-width="0.5" fill="none" opacity="0.5"/>
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
        <linearGradient id="leatherMain" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" style="stop-color:#3a3a3a"/>
          <stop offset="30%" style="stop-color:#1a1a1a"/>
          <stop offset="65%" style="stop-color:#050505"/>
          <stop offset="100%" style="stop-color:#1c1c1c"/>
        </linearGradient>
        <radialGradient id="leatherGloss" cx="30%" cy="20%" r="55%">
          <stop offset="0%" style="stop-color:#6e6e6e;stop-opacity:0.65"/>
          <stop offset="50%" style="stop-color:#3a3a3a;stop-opacity:0.15"/>
          <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="leatherEdge" x1="0%" y1="40%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#000;stop-opacity:0"/>
          <stop offset="100%" style="stop-color:#000;stop-opacity:0.8"/>
        </linearGradient>
        <linearGradient id="lapelGloss" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#555"/>
          <stop offset="40%" style="stop-color:#1a1a1a"/>
          <stop offset="60%" style="stop-color:#0a0a0a"/>
          <stop offset="100%" style="stop-color:#444"/>
        </linearGradient>
        <linearGradient id="zipperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#444"/>
          <stop offset="45%" style="stop-color:#e8e8e8"/>
          <stop offset="55%" style="stop-color:#ffffff"/>
          <stop offset="100%" style="stop-color:#3a3a3a"/>
        </linearGradient>
        <radialGradient id="studG" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#e8e8e8"/>
          <stop offset="55%" style="stop-color:#888"/>
          <stop offset="100%" style="stop-color:#222"/>
        </radialGradient>
        <radialGradient id="zipPull" cx="35%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:#d4d4d4"/>
          <stop offset="55%" style="stop-color:#6e6e6e"/>
          <stop offset="100%" style="stop-color:#1a1a1a"/>
        </radialGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#leatherMain)" stroke="#000" stroke-width="0.8"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#leatherGloss)"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#leatherEdge)" opacity="0.55"/>
      <path d="M10 10 Q14 22 12 40" stroke="#4a4a4a" stroke-width="0.6" fill="none" opacity="0.4" stroke-linecap="round"/>
      <path d="M28 0 Q48 5 68 0 L68 -3 Q48 1 28 -3 Z" fill="#0a0a0a" stroke="#2a2a2a" stroke-width="0.5"/>
      <path d="M30 -1 Q48 3 66 -1" stroke="#5a5a5a" stroke-width="0.35" fill="none" opacity="0.8"/>
      <path d="M30 0 L46 30 L30 42 L24 36 L38 24 L30 0" fill="url(#lapelGloss)" stroke="#000" stroke-width="0.5"/>
      <path d="M66 0 L50 30 L66 42 L72 36 L58 24 L66 0" fill="url(#lapelGloss)" stroke="#000" stroke-width="0.5"/>
      <path d="M32 2 L44 26" stroke="#6a6a6a" stroke-width="0.4" opacity="0.7"/>
      <path d="M64 2 L52 26" stroke="#6a6a6a" stroke-width="0.4" opacity="0.7"/>
      <path d="M30 0 L46 30" stroke="#000" stroke-width="0.4"/>
      <path d="M66 0 L50 30" stroke="#000" stroke-width="0.4"/>
      <line x1="48.5" y1="4" x2="48.5" y2="38" stroke="#000" stroke-width="2"/>
      <line x1="48" y1="4" x2="48" y2="38" stroke="url(#zipperGrad)" stroke-width="1.8"/>
      <line x1="48" y1="4" x2="48" y2="38" stroke="#1a1a1a" stroke-width="0.55" stroke-dasharray="1.2,1.2"/>
      <rect x="45.5" y="5.5" width="5" height="6" rx="1.2" fill="url(#zipPull)" stroke="#000" stroke-width="0.4"/>
      <rect x="46.4" y="6.2" width="2.2" height="1.2" rx="0.4" fill="#ffffff" opacity="0.6"/>
      <circle cx="48" cy="12.2" r="1" fill="url(#zipPull)" stroke="#000" stroke-width="0.3"/>
      <path d="M62 12 L78 14" stroke="#000" stroke-width="1.1"/>
      <path d="M62 12 L78 14" stroke="#555" stroke-width="0.5"/>
      <rect x="76" y="13" width="3.5" height="2.3" rx="0.6" fill="url(#zipPull)" stroke="#000" stroke-width="0.3"/>
      <rect x="12" y="36" width="72" height="4" rx="1" fill="#090909" stroke="#2a2a2a" stroke-width="0.5"/>
      <rect x="12" y="36.3" width="72" height="0.8" fill="#4a4a4a" opacity="0.5"/>
      <rect x="42" y="35" width="12" height="6" rx="1.5" fill="url(#zipPull)" stroke="#000" stroke-width="0.5"/>
      <rect x="43" y="35.6" width="10" height="1" rx="0.5" fill="#e0e0e0" opacity="0.6"/>
      <rect x="45.5" y="36.5" width="5" height="3" rx="0.6" fill="#1a1a1a"/>
      <circle cx="48" cy="38" r="0.6" fill="#bbb"/>
      <rect x="5" y="3" width="10" height="3" rx="1" fill="#0f0f0f" stroke="#333" stroke-width="0.4"/>
      <circle cx="13" cy="4.5" r="1" fill="url(#studG)" stroke="#000" stroke-width="0.25"/>
      <circle cx="12.8" cy="4.2" r="0.3" fill="#ffffff" opacity="0.9"/>
      <rect x="81" y="3" width="10" height="3" rx="1" fill="#0f0f0f" stroke="#333" stroke-width="0.4"/>
      <circle cx="83" cy="4.5" r="1" fill="url(#studG)" stroke="#000" stroke-width="0.25"/>
      <circle cx="82.8" cy="4.2" r="0.3" fill="#ffffff" opacity="0.9"/>
      <circle cx="20" cy="18" r="0.6" fill="url(#studG)"/>
      <circle cx="20" cy="28" r="0.6" fill="url(#studG)"/>
      <circle cx="75" cy="22" r="0.6" fill="url(#studG)"/>
      <circle cx="75" cy="32" r="0.6" fill="url(#studG)"/>
      <circle cx="20" cy="18" r="0.2" fill="#fff" opacity="0.85"/>
      <circle cx="20" cy="28" r="0.2" fill="#fff" opacity="0.85"/>
      <circle cx="75" cy="22" r="0.2" fill="#fff" opacity="0.85"/>
      <circle cx="75" cy="32" r="0.2" fill="#fff" opacity="0.85"/>
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
        <linearGradient id="sweaterBody" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" style="stop-color:#f59e0b"/>
          <stop offset="35%" style="stop-color:#d97706"/>
          <stop offset="75%" style="stop-color:#b45309"/>
          <stop offset="100%" style="stop-color:#78350f"/>
        </linearGradient>
        <radialGradient id="sweaterHL" cx="30%" cy="20%" r="60%">
          <stop offset="0%" style="stop-color:#fde68a;stop-opacity:0.55"/>
          <stop offset="55%" style="stop-color:#fde68a;stop-opacity:0.08"/>
          <stop offset="100%" style="stop-color:#fde68a;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="sweaterEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#78350f;stop-opacity:0.7"/>
          <stop offset="40%" style="stop-color:#78350f;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="sweaterEdgeR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#78350f;stop-opacity:0.7"/>
          <stop offset="40%" style="stop-color:#78350f;stop-opacity:0"/>
        </linearGradient>
        <pattern id="cableKnit" x="0" y="0" width="10" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 4 Q2.5 0 5 4 Q7.5 8 10 4" stroke="#78350f" stroke-width="0.6" fill="none" opacity="0.65"/>
          <path d="M0 4 Q2.5 0 5 4 Q7.5 8 10 4" stroke="#fcd34d" stroke-width="0.35" fill="none" opacity="0.5" transform="translate(0,-0.45)"/>
          <circle cx="2.5" cy="2" r="0.18" fill="#fde68a" opacity="0.55"/>
          <circle cx="7.5" cy="6" r="0.18" fill="#fde68a" opacity="0.55"/>
        </pattern>
        <linearGradient id="neckRibG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#92400e"/>
          <stop offset="45%" style="stop-color:#d97706"/>
          <stop offset="100%" style="stop-color:#78350f"/>
        </linearGradient>
        <linearGradient id="hemRibG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#92400e"/>
          <stop offset="50%" style="stop-color:#b45309"/>
          <stop offset="100%" style="stop-color:#6b2e08"/>
        </linearGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#sweaterBody)" stroke="#78350f" stroke-width="0.8"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#cableKnit)" opacity="0.75"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#sweaterHL)"/>
      <path d="M4 2 L4 34 Q4 46 16 46 L22 46 L22 6" fill="url(#sweaterEdge)"/>
      <path d="M92 2 L92 34 Q92 46 80 46 L74 46 L74 6" fill="url(#sweaterEdgeR)"/>
      <path d="M42 2 Q44 10 42 18 Q40 26 42 34 Q44 42 42 44" stroke="#78350f" stroke-width="0.8" fill="none" opacity="0.85"/>
      <path d="M54 2 Q52 10 54 18 Q56 26 54 34 Q52 42 54 44" stroke="#78350f" stroke-width="0.8" fill="none" opacity="0.85"/>
      <path d="M42 2 Q44 10 42 18 Q40 26 42 34" stroke="#fcd34d" stroke-width="0.35" fill="none" opacity="0.6" transform="translate(-0.3,0)"/>
      <path d="M54 2 Q52 10 54 18 Q56 26 54 34" stroke="#fcd34d" stroke-width="0.35" fill="none" opacity="0.6" transform="translate(0.3,0)"/>
      <rect x="28" y="-6" width="40" height="10" rx="4" fill="url(#neckRibG)" stroke="#78350f" stroke-width="0.6"/>
      <line x1="32" y1="-5" x2="32" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="36" y1="-5" x2="36" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="40" y1="-5" x2="40" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="44" y1="-5" x2="44" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="48" y1="-5" x2="48" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="52" y1="-5" x2="52" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="56" y1="-5" x2="56" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="60" y1="-5" x2="60" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="64" y1="-5" x2="64" y2="3" stroke="#b45309" stroke-width="0.6"/>
      <line x1="34" y1="-5" x2="34" y2="3" stroke="#fcd34d" stroke-width="0.3" opacity="0.5"/>
      <line x1="42" y1="-5" x2="42" y2="3" stroke="#fcd34d" stroke-width="0.3" opacity="0.5"/>
      <line x1="54" y1="-5" x2="54" y2="3" stroke="#fcd34d" stroke-width="0.3" opacity="0.5"/>
      <line x1="62" y1="-5" x2="62" y2="3" stroke="#fcd34d" stroke-width="0.3" opacity="0.5"/>
      <path d="M28 -1 Q48 3 68 -1" stroke="#fcd34d" stroke-width="0.4" fill="none" opacity="0.5"/>
      <rect x="10" y="38" width="76" height="6" rx="1" fill="url(#hemRibG)"/>
      <rect x="10" y="38" width="76" height="1" fill="#fcd34d" opacity="0.35"/>
      <line x1="18" y1="38" x2="18" y2="44" stroke="#6b2e08" stroke-width="0.5"/>
      <line x1="26" y1="38" x2="26" y2="44" stroke="#6b2e08" stroke-width="0.5"/>
      <line x1="34" y1="38" x2="34" y2="44" stroke="#6b2e08" stroke-width="0.5"/>
      <line x1="42" y1="38" x2="42" y2="44" stroke="#6b2e08" stroke-width="0.5"/>
      <line x1="50" y1="38" x2="50" y2="44" stroke="#6b2e08" stroke-width="0.5"/>
      <line x1="58" y1="38" x2="58" y2="44" stroke="#6b2e08" stroke-width="0.5"/>
      <line x1="66" y1="38" x2="66" y2="44" stroke="#6b2e08" stroke-width="0.5"/>
      <line x1="74" y1="38" x2="74" y2="44" stroke="#6b2e08" stroke-width="0.5"/>
      <line x1="22" y1="38" x2="22" y2="44" stroke="#fcd34d" stroke-width="0.3" opacity="0.45"/>
      <line x1="38" y1="38" x2="38" y2="44" stroke="#fcd34d" stroke-width="0.3" opacity="0.45"/>
      <line x1="54" y1="38" x2="54" y2="44" stroke="#fcd34d" stroke-width="0.3" opacity="0.45"/>
      <line x1="70" y1="38" x2="70" y2="44" stroke="#fcd34d" stroke-width="0.3" opacity="0.45"/>
      <path d="M30 4 Q48 8 66 4" stroke="#fde68a" stroke-width="0.55" fill="none" opacity="0.55"/>
      <path d="M24 12 Q30 16 28 24" stroke="#78350f" stroke-width="0.35" fill="none" opacity="0.55" stroke-dasharray="1.2,1"/>
      <path d="M72 12 Q66 16 68 24" stroke="#78350f" stroke-width="0.35" fill="none" opacity="0.55" stroke-dasharray="1.2,1"/>
      <circle cx="20" cy="14" r="0.2" fill="#fde68a" opacity="0.55"/>
      <circle cx="26" cy="22" r="0.2" fill="#fde68a" opacity="0.55"/>
      <circle cx="70" cy="16" r="0.2" fill="#fde68a" opacity="0.55"/>
      <circle cx="78" cy="26" r="0.2" fill="#fde68a" opacity="0.55"/>
      <circle cx="34" cy="30" r="0.2" fill="#fde68a" opacity="0.5"/>
      <circle cx="62" cy="32" r="0.2" fill="#fde68a" opacity="0.5"/>
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
        <linearGradient id="tuxBody" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" style="stop-color:#1f1f1f"/>
          <stop offset="40%" style="stop-color:#0b0b0b"/>
          <stop offset="70%" style="stop-color:#000000"/>
          <stop offset="100%" style="stop-color:#141414"/>
        </linearGradient>
        <radialGradient id="tuxGloss" cx="32%" cy="22%" r="55%">
          <stop offset="0%" style="stop-color:#3a3a3a;stop-opacity:0.55"/>
          <stop offset="55%" style="stop-color:#1a1a1a;stop-opacity:0.08"/>
          <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="satinLapel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#5a5a5a"/>
          <stop offset="30%" style="stop-color:#2a2a2a"/>
          <stop offset="55%" style="stop-color:#0a0a0a"/>
          <stop offset="80%" style="stop-color:#2a2a2a"/>
          <stop offset="100%" style="stop-color:#5a5a5a"/>
        </linearGradient>
        <linearGradient id="lapelShineTux" x1="10%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" style="stop-color:#888;stop-opacity:0.6"/>
          <stop offset="100%" style="stop-color:#888;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="shirtG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff"/>
          <stop offset="55%" style="stop-color:#f5f5f5"/>
          <stop offset="100%" style="stop-color:#d4d4d4"/>
        </linearGradient>
        <radialGradient id="goldBtnTux" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="45%" style="stop-color:#fbbf24"/>
          <stop offset="100%" style="stop-color:#78350f"/>
        </radialGradient>
        <linearGradient id="bowG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a"/>
          <stop offset="45%" style="stop-color:#0a0a0a"/>
          <stop offset="100%" style="stop-color:#2a2a2a"/>
        </linearGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#tuxBody)" stroke="#000" stroke-width="0.8"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#tuxGloss)"/>
      <path d="M4 2 L4 34 Q4 46 16 46 L18 46 L18 6" fill="#000" opacity="0.4"/>
      <path d="M92 2 L92 34 Q92 46 80 46 L78 46 L78 6" fill="#000" opacity="0.4"/>
      <path d="M30 0 L46 30 L30 42 L24 36 L38 22 L30 0" fill="url(#satinLapel)" stroke="#000" stroke-width="0.5"/>
      <path d="M30 0 L38 16 L32 30 L28 26 L36 16 L30 0" fill="url(#lapelShineTux)" opacity="0.85"/>
      <path d="M66 0 L50 30 L66 42 L72 36 L58 22 L66 0" fill="url(#satinLapel)" stroke="#000" stroke-width="0.5"/>
      <path d="M66 0 L58 16 L64 30 L68 26 L60 16 L66 0" fill="url(#lapelShineTux)" opacity="0.7"/>
      <path d="M30 0 L46 30" stroke="#000" stroke-width="0.4"/>
      <path d="M66 0 L50 30" stroke="#000" stroke-width="0.4"/>
      <path d="M38 -2 L28 -5 L28 2 Z" fill="#0a0a0a" stroke="#333" stroke-width="0.3"/>
      <path d="M58 -2 L68 -5 L68 2 Z" fill="#0a0a0a" stroke="#333" stroke-width="0.3"/>
      <path d="M34 -4 L46 -2 L46 1 L34 3 Z" fill="url(#bowG)" stroke="#333" stroke-width="0.35"/>
      <path d="M62 -4 L50 -2 L50 1 L62 3 Z" fill="url(#bowG)" stroke="#333" stroke-width="0.35"/>
      <path d="M34 -3 L44 -1" stroke="#4a4a4a" stroke-width="0.3" opacity="0.7"/>
      <path d="M62 -3 L52 -1" stroke="#4a4a4a" stroke-width="0.3" opacity="0.7"/>
      <rect x="45.5" y="-3.5" width="5" height="4.5" rx="1" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.3"/>
      <rect x="46" y="-3" width="4" height="1" rx="0.3" fill="#4a4a4a" opacity="0.7"/>
      <path d="M38 0 L48 28 L58 0 Q48 4 38 0" fill="url(#shirtG)" stroke="#c0c0c0" stroke-width="0.3"/>
      <path d="M48 3 L48 26" stroke="#d4d4d4" stroke-width="0.4"/>
      <circle cx="48" cy="8" r="1.2" fill="url(#goldBtnTux)" stroke="#92400e" stroke-width="0.3"/>
      <circle cx="47.7" cy="7.7" r="0.35" fill="#fffbeb" opacity="0.9"/>
      <circle cx="48" cy="15" r="1.2" fill="url(#goldBtnTux)" stroke="#92400e" stroke-width="0.3"/>
      <circle cx="47.7" cy="14.7" r="0.35" fill="#fffbeb" opacity="0.9"/>
      <circle cx="48" cy="22" r="1.2" fill="url(#goldBtnTux)" stroke="#92400e" stroke-width="0.3"/>
      <circle cx="47.7" cy="21.7" r="0.35" fill="#fffbeb" opacity="0.9"/>
      <circle cx="48" cy="34" r="1.4" fill="#1a1a1a" stroke="#4a4a4a" stroke-width="0.4"/>
      <circle cx="47.7" cy="33.7" r="0.4" fill="#6a6a6a" opacity="0.85"/>
      <path d="M72 10 L76 7 L80 10 L78 14 L74 14 Z" fill="url(#shirtG)" stroke="#bfbfbf" stroke-width="0.3"/>
      <path d="M73 11 L76 9 L79 11" stroke="#d4d4d4" stroke-width="0.35" fill="none"/>
      <path d="M74 12 L76 11 L78 12.5" stroke="#d4d4d4" stroke-width="0.3" fill="none" opacity="0.7"/>
      <path d="M50 4 Q70 8 88 4" stroke="#2a2a2a" stroke-width="0.35" fill="none" opacity="0.55" stroke-dasharray="1,0.8"/>
      <path d="M8 4 Q28 8 46 4" stroke="#2a2a2a" stroke-width="0.35" fill="none" opacity="0.55" stroke-dasharray="1,0.8"/>
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
        <linearGradient id="bomberBody" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" style="stop-color:#0e8a66"/>
          <stop offset="40%" style="stop-color:#065f46"/>
          <stop offset="75%" style="stop-color:#03382a"/>
          <stop offset="100%" style="stop-color:#064e3b"/>
        </linearGradient>
        <radialGradient id="bomberHL" cx="30%" cy="20%" r="60%">
          <stop offset="0%" style="stop-color:#34d399;stop-opacity:0.38"/>
          <stop offset="55%" style="stop-color:#6ee7b7;stop-opacity:0.05"/>
          <stop offset="100%" style="stop-color:#6ee7b7;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="bomberEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#022c1f;stop-opacity:0.75"/>
          <stop offset="40%" style="stop-color:#022c1f;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="bomberEdgeR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#022c1f;stop-opacity:0.75"/>
          <stop offset="40%" style="stop-color:#022c1f;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="bomberRibG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#fb923c"/>
          <stop offset="35%" style="stop-color:#f97316"/>
          <stop offset="70%" style="stop-color:#c2410c"/>
          <stop offset="100%" style="stop-color:#9a3412"/>
        </linearGradient>
        <linearGradient id="zipSilver" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#444"/>
          <stop offset="48%" style="stop-color:#e8e8e8"/>
          <stop offset="55%" style="stop-color:#ffffff"/>
          <stop offset="100%" style="stop-color:#3a3a3a"/>
        </linearGradient>
        <radialGradient id="zipPullG" cx="35%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:#fde68a"/>
          <stop offset="50%" style="stop-color:#fbbf24"/>
          <stop offset="100%" style="stop-color:#78350f"/>
        </radialGradient>
        <linearGradient id="pocketB" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#03382a"/>
          <stop offset="50%" style="stop-color:#022c1f"/>
          <stop offset="100%" style="stop-color:#011f17"/>
        </linearGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#bomberBody)" stroke="#011f17" stroke-width="0.8"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#bomberHL)"/>
      <path d="M4 2 L4 34 Q4 46 16 46 L22 46 L22 6" fill="url(#bomberEdge)"/>
      <path d="M92 2 L92 34 Q92 46 80 46 L74 46 L74 6" fill="url(#bomberEdgeR)"/>
      <path d="M14 8 Q18 22 16 42" stroke="#6ee7b7" stroke-width="0.7" fill="none" opacity="0.3" stroke-linecap="round"/>
      <rect x="28" y="-4" width="40" height="8" rx="3" fill="url(#bomberRibG)" stroke="#7c2d12" stroke-width="0.5"/>
      <rect x="28" y="-4" width="40" height="1.4" fill="#fed7aa" opacity="0.5" rx="1.5"/>
      <line x1="32" y1="-3" x2="32" y2="3" stroke="#7c2d12" stroke-width="0.5"/>
      <line x1="37" y1="-3" x2="37" y2="3" stroke="#7c2d12" stroke-width="0.5"/>
      <line x1="42" y1="-3" x2="42" y2="3" stroke="#7c2d12" stroke-width="0.5"/>
      <line x1="48" y1="-3" x2="48" y2="3" stroke="#7c2d12" stroke-width="0.5"/>
      <line x1="54" y1="-3" x2="54" y2="3" stroke="#7c2d12" stroke-width="0.5"/>
      <line x1="59" y1="-3" x2="59" y2="3" stroke="#7c2d12" stroke-width="0.5"/>
      <line x1="64" y1="-3" x2="64" y2="3" stroke="#7c2d12" stroke-width="0.5"/>
      <line x1="34" y1="-3" x2="34" y2="3" stroke="#fed7aa" stroke-width="0.3" opacity="0.55"/>
      <line x1="44" y1="-3" x2="44" y2="3" stroke="#fed7aa" stroke-width="0.3" opacity="0.55"/>
      <line x1="56" y1="-3" x2="56" y2="3" stroke="#fed7aa" stroke-width="0.3" opacity="0.55"/>
      <rect x="10" y="38" width="76" height="6" rx="2" fill="url(#bomberRibG)" stroke="#7c2d12" stroke-width="0.5"/>
      <rect x="10" y="38" width="76" height="1.3" fill="#fed7aa" opacity="0.5" rx="1"/>
      <line x1="18" y1="38" x2="18" y2="44" stroke="#7c2d12" stroke-width="0.45"/>
      <line x1="26" y1="38" x2="26" y2="44" stroke="#7c2d12" stroke-width="0.45"/>
      <line x1="34" y1="38" x2="34" y2="44" stroke="#7c2d12" stroke-width="0.45"/>
      <line x1="42" y1="38" x2="42" y2="44" stroke="#7c2d12" stroke-width="0.45"/>
      <line x1="50" y1="38" x2="50" y2="44" stroke="#7c2d12" stroke-width="0.45"/>
      <line x1="58" y1="38" x2="58" y2="44" stroke="#7c2d12" stroke-width="0.45"/>
      <line x1="66" y1="38" x2="66" y2="44" stroke="#7c2d12" stroke-width="0.45"/>
      <line x1="74" y1="38" x2="74" y2="44" stroke="#7c2d12" stroke-width="0.45"/>
      <line x1="22" y1="38" x2="22" y2="44" stroke="#fed7aa" stroke-width="0.3" opacity="0.45"/>
      <line x1="38" y1="38" x2="38" y2="44" stroke="#fed7aa" stroke-width="0.3" opacity="0.45"/>
      <line x1="54" y1="38" x2="54" y2="44" stroke="#fed7aa" stroke-width="0.3" opacity="0.45"/>
      <line x1="70" y1="38" x2="70" y2="44" stroke="#fed7aa" stroke-width="0.3" opacity="0.45"/>
      <line x1="48.5" y1="5" x2="48.5" y2="38" stroke="#011f17" stroke-width="2.2"/>
      <line x1="48" y1="5" x2="48" y2="38" stroke="url(#zipSilver)" stroke-width="1.6"/>
      <line x1="48" y1="5" x2="48" y2="38" stroke="#1a1a1a" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
      <rect x="45.5" y="6" width="5" height="5.5" rx="1.2" fill="url(#zipPullG)" stroke="#7c2d12" stroke-width="0.3"/>
      <rect x="46" y="6.5" width="2" height="1" rx="0.3" fill="#fffbeb" opacity="0.75"/>
      <circle cx="48" cy="12.2" r="0.9" fill="url(#zipPullG)" stroke="#7c2d12" stroke-width="0.25"/>
      <rect x="62" y="14" width="14" height="11" rx="1.2" fill="url(#pocketB)" stroke="#022c1f" stroke-width="0.5"/>
      <rect x="62" y="14" width="14" height="2.5" rx="1" fill="#064e3b" opacity="0.8"/>
      <rect x="62" y="14" width="14" height="0.5" fill="#34d399" opacity="0.4"/>
      <line x1="65" y1="14" x2="65" y2="16.5" stroke="#011f17" stroke-width="0.4"/>
      <line x1="73" y1="14" x2="73" y2="16.5" stroke="#011f17" stroke-width="0.4"/>
      <circle cx="69" cy="15.3" r="0.6" fill="url(#zipPullG)" stroke="#7c2d12" stroke-width="0.2"/>
      <circle cx="68.8" cy="15.1" r="0.2" fill="#fffbeb" opacity="0.9"/>
      <rect x="7" y="10" width="9" height="7" rx="1" fill="url(#pocketB)" stroke="#022c1f" stroke-width="0.4"/>
      <rect x="7" y="10" width="9" height="1.6" fill="#064e3b" opacity="0.8"/>
      <rect x="10" y="11.8" width="3" height="3.5" rx="0.5" fill="#03382a" stroke="#022c1f" stroke-width="0.25"/>
      <circle cx="11.5" cy="13.5" r="0.35" fill="url(#zipPullG)"/>
      <path d="M22 10 Q28 16 26 24" stroke="#fed7aa" stroke-width="0.3" fill="none" opacity="0.4" stroke-dasharray="1,0.8"/>
      <path d="M74 10 Q68 16 70 24" stroke="#fed7aa" stroke-width="0.3" fill="none" opacity="0.4" stroke-dasharray="1,0.8"/>
      <path d="M28 4.5 Q48 7 68 4.5" stroke="#fed7aa" stroke-width="0.3" fill="none" opacity="0.35" stroke-dasharray="1,0.8"/>
      <circle cx="20" cy="20" r="0.18" fill="#6ee7b7" opacity="0.4"/>
      <circle cx="32" cy="22" r="0.18" fill="#6ee7b7" opacity="0.4"/>
      <circle cx="78" cy="30" r="0.18" fill="#6ee7b7" opacity="0.4"/>
      <circle cx="82" cy="20" r="0.18" fill="#6ee7b7" opacity="0.4"/>
      <circle cx="16" cy="32" r="0.18" fill="#6ee7b7" opacity="0.4"/>
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
          <circle cx="9" cy="9" r="2.6" fill="#f9a8d4" opacity="0.55"/>
          <circle cx="9" cy="9" r="1.6" fill="#fcd34d"/>
          <circle cx="9" cy="4" r="2.2" fill="#fb7185"/>
          <circle cx="9" cy="4" r="1.2" fill="#fda4af" opacity="0.6"/>
          <circle cx="9" cy="14" r="2.2" fill="#fb7185"/>
          <circle cx="9" cy="14" r="1.2" fill="#fda4af" opacity="0.6"/>
          <circle cx="4" cy="9" r="2.2" fill="#fb7185"/>
          <circle cx="4" cy="9" r="1.2" fill="#fda4af" opacity="0.6"/>
          <circle cx="14" cy="9" r="2.2" fill="#fb7185"/>
          <circle cx="14" cy="9" r="1.2" fill="#fda4af" opacity="0.6"/>
          <path d="M2 3 Q5 2 3 5" stroke="#16a34a" stroke-width="0.7" fill="none"/>
          <path d="M2 3 Q5 2 3 5" stroke="#86efac" stroke-width="0.3" fill="none" opacity="0.7"/>
          <path d="M14 14 Q16 13 15 16" stroke="#16a34a" stroke-width="0.7" fill="none"/>
          <path d="M14 14 Q16 13 15 16" stroke="#86efac" stroke-width="0.3" fill="none" opacity="0.7"/>
        </pattern>
        <radialGradient id="hawaiiHL" cx="30%" cy="20%" r="60%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.45"/>
          <stop offset="55%" style="stop-color:#ffffff;stop-opacity:0.06"/>
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="hawaiiEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#172554;stop-opacity:0.55"/>
          <stop offset="40%" style="stop-color:#172554;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="hawaiiEdgeR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#172554;stop-opacity:0.55"/>
          <stop offset="40%" style="stop-color:#172554;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="collarHawG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2563eb"/>
          <stop offset="100%" style="stop-color:#172554"/>
        </linearGradient>
        <radialGradient id="coconutBtn" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#a16207"/>
          <stop offset="50%" style="stop-color:#6b3410"/>
          <stop offset="100%" style="stop-color:#2d1608"/>
        </radialGradient>
      </defs>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#tropicalFlower)" stroke="#172554" stroke-width="0.7"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#hawaiiHL)"/>
      <path d="M4 2 L4 34 Q4 46 16 46 L22 46 L22 6" fill="url(#hawaiiEdge)"/>
      <path d="M92 2 L92 34 Q92 46 80 46 L74 46 L74 6" fill="url(#hawaiiEdgeR)"/>
      <path d="M34 0 Q48 5 62 0 L60 -4 Q48 0 36 -4 Z" fill="url(#collarHawG)" stroke="#172554" stroke-width="0.4"/>
      <path d="M36 -2 Q48 2 60 -2" stroke="#60a5fa" stroke-width="0.35" fill="none" opacity="0.7"/>
      <path d="M42 -3 L46 1 Q48 1.5 50 1 L54 -3" stroke="#172554" stroke-width="0.5" fill="none" opacity="0.85"/>
      <rect x="46" y="2" width="4" height="38" fill="#172554" opacity="0.55"/>
      <rect x="46" y="2" width="1" height="38" fill="#60a5fa" opacity="0.45"/>
      <rect x="49" y="2" width="1" height="38" fill="#0b1636" opacity="0.6"/>
      <circle cx="48" cy="10" r="2" fill="url(#coconutBtn)" stroke="#2d1608" stroke-width="0.4"/>
      <circle cx="47.3" cy="9.3" r="0.55" fill="#d97706" opacity="0.85"/>
      <circle cx="47.5" cy="10" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <circle cx="48.3" cy="10" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <circle cx="47.9" cy="10.4" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <circle cx="48" cy="22" r="2" fill="url(#coconutBtn)" stroke="#2d1608" stroke-width="0.4"/>
      <circle cx="47.3" cy="21.3" r="0.55" fill="#d97706" opacity="0.85"/>
      <circle cx="47.5" cy="22" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <circle cx="48.3" cy="22" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <circle cx="47.9" cy="22.4" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <circle cx="48" cy="34" r="2" fill="url(#coconutBtn)" stroke="#2d1608" stroke-width="0.4"/>
      <circle cx="47.3" cy="33.3" r="0.55" fill="#d97706" opacity="0.85"/>
      <circle cx="47.5" cy="34" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <circle cx="48.3" cy="34" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <circle cx="47.9" cy="34.4" r="0.25" fill="#1a0c04" opacity="0.9"/>
      <rect x="60" y="8" width="12" height="9" rx="1" fill="url(#tropicalFlower)" stroke="#172554" stroke-width="0.5"/>
      <rect x="60" y="8" width="12" height="9" rx="1" fill="#172554" opacity="0.18"/>
      <path d="M60 8 L72 8" stroke="#172554" stroke-width="0.6"/>
      <path d="M61 9 L71 9" stroke="#60a5fa" stroke-width="0.25" opacity="0.6"/>
      <path d="M12 42 Q48 45 84 42" stroke="#172554" stroke-width="0.5" fill="none"/>
      <path d="M12 42.6 Q48 45.6 84 42.6" stroke="#60a5fa" stroke-width="0.25" fill="none" opacity="0.55" stroke-dasharray="1.5,1"/>
      <line x1="8" y1="16" x2="12" y2="16" stroke="#ffffff" stroke-width="0.2" opacity="0.25"/>
      <line x1="82" y1="26" x2="86" y2="26" stroke="#ffffff" stroke-width="0.2" opacity="0.25"/>
      <line x1="18" y1="32" x2="22" y2="32" stroke="#ffffff" stroke-width="0.2" opacity="0.25"/>
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
        <linearGradient id="cardiganBody" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" style="stop-color:#d6cfc7"/>
          <stop offset="35%" style="stop-color:#a8a29e"/>
          <stop offset="75%" style="stop-color:#78716c"/>
          <stop offset="100%" style="stop-color:#52504c"/>
        </linearGradient>
        <radialGradient id="cardiganHL" cx="30%" cy="22%" r="60%">
          <stop offset="0%" style="stop-color:#fafaf9;stop-opacity:0.55"/>
          <stop offset="55%" style="stop-color:#e7e5e4;stop-opacity:0.08"/>
          <stop offset="100%" style="stop-color:#e7e5e4;stop-opacity:0"/>
        </radialGradient>
        <radialGradient id="goldBtnCard" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#fffbeb"/>
          <stop offset="35%" style="stop-color:#fde68a"/>
          <stop offset="70%" style="stop-color:#f59e0b"/>
          <stop offset="100%" style="stop-color:#78350f"/>
        </radialGradient>
        <pattern id="cardiganRib" x="0" y="0" width="3" height="6" patternUnits="userSpaceOnUse">
          <line x1="1.5" y1="0" x2="1.5" y2="6" stroke="#57534e" stroke-width="0.7"/>
          <line x1="1.8" y1="0" x2="1.8" y2="6" stroke="#e7e5e4" stroke-width="0.2" opacity="0.5"/>
        </pattern>
        <pattern id="chunkyKnit" x="0" y="0" width="6" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 4 Q1.5 0 3 4 Q4.5 8 6 4" stroke="#57534e" stroke-width="0.5" fill="none" opacity="0.6"/>
          <path d="M0 4 Q1.5 0 3 4 Q4.5 8 6 4" stroke="#e7e5e4" stroke-width="0.25" fill="none" opacity="0.55" transform="translate(0,-0.3)"/>
        </pattern>
        <linearGradient id="collarCardG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#a8a29e"/>
          <stop offset="50%" style="stop-color:#78716c"/>
          <stop offset="100%" style="stop-color:#52504c"/>
        </linearGradient>
        <linearGradient id="pocketCardG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#9a948f"/>
          <stop offset="50%" style="stop-color:#78716c"/>
          <stop offset="100%" style="stop-color:#57534e"/>
        </linearGradient>
      </defs>
      <path d="M6 0 L48 4 L48 46 L16 46 Q6 46 6 36 Z" fill="url(#cardiganBody)" stroke="#44403c" stroke-width="0.6"/>
      <path d="M90 0 L48 4 L48 46 L80 46 Q90 46 90 36 Z" fill="url(#cardiganBody)" stroke="#44403c" stroke-width="0.6"/>
      <path d="M6 0 L48 4 L48 46 L16 46 Q6 46 6 36 Z" fill="url(#chunkyKnit)" opacity="0.75"/>
      <path d="M90 0 L48 4 L48 46 L80 46 Q90 46 90 36 Z" fill="url(#chunkyKnit)" opacity="0.75"/>
      <path d="M4 2 Q48 8 92 2 L92 34 Q92 46 80 46 L16 46 Q4 46 4 34 Z" fill="url(#cardiganHL)"/>
      <line x1="48" y1="4" x2="48" y2="46" stroke="#44403c" stroke-width="1"/>
      <line x1="47.3" y1="4" x2="47.3" y2="46" stroke="#57534e" stroke-width="0.4" opacity="0.7"/>
      <line x1="48.7" y1="4" x2="48.7" y2="46" stroke="#57534e" stroke-width="0.4" opacity="0.7"/>
      <path d="M20 4 Q22 12 20 20 Q18 28 20 36 Q22 42 20 46" stroke="#57534e" stroke-width="0.7" fill="none" opacity="0.85"/>
      <path d="M20 4 Q22 12 20 20 Q18 28 20 36 Q22 42 20 46" stroke="#e7e5e4" stroke-width="0.3" fill="none" opacity="0.55" transform="translate(-0.3,0)"/>
      <path d="M76 4 Q74 12 76 20 Q78 28 76 36 Q74 42 76 46" stroke="#57534e" stroke-width="0.7" fill="none" opacity="0.85"/>
      <path d="M76 4 Q74 12 76 20 Q78 28 76 36 Q74 42 76 46" stroke="#e7e5e4" stroke-width="0.3" fill="none" opacity="0.55" transform="translate(0.3,0)"/>
      <path d="M30 -2 Q48 6 66 -2 Q58 3 48 3 Q38 3 30 -2" fill="url(#collarCardG)" stroke="#44403c" stroke-width="0.5"/>
      <path d="M30 -1 Q48 5 66 -1" stroke="#e7e5e4" stroke-width="0.3" fill="none" opacity="0.55"/>
      <path d="M32 0 Q48 5 64 0" stroke="#44403c" stroke-width="0.4" fill="none"/>
      <rect x="12" y="38" width="72" height="6" rx="1" fill="#52504c"/>
      <rect x="12" y="38" width="72" height="6" fill="url(#cardiganRib)" opacity="0.85"/>
      <rect x="12" y="38" width="72" height="0.8" fill="#e7e5e4" opacity="0.45"/>
      <circle cx="44" cy="10" r="2.5" fill="url(#goldBtnCard)" stroke="#78350f" stroke-width="0.4"/>
      <circle cx="43.2" cy="9.3" r="0.75" fill="#fffbeb" opacity="0.9"/>
      <circle cx="44" cy="10" r="0.6" fill="#78350f" opacity="0.55"/>
      <circle cx="44" cy="22" r="2.5" fill="url(#goldBtnCard)" stroke="#78350f" stroke-width="0.4"/>
      <circle cx="43.2" cy="21.3" r="0.75" fill="#fffbeb" opacity="0.9"/>
      <circle cx="44" cy="22" r="0.6" fill="#78350f" opacity="0.55"/>
      <circle cx="44" cy="34" r="2.5" fill="url(#goldBtnCard)" stroke="#78350f" stroke-width="0.4"/>
      <circle cx="43.2" cy="33.3" r="0.75" fill="#fffbeb" opacity="0.9"/>
      <circle cx="44" cy="34" r="0.6" fill="#78350f" opacity="0.55"/>
      <rect x="16" y="22" width="14" height="12" rx="1.5" fill="url(#pocketCardG)" stroke="#44403c" stroke-width="0.5"/>
      <rect x="16" y="22" width="14" height="12" rx="1.5" fill="url(#chunkyKnit)" opacity="0.55"/>
      <path d="M16 22 L30 22" stroke="#44403c" stroke-width="0.7"/>
      <path d="M16 22.6 L30 22.6" stroke="#e7e5e4" stroke-width="0.3" opacity="0.55"/>
      <rect x="66" y="22" width="14" height="12" rx="1.5" fill="url(#pocketCardG)" stroke="#44403c" stroke-width="0.5"/>
      <rect x="66" y="22" width="14" height="12" rx="1.5" fill="url(#chunkyKnit)" opacity="0.55"/>
      <path d="M66 22 L80 22" stroke="#44403c" stroke-width="0.7"/>
      <path d="M66 22.6 L80 22.6" stroke="#e7e5e4" stroke-width="0.3" opacity="0.55"/>
      <path d="M20 8 Q26 12 24 18" stroke="#57534e" stroke-width="0.3" fill="none" opacity="0.55" stroke-dasharray="1.2,1"/>
      <path d="M76 8 Q70 12 72 18" stroke="#57534e" stroke-width="0.3" fill="none" opacity="0.55" stroke-dasharray="1.2,1"/>
      <circle cx="10" cy="16" r="0.2" fill="#fafaf9" opacity="0.55"/>
      <circle cx="86" cy="20" r="0.2" fill="#fafaf9" opacity="0.55"/>
      <circle cx="14" cy="28" r="0.2" fill="#fafaf9" opacity="0.55"/>
      <circle cx="82" cy="32" r="0.2" fill="#fafaf9" opacity="0.55"/>
      <circle cx="38" cy="38" r="0.2" fill="#fafaf9" opacity="0.45"/>
      <circle cx="58" cy="16" r="0.2" fill="#fafaf9" opacity="0.45"/>
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
        <linearGradient id="ponchoMain" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" style="stop-color:#ea580c"/>
          <stop offset="35%" style="stop-color:#c2410c"/>
          <stop offset="75%" style="stop-color:#7c2d12"/>
          <stop offset="100%" style="stop-color:#431407"/>
        </linearGradient>
        <radialGradient id="ponchoHL" cx="30%" cy="20%" r="60%">
          <stop offset="0%" style="stop-color:#fed7aa;stop-opacity:0.45"/>
          <stop offset="55%" style="stop-color:#fed7aa;stop-opacity:0.06"/>
          <stop offset="100%" style="stop-color:#fed7aa;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="ponchoEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#431407;stop-opacity:0.65"/>
          <stop offset="35%" style="stop-color:#431407;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="ponchoEdgeR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#431407;stop-opacity:0.65"/>
          <stop offset="35%" style="stop-color:#431407;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="ponchoGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#fbbf24"/>
          <stop offset="50%" style="stop-color:#f59e0b"/>
          <stop offset="100%" style="stop-color:#b45309"/>
        </linearGradient>
        <linearGradient id="ponchoGreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#a3e635"/>
          <stop offset="50%" style="stop-color:#65a30d"/>
          <stop offset="100%" style="stop-color:#3f6212"/>
        </linearGradient>
        <pattern id="weaveTex" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="4" y2="2" stroke="#431407" stroke-width="0.3" opacity="0.55"/>
          <line x1="2" y1="0" x2="2" y2="4" stroke="#431407" stroke-width="0.2" opacity="0.55"/>
          <circle cx="1" cy="1" r="0.15" fill="#fed7aa" opacity="0.3"/>
          <circle cx="3" cy="3" r="0.15" fill="#fed7aa" opacity="0.3"/>
        </pattern>
        <radialGradient id="tasselG" cx="50%" cy="20%" r="60%">
          <stop offset="0%" style="stop-color:#c2410c"/>
          <stop offset="100%" style="stop-color:#431407"/>
        </radialGradient>
        <radialGradient id="neckRope" cx="40%" cy="40%" r="60%">
          <stop offset="0%" style="stop-color:#fbbf24"/>
          <stop offset="55%" style="stop-color:#d97706"/>
          <stop offset="100%" style="stop-color:#7c2d12"/>
        </radialGradient>
      </defs>
      <path d="M0 0 Q48 8 96 0 L96 34 Q96 46 84 46 L12 46 Q0 46 0 34 Z" fill="url(#ponchoMain)" stroke="#431407" stroke-width="0.7"/>
      <path d="M0 0 Q48 8 96 0 L96 34 Q96 46 84 46 L12 46 Q0 46 0 34 Z" fill="url(#weaveTex)" opacity="0.55"/>
      <path d="M0 0 Q48 8 96 0 L96 34 Q96 46 84 46 L12 46 Q0 46 0 34 Z" fill="url(#ponchoHL)"/>
      <path d="M0 0 L0 34 Q0 46 12 46 L18 46 L18 4" fill="url(#ponchoEdge)"/>
      <path d="M96 0 L96 34 Q96 46 84 46 L78 46 L78 4" fill="url(#ponchoEdgeR)"/>
      <path d="M4 10 Q48 16 92 10 L94 18 Q48 24 2 18 Z" fill="url(#ponchoGold)"/>
      <path d="M4 10 Q48 16 92 10 L94 11.5 Q48 17.5 2 11.5 Z" fill="#fef3c7" opacity="0.5"/>
      <path d="M4 17.2 Q48 23 92 17.2 L94 18 Q48 24 2 18 Z" fill="#7c2d12" opacity="0.55"/>
      <path d="M10 13 Q48 18 86 13" stroke="#7c2d12" stroke-width="0.5" fill="none" stroke-dasharray="3,2"/>
      <path d="M14 14 L16 13 L18 14 L16 15 Z" fill="#7c2d12"/>
      <path d="M28 14 L30 13 L32 14 L30 15 Z" fill="#7c2d12"/>
      <path d="M42 14 L44 13 L46 14 L44 15 Z" fill="#7c2d12"/>
      <path d="M50 14 L52 13 L54 14 L52 15 Z" fill="#7c2d12"/>
      <path d="M64 14 L66 13 L68 14 L66 15 Z" fill="#7c2d12"/>
      <path d="M78 14 L80 13 L82 14 L80 15 Z" fill="#7c2d12"/>
      <path d="M2 26 Q48 32 94 26 L96 34 Q48 40 0 34 Z" fill="url(#ponchoGreen)"/>
      <path d="M2 26 Q48 32 94 26 L96 27.5 Q48 33.5 0 27.5 Z" fill="#d9f99d" opacity="0.5"/>
      <path d="M2 33.2 Q48 39 94 33.2 L96 34 Q48 40 0 34 Z" fill="#3f6212" opacity="0.6"/>
      <path d="M10 30 L14 32 L18 30 L22 32 L26 30 L30 32 L34 30 L38 32 L42 30 L46 32 L50 30 L54 32 L58 30 L62 32 L66 30 L70 32 L74 30 L78 32 L82 30 L86 32" stroke="#fed7aa" stroke-width="0.7" fill="none"/>
      <path d="M10 30 L14 32 L18 30 L22 32 L26 30 L30 32 L34 30 L38 32 L42 30 L46 32 L50 30 L54 32 L58 30 L62 32 L66 30 L70 32 L74 30 L78 32 L82 30 L86 32" stroke="#7c2d12" stroke-width="0.3" fill="none" opacity="0.85" transform="translate(0,0.4)"/>
      <line x1="10" y1="45" x2="10" y2="50" stroke="url(#tasselG)" stroke-width="1.3"/>
      <line x1="9.7" y1="45" x2="9.7" y2="50" stroke="#fed7aa" stroke-width="0.25" opacity="0.5"/>
      <circle cx="10" cy="45" r="0.6" fill="url(#ponchoGold)"/>
      <line x1="18" y1="46" x2="18" y2="50" stroke="url(#tasselG)" stroke-width="1.1"/>
      <line x1="17.8" y1="46" x2="17.8" y2="50" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <line x1="26" y1="46" x2="26" y2="50" stroke="url(#tasselG)" stroke-width="1.1"/>
      <line x1="25.8" y1="46" x2="25.8" y2="50" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <line x1="34" y1="46" x2="34" y2="50" stroke="url(#tasselG)" stroke-width="1.1"/>
      <line x1="33.8" y1="46" x2="33.8" y2="50" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <line x1="42" y1="46" x2="42" y2="50" stroke="url(#tasselG)" stroke-width="1.1"/>
      <line x1="41.8" y1="46" x2="41.8" y2="50" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <line x1="54" y1="46" x2="54" y2="50" stroke="url(#tasselG)" stroke-width="1.1"/>
      <line x1="53.8" y1="46" x2="53.8" y2="50" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <line x1="62" y1="46" x2="62" y2="50" stroke="url(#tasselG)" stroke-width="1.1"/>
      <line x1="61.8" y1="46" x2="61.8" y2="50" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <line x1="70" y1="46" x2="70" y2="50" stroke="url(#tasselG)" stroke-width="1.1"/>
      <line x1="69.8" y1="46" x2="69.8" y2="50" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <line x1="78" y1="46" x2="78" y2="50" stroke="url(#tasselG)" stroke-width="1.1"/>
      <line x1="77.8" y1="46" x2="77.8" y2="50" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <line x1="86" y1="45" x2="86" y2="50" stroke="url(#tasselG)" stroke-width="1.3"/>
      <line x1="85.7" y1="45" x2="85.7" y2="50" stroke="#fed7aa" stroke-width="0.25" opacity="0.5"/>
      <circle cx="86" cy="45" r="0.6" fill="url(#ponchoGold)"/>
      <ellipse cx="48" cy="0" rx="10" ry="3" fill="#3b1508" stroke="#7c2d12" stroke-width="0.4"/>
      <ellipse cx="48" cy="0" rx="9" ry="2.2" fill="none" stroke="#fed7aa" stroke-width="0.3" opacity="0.55" stroke-dasharray="1.5,1"/>
      <circle cx="48" cy="4" r="2" fill="url(#neckRope)" stroke="#7c2d12" stroke-width="0.4"/>
      <circle cx="47.5" cy="3.5" r="0.55" fill="#fef3c7" opacity="0.85"/>
      <line x1="48" y1="6" x2="48" y2="10" stroke="url(#tasselG)" stroke-width="0.9"/>
      <line x1="47.8" y1="6" x2="47.8" y2="10" stroke="#fed7aa" stroke-width="0.2" opacity="0.5"/>
      <path d="M10 6 L14 8 L10 10" stroke="#fed7aa" stroke-width="0.35" fill="none" opacity="0.55"/>
      <path d="M82 6 L86 8 L82 10" stroke="#fed7aa" stroke-width="0.35" fill="none" opacity="0.55"/>
      <path d="M10 38 L14 40 L10 42" stroke="#fed7aa" stroke-width="0.35" fill="none" opacity="0.55"/>
      <path d="M82 38 L86 40 L82 42" stroke="#fed7aa" stroke-width="0.35" fill="none" opacity="0.55"/>
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
        <linearGradient id="lensGradWF" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2a"/>
          <stop offset="45%" style="stop-color:#050505"/>
          <stop offset="100%" style="stop-color:#1f1f1f"/>
        </linearGradient>
        <linearGradient id="lensShineWF" x1="10%" y1="0%" x2="40%" y2="80%">
          <stop offset="0%" style="stop-color:#6e6e6e;stop-opacity:0.85"/>
          <stop offset="60%" style="stop-color:#3a3a3a;stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="frameGradWF" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2a"/>
          <stop offset="50%" style="stop-color:#090909"/>
          <stop offset="100%" style="stop-color:#000"/>
        </linearGradient>
        <radialGradient id="hingeWF" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#b8b8b8"/>
          <stop offset="55%" style="stop-color:#666"/>
          <stop offset="100%" style="stop-color:#1f1f1f"/>
        </radialGradient>
      </defs>
      <rect x="17" y="3" width="20" height="14" rx="3" fill="url(#lensGradWF)" stroke="#000" stroke-width="1.5"/>
      <rect x="18" y="4" width="18" height="12" rx="2.4" fill="url(#lensShineWF)"/>
      <rect x="19" y="4.5" width="7" height="4" rx="1.2" fill="#fafafa" opacity="0.35"/>
      <rect x="20" y="5" width="3" height="1.5" rx="0.6" fill="#fff" opacity="0.55"/>
      <rect x="55" y="3" width="20" height="14" rx="3" fill="url(#lensGradWF)" stroke="#000" stroke-width="1.5"/>
      <rect x="56" y="4" width="18" height="12" rx="2.4" fill="url(#lensShineWF)"/>
      <rect x="57" y="4.5" width="7" height="4" rx="1.2" fill="#fafafa" opacity="0.35"/>
      <rect x="58" y="5" width="3" height="1.5" rx="0.6" fill="#fff" opacity="0.55"/>
      <path d="M37 8 Q48 12 55 8" stroke="url(#frameGradWF)" stroke-width="2.5" fill="none"/>
      <path d="M37 7.3 Q48 11 55 7.3" stroke="#4a4a4a" stroke-width="0.4" fill="none" opacity="0.75"/>
      <rect x="17" y="2" width="20" height="3" rx="1" fill="url(#frameGradWF)"/>
      <rect x="55" y="2" width="20" height="3" rx="1" fill="url(#frameGradWF)"/>
      <rect x="18" y="2.3" width="18" height="0.7" rx="0.4" fill="#5a5a5a" opacity="0.55"/>
      <rect x="56" y="2.3" width="18" height="0.7" rx="0.4" fill="#5a5a5a" opacity="0.55"/>
      <line x1="17" y1="8" x2="6" y2="7" stroke="url(#frameGradWF)" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="75" y1="8" x2="90" y2="7" stroke="url(#frameGradWF)" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="15" y1="7.6" x2="8" y2="6.8" stroke="#4a4a4a" stroke-width="0.5" opacity="0.7"/>
      <line x1="77" y1="7.6" x2="88" y2="6.8" stroke="#4a4a4a" stroke-width="0.5" opacity="0.7"/>
      <circle cx="17" cy="8" r="1.4" fill="url(#hingeWF)" stroke="#000" stroke-width="0.3"/>
      <circle cx="16.7" cy="7.7" r="0.4" fill="#f0f0f0" opacity="0.85"/>
      <circle cx="75" cy="8" r="1.4" fill="url(#hingeWF)" stroke="#000" stroke-width="0.3"/>
      <circle cx="74.7" cy="7.7" r="0.4" fill="#f0f0f0" opacity="0.85"/>
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
        <linearGradient id="capBodyG" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6"/>
          <stop offset="40%" style="stop-color:#1e40af"/>
          <stop offset="100%" style="stop-color:#172554"/>
        </linearGradient>
        <radialGradient id="capHL" cx="30%" cy="25%" r="55%">
          <stop offset="0%" style="stop-color:#93c5fd;stop-opacity:0.55"/>
          <stop offset="60%" style="stop-color:#60a5fa;stop-opacity:0.08"/>
          <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:0"/>
        </radialGradient>
        <linearGradient id="visorG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2563eb"/>
          <stop offset="55%" style="stop-color:#1d4ed8"/>
          <stop offset="100%" style="stop-color:#1e3a8a"/>
        </linearGradient>
        <linearGradient id="visorHL" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#bfdbfe;stop-opacity:0.55"/>
          <stop offset="100%" style="stop-color:#bfdbfe;stop-opacity:0"/>
        </linearGradient>
        <radialGradient id="capButton" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#60a5fa"/>
          <stop offset="55%" style="stop-color:#1e40af"/>
          <stop offset="100%" style="stop-color:#0b1636"/>
        </radialGradient>
      </defs>
      <path d="M14 24 Q14 4 48 2 Q82 4 82 24" fill="url(#capBodyG)" stroke="#172554" stroke-width="1"/>
      <path d="M14 24 Q14 4 48 2 Q82 4 82 24" fill="url(#capHL)"/>
      <path d="M48 3 L48 24" stroke="#172554" stroke-width="0.5" opacity="0.7"/>
      <path d="M28 6 Q30 14 30 23" stroke="#172554" stroke-width="0.35" fill="none" opacity="0.55"/>
      <path d="M68 6 Q66 14 66 23" stroke="#172554" stroke-width="0.35" fill="none" opacity="0.55"/>
      <circle cx="48" cy="3" r="2.5" fill="url(#capButton)" stroke="#0b1636" stroke-width="0.4"/>
      <circle cx="47.3" cy="2.3" r="0.8" fill="#bfdbfe" opacity="0.85"/>
      <path d="M14 24 Q48 28 82 24 L88 29 Q48 36 8 29 Z" fill="url(#visorG)" stroke="#172554" stroke-width="0.8"/>
      <path d="M14 24 Q48 27.5 82 24 L85 26.5 Q48 30 11 26.5 Z" fill="url(#visorHL)"/>
      <path d="M14 26 Q48 30 82 26" stroke="#93c5fd" stroke-width="0.5" stroke-dasharray="2,2" fill="none"/>
      <path d="M12 28 Q48 32 84 28" stroke="#172554" stroke-width="0.35" stroke-dasharray="1.5,1" fill="none" opacity="0.7"/>
      <circle cx="24" cy="12" r="0.4" fill="#172554" opacity="0.6"/>
      <circle cx="72" cy="12" r="0.4" fill="#172554" opacity="0.6"/>
      <circle cx="36" cy="8" r="0.4" fill="#172554" opacity="0.6"/>
      <circle cx="60" cy="8" r="0.4" fill="#172554" opacity="0.6"/>
    </svg>`
  },
  {
    id: 'earrings-hoop',
    name: 'Orecchini Cerchio',
    category: 'accessories',
    position: 'head',
    zIndex: 10020,
    svg: `<svg viewBox="0 0 96 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGradEar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="30%" style="stop-color:#fcd34d"/>
          <stop offset="65%" style="stop-color:#f59e0b"/>
          <stop offset="100%" style="stop-color:#92400e"/>
        </linearGradient>
        <radialGradient id="pearlEarR" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#ffffff"/>
          <stop offset="55%" style="stop-color:#fef3c7"/>
          <stop offset="100%" style="stop-color:#d97706"/>
        </radialGradient>
      </defs>
      <circle cx="5" cy="14" r="6" stroke="url(#goldGradEar)" stroke-width="2.5" fill="none"/>
      <circle cx="4.65" cy="13.65" r="6" stroke="#fef3c7" stroke-width="0.6" fill="none" opacity="0.55"/>
      <circle cx="5.3" cy="14.3" r="6" stroke="#78350f" stroke-width="0.4" fill="none" opacity="0.6"/>
      <circle cx="5" cy="8" r="1" fill="url(#pearlEarR)" stroke="#92400e" stroke-width="0.3"/>
      <circle cx="4.7" cy="7.7" r="0.3" fill="#fff" opacity="0.9"/>
      <circle cx="91" cy="14" r="6" stroke="url(#goldGradEar)" stroke-width="2.5" fill="none"/>
      <circle cx="90.65" cy="13.65" r="6" stroke="#fef3c7" stroke-width="0.6" fill="none" opacity="0.55"/>
      <circle cx="91.3" cy="14.3" r="6" stroke="#78350f" stroke-width="0.4" fill="none" opacity="0.6"/>
      <circle cx="91" cy="8" r="1" fill="url(#pearlEarR)" stroke="#92400e" stroke-width="0.3"/>
      <circle cx="90.7" cy="7.7" r="0.3" fill="#fff" opacity="0.9"/>
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
        <linearGradient id="chainGradNK" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#6b6b6b"/>
          <stop offset="25%" style="stop-color:#e0e0e0"/>
          <stop offset="50%" style="stop-color:#ffffff"/>
          <stop offset="75%" style="stop-color:#e0e0e0"/>
          <stop offset="100%" style="stop-color:#6b6b6b"/>
        </linearGradient>
        <radialGradient id="pendantBezelNK" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#e8e8e8"/>
          <stop offset="55%" style="stop-color:#a0a0a0"/>
          <stop offset="100%" style="stop-color:#404040"/>
        </radialGradient>
        <radialGradient id="pendantGemNK" cx="35%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:#dbeafe"/>
          <stop offset="40%" style="stop-color:#60a5fa"/>
          <stop offset="75%" style="stop-color:#2563eb"/>
          <stop offset="100%" style="stop-color:#1e3a8a"/>
        </radialGradient>
      </defs>
      <path d="M28 0 Q48 22 68 0" stroke="url(#chainGradNK)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M28 0 Q48 22 68 0" stroke="#0f0f0f" stroke-width="0.5" fill="none" stroke-dasharray="1.5,1.2" opacity="0.7"/>
      <path d="M28 0 Q48 22 68 0" stroke="#ffffff" stroke-width="0.35" fill="none" opacity="0.55" transform="translate(-0.3,-0.3)"/>
      <circle cx="48" cy="12" r="1.2" fill="none" stroke="url(#pendantBezelNK)" stroke-width="0.8"/>
      <ellipse cx="48" cy="22" rx="7" ry="9" fill="url(#pendantBezelNK)" stroke="#2a2a2a" stroke-width="0.5"/>
      <ellipse cx="48" cy="22" rx="5" ry="7" fill="url(#pendantGemNK)" stroke="#1e3a8a" stroke-width="0.4"/>
      <ellipse cx="46.5" cy="19.5" rx="1.4" ry="2.2" fill="#ffffff" opacity="0.7"/>
      <path d="M45 21 L48 18 L51 21" stroke="#dbeafe" stroke-width="0.35" fill="none" opacity="0.75"/>
      <path d="M45 24 L48 27 L51 24" stroke="#1e3a8a" stroke-width="0.35" fill="none" opacity="0.7"/>
      <circle cx="46" cy="19" r="0.3" fill="#ffffff"/>
      <circle cx="50" cy="26" r="0.25" fill="#dbeafe" opacity="0.8"/>
    </svg>`
  },
  {
    id: 'hair-bow',
    name: 'Fiocco Cute',
    category: 'accessories',
    position: 'head',
    zIndex: 10021,
    svg: `<svg viewBox="0 0 50 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bowSatinL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fbcfe8"/>
          <stop offset="40%" style="stop-color:#f472b6"/>
          <stop offset="100%" style="stop-color:#be185d"/>
        </linearGradient>
        <linearGradient id="bowSatinR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#fbcfe8"/>
          <stop offset="40%" style="stop-color:#ec4899"/>
          <stop offset="100%" style="stop-color:#9d174d"/>
        </linearGradient>
        <radialGradient id="bowKnot" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#f9a8d4"/>
          <stop offset="55%" style="stop-color:#db2777"/>
          <stop offset="100%" style="stop-color:#831843"/>
        </radialGradient>
      </defs>
      <path d="M23 10 Q8 2 4 12 Q8 24 23 16" fill="url(#bowSatinL)" stroke="#831843" stroke-width="0.8"/>
      <path d="M20 10 Q12 6 8 12" stroke="#fce7f3" stroke-width="0.4" fill="none" opacity="0.75"/>
      <path d="M20 16 Q12 20 8 14" stroke="#831843" stroke-width="0.3" fill="none" opacity="0.55"/>
      <path d="M22 13 Q12 14 5 13" stroke="#ffffff" stroke-width="0.25" fill="none" opacity="0.4"/>
      <path d="M27 10 Q42 2 46 12 Q42 24 27 16" fill="url(#bowSatinR)" stroke="#831843" stroke-width="0.8"/>
      <path d="M30 10 Q38 6 42 12" stroke="#fce7f3" stroke-width="0.4" fill="none" opacity="0.75"/>
      <path d="M30 16 Q38 20 42 14" stroke="#831843" stroke-width="0.3" fill="none" opacity="0.55"/>
      <path d="M28 13 Q38 14 45 13" stroke="#ffffff" stroke-width="0.25" fill="none" opacity="0.4"/>
      <rect x="23" y="10" width="4" height="6" rx="1.5" fill="url(#bowKnot)" stroke="#831843" stroke-width="0.5"/>
      <rect x="23.5" y="10.5" width="3" height="1.5" rx="0.6" fill="#f9a8d4" opacity="0.7"/>
      <path d="M23 13 Q25 12.5 27 13" stroke="#831843" stroke-width="0.3" fill="none" opacity="0.85"/>
    </svg>`
  },
  {
    id: 'headphones',
    name: 'Cuffie Pro',
    category: 'accessories',
    position: 'head',
    zIndex: 10018,
    svg: `<svg viewBox="0 0 96 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hpBandG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#6b7280"/>
          <stop offset="50%" style="stop-color:#374151"/>
          <stop offset="100%" style="stop-color:#111827"/>
        </linearGradient>
        <linearGradient id="hpCupG" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" style="stop-color:#4b5563"/>
          <stop offset="50%" style="stop-color:#1f2937"/>
          <stop offset="100%" style="stop-color:#030712"/>
        </linearGradient>
        <radialGradient id="hpCupHL" cx="35%" cy="25%" r="60%">
          <stop offset="0%" style="stop-color:#9ca3af;stop-opacity:0.65"/>
          <stop offset="60%" style="stop-color:#4b5563;stop-opacity:0.08"/>
          <stop offset="100%" style="stop-color:#030712;stop-opacity:0"/>
        </radialGradient>
        <radialGradient id="hpCushion" cx="50%" cy="50%" r="50%">
          <stop offset="55%" style="stop-color:#030712;stop-opacity:0"/>
          <stop offset="100%" style="stop-color:#030712;stop-opacity:0.8"/>
        </radialGradient>
      </defs>
      <path d="M10 38 Q10 4 48 0 Q86 4 86 38" stroke="url(#hpBandG)" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M10 38 Q10 4 48 0 Q86 4 86 38" stroke="#6b7280" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.55" transform="translate(0,-1)"/>
      <path d="M14 32 Q14 8 48 4 Q82 8 82 32" stroke="#111827" stroke-width="0.6" fill="none" opacity="0.7"/>
      <rect x="2" y="32" width="14" height="18" rx="4" fill="url(#hpCupG)" stroke="#030712" stroke-width="0.6"/>
      <rect x="2" y="32" width="14" height="18" rx="4" fill="url(#hpCupHL)"/>
      <rect x="4" y="34" width="10" height="14" rx="3" fill="#0f172a" stroke="#374151" stroke-width="0.5"/>
      <rect x="4" y="34" width="10" height="14" rx="3" fill="url(#hpCushion)"/>
      <circle cx="9" cy="38" r="0.4" fill="#4b5563"/>
      <circle cx="9" cy="41" r="0.4" fill="#4b5563"/>
      <circle cx="9" cy="44" r="0.4" fill="#4b5563"/>
      <circle cx="7" cy="39.5" r="0.3" fill="#4b5563" opacity="0.6"/>
      <circle cx="11" cy="39.5" r="0.3" fill="#4b5563" opacity="0.6"/>
      <rect x="80" y="32" width="14" height="18" rx="4" fill="url(#hpCupG)" stroke="#030712" stroke-width="0.6"/>
      <rect x="80" y="32" width="14" height="18" rx="4" fill="url(#hpCupHL)"/>
      <rect x="82" y="34" width="10" height="14" rx="3" fill="#0f172a" stroke="#374151" stroke-width="0.5"/>
      <rect x="82" y="34" width="10" height="14" rx="3" fill="url(#hpCushion)"/>
      <circle cx="87" cy="38" r="0.4" fill="#4b5563"/>
      <circle cx="87" cy="41" r="0.4" fill="#4b5563"/>
      <circle cx="87" cy="44" r="0.4" fill="#4b5563"/>
      <circle cx="85" cy="39.5" r="0.3" fill="#4b5563" opacity="0.6"/>
      <circle cx="89" cy="39.5" r="0.3" fill="#4b5563" opacity="0.6"/>
      <circle cx="9" cy="48" r="0.45" fill="#22d3ee"/>
      <circle cx="87" cy="48" r="0.45" fill="#22d3ee"/>
    </svg>`
  },
  {
    id: 'headband',
    name: 'Cerchietto Pearl',
    category: 'accessories',
    position: 'head',
    zIndex: 10016,
    svg: `<svg viewBox="0 0 96 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hbGoldG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fef3c7"/>
          <stop offset="35%" style="stop-color:#fcd34d"/>
          <stop offset="75%" style="stop-color:#d4af37"/>
          <stop offset="100%" style="stop-color:#92400e"/>
        </linearGradient>
        <radialGradient id="hbPearlG" cx="35%" cy="30%" r="65%">
          <stop offset="0%" style="stop-color:#ffffff"/>
          <stop offset="45%" style="stop-color:#f5f5f4"/>
          <stop offset="85%" style="stop-color:#d4d4d8"/>
          <stop offset="100%" style="stop-color:#737373"/>
        </radialGradient>
      </defs>
      <path d="M8 18 Q48 0 88 18" stroke="url(#hbGoldG)" stroke-width="2.2" fill="none"/>
      <path d="M8 18 Q48 0 88 18" stroke="#fef3c7" stroke-width="0.5" fill="none" opacity="0.65" transform="translate(0,-0.5)"/>
      <path d="M8 18 Q48 0 88 18" stroke="#78350f" stroke-width="0.4" fill="none" opacity="0.6" transform="translate(0,0.5)"/>
      <circle cx="48" cy="4" r="3.8" fill="url(#hbPearlG)" stroke="#92400e" stroke-width="0.5"/>
      <circle cx="46.8" cy="2.8" r="1.2" fill="#ffffff" opacity="0.9"/>
      <circle cx="49.5" cy="5.5" r="0.6" fill="#78350f" opacity="0.4"/>
      <circle cx="30" cy="9" r="1.4" fill="url(#hbPearlG)" stroke="#92400e" stroke-width="0.3"/>
      <circle cx="29.6" cy="8.6" r="0.4" fill="#ffffff" opacity="0.85"/>
      <circle cx="66" cy="9" r="1.4" fill="url(#hbPearlG)" stroke="#92400e" stroke-width="0.3"/>
      <circle cx="65.6" cy="8.6" r="0.4" fill="#ffffff" opacity="0.85"/>
      <circle cx="18" cy="14" r="0.9" fill="url(#hbPearlG)" stroke="#92400e" stroke-width="0.25"/>
      <circle cx="78" cy="14" r="0.9" fill="url(#hbPearlG)" stroke="#92400e" stroke-width="0.25"/>
    </svg>`
  },
  {
    id: 'glasses-round',
    name: 'Occhiali Vintage',
    category: 'accessories',
    position: 'head',
    zIndex: 10020,
    svg: `<svg viewBox="0 0 96 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tortoiseR" cx="35%" cy="35%" r="70%">
          <stop offset="0%" style="stop-color:#d97706"/>
          <stop offset="50%" style="stop-color:#8b4513"/>
          <stop offset="100%" style="stop-color:#3b1608"/>
        </radialGradient>
        <pattern id="tortoiseP" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#3b1608" opacity="0.7"/>
          <circle cx="3" cy="2.5" r="0.45" fill="#78350f" opacity="0.6"/>
          <circle cx="2" cy="3.5" r="0.3" fill="#fbbf24" opacity="0.5"/>
        </pattern>
        <radialGradient id="lensTintR" cx="35%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:#fef3c7;stop-opacity:0.5"/>
          <stop offset="60%" style="stop-color:#fcd34d;stop-opacity:0.15"/>
          <stop offset="100%" style="stop-color:#92400e;stop-opacity:0.12"/>
        </radialGradient>
      </defs>
      <circle cx="27" cy="12" r="11" fill="url(#lensTintR)" stroke="url(#tortoiseR)" stroke-width="2.5"/>
      <circle cx="27" cy="12" r="11" fill="url(#tortoiseP)" opacity="0.35" stroke="none"/>
      <circle cx="27" cy="12" r="11" fill="none" stroke="#3b1608" stroke-width="0.5"/>
      <path d="M20 6 Q24 4 30 5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.65" fill="none"/>
      <path d="M22 8 Q25 6 29 7" stroke="#fff" stroke-width="0.5" stroke-linecap="round" opacity="0.55" fill="none"/>
      <circle cx="65" cy="12" r="11" fill="url(#lensTintR)" stroke="url(#tortoiseR)" stroke-width="2.5"/>
      <circle cx="65" cy="12" r="11" fill="url(#tortoiseP)" opacity="0.35" stroke="none"/>
      <circle cx="65" cy="12" r="11" fill="none" stroke="#3b1608" stroke-width="0.5"/>
      <path d="M58 6 Q62 4 68 5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.65" fill="none"/>
      <path d="M60 8 Q63 6 67 7" stroke="#fff" stroke-width="0.5" stroke-linecap="round" opacity="0.55" fill="none"/>
      <path d="M38 10 Q48 6 54 10" stroke="url(#tortoiseR)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M38 10 Q48 7 54 10" stroke="#fbbf24" stroke-width="0.4" fill="none" opacity="0.55"/>
      <circle cx="38" cy="12" r="0.6" fill="#78350f"/>
      <circle cx="54" cy="12" r="0.6" fill="#78350f"/>
      <line x1="16" y1="12" x2="6" y2="11" stroke="url(#tortoiseR)" stroke-width="2" stroke-linecap="round"/>
      <line x1="76" y1="12" x2="90" y2="11" stroke="url(#tortoiseR)" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'bandana',
    name: 'Bandana Cool',
    category: 'accessories',
    position: 'head',
    zIndex: 10015,
    svg: `<svg viewBox="0 0 96 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bandanaG" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" style="stop-color:#ef4444"/>
          <stop offset="45%" style="stop-color:#dc2626"/>
          <stop offset="100%" style="stop-color:#7f1d1d"/>
        </linearGradient>
        <radialGradient id="bandanaHL" cx="35%" cy="30%" r="60%">
          <stop offset="0%" style="stop-color:#fecaca;stop-opacity:0.55"/>
          <stop offset="100%" style="stop-color:#fecaca;stop-opacity:0"/>
        </radialGradient>
        <pattern id="paisleyP" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.7" fill="#fef2f2" opacity="0.6"/>
          <circle cx="2" cy="2" r="0.3" fill="#7f1d1d"/>
          <path d="M6 5 Q8 4 9 6 Q8 8 6 7" stroke="#fef2f2" stroke-width="0.4" fill="none" opacity="0.6"/>
          <circle cx="8" cy="8.5" r="0.5" fill="#fef2f2" opacity="0.5"/>
        </pattern>
      </defs>
      <path d="M4 6 Q48 0 92 6 L92 15 Q48 8 4 15 Z" fill="url(#bandanaG)" stroke="#7f1d1d" stroke-width="0.8"/>
      <path d="M4 6 Q48 0 92 6 L92 15 Q48 8 4 15 Z" fill="url(#paisleyP)" opacity="0.7"/>
      <path d="M4 6 Q48 0 92 6 L92 15 Q48 8 4 15 Z" fill="url(#bandanaHL)"/>
      <path d="M6 6.5 Q48 1 90 6.5" stroke="#fecaca" stroke-width="0.4" fill="none" opacity="0.6"/>
      <path d="M6 14 Q48 8.5 90 14" stroke="#7f1d1d" stroke-width="0.35" fill="none" opacity="0.65"/>
      <path d="M86 8 L94 6 L94 16 L86 14 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="0.5"/>
      <path d="M88 9 L92 8" stroke="#fecaca" stroke-width="0.3" opacity="0.55"/>
    </svg>`
  },
  {
    id: 'ski-goggles',
    name: 'Maschera Sci',
    category: 'accessories',
    position: 'head',
    zIndex: 10020,
    svg: `<svg viewBox="0 0 96 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sgFrameG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#374151"/>
          <stop offset="50%" style="stop-color:#1f2937"/>
          <stop offset="100%" style="stop-color:#030712"/>
        </linearGradient>
        <linearGradient id="sgLensG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#06b6d4"/>
          <stop offset="40%" style="stop-color:#0891b2"/>
          <stop offset="75%" style="stop-color:#1e40af"/>
          <stop offset="100%" style="stop-color:#7c3aed"/>
        </linearGradient>
        <linearGradient id="sgLensShine" x1="10%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.75"/>
          <stop offset="60%" style="stop-color:#ffffff;stop-opacity:0.15"/>
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
        </linearGradient>
        <linearGradient id="sgStrapG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#e11d48"/>
          <stop offset="100%" style="stop-color:#9f1239"/>
        </linearGradient>
      </defs>
      <rect x="14" y="4" width="68" height="22" rx="10" fill="url(#sgFrameG)" stroke="#000" stroke-width="1"/>
      <path d="M16 6 Q48 2 80 6 Q84 8 84 14 Q84 22 80 24 Q48 28 16 24 Q12 22 12 14 Q12 8 16 6" fill="url(#sgLensG)" stroke="#1f2937" stroke-width="0.8"/>
      <path d="M20 8 Q40 5 58 7 L56 13 Q38 11 22 13 Z" fill="url(#sgLensShine)"/>
      <path d="M22 22 Q48 24 74 22" stroke="#fbbf24" stroke-width="0.5" fill="none" opacity="0.55"/>
      <path d="M22 23 Q48 25 74 23" stroke="#f87171" stroke-width="0.35" fill="none" opacity="0.5"/>
      <path d="M42 21 Q48 24 54 21" stroke="#030712" stroke-width="0.6" fill="none" opacity="0.55"/>
      <rect x="14" y="4" width="68" height="2" rx="1" fill="#6b7280" opacity="0.45"/>
      <rect x="0" y="12" width="14" height="6" rx="1" fill="url(#sgStrapG)" stroke="#7f1d1d" stroke-width="0.5"/>
      <rect x="0" y="13" width="14" height="1" fill="#fda4af" opacity="0.55"/>
      <rect x="82" y="12" width="14" height="6" rx="1" fill="url(#sgStrapG)" stroke="#7f1d1d" stroke-width="0.5"/>
      <rect x="82" y="13" width="14" height="1" fill="#fda4af" opacity="0.55"/>
      <circle cx="35" cy="11" r="0.3" fill="#ffffff"/>
      <circle cx="60" cy="15" r="0.25" fill="#ffffff" opacity="0.8"/>
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
