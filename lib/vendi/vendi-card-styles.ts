/** Gradienti di sfondo e colori glow per le card del flusso vendita.
 *  I colori sono abbinati manualmente alle nuove immagini fantasy.
 *  Un overlay bianco semi-trasparente rende i gradienti più delicati.
 */

export type VendiCardStyle = {
  background: string;
  glowColor: string; // RGB values, e.g. "255, 115, 0"
  imagePosition?: string;
};

function withOverlay(gradient: string): string {
  return `linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%), ${gradient}`;
}

export const VENDI_CARD_STYLES: Record<string, VendiCardStyle> = {
  // Principali
  singole: {
    background: withOverlay('linear-gradient(135deg, #0c2d6b 0%, #1e4d8f 25%, #2d6cb5 50%, #1e4d8f 75%, #0c2d6b 100%)'),
    glowColor: '56, 189, 248',
  },
  oggetti: {
    background: withOverlay('linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)'),
    glowColor: '255, 115, 0',
  },
  'set-edizioni': {
    background: withOverlay('linear-gradient(135deg, #2d1b4e 0%, #4a2c7a 25%, #6b3fa0 50%, #4a2c7a 75%, #2d1b4e 100%)'),
    glowColor: '167, 139, 250',
  },

  // Oggetti
  boosters: {
    background: withOverlay('linear-gradient(135deg, #5c3d1e 0%, #8b5a2b 25%, #a67c52 50%, #8b5a2b 75%, #5c3d1e 100%)'),
    glowColor: '251, 146, 60',
  },
  'booster-boxes': {
    background: withOverlay('linear-gradient(135deg, #3d2517 0%, #5c3d1e 25%, #4a2c7a 50%, #2d4a6e 75%, #3d2517 100%)'),
    glowColor: '139, 92, 246',
    imagePosition: 'left center',
  },
  'set-lotti-collezioni': {
    background: withOverlay('linear-gradient(135deg, #4a2c2c 0%, #6b3f3f 25%, #8b5a2b 50%, #6b3f3f 75%, #4a2c2c 100%)'),
    glowColor: '251, 191, 36',
  },
  sigillati: {
    background: withOverlay('linear-gradient(135deg, #1e3d2f 0%, #2d5a3f 25%, #3d7a52 50%, #2d5a3f 75%, #1e3d2f 100%)'),
    glowColor: '34, 197, 94',
    imagePosition: 'left center',
  },
  accessori: {
    background: withOverlay('linear-gradient(135deg, #1e3d5c 0%, #2d5a7a 25%, #4a2c7a 50%, #2d6b4e 75%, #1e3d5c 100%)'),
    glowColor: '168, 85, 247',
  },
};

export function getVendiCardStyle(id: string): VendiCardStyle {
  return VENDI_CARD_STYLES[id] || {
    background: withOverlay('linear-gradient(135deg, #1D3160 0%, #2a4a7f 50%, #1D3160 100%)'),
    glowColor: '255, 115, 0',
  };
}
