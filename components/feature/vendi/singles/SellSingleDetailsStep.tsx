'use client';

import Image from 'next/image';
import { CardLanguageSelect } from '@/components/ui/CardLanguageSelect';
import type { CardLanguageOption } from '@/lib/card-languages';
import { sellSingleConditionLabel } from '@/lib/marketplace/sell-single-conditions';
import type { SellSingleDraft } from '@/lib/marketplace/sell-single-draft';
import { cn, formatEuroNoSpace } from '@/lib/utils';

type SellSingleDetailsStepProps = {
  draft: SellSingleDraft;
  update: <K extends keyof SellSingleDraft>(key: K, value: SellSingleDraft[K]) => void;
  cardTitle: string;
  imageSrc: string | null;
  languageOptions: CardLanguageOption[];
  unitPrice: number;
  totalPrice: number;
  compact?: boolean;
  onOpenConditionPicker: () => void;
};

export function SellSingleDetailsStep({
  draft,
  update,
  cardTitle,
  imageSrc,
  languageOptions,
  unitPrice,
  totalPrice,
  compact = false,
  onOpenConditionPicker,
}: SellSingleDetailsStepProps) {
  const formatEuro = (n: number) => formatEuroNoSpace(n, 'it-IT');
  const qty = Number.isFinite(draft.quantity) ? Math.max(1, draft.quantity) : 1;

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {imageSrc && (
        <div
          className={cn(
            'relative mx-auto h-32 w-[5.5rem] shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 sm:mx-0',
            compact && 'h-24 w-[4.5rem]',
          )}
        >
          <Image src={imageSrc} alt="" fill className="object-contain" sizes="88px" unoptimized />
        </div>
      )}
      <div>
        <p className={cn('text-xs font-bold uppercase tracking-wide text-zinc-500', compact && 'text-[10px]')}>
          Prodotto
        </p>
        <p className={cn('mt-0.5 text-sm font-semibold text-zinc-900', compact && 'text-xs')}>{cardTitle}</p>
      </div>

      <div className={cn('grid grid-cols-2 gap-2', compact && 'gap-1.5')}>
        <div>
          <label className={cn('mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400', compact && 'text-[10px]')}>
            Quantità
          </label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => update('quantity', Number(e.target.value) || 1)}
            className={cn(
              'w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-xs font-medium text-zinc-900 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10',
              compact && 'rounded-md py-1 text-[13px]',
            )}
          />
        </div>
        <div>
          <label className={cn('mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400', compact && 'text-[10px]')}>
            Prezzo (€)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={draft.price}
            onChange={(e) => update('price', e.target.value)}
            className={cn(
              'w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-xs font-medium text-zinc-900 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10',
              compact && 'rounded-md py-1 text-[13px]',
            )}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={cn('mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400', compact && 'text-[10px]')}>
            Lingua
          </label>
          <CardLanguageSelect
            options={languageOptions}
            value={draft.language}
            onChange={(code) => update('language', code)}
            className={cn(
              compact && '[&_button]:rounded-md [&_button]:border-zinc-200/80 [&_button]:bg-zinc-50/40 [&_button]:px-2 [&_button]:py-1 [&_button]:text-[13px]',
            )}
          />
        </div>
        <div>
          <label className={cn('mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400', compact && 'text-[10px]')}>
            Condizione
          </label>
          <button
            type="button"
            onClick={onOpenConditionPicker}
            className={cn(
              'w-full truncate rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-left text-xs font-medium text-zinc-900 transition-colors hover:border-zinc-300',
              compact && 'rounded-md py-1 text-[13px]',
            )}
          >
            {sellSingleConditionLabel(draft.condition)}
          </button>
        </div>
      </div>

      <div>
        <label className={cn('mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400', compact && 'text-[10px]')}>
          Note
        </label>
        <input
          type="text"
          value={draft.comments}
          onChange={(e) => update('comments', e.target.value)}
          placeholder="Commenti per acquirente (solo UI)"
          className={cn(
            'w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-xs font-medium text-zinc-900 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10',
            compact && 'rounded-md py-1 text-[13px]',
          )}
        />
      </div>

      <div className={cn('grid grid-cols-3 gap-1.5', compact && 'gap-1')}>
        <div className="rounded-lg bg-zinc-50/80 p-1.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Unit.</p>
          <p className="mt-0.5 text-xs font-extrabold text-zinc-800">{formatEuro(unitPrice)}</p>
        </div>
        <div className="rounded-lg bg-sky-50/60 p-1.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600/80">Qtà</p>
          <p className="mt-0.5 text-xs font-extrabold text-sky-700">{new Intl.NumberFormat('it-IT').format(qty)}</p>
        </div>
        <div className="rounded-lg bg-amber-50/70 p-1.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600/80">Tot.</p>
          <p className="mt-0.5 text-xs font-extrabold text-amber-700">{formatEuro(totalPrice)}</p>
        </div>
      </div>

      <div className={cn('flex flex-wrap items-center gap-3', compact && 'gap-2')}>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
          <input
            type="checkbox"
            checked={draft.extraFoil}
            onChange={(e) => update('extraFoil', e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary/25"
          />
          Foil
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
          <input
            type="checkbox"
            checked={draft.extraSigned}
            onChange={(e) => update('extraSigned', e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary/25"
          />
          Firmata
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500" title="Non ancora supportato dal backend">
          <input
            type="checkbox"
            checked={draft.extraAltered}
            onChange={(e) => update('extraAltered', e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary/25"
          />
          Alterata
        </label>
      </div>
    </div>
  );
}
