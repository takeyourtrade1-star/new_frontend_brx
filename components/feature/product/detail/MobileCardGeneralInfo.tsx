import Link from 'next/link';
import type { CardDocument } from '@/lib/product-detail';
import { RarityIndicator } from '@/components/ui/RarityIndicator';
import { CardLanguageFlags } from '@/components/ui/CardLanguageFlags';

export function MobileCardGeneralInfo({
  card,
  setCatalogHref,
  cardsInSaleLabel,
}: {
  card?: CardDocument;
  setCatalogHref: string | null;
  cardsInSaleLabel: string;
}) {
  return (
    <div className="border-b border-zinc-100 bg-white px-2.5 py-2">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 items-center justify-between gap-1">
          <dt className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-zinc-400">Rarità</dt>
          <dd className="min-w-0 text-right">
            <RarityIndicator rarity={card?.rarity} showLabel size="sm" />
          </dd>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-1">
          <dt className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-zinc-400">Numero</dt>
          <dd className="truncate text-[11px] font-bold tabular-nums text-zinc-900">{card?.collector_number ?? '—'}</dd>
        </div>
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-1">
          <dt className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-zinc-400">Set</dt>
          <dd className="min-w-0 truncate text-right">
            {setCatalogHref ? (
              <Link
                href={setCatalogHref}
                className="text-[11px] font-bold text-primary underline-offset-2 hover:underline"
              >
                {card?.set_name ?? '—'}
              </Link>
            ) : (
              <span className="text-[11px] font-bold text-zinc-900">{card?.set_name ?? '—'}</span>
            )}
          </dd>
        </div>
        <div className="col-span-2 flex min-w-0 items-start justify-between gap-1">
          <dt className="shrink-0 pt-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-400">Lingue</dt>
          <dd className="min-w-0">
            {card?.game_slug === 'mtg' ? (
              <CardLanguageFlags languages={card?.available_languages} size="xs" showActiveLabel />
            ) : (
              <span className="text-[10px] font-medium text-zinc-500">N/D</span>
            )}
          </dd>
        </div>
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-1">
          <dt className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-zinc-400">In vendita</dt>
          <dd className="text-[12px] font-extrabold tabular-nums text-primary">{cardsInSaleLabel}</dd>
        </div>
      </dl>
    </div>
  );
}
