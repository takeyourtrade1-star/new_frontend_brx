import { describe, expect, it } from 'vitest';
import {
  WARDROBE_ITEMS,
  WARDROBE_ITEM_LOADERS,
  getSlotStyle,
} from '@/components/mascotte/wardrobe/manifest';

describe('wardrobe manifest', () => {
  it('id univoci', () => {
    const ids = WARDROBE_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ogni item ha un loader lazy registrato (e viceversa)', () => {
    const ids = new Set(WARDROBE_ITEMS.map((item) => item.id));
    const loaderIds = new Set(Object.keys(WARDROBE_ITEM_LOADERS));
    expect(loaderIds).toEqual(ids);
  });

  it('slot coerenti con la categoria', () => {
    for (const item of WARDROBE_ITEMS) {
      if (item.category === 'clothing') expect(item.slot).toBe('body');
      if (item.category === 'objects') expect(['hand', 'handWide']).toContain(item.slot);
      if (item.category === 'accessories') expect(['headTop', 'ears', 'eyes', 'eyesTall']).toContain(item.slot);
    }
  });

  it('ogni loader risolve in un componente React', async () => {
    for (const [id, loader] of Object.entries(WARDROBE_ITEM_LOADERS)) {
      const mod = await loader();
      expect(typeof mod.default, `item ${id}`).toBe('function');
    }
  });

  it('oggetti in mano alternano destra/sinistra', () => {
    const laptop = WARDROBE_ITEMS.find((i) => i.id === 'laptop')!;
    const coffee = WARDROBE_ITEMS.find((i) => i.id === 'coffee')!;
    const equipped = ['laptop', 'coffee'];
    const first = getSlotStyle(laptop, equipped);
    const second = getSlotStyle(coffee, equipped);
    expect(first.right).toBeDefined();
    expect(second.left).toBeDefined();
  });

  it('slot fissi hanno un frame assoluto valido', () => {
    for (const item of WARDROBE_ITEMS.filter((i) => i.slot !== 'hand' && i.slot !== 'handWide')) {
      const style = getSlotStyle(item, []);
      expect(style.position).toBe('absolute');
      expect(style.width).toBeDefined();
      expect(style.height).toBeDefined();
    }
  });
});
