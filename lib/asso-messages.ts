/** Timing e UX condivisi per i messaggi della mascotte Asso */

export const ASSO_MESSAGE_TYPEWRITER_MS = {
  /** Ritardo prima del primo carattere */
  initial: 100,
  /** Ritardo base tra caratteri */
  base: 26,
  /** Spazi — più rapidi */
  space: 14,
  /** Punteggiatura forte — pausa breve */
  punctStrong: 85,
  /** Virgole, due punti — pausa leggera */
  punctSoft: 48,
} as const;

/** Durata minima del bubble dopo che il typewriter ha finito */
export const ASSO_MESSAGE_BUBBLE_HOLD_MS = {
  promo: 7200,
  styleReaction: 4800,
  sleepDream: 6500,
} as const;

/** Intervallo tra un messaggio promo e il successivo (visibilità + pausa) */
export const ASSO_MESSAGE_BUBBLE_CYCLE_MS = {
  initialDelay: 4000,
  gapBetween: 20000,
} as const;

/** Chat modale (benvenuto) */
export const ASSO_MESSAGE_CHAT_MS = {
  typingIndicator: 500,
  menuAfterGreeting: 800,
} as const;

/** Larghezza massima bubble ancorata alla mascotte (angolo, non invade il centro) */
export const ASSO_MESSAGE_BUBBLE_MAX_WIDTH_PX = 220;
