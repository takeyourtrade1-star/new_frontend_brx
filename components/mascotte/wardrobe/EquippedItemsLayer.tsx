'use client';

// Layer degli item equipaggiati (PLAN/13.4): ogni item è un chunk lazy,
// scaricato solo quando è equipaggiato (o mostrato come thumbnail nel pannello).

import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  WARDROBE_ITEMS_BY_ID,
  WARDROBE_ITEM_LOADERS,
  getSlotStyle,
  type EquippedItems,
} from './manifest';

// React.lazy va creato una sola volta a livello modulo (non per-render).
const LAZY_ITEM_ART: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  Object.entries(WARDROBE_ITEM_LOADERS).map(([id, loader]) => [id, lazy(loader)])
);

/** Arte di un singolo item, lazy con fallback vuoto. */
export function LazyItemArt({ itemId }: { itemId: string }) {
  const Art = LAZY_ITEM_ART[itemId];
  if (!Art) return null;
  return (
    <Suspense fallback={null}>
      <Art />
    </Suspense>
  );
}

export function EquippedItemsLayer({ equipped }: { equipped: EquippedItems }) {
  const ids = [
    ...(equipped.clothing ? [equipped.clothing] : []),
    ...equipped.accessories,
    ...equipped.objects,
  ];

  const items = ids
    .map((id) => WARDROBE_ITEMS_BY_ID.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <>
      {items.map((item) => (
        <div key={item.id} aria-hidden="true" style={getSlotStyle(item, equipped.objects)}>
          <div
            className={`asso-item-art h-full w-full ${item.category === 'objects' ? 'asso-item-float' : ''}`}
          >
            <LazyItemArt itemId={item.id} />
          </div>
        </div>
      ))}
    </>
  );
}
