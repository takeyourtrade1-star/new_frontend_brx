'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import type { SearchHit } from '@/app/api/search/route';
import { getCardImageUrl } from '@/lib/assets';
import { SetIconBadge } from '@/components/ui/SetIconBadge';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import { RarityIndicator } from '@/components/ui/RarityIndicator';
import { buildSetPageUrl, resolveSetPageGameSlug } from '@/lib/search/set-page-url';
import type { GameSlug } from '@/lib/search/category-mapping';

const BACKEND_LANG_ORDER = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;
type SupportedLang = (typeof BACKEND_LANG_ORDER)[number];

function normalizeLang(lang: string): SupportedLang {
  return BACKEND_LANG_ORDER.includes(lang as SupportedLang) ? (lang as SupportedLang) : 'en';
}

function getLocalizedName(keywords: string[] | undefined, lang: string): string | null {
  if (!keywords?.length) return null;
  const l = normalizeLang(lang);
  const idx = BACKEND_LANG_ORDER.indexOf(l);
  if (idx < 0 || !keywords[idx]) return null;
  const raw = keywords[idx];
  return (typeof raw === 'string' ? raw : '').trim() || null;
}

export function getSearchHitDisplayNames(
  hit: SearchHit,
  currentLang: string
): { primary: string; secondary: string | null } {
  const primary = getLocalizedName(hit.keywords_localized, currentLang) ?? hit.name;
  const secondary = currentLang !== 'en' ? hit.name : null;
  return { primary, secondary };
}

export type SearchResultsTableProps = {
  hits: SearchHit[];
  selectedLang: string;
  gameSlug: GameSlug | null;
  t: (k: MessageKey, vars?: Record<string, string | number>) => string;
  /** Colonna edizione: icona set (search) o testo set (categoria). */
  editionVariant?: 'icon' | 'text';
  showCardDetails?: boolean;
  onImagePreviewOpenChange?: (open: boolean) => void;
  formatPrice?: (hit: SearchHit) => string;
  formatAvailable?: (hit: SearchHit) => string;
};

export function SearchResultsTable({
  hits,
  selectedLang,
  gameSlug,
  t,
  editionVariant = 'icon',
  showCardDetails = true,
  onImagePreviewOpenChange,
  formatPrice,
  formatAvailable,
}: SearchResultsTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto search-results-table-wrapper">
      <table className="search-results-table w-full min-w-[640px] border-collapse text-sm table-fixed">
        <colgroup>
          <col className="min-w-0" style={{ width: 'min(10%, 5.5rem)' }} />
          <col className="min-w-0" style={{ width: 'auto' }} />
          {showCardDetails && (
            <>
              <col style={{ width: '7%' }} />
              <col style={{ width: '6%' }} />
            </>
          )}
          <col style={{ width: '9%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr className="search-results-thead">
            <th className="search-results-th pl-2 pr-0 text-left">{t('search.filterEdition')}</th>
            <th className="search-results-th pl-2 pr-3 text-left">{t('search.thName')}</th>
            {showCardDetails && (
              <>
                <th className="search-results-th px-2 text-right">{t('search.thNumber')}</th>
                <th className="search-results-th px-2 text-center">{t('search.thRarity')}</th>
              </>
            )}
            <th className="search-results-th px-2 text-right">{t('search.thAvailable')}</th>
            <th className="search-results-th px-2 pr-3 text-right">{t('search.thFrom')}</th>
          </tr>
        </thead>
        <tbody>
          {hits.map((hit) => {
            const productHref = `/products/${hit.id}`;
            const { primary, secondary } = getSearchHitDisplayNames(hit, selectedLang);
            const imgUrl = getCardImageUrl(hit.image ?? null);
            const setName = hit.set_name ?? '';
            const setPageGame = resolveSetPageGameSlug(hit.game_slug, gameSlug);
            const setPageHref = setName ? buildSetPageUrl(setPageGame, setName) : null;
            const nameOriginal = secondary ?? primary;
            const nameTranslation = secondary ? primary : null;
            const priceLabel = formatPrice?.(hit) ?? '–';
            const availableLabel = formatAvailable?.(hit) ?? '–';

            return (
              <tr
                key={hit.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(productHref)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(productHref)}
                className="search-result-row border-b border-gray-100/90 cursor-pointer outline-none"
              >
                <td className="search-results-td pl-2 pr-0 align-middle min-w-0">
                  <div className="flex items-center justify-start gap-1 min-w-0">
                    <CardImageCameraPeek
                      imageUrl={imgUrl}
                      name={nameOriginal}
                      previewSide="left"
                      onModalOpenChange={onImagePreviewOpenChange}
                    />
                    {editionVariant === 'icon' &&
                      (setPageHref || setName || hit.set_code) &&
                      (setPageHref ? (
                        <Link
                          href={setPageHref}
                          title={setName}
                          aria-label={setName ? `Set: ${setName}` : 'Set'}
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-80 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <SetIconBadge
                            setIconUri={hit.set_icon_uri}
                            setCode={hit.set_code}
                            setName={setName}
                            gameSlug={hit.game_slug}
                            imageClassName="h-6 w-6 md:h-7 md:w-7 object-contain"
                          />
                        </Link>
                      ) : (
                        <div className="flex flex-shrink-0 items-center justify-center">
                          <SetIconBadge
                            setIconUri={hit.set_icon_uri}
                            setCode={hit.set_code}
                            setName={setName}
                            gameSlug={hit.game_slug}
                            imageClassName="h-6 w-6 md:h-7 md:w-7 object-contain"
                          />
                        </div>
                      ))}
                    {editionVariant === 'text' && setName && (
                      <span
                        className="min-w-0 max-w-[5.5rem] truncate text-[10px] font-medium leading-none text-gray-500"
                        title={setName}
                      >
                        {setName}
                      </span>
                    )}
                  </div>
                </td>
                <td className="search-results-td pl-2 pr-3 align-middle min-w-0 text-left">
                  <div className="flex min-w-0 flex-col justify-center gap-0">
                    <span className="text-[13px] font-semibold leading-tight text-[#1a5fb4] break-words">
                      {nameOriginal}
                    </span>
                    {nameTranslation && (
                      <p className="text-[11px] font-normal leading-tight text-gray-500 break-words">
                        {nameTranslation}
                      </p>
                    )}
                  </div>
                </td>
                {showCardDetails && (
                  <>
                    <td className="search-results-td px-2 text-right align-middle text-[11px] text-gray-600 tabular-nums whitespace-nowrap">
                      {hit.collector_number ?? '–'}
                    </td>
                    <td className="search-results-td px-2 text-center align-middle whitespace-nowrap">
                      <div className="flex justify-center">
                        <RarityIndicator rarity={hit.rarity} size="sm" />
                      </div>
                    </td>
                  </>
                )}
                <td className="search-results-td px-2 text-right align-middle text-[11px] text-gray-600 tabular-nums whitespace-nowrap">
                  {availableLabel}
                </td>
                <td className="search-results-td px-2 pr-3 text-right align-middle text-[11px] font-semibold text-[#FF7300] tabular-nums whitespace-nowrap">
                  {priceLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
