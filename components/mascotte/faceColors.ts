// Colori faccia di Asso (glow neon della card).
// Nomi via i18n (PLAN/13.9); i valori colore sono identici al set precedente.

import type { MessageKey } from '@/lib/i18n/messages/en';

export interface FaceColorOption {
  id: string;
  nameKey: MessageKey;
  line: string;
  pupil: string;
  highlight: string;
  glowStrong: string;
  glowMid: string;
  glowSoft: string;
}

export const DEFAULT_FACE_COLOR_ID = 'neon-orange';

export const FACE_COLOR_OPTIONS: FaceColorOption[] = [
  {
    id: 'neon-orange',
    nameKey: 'asso.color.neonOrange',
    line: '#ff6a00',
    pupil: '#ff7f11',
    highlight: '#fff2bf',
    glowStrong: 'rgba(255, 120, 10, 0.95)',
    glowMid: 'rgba(255, 106, 0, 0.75)',
    glowSoft: 'rgba(255, 106, 0, 0.45)',
  },
  {
    id: 'electric-cyan',
    nameKey: 'asso.color.electricCyan',
    line: '#00d5ff',
    pupil: '#22e6ff',
    highlight: '#d7fbff',
    glowStrong: 'rgba(0, 213, 255, 0.92)',
    glowMid: 'rgba(20, 193, 255, 0.72)',
    glowSoft: 'rgba(20, 193, 255, 0.4)',
  },
  {
    id: 'acid-lime',
    nameKey: 'asso.color.acidLime',
    line: '#95ff00',
    pupil: '#b7ff3f',
    highlight: '#f3ffd1',
    glowStrong: 'rgba(149, 255, 0, 0.92)',
    glowMid: 'rgba(120, 232, 22, 0.72)',
    glowSoft: 'rgba(120, 232, 22, 0.42)',
  },
  {
    id: 'hot-pink',
    nameKey: 'asso.color.hotPink',
    line: '#ff2ea6',
    pupil: '#ff4eb6',
    highlight: '#ffd9ee',
    glowStrong: 'rgba(255, 46, 166, 0.94)',
    glowMid: 'rgba(255, 62, 182, 0.74)',
    glowSoft: 'rgba(255, 62, 182, 0.43)',
  },
  {
    id: 'violet-burst',
    nameKey: 'asso.color.violetBurst',
    line: '#9a5cff',
    pupil: '#b17bff',
    highlight: '#e6dcff',
    glowStrong: 'rgba(154, 92, 255, 0.94)',
    glowMid: 'rgba(167, 110, 255, 0.73)',
    glowSoft: 'rgba(167, 110, 255, 0.42)',
  },
  {
    id: 'ember-red',
    nameKey: 'asso.color.emberRed',
    line: '#ff3d3d',
    pupil: '#ff5d5d',
    highlight: '#ffe1e1',
    glowStrong: 'rgba(255, 61, 61, 0.95)',
    glowMid: 'rgba(255, 86, 86, 0.76)',
    glowSoft: 'rgba(255, 86, 86, 0.44)',
  },
  {
    id: 'arctic-blue',
    nameKey: 'asso.color.arcticBlue',
    line: '#4da3ff',
    pupil: '#73bbff',
    highlight: '#e2f0ff',
    glowStrong: 'rgba(77, 163, 255, 0.94)',
    glowMid: 'rgba(98, 175, 255, 0.74)',
    glowSoft: 'rgba(98, 175, 255, 0.42)',
  },
  {
    id: 'mint-aura',
    nameKey: 'asso.color.mintAura',
    line: '#33e6b1',
    pupil: '#61efc4',
    highlight: '#dcfff3',
    glowStrong: 'rgba(51, 230, 177, 0.94)',
    glowMid: 'rgba(86, 239, 195, 0.74)',
    glowSoft: 'rgba(86, 239, 195, 0.42)',
  },
  {
    id: 'sunset-gold',
    nameKey: 'asso.color.sunsetGold',
    line: '#ffba42',
    pupil: '#ffd166',
    highlight: '#fff3d6',
    glowStrong: 'rgba(255, 186, 66, 0.96)',
    glowMid: 'rgba(255, 201, 105, 0.76)',
    glowSoft: 'rgba(255, 201, 105, 0.45)',
  },
  {
    id: 'mono-ice',
    nameKey: 'asso.color.monoIce',
    line: '#d9e3f0',
    pupil: '#eef3fa',
    highlight: '#ffffff',
    glowStrong: 'rgba(233, 240, 250, 0.95)',
    glowMid: 'rgba(210, 224, 242, 0.74)',
    glowSoft: 'rgba(210, 224, 242, 0.45)',
  },
  {
    id: 'deep-space',
    nameKey: 'asso.color.deepSpace',
    line: '#7f7aff',
    pupil: '#a8a5ff',
    highlight: '#e9e8ff',
    glowStrong: 'rgba(127, 122, 255, 0.95)',
    glowMid: 'rgba(150, 145, 255, 0.75)',
    glowSoft: 'rgba(150, 145, 255, 0.44)',
  },
];

export function isValidFaceColorId(value: unknown): value is string {
  return typeof value === 'string' && FACE_COLOR_OPTIONS.some((option) => option.id === value);
}

export function getFaceColor(id: string): FaceColorOption {
  return FACE_COLOR_OPTIONS.find((option) => option.id === id) ?? FACE_COLOR_OPTIONS[0];
}
