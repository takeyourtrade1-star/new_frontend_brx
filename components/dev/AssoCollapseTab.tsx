'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ASSO_LAYOUT,
  getAssoCollapseButtonBottom,
  getAssoMascotBottom,
} from '@/lib/asso-layout';

type AssoCollapseTabProps = {
  collapsed: boolean;
  isStickyBarVisible: boolean;
  onToggle: () => void;
};

/**
 * Freccia per nascondere Asso (→) o riaprirlo (←) senza perdere la preferenza.
 */
export function AssoCollapseTab({ collapsed, isStickyBarVisible, onToggle }: AssoCollapseTabProps) {
  if (collapsed) {
    const bottom = getAssoMascotBottom(isStickyBarVisible) + 40;
    return (
      <button
        type="button"
        onClick={onToggle}
        className="fixed flex items-center justify-center rounded-l-xl border border-r-0 border-white/20 bg-zinc-900/90 text-white shadow-lg backdrop-blur-md transition-all hover:bg-zinc-800/95 hover:pl-0.5 active:scale-[0.98]"
        style={{
          zIndex: 10004,
          right: 0,
          bottom,
          width: ASSO_LAYOUT.collapsedTabWidth,
          height: 52,
        }}
        aria-label="Mostra Asso"
        title="Mostra Asso"
      >
        <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
      </button>
    );
  }

  const bottom = getAssoCollapseButtonBottom(isStickyBarVisible);
  const right = ASSO_LAYOUT.mascotRight + ASSO_LAYOUT.mascotWidth + 6;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="fixed flex items-center justify-center rounded-full border border-white/25 bg-zinc-900/75 text-white shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:bg-zinc-800/90 active:scale-95"
      style={{
        zIndex: 10004,
        right,
        bottom,
        width: 32,
        height: 32,
      }}
      aria-label="Nascondi Asso"
      title="Nascondi Asso"
    >
      <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
