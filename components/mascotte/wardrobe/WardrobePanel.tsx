'use client';

// Pannello guardaroba (PLAN/13.4-13.5): caricato via dynamic() solo all'apertura.
// Thumbnails = stessi componenti lazy dell'arte equipaggiata (chunk condiviso).

import { useState, type MouseEvent } from 'react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { FACE_COLOR_OPTIONS } from '../faceColors';
import { LazyItemArt } from './EquippedItemsLayer';
import { WARDROBE_ITEMS, type EquippedItems, type WardrobeItemMeta } from './manifest';

type PanelCategory = 'clothing' | 'accessories' | 'objects' | 'color';

export interface WardrobePanelProps {
  zIndex: number;
  isStickyBarVisible: boolean;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  equipped: EquippedItems;
  onToggleItem: (item: WardrobeItemMeta) => void;
  onSetFaceColor: (id: string) => void;
  onReset: () => void;
  onDone: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function WardrobePanel({
  zIndex,
  isStickyBarVisible,
  t,
  equipped,
  onToggleItem,
  onSetFaceColor,
  onReset,
  onDone,
}: WardrobePanelProps) {
  const [category, setCategory] = useState<PanelCategory>('clothing');

  const visibleItems = category === 'color'
    ? []
    : WARDROBE_ITEMS.filter((item) => item.category === category);

  const isEquipped = (item: WardrobeItemMeta) =>
    item.category === 'clothing'
      ? equipped.clothing === item.id
      : item.category === 'accessories'
        ? equipped.accessories.includes(item.id)
        : equipped.objects.includes(item.id);

  return (
    <div
      className="fixed"
      style={{
        zIndex,
        bottom: isStickyBarVisible ? '260px' : '200px',
        right: '16px',
        animation: 'albumSlideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
    >
      <div className="relative w-[250px] max-w-[calc(100vw-1.5rem)] max-h-[360px] overflow-hidden rounded-2xl border border-white/35 bg-[linear-gradient(165deg,rgba(255,210,165,0.36)_0%,rgba(255,142,42,0.24)_40%,rgba(25,24,32,0.9)_100%)] p-2.5 shadow-[0_20px_46px_rgba(255,115,0,0.35)] ring-1 ring-white/20 backdrop-blur-2xl">
        <div className="pointer-events-none absolute -top-12 left-1/2 h-24 w-44 -translate-x-1/2 rounded-full bg-white/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-[#ff7300]/25 blur-2xl" />

        <div className="relative z-[1]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/85">{t('asso.wardrobe.title')}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/90 transition hover:bg-white/25"
              >
                {t('asso.wardrobe.reset')}
              </button>
              <button
                type="button"
                onClick={onDone}
                className="rounded-full border border-[#FFB26B]/70 bg-gradient-to-r from-[#FF7300]/95 to-[#FFA246]/90 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(255,115,0,0.35)] transition hover:brightness-110"
              >
                {t('asso.wardrobe.done')}
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-4 gap-1">
            {(['clothing', 'accessories', 'objects', 'color'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCategory(cat);
                }}
                className={`min-w-0 overflow-hidden rounded-lg border px-1 py-1 text-[7px] font-bold uppercase leading-none tracking-[0.01em] transition ${category === cat
                  ? 'border-white/40 bg-gradient-to-r from-[#FF7300]/95 to-[#FFA246]/90 text-white shadow-[0_6px_16px_rgba(255,115,0,0.35)]'
                  : 'border-white/15 bg-black/20 text-white/75 hover:border-white/30 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span className="block w-full truncate">
                  {cat === 'clothing'
                    ? t('asso.wardrobe.category.clothing')
                    : cat === 'accessories'
                      ? t('asso.wardrobe.category.accessories')
                      : cat === 'objects'
                        ? t('asso.wardrobe.category.objects')
                        : t('asso.wardrobe.category.color')}
                </span>
              </button>
            ))}
          </div>

          {category === 'color' ? (
            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-black/15 p-1.5 sm:grid-cols-3">
              {FACE_COLOR_OPTIONS.map((option) => {
                const isActive = equipped.faceColor === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActive) onSetFaceColor(option.id);
                    }}
                    className={`flex items-center rounded-lg border px-2 py-1.5 text-left transition ${isActive
                      ? 'border-[#FFB26B]/80 bg-[#FF7300]/30 text-white shadow-[0_8px_18px_rgba(255,115,0,0.25)]'
                      : 'border-white/15 bg-black/20 text-white/85 hover:border-white/30 hover:bg-white/10'
                      }`}
                  >
                    <span className="flex items-center gap-1.5 truncate text-[9px] font-semibold">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: option.line,
                          boxShadow: `0 0 8px ${option.glowMid}`,
                        }}
                      />
                      {t(option.nameKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="max-h-[250px] overflow-y-auto rounded-xl border border-white/10 bg-black/15 p-1.5 pr-1">
              <div className="grid grid-cols-3 gap-1.5">
                {visibleItems.map((item) => {
                  const active = isEquipped(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleItem(item);
                      }}
                      className={`group flex min-h-[74px] flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center transition ${active
                        ? 'border-[#FFB26B]/80 bg-[linear-gradient(155deg,rgba(255,150,70,0.38)_0%,rgba(255,115,0,0.28)_55%,rgba(0,0,0,0.38)_100%)] text-white shadow-[0_10px_22px_rgba(255,115,0,0.28)]'
                        : 'border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_45%,rgba(0,0,0,0.32)_100%)] text-white/85 hover:border-white/30 hover:bg-white/10'
                        }`}
                    >
                      <span className={`relative flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border p-0.5 ${active ? 'border-white/40 bg-white/25' : 'border-white/20 bg-white/10'}`}>
                        <span className="asso-item-art h-full w-full">
                          <LazyItemArt itemId={item.id} />
                        </span>
                      </span>
                      <span className="w-full truncate text-[8px] font-semibold leading-tight">{t(item.nameKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
