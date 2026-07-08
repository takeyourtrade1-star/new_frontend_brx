// Persistenza unificata della mascotte Asso (PLAN/13.10).
// Una sola chiave versionata al posto delle 7 chiavi legacy sparse.
// La migrazione avviene una volta al primo load e rimuove le chiavi vecchie.

import { DEFAULT_FACE_COLOR_ID, isValidFaceColorId } from './faceColors';
import { MAX_EQUIPPED_OBJECTS, WARDROBE_ITEMS_BY_ID, type EquippedItems } from './wardrobe/manifest';

export const ASSO_STORAGE_KEY = 'brx_asso_v1';

export interface AssoPersistedState {
  version: 1;
  flips: number;
  /** Soglie di unlock dei retro carta già celebrati. */
  unlockedVariants: number[];
  wardrobe: EquippedItems;
  muted: boolean;
  interacted: boolean;
}

export const ASSO_DEFAULT_PERSISTED: AssoPersistedState = {
  version: 1,
  flips: 0,
  unlockedVariants: [],
  wardrobe: {
    clothing: null,
    accessories: [],
    objects: [],
    faceColor: DEFAULT_FACE_COLOR_ID,
  },
  muted: false,
  interacted: false,
};

const LEGACY_KEYS = [
  'brx_mascotte_flips',
  'brx_mascotte_unlocked',
  'brx_mascotte_wardrobe_v1',
  'brx_asso_sleep_muted',
  'brx_asso_sleep_ms',
  'brx_asso_interacted',
] as const;

function isCategoryId(id: unknown, category: 'clothing' | 'accessories' | 'objects'): id is string {
  if (typeof id !== 'string') return false;
  return WARDROBE_ITEMS_BY_ID.get(id)?.category === category;
}

/** Normalizza un wardrobe arbitrario: scarta id sconosciuti/droppati. */
export function sanitizeWardrobe(raw: unknown): EquippedItems {
  const parsed = (raw ?? {}) as Partial<EquippedItems>;
  return {
    clothing: isCategoryId(parsed.clothing, 'clothing') ? parsed.clothing : null,
    accessories: Array.isArray(parsed.accessories)
      ? parsed.accessories.filter((id) => isCategoryId(id, 'accessories'))
      : [],
    objects: Array.isArray(parsed.objects)
      ? parsed.objects.filter((id) => isCategoryId(id, 'objects')).slice(-MAX_EQUIPPED_OBJECTS)
      : [],
    faceColor: isValidFaceColorId(parsed.faceColor) ? parsed.faceColor : DEFAULT_FACE_COLOR_ID,
  };
}

function sanitizePersisted(raw: unknown): AssoPersistedState {
  const parsed = (raw ?? {}) as Partial<AssoPersistedState>;
  return {
    version: 1,
    flips: typeof parsed.flips === 'number' && Number.isFinite(parsed.flips) && parsed.flips >= 0
      ? Math.floor(parsed.flips)
      : 0,
    unlockedVariants: Array.isArray(parsed.unlockedVariants)
      ? parsed.unlockedVariants.filter((v): v is number => typeof v === 'number')
      : [],
    wardrobe: sanitizeWardrobe(parsed.wardrobe),
    muted: parsed.muted === true,
    interacted: parsed.interacted === true,
  };
}

function migrateLegacy(storage: Storage): AssoPersistedState {
  const state: AssoPersistedState = {
    ...ASSO_DEFAULT_PERSISTED,
    wardrobe: { ...ASSO_DEFAULT_PERSISTED.wardrobe },
  };

  try {
    const flips = parseInt(storage.getItem('brx_mascotte_flips') ?? '', 10);
    if (Number.isFinite(flips) && flips > 0) state.flips = flips;

    const unlocked = JSON.parse(storage.getItem('brx_mascotte_unlocked') ?? '[]') as unknown;
    if (Array.isArray(unlocked)) {
      state.unlockedVariants = unlocked.filter((v): v is number => typeof v === 'number');
    }

    const wardrobeRaw = storage.getItem('brx_mascotte_wardrobe_v1');
    if (wardrobeRaw) state.wardrobe = sanitizeWardrobe(JSON.parse(wardrobeRaw));

    state.muted = storage.getItem('brx_asso_sleep_muted') === 'true';
    state.interacted = storage.getItem('brx_asso_interacted') === 'true';
  } catch {
    // Dati legacy corrotti: si riparte dai default.
  }

  for (const key of LEGACY_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      // Storage in sola lettura: ignora.
    }
  }

  return state;
}

/**
 * Carica lo stato persistito; se assente migra dalle chiavi legacy
 * (rimuovendole) e salva subito nel nuovo formato.
 */
export function loadAssoState(storage: Storage | null = getStorage()): AssoPersistedState {
  if (!storage) return { ...ASSO_DEFAULT_PERSISTED, wardrobe: { ...ASSO_DEFAULT_PERSISTED.wardrobe } };
  try {
    const raw = storage.getItem(ASSO_STORAGE_KEY);
    if (raw) return sanitizePersisted(JSON.parse(raw));
  } catch {
    // JSON corrotto: prova la migrazione / default.
  }
  const migrated = migrateLegacy(storage);
  saveAssoState(migrated, storage);
  return migrated;
}

export function saveAssoState(state: AssoPersistedState, storage: Storage | null = getStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(ASSO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota piena / private mode: ignora.
  }
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
