import { describe, expect, it } from 'vitest';
import {
  ASSO_STORAGE_KEY,
  loadAssoState,
  sanitizeWardrobe,
} from '@/components/mascotte/persistence';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => { data.delete(key); },
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
}

describe('loadAssoState — migrazione legacy', () => {
  it('migra le chiavi legacy, le rimuove e salva nel nuovo formato', () => {
    const storage = fakeStorage({
      brx_mascotte_flips: '42',
      brx_mascotte_unlocked: '[5,15]',
      brx_mascotte_wardrobe_v1: JSON.stringify({
        clothing: 'hoodie',
        accessories: ['cap-baseball'],
        objects: ['coffee'],
        faceColor: 'electric-cyan',
      }),
      brx_asso_sleep_muted: 'true',
      brx_asso_interacted: 'true',
      brx_asso_sleep_ms: '123456',
    });

    const state = loadAssoState(storage);

    expect(state.flips).toBe(42);
    expect(state.unlockedVariants).toEqual([5, 15]);
    expect(state.wardrobe.clothing).toBe('hoodie');
    expect(state.wardrobe.faceColor).toBe('electric-cyan');
    expect(state.muted).toBe(true);
    expect(state.interacted).toBe(true);

    // Chiavi legacy rimosse, nuovo formato scritto
    expect(storage.getItem('brx_mascotte_flips')).toBeNull();
    expect(storage.getItem('brx_asso_sleep_ms')).toBeNull();
    expect(storage.getItem(ASSO_STORAGE_KEY)).not.toBeNull();
  });

  it('scarta item droppati dal guardaroba legacy (es. cigar-xl, leather-jacket)', () => {
    const storage = fakeStorage({
      brx_mascotte_wardrobe_v1: JSON.stringify({
        clothing: 'leather-jacket',
        accessories: ['cigar-xl', 'sunglasses-wayfarer'],
        objects: ['balloon', 'laptop'],
        faceColor: 'neon-orange',
      }),
    });

    const state = loadAssoState(storage);
    expect(state.wardrobe.clothing).toBeNull();
    expect(state.wardrobe.accessories).toEqual(['sunglasses-wayfarer']);
    expect(state.wardrobe.objects).toEqual(['laptop']);
  });

  it('dati corrotti → default senza lanciare', () => {
    const storage = fakeStorage({ [ASSO_STORAGE_KEY]: '{not json' });
    const state = loadAssoState(storage);
    expect(state.flips).toBe(0);
    expect(state.wardrobe.faceColor).toBe('neon-orange');
  });

  it('round-trip: load dopo save restituisce lo stesso stato', () => {
    const storage = fakeStorage({ brx_mascotte_flips: '7' });
    const first = loadAssoState(storage);
    const second = loadAssoState(storage);
    expect(second).toEqual(first);
  });
});

describe('sanitizeWardrobe', () => {
  it('categoria sbagliata per lo slot → scartato', () => {
    const wardrobe = sanitizeWardrobe({
      clothing: 'laptop', // è un object, non clothing
      accessories: ['hoodie'], // è clothing
      objects: ['cap-baseball'], // è accessory
      faceColor: 'hot-pink',
    });
    expect(wardrobe.clothing).toBeNull();
    expect(wardrobe.accessories).toEqual([]);
    expect(wardrobe.objects).toEqual([]);
    expect(wardrobe.faceColor).toBe('hot-pink');
  });

  it('oggetti oltre il limite → tiene gli ultimi 2', () => {
    const wardrobe = sanitizeWardrobe({
      objects: ['laptop', 'coffee', 'trophy'],
    });
    expect(wardrobe.objects).toEqual(['coffee', 'trophy']);
  });
});
