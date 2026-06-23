import type { CSSProperties } from 'react';

export type Category = 'clothing' | 'accessories' | 'objects' | 'color';
export type FaceColorId =
  | 'neon-orange'
  | 'electric-cyan'
  | 'acid-lime'
  | 'hot-pink'
  | 'violet-burst'
  | 'ember-red'
  | 'arctic-blue'
  | 'mint-aura'
  | 'sunset-gold'
  | 'mono-ice'
  | 'deep-space';

export interface WardrobeItem {
  id: string;
  name: string;
  category: Category;
  svg: string;
  position: 'body' | 'head' | 'hands' | 'background';
  zIndex: number;
}

type MaterialProfile = 'fabric' | 'leather' | 'metal' | 'glass' | 'tech' | 'soft' | 'neutral';

const ITEM_REALISM_TUNING: Record<
  string,
  {
    filterBoost?: string;
    transform?: string;
    opacity?: number;
  }
> = {
  'sunglasses-wayfarer': {
    filterBoost: 'brightness(1.06) contrast(1.16)',
  },
  'glasses-round': {
    filterBoost: 'brightness(1.05) contrast(1.14)',
  },
  'ski-goggles': {
    filterBoost: 'saturate(1.22) brightness(1.07)',
  },
  'cigar-xl': {
    filterBoost: 'saturate(1.08) contrast(1.14)',
    transform: 'rotate(-6deg) translateY(-0.5px)',
  },
  trophy: {
    filterBoost: 'brightness(1.15) contrast(1.2) saturate(1.18)',
  },
  laptop: {
    filterBoost: 'contrast(1.14) saturate(1.16)',
  },
  smartphone: {
    filterBoost: 'contrast(1.18) saturate(1.12)',
  },
  'yugioh-deck': {
    filterBoost: 'contrast(1.2) saturate(1.18)',
  },
  headphones: {
    filterBoost: 'contrast(1.12) saturate(1.12)',
  },
  'leather-jacket': {
    filterBoost: 'contrast(1.2) saturate(1.14)',
  },
};

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
  {
    id: 'ember-red',
    name: 'Ember Red',
    line: '#ff3d3d',
    pupil: '#ff5d5d',
    highlight: '#ffe1e1',
    glowStrong: 'rgba(255, 61, 61, 0.95)',
    glowMid: 'rgba(255, 86, 86, 0.76)',
    glowSoft: 'rgba(255, 86, 86, 0.44)',
  },
  {
    id: 'arctic-blue',
    name: 'Arctic Blue',
    line: '#4da3ff',
    pupil: '#73bbff',
    highlight: '#e2f0ff',
    glowStrong: 'rgba(77, 163, 255, 0.94)',
    glowMid: 'rgba(98, 175, 255, 0.74)',
    glowSoft: 'rgba(98, 175, 255, 0.42)',
  },
  {
    id: 'mint-aura',
    name: 'Mint Aura',
    line: '#33e6b1',
    pupil: '#61efc4',
    highlight: '#dcfff3',
    glowStrong: 'rgba(51, 230, 177, 0.94)',
    glowMid: 'rgba(86, 239, 195, 0.74)',
    glowSoft: 'rgba(86, 239, 195, 0.42)',
  },
  {
    id: 'sunset-gold',
    name: 'Sunset Gold',
    line: '#ffba42',
    pupil: '#ffd166',
    highlight: '#fff3d6',
    glowStrong: 'rgba(255, 186, 66, 0.96)',
    glowMid: 'rgba(255, 201, 105, 0.76)',
    glowSoft: 'rgba(255, 201, 105, 0.45)',
  },
  {
    id: 'mono-ice',
    name: 'Mono Ice',
    line: '#d9e3f0',
    pupil: '#eef3fa',
    highlight: '#ffffff',
    glowStrong: 'rgba(233, 240, 250, 0.95)',
    glowMid: 'rgba(210, 224, 242, 0.74)',
    glowSoft: 'rgba(210, 224, 242, 0.45)',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    line: '#7f7aff',
    pupil: '#a8a5ff',
    highlight: '#e9e8ff',
    glowStrong: 'rgba(127, 122, 255, 0.95)',
    glowMid: 'rgba(150, 145, 255, 0.75)',
    glowSoft: 'rgba(150, 145, 255, 0.44)',
  },
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
    if (item.id === 'cigar-xl') return { ...base, top: '56px', left: '-22px', width: '130px', height: '58px', transform: 'rotate(-6deg)', transformOrigin: 'center center' };
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

function getItemMaterialProfile(item: WardrobeItem): MaterialProfile {
  const id = item.id;

  if (id.includes('leather') || id.includes('jacket')) return 'leather';
  if (
    id.includes('glasses') ||
    id.includes('goggles') ||
    id.includes('camera')
  ) {
    return 'glass';
  }
  if (
    id.includes('necklace') ||
    id.includes('earrings') ||
    id.includes('trophy')
  ) {
    return 'metal';
  }
  if (
    id.includes('laptop') ||
    id.includes('smartphone') ||
    id.includes('headphones') ||
    id.includes('yugioh')
  ) {
    return 'tech';
  }
  if (id.includes('coffee') || id.includes('ice-cream') || id.includes('balloon')) return 'soft';
  if (item.category === 'clothing') return 'fabric';
  return 'neutral';
}

/**
 * Visual polish layer applied above absolute positioning.
 * Adds realistic depth via tuned shadows, contrast and saturation by material.
 */
export function getItemRenderEnhancementStyle(item: WardrobeItem): CSSProperties {
  const material = getItemMaterialProfile(item);
  const tuning = ITEM_REALISM_TUNING[item.id];

  const base: CSSProperties = {
    transformOrigin: '50% 50%',
    willChange: 'transform, filter, opacity',
    opacity: tuning?.opacity ?? 0.98,
    transform: tuning?.transform,
  };

  if (material === 'fabric') {
    return {
      ...base,
      filter:
        `drop-shadow(0 1px 1px rgba(0,0,0,0.26)) drop-shadow(0 4px 8px rgba(0,0,0,0.2)) saturate(1.08) contrast(1.05) ${tuning?.filterBoost ?? ''}`.trim(),
    };
  }

  if (material === 'leather') {
    return {
      ...base,
      filter:
        `drop-shadow(0 1px 1px rgba(0,0,0,0.32)) drop-shadow(0 5px 10px rgba(0,0,0,0.28)) contrast(1.12) saturate(1.1) ${tuning?.filterBoost ?? ''}`.trim(),
    };
  }

  if (material === 'metal') {
    return {
      ...base,
      filter:
        `drop-shadow(0 0 1px rgba(255,255,255,0.22)) drop-shadow(0 2px 5px rgba(0,0,0,0.28)) brightness(1.08) contrast(1.12) ${tuning?.filterBoost ?? ''}`.trim(),
    };
  }

  if (material === 'glass') {
    return {
      ...base,
      opacity: 0.97,
      filter:
        `drop-shadow(0 1px 2px rgba(0,0,0,0.2)) drop-shadow(0 0 6px rgba(255,255,255,0.2)) saturate(1.15) brightness(1.06) ${tuning?.filterBoost ?? ''}`.trim(),
    };
  }

  if (material === 'tech') {
    return {
      ...base,
      filter:
        `drop-shadow(0 1px 1px rgba(0,0,0,0.28)) drop-shadow(0 4px 10px rgba(0,0,0,0.25)) saturate(1.14) contrast(1.09) ${tuning?.filterBoost ?? ''}`.trim(),
    };
  }

  if (material === 'soft') {
    return {
      ...base,
      filter:
        `drop-shadow(0 1px 1px rgba(0,0,0,0.2)) drop-shadow(0 3px 6px rgba(0,0,0,0.18)) saturate(1.06) brightness(1.03) ${tuning?.filterBoost ?? ''}`.trim(),
    };
  }

  return {
    ...base,
    filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.22)) saturate(1.05) contrast(1.03) ${tuning?.filterBoost ?? ''}`.trim(),
  };
}

export function getItemRenderClassName(item: WardrobeItem): string {
  if (item.id === 'trophy' || item.id === 'necklace-pendant') return 'equipped-item-metallic';
  if (item.id === 'sunglasses-wayfarer' || item.id === 'glasses-round' || item.id === 'ski-goggles') return 'equipped-item-glass';
  if (item.id === 'laptop' || item.id === 'smartphone' || item.id === 'yugioh-deck') return 'equipped-item-tech';
  return '';
}
