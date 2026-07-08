// Manifest del guardaroba di Asso (PLAN/13.4-13.5).
// Solo metadati leggeri: l'arte SVG vive in ./items/<id>.tsx e viene caricata
// lazy (equip o pannello aperto), mai nel chunk base della mascotte.
//
// ── Griglia di ancoraggio (card 96×128) ─────────────────────────────────────
// La faccia occupa il riquadro interno (inset 3/4 px); occhi ≈ y 38-46,
// bocca ≈ y 80. Gli slot sono riquadri fissi: un item disegnato dentro il
// proprio slot è allineato per costruzione.
//
//   headTop   : top -2,  left 0,   96×32  (cappelli)
//   ears      : top -6,  left -4, 104×56  (cuffie, archetti)
//   eyes      : top 40,  left 0,   96×24  (occhiali)
//   eyesTall  : top 37,  left 0,   96×28  (occhiali montatura alta)
//   body      : top 78,  left 0,   96×50  (vestiti)
//   hand      : top 60,  ±(-24),   36×48  (oggetti in mano, lato alternato)
//   handWide  : top 48,  ±(-38),   52×44  (oggetti larghi, es. mazzo carte)

import type { CSSProperties, ComponentType } from 'react';
import type { MessageKey } from '@/lib/i18n/messages/en';

export type WardrobeCategory = 'clothing' | 'accessories' | 'objects';
export type WardrobeSlot = 'headTop' | 'ears' | 'eyes' | 'eyesTall' | 'body' | 'hand' | 'handWide';

export interface WardrobeItemMeta {
  id: string;
  nameKey: MessageKey;
  category: WardrobeCategory;
  slot: WardrobeSlot;
  zIndex: number;
}

export interface EquippedItems {
  clothing: string | null;
  accessories: string[];
  objects: string[];
  faceColor: string;
}

export const WARDROBE_ITEMS: WardrobeItemMeta[] = [
  // Vestiti (slot body, uno alla volta)
  { id: 'hoodie', nameKey: 'asso.item.hoodie', category: 'clothing', slot: 'body', zIndex: 10010 },
  { id: 'tuxedo', nameKey: 'asso.item.tuxedo', category: 'clothing', slot: 'body', zIndex: 10010 },
  { id: 'bomber', nameKey: 'asso.item.bomber', category: 'clothing', slot: 'body', zIndex: 10010 },
  // Accessori (cumulabili)
  { id: 'cap-baseball', nameKey: 'asso.item.capBaseball', category: 'accessories', slot: 'headTop', zIndex: 10015 },
  { id: 'sunglasses-wayfarer', nameKey: 'asso.item.sunglasses', category: 'accessories', slot: 'eyes', zIndex: 10016 },
  { id: 'glasses-round', nameKey: 'asso.item.glassesRound', category: 'accessories', slot: 'eyesTall', zIndex: 10016 },
  { id: 'headphones', nameKey: 'asso.item.headphones', category: 'accessories', slot: 'ears', zIndex: 10014 },
  // Oggetti (max 2, lato alternato)
  { id: 'laptop', nameKey: 'asso.item.laptop', category: 'objects', slot: 'hand', zIndex: 10020 },
  { id: 'coffee', nameKey: 'asso.item.coffee', category: 'objects', slot: 'hand', zIndex: 10020 },
  { id: 'camera', nameKey: 'asso.item.camera', category: 'objects', slot: 'hand', zIndex: 10020 },
  { id: 'trophy', nameKey: 'asso.item.trophy', category: 'objects', slot: 'hand', zIndex: 10020 },
  { id: 'card-deck', nameKey: 'asso.item.cardDeck', category: 'objects', slot: 'handWide', zIndex: 10019 },
];

export const WARDROBE_ITEM_IDS = new Set(WARDROBE_ITEMS.map((item) => item.id));

export const WARDROBE_ITEMS_BY_ID = new Map(WARDROBE_ITEMS.map((item) => [item.id, item]));

/** Numero massimo di oggetti equipaggiati contemporaneamente. */
export const MAX_EQUIPPED_OBJECTS = 2;

const SLOT_FRAMES: Record<Exclude<WardrobeSlot, 'hand' | 'handWide'>, CSSProperties> = {
  headTop: { top: '-2px', left: '0', width: '96px', height: '32px' },
  ears: { top: '-6px', left: '-4px', width: '104px', height: '56px' },
  eyes: { top: '40px', left: '0', width: '96px', height: '24px' },
  eyesTall: { top: '37px', left: '0', width: '96px', height: '28px' },
  body: { top: '78px', left: '0', width: '96px', height: '50px' },
};

/**
 * Posizione assoluta dello slot sulla card 96×128.
 * Gli oggetti in mano alternano destra/sinistra in base all'ordine di equip.
 */
export function getSlotStyle(item: WardrobeItemMeta, equippedObjects: string[]): CSSProperties {
  const base: CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: item.zIndex,
  };

  if (item.slot === 'hand' || item.slot === 'handWide') {
    const index = equippedObjects.indexOf(item.id);
    const isRight = index % 2 === 0;
    const side = item.slot === 'handWide' ? '-38px' : '-24px';
    const size = item.slot === 'handWide'
      ? { top: '48px', width: '52px', height: '44px' }
      : { top: '60px', width: '36px', height: '48px' };
    return { ...base, ...size, [isRight ? 'right' : 'left']: side };
  }

  return { ...base, ...SLOT_FRAMES[item.slot] };
}

/**
 * Loader lazy per l'arte di ogni item: import esplicito → un chunk per item,
 * scaricato solo quando serve (equip o thumbnail nel pannello).
 */
export const WARDROBE_ITEM_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  hoodie: () => import('./items/hoodie'),
  tuxedo: () => import('./items/tuxedo'),
  bomber: () => import('./items/bomber'),
  'cap-baseball': () => import('./items/cap-baseball'),
  'sunglasses-wayfarer': () => import('./items/sunglasses-wayfarer'),
  'glasses-round': () => import('./items/glasses-round'),
  headphones: () => import('./items/headphones'),
  laptop: () => import('./items/laptop'),
  coffee: () => import('./items/coffee'),
  camera: () => import('./items/camera'),
  trophy: () => import('./items/trophy'),
  'card-deck': () => import('./items/card-deck'),
};
