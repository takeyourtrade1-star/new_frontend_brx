// Storage keys for bug report data
export const BUG_REPORT_STORAGE = {
  SCREENSHOT: 'brx_bug_screenshot',
  CONSOLE_LOGS: 'brx_bug_console_logs',
  CATEGORY: 'brx_bug_category',
  TIMESTAMP: 'brx_bug_timestamp',
};

export const Z_INDEX = {
  mascotteBase: 9999,
  modal: 10000,
  mascotteOverlay: 10002,
  tooltip: 10003,
  screenshotPreview: 99998,
  flash: 99999,
} as const;

export const EXPRESSION_TRANSITION_MS = 140;
export const CODING_PREVIEW_MS = 900;
export const SUBMIT_FEEDBACK_MS = 1400;
export const BUG_MODAL_FADE_MS = 220;
export const WARDROBE_STORAGE_KEY = 'brx_mascotte_wardrobe_v1';

export interface BackVariant {
  gradient: string;
  pattern: string;
  label: string;
  sub: string;
  unlock: number;
}

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

export interface GoldenConfettiPiece {
  id: number;
  x: number;
  delay: number;
  size: number;
  rotation: number;
  duration: number;
  color: string;
}
