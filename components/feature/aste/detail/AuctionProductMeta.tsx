import Link from 'next/link';
import type { MessageKey } from '@/lib/i18n/messages/en';

export function AuctionProductMeta({
  conditionLabel,
  languageLabel,
  expansionName,
  expansionHref,
  t,
}: {
  conditionLabel: string;
  languageLabel: string;
  expansionName: string;
  expansionHref: string | null;
  t: (key: MessageKey) => string;
}) {
  const rows = [
    { key: 'condition', label: t('auctions.detailCondition'), value: conditionLabel },
    { key: 'language', label: t('auctions.detailLanguage'), value: languageLabel },
    { key: 'expansion', label: t('auctions.detailExpansion'), value: expansionName, href: expansionHref },
  ] as const;

  return (
    <dl className="mt-2 divide-y divide-gray-100/90 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/60">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-3 px-3 py-1.5">
          <dt className="text-[11px] font-medium text-gray-500">{row.label}</dt>
          <dd className="min-w-0 text-right text-[13px] font-semibold text-gray-900">
            {'href' in row && row.href && row.value !== '—' ? (
              <Link href={row.href} className="truncate text-[#FF7300] transition hover:underline">
                {row.value}
              </Link>
            ) : (
              <span className="truncate">{row.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
