// Costanti condivise della mascotte Asso.

export const Z_INDEX = {
  mascotteBase: 9999,
  modal: 10000,
  mascotteOverlay: 10002,
  tooltip: 10003,
  screenshotPreview: 99998,
  flash: 99999,
} as const;

export const CODING_PREVIEW_MS = 900;
export const SUBMIT_FEEDBACK_MS = 1400;
export const BUG_MODAL_FADE_MS = 220;
export const SLEEP_DELAY_MS = 15000;

export interface BackVariant {
  gradient: string;
  label: string;
  subKey:
    | 'asso.backFace.sub.base'
    | 'asso.backFace.sub.collector'
    | 'asso.backFace.sub.legendary'
    | 'asso.backFace.sub.special'
    | 'asso.backFace.sub.ultraRare';
  unlock: number;
}

/** Retro carta sbloccabili con i flip (gamification mantenuta, PLAN/13.7). */
export const BACK_VARIANTS: BackVariant[] = [
  { gradient: 'linear-gradient(145deg, #FF7300 0%, #FF9A40 50%, #FFB366 100%)', label: 'ASSO', subKey: 'asso.backFace.sub.base', unlock: 0 },
  { gradient: 'linear-gradient(145deg, #6366F1 0%, #818CF8 50%, #A5B4FC 100%)', label: 'RARO', subKey: 'asso.backFace.sub.collector', unlock: 5 },
  { gradient: 'linear-gradient(145deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)', label: 'EPICO', subKey: 'asso.backFace.sub.legendary', unlock: 15 },
  { gradient: 'linear-gradient(145deg, #F43F5E 0%, #FB7185 50%, #FDA4AF 100%)', label: 'FOIL', subKey: 'asso.backFace.sub.special', unlock: 30 },
  { gradient: 'linear-gradient(145deg, #F59E0B 0%, #FBBF24 50%, #FDE68A 100%)', label: 'GOLD', subKey: 'asso.backFace.sub.ultraRare', unlock: 50 },
];

export interface FlipParticle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
}

export interface DressingSparkle {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: number;
  color: string;
}
