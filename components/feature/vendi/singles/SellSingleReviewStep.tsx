'use client';

import Image from 'next/image';
import { ListingPhotoThumbnailsRow } from './ListingPhotoUpload';
import { sellSingleConditionLabel } from '@/lib/marketplace/sell-single-conditions';
import type { SellSingleDraft } from '@/lib/marketplace/sell-single-draft';
import type { CardLanguageOption } from '@/lib/card-languages';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';

type SellSingleReviewStepProps = {
  draft: SellSingleDraft;
  cardTitle: string;
  imageSrc: string | null;
  languageOptions: CardLanguageOption[];
  unitPrice: number;
  totalPrice: number;
  compact?: boolean;
};

export function SellSingleReviewStep({
  draft,
  cardTitle,
  imageSrc,
  languageOptions,
  unitPrice,
  totalPrice,
  compact = false,
}: SellSingleReviewStepProps) {
  const intlLocale = useIntlLocale();
  const formatEuro = (n: number) => formatEuroNoSpace(n, intlLocale);
  const langLabel =
    languageOptions.find((o) => o.code === draft.language)?.label ?? draft.language.toUpperCase();
  const qty = Number.isFinite(draft.quantity) ? Math.max(1, draft.quantity) : 1;

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      <div
        className={cn(
          'rounded-xl border border-[#1D3160]/15 bg-[#f8f9fb] p-4',
          compact && 'rounded-lg border-zinc-200/60 bg-zinc-50/80 p-2.5',
        )}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-[#1D3160]">Riepilogo inserzione</p>
        <p className={cn('mt-2 text-sm leading-relaxed text-gray-700', compact && 'mt-1 text-[11px]')}>
          Verifica i dati prima di pubblicare sul marketplace EBARTEX.
        </p>
      </div>

      <div className={cn('flex gap-3', compact && 'gap-2')}>
        {imageSrc && (
          <div
            className={cn(
              'relative h-20 w-[3.75rem] shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100',
              compact && 'h-16 w-12',
            )}
          >
            <Image src={imageSrc} alt="" fill className="object-contain" sizes="60px" unoptimized />
          </div>
        )}
        <dl className={cn('min-w-0 flex-1 divide-y divide-gray-100 text-sm', compact && 'text-xs')}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Titolo</dt>
            <dd className="text-right font-medium text-gray-900">{cardTitle}</dd>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Prezzo unit.</dt>
            <dd className="text-right font-medium text-gray-900">{formatEuro(unitPrice)}</dd>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Quantità</dt>
            <dd className="text-right font-medium text-gray-900">{qty}</dd>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Totale</dt>
            <dd className="text-right font-extrabold text-primary">{formatEuro(totalPrice)}</dd>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Condizione</dt>
            <dd className="text-right font-medium text-gray-900">{sellSingleConditionLabel(draft.condition)}</dd>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Lingua</dt>
            <dd className="text-right font-medium text-gray-900">{langLabel}</dd>
          </div>
          {(draft.extraFoil || draft.extraSigned || draft.extraAltered || draft.extraGraded) && (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Extra</dt>
              <dd className="text-right text-gray-700">
                {[draft.extraFoil && 'Foil', draft.extraSigned && 'Firmata', draft.extraAltered && 'Alterata', draft.extraGraded && 'Gradata']
                  .filter(Boolean)
                  .join(', ') || '—'}
              </dd>
            </div>
          )}
          {draft.comments.trim() ? (
            <div className="py-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Note</dt>
              <dd className="mt-0.5 text-gray-800">{draft.comments}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {draft.listingPhotos.length > 0 ? (
        <div className={cn('mt-3', compact && 'mt-2')}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Foto inserzione</p>
          <div className="mt-2">
            <ListingPhotoThumbnailsRow photos={draft.listingPhotos} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
