'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FoilSelectorProps {
  /** true = mostra solo le inserzioni foil; false = mostra tutto (default). */
  soloFoil: boolean;
  onChange: (soloFoil: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

const OPTIONS: { value: boolean; label: string }[] = [
  { value: false, label: 'Tutte' },
  { value: true, label: 'Foil' },
];

/**
 * Selettore foil mostrato sopra l'immagine della carta. Filtra le inserzioni
 * del marketplace condividendo lo stato con il filtro "Solo foil" del pannello.
 * Di base ("Tutte") mostra ogni inserzione; "Foil" lascia solo le carte foil.
 */
export function FoilSelector({ soloFoil, onChange, size = 'md', className }: FoilSelectorProps) {
  const sm = size === 'sm';
  return (
    <div
      role="radiogroup"
      aria-label="Filtra per foil"
      className={cn(
        'inline-flex items-center rounded-full border border-zinc-200 bg-white p-0.5 shadow-sm',
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const active = soloFoil === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide transition-colors',
              sm ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1 text-[10px]',
              active
                ? opt.value
                  ? 'bg-gradient-to-r from-[#FF8A26] to-[#FF7300] text-white shadow-sm'
                  : 'bg-[#1D3160] text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            {opt.value && <Sparkles className={cn(sm ? 'h-2.5 w-2.5' : 'h-3 w-3')} aria-hidden />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
