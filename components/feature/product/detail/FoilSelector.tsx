'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface FoilSelectorProps {
  /** true = mostra solo le inserzioni foil; false = mostra tutto (default). */
  soloFoil: boolean;
  onChange: (soloFoil: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Toggle foil sopra l'immagine della carta. Condivise lo stato con il filtro
 * "Solo foil" del pannello marketplace.
 */
export function FoilSelector({ soloFoil, onChange, size = 'md', className }: FoilSelectorProps) {
  const { t } = useTranslation();
  const sm = size === 'sm';
  const label = t('productDetail.filters.traitFoil');

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-2xl border px-3 transition-colors duration-200',
        sm ? 'py-1.5' : 'py-2',
        soloFoil
          ? 'border-orange-200/90 bg-orange-50/50'
          : 'border-zinc-200/80 bg-white/90 shadow-sm',
        className
      )}
    >
      <span
        className={cn(
          'font-medium',
          sm ? 'text-[11px]' : 'text-xs',
          soloFoil ? 'text-orange-900' : 'text-zinc-600'
        )}
      >
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={soloFoil}
        aria-label={label}
        onClick={() => onChange(!soloFoil)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8800]/30',
          sm ? 'h-5 w-9' : 'h-6 w-10',
          soloFoil ? 'bg-[#FF8800]' : 'bg-zinc-200'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
            sm ? 'h-4 w-4' : 'h-5 w-5',
            soloFoil ? (sm ? 'translate-x-[18px]' : 'translate-x-[18px]') : 'translate-x-0.5'
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}
