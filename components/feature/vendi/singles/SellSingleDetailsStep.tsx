'use client';

import { CardLanguageSelect } from '@/components/ui/CardLanguageSelect';
import { CustomSelect } from '@/components/ui/CustomSelect';
import type { CardLanguageOption } from '@/lib/card-languages';
import { SELL_SINGLE_CONDITION_OPTIONS } from '@/lib/marketplace/sell-single-conditions';
import type { SellSingleDraft } from '@/lib/marketplace/sell-single-draft';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { Minus, Plus } from 'lucide-react';

type SellSingleDetailsStepProps = {
  draft: SellSingleDraft;
  update: <K extends keyof SellSingleDraft>(key: K, value: SellSingleDraft[K]) => void;
  cardTitle: string;
  languageOptions: CardLanguageOption[];
  unitPrice: number;
  totalPrice: number;
  compact?: boolean;
  onConditionChange: (value: string) => void;
};

export function SellSingleDetailsStep({
  draft,
  update,
  cardTitle,
  languageOptions,
  unitPrice,
  totalPrice,
  compact = false,
  onConditionChange,
}: SellSingleDetailsStepProps) {
  const intlLocale = useIntlLocale();
  const formatEuro = (n: number) => formatEuroNoSpace(n, intlLocale);
  const qty = Number.isFinite(draft.quantity) ? Math.max(1, draft.quantity) : 1;

  return (
    <div className={cn('space-y-2.5', compact && 'space-y-2')}>
      <p
        className={cn(
          'truncate text-[11px] font-semibold leading-snug text-zinc-800',
          compact && 'text-[10px]',
        )}
        title={cardTitle}
      >
        {cardTitle}
      </p>

      <div className={cn('grid grid-cols-2 gap-2', compact && 'gap-1.5')}>
        <div>
          <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Quantità
          </label>
          <div className="inline-flex w-full items-center rounded-md border border-zinc-200 bg-white">
            <button
              type="button"
              onClick={() => update('quantity', Math.max(1, qty - 1))}
              disabled={qty <= 1}
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40',
                compact && 'h-7 w-7',
              )}
              aria-label="Diminuisci quantità"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => update('quantity', Number(e.target.value) || 1)}
              style={{ MozAppearance: 'textfield' }}
              className={cn(
                'h-8 w-full min-w-0 border-x border-zinc-200 bg-zinc-50/50 px-2 py-1 text-[13px] font-medium text-zinc-900 text-center focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden',
                compact && 'h-7 py-0.5 text-xs',
              )}
            />
            <button
              type="button"
              onClick={() => update('quantity', qty + 1)}
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40',
                compact && 'h-7 w-7',
              )}
              aria-label="Aumenta quantità"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Prezzo (€)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={draft.price}
            onChange={(e) => update('price', e.target.value)}
            className={cn(
              'w-full rounded-md border border-zinc-200 bg-zinc-50/50 px-2 py-1 text-[13px] font-medium text-zinc-900 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10',
              compact && 'py-0.5 text-xs',
            )}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Lingua
          </label>
          <CardLanguageSelect
            options={languageOptions}
            value={draft.language}
            onChange={(code) => update('language', code)}
            className={cn(
              compact &&
                '[&_button]:rounded-md [&_button]:border-zinc-200/80 [&_button]:bg-zinc-50/40 [&_button]:px-2 [&_button]:py-0.5 [&_button]:text-xs',
            )}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            Condizione
          </label>
          <CustomSelect
            options={SELL_SINGLE_CONDITION_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            value={draft.condition}
            onChange={(value) => onConditionChange(value)}
            className={cn(
              compact &&
                '[&_button]:rounded-md [&_button]:border-zinc-200/80 [&_button]:bg-zinc-50/40 [&_button]:px-2 [&_button]:py-0.5 [&_button]:text-xs',
            )}
          />
        </div>
      </div>

      <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', compact && 'gap-x-2')}>
        <label className="flex items-center gap-1 text-[10px] font-semibold text-zinc-600">
          <input
            type="checkbox"
            checked={draft.extraFoil}
            onChange={(e) => update('extraFoil', e.target.checked)}
            className="h-3 w-3 rounded border-zinc-300 text-primary focus:ring-primary/25"
          />
          Foil
        </label>
        <label className="flex items-center gap-1 text-[10px] font-semibold text-zinc-600">
          <input
            type="checkbox"
            checked={draft.extraSigned}
            onChange={(e) => update('extraSigned', e.target.checked)}
            className="h-3 w-3 rounded border-zinc-300 text-primary focus:ring-primary/25"
          />
          Firmata
        </label>
        <label
          className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500"
          title="Non ancora supportato dal backend"
        >
          <input
            type="checkbox"
            checked={draft.extraAltered}
            onChange={(e) => update('extraAltered', e.target.checked)}
            className="h-3 w-3 rounded border-zinc-300 text-primary focus:ring-primary/25"
          />
          Alterata
        </label>
        <label className="flex items-center gap-1 text-[10px] font-semibold text-zinc-600">
          <input
            type="checkbox"
            checked={draft.extraGraded}
            onChange={(e) => update('extraGraded', e.target.checked)}
            className="h-3 w-3 rounded border-zinc-300 text-primary focus:ring-primary/25"
          />
          Gradata
        </label>
      </div>

      <div className={cn('grid grid-cols-3 gap-1', compact && 'gap-0.5')}>
        <div className="rounded-md bg-zinc-50/80 px-1.5 py-1 text-center">
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Unit.</p>
          <p className="text-[11px] font-extrabold tabular-nums text-zinc-800">{formatEuro(unitPrice)}</p>
        </div>
        <div className="rounded-md bg-sky-50/60 px-1.5 py-1 text-center">
          <p className="text-[8px] font-bold uppercase tracking-wider text-sky-600/80">Qtà</p>
          <p className="text-[11px] font-extrabold tabular-nums text-sky-700">
            {new Intl.NumberFormat(intlLocale).format(qty)}
          </p>
        </div>
        <div className="rounded-md bg-amber-50/70 px-1.5 py-1 text-center">
          <p className="text-[8px] font-bold uppercase tracking-wider text-amber-600/80">Tot.</p>
          <p className="text-[11px] font-extrabold tabular-nums text-amber-700">{formatEuro(totalPrice)}</p>
        </div>
      </div>
    </div>
  );
}
