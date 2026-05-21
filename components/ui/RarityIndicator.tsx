'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getRarityInfo } from '@/lib/rarity';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useRarityLegendOptional } from '@/components/ui/RarityLegendProvider';
import { RarityLegendModal } from '@/components/ui/RarityLegendModal';

type RarityIndicatorProps = {
  rarity?: string | null;
  /** Mostra etichetta testuale accanto al pallino. */
  showLabel?: boolean;
  /** Dimensione pallino: sm per tabella, md per dettaglio. */
  size?: 'sm' | 'md';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
};

const SIZE_CLASSES = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3.5 w-3.5',
} as const;

export function RarityIndicator({
  rarity,
  showLabel = false,
  size = 'sm',
  className,
  onClick,
}: RarityIndicatorProps) {
  const { t } = useTranslation();
  const legendCtx = useRarityLegendOptional();
  const [localLegendOpen, setLocalLegendOpen] = useState(false);
  const info = getRarityInfo(rarity);
  const label = info.rawLabel ?? (info.key !== 'unknown' ? t(info.labelKey) : '–');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick?.(e);
    if (legendCtx) {
      legendCtx.openLegend();
    } else {
      setLocalLegendOpen(true);
    }
  };

  if (!rarity?.trim() && !showLabel) {
    return <span className="text-xs text-gray-400 tabular-nums">–</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full transition-opacity hover:opacity-80 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/40',
          showLabel ? 'px-0.5' : 'p-0.5',
          className
        )}
        aria-label={t('rarity.openLegend', { name: label })}
        title={label}
      >
        <span
          className={cn('shrink-0 rounded-full ring-1 ring-black/10', SIZE_CLASSES[size])}
          style={{ backgroundColor: info.color }}
          aria-hidden
        />
        {showLabel && (
          <span className="text-xs font-semibold text-gray-700">{label}</span>
        )}
      </button>
      {!legendCtx && (
        <RarityLegendModal open={localLegendOpen} onClose={() => setLocalLegendOpen(false)} />
      )}
    </>
  );
}
