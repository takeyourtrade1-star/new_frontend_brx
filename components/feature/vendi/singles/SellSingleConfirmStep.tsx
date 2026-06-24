'use client';

import type { ReactNode } from 'react';
import { sellSingleConditionLabel } from '@/lib/marketplace/sell-single-conditions';
import type { SellSingleDraft } from '@/lib/marketplace/sell-single-draft';
import type { CardLanguageOption } from '@/lib/card-languages';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';

type SellSingleConfirmStepProps = {
  draft: SellSingleDraft;
  cardTitle: string;
  languageOptions: CardLanguageOption[];
  unitPrice: number;
  totalPrice: number;
  compact?: boolean;
  children: ReactNode;
};

export function SellSingleConfirmStep({
  draft,
  cardTitle,
  languageOptions,
  unitPrice,
  totalPrice,
  compact = false,
  children,
}: SellSingleConfirmStepProps) {
  const intlLocale = useIntlLocale();
  const formatEuro = (n: number) => formatEuroNoSpace(n, intlLocale);
  const langLabel =
    languageOptions.find((o) => o.code === draft.language)?.label ?? draft.language.toUpperCase();
  const qty = Number.isFinite(draft.quantity) ? Math.max(1, draft.quantity) : 1;

  return (
    <div className={cn('space-y-2.5', compact && 'space-y-2')}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-2',
          compact && 'p-1.5',
        )}
      >
        <span className="max-w-full truncate text-[11px] font-semibold text-zinc-900">{cardTitle}</span>
        <span className="text-zinc-300">·</span>
        <span className="text-[10px] font-bold tabular-nums text-primary">{formatEuro(unitPrice)}</span>
        <span className="text-[10px] text-zinc-400">×</span>
        <span className="text-[10px] font-bold tabular-nums text-zinc-700">{qty}</span>
        <span className="text-[10px] text-zinc-400">=</span>
        <span className="text-[10px] font-extrabold tabular-nums text-amber-700">{formatEuro(totalPrice)}</span>
        <span className="hidden text-zinc-300 sm:inline">·</span>
        <span className="text-[10px] text-zinc-600">{sellSingleConditionLabel(draft.condition)}</span>
        <span className="text-[10px] text-zinc-400">·</span>
        <span className="text-[10px] text-zinc-600">{langLabel}</span>
        {(draft.extraFoil || draft.extraSigned || draft.extraAltered) && (
          <>
            <span className="text-[10px] text-zinc-400">·</span>
            <span className="text-[10px] text-zinc-600">
              {[draft.extraFoil && 'Foil', draft.extraSigned && 'Firmata', draft.extraAltered && 'Alterata']
                .filter(Boolean)
                .join(', ')}
            </span>
          </>
        )}
      </div>

      <div>
        <p className={cn('mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500', compact && 'mb-1')}>
          Foto oggetto reale
        </p>
        {children}
      </div>
    </div>
  );
}
