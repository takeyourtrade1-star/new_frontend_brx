'use client';

import type { Ref } from 'react';
import { Minus, Plus } from 'lucide-react';

export interface ProductDetailQtyPopupProps {
  open: boolean;
  qtyValue: number;
  qtyInputRef: Ref<HTMLInputElement>;
  onClose: () => void;
  onQtyChange: (value: number) => void;
  onDecrement: () => void;
  onIncrement: () => void;
  onConfirm: () => void;
}

export function ProductDetailQtyPopup({
  open,
  qtyValue,
  qtyInputRef,
  onClose,
  onQtyChange,
  onDecrement,
  onIncrement,
  onConfirm,
}: ProductDetailQtyPopupProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-6 py-5 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-white">Quantità</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDecrement}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            ref={qtyInputRef}
            type="number"
            min={1}
            value={qtyValue}
            onChange={(e) => onQtyChange(Math.max(1, parseInt(e.target.value || '1', 10)))}
            onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
            className="h-10 w-16 rounded-lg border border-white/20 bg-white/5 text-center text-lg font-bold text-white outline-none focus:border-[#FF7300]/60"
          />
          <button
            type="button"
            onClick={onIncrement}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-1 flex h-10 items-center justify-center rounded-full bg-[#FF7300] px-6 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#FF8800] active:scale-95"
        >
          Conferma
        </button>
      </div>
    </div>
  );
}
