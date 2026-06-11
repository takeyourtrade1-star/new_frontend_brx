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
import { cn } from '@/lib/utils';

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
  buildProductHref?: (id: string) => string;
  exactMatchIds?: Set<string>;
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
  buildProductHref,
  exactMatchIds,
}: SearchResultsTableProps) {
  const router = useRouter();

  return (
    <div className="search-results-table-wrapper">
      {/* Desktop/Tablet View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="search-results-table w-full min-w-[640px] border-collapse text-sm table-fixed">
          <thead>
            <tr className="search-results-thead">
              <th className="search-results-th pl-2 pr-0 text-left w-[88px]">{t('search.filterEdition')}</th>
              <th className="search-results-th pl-2 pr-3 text-left w-auto">{t('search.thName')}</th>
              {showCardDetails && (
                <>
                  <th className="search-results-th px-2 text-right w-[7%]">{t('search.thNumber')}</th>
                  <th className="search-results-th px-2 text-center w-[6%]">{t('search.thRarity')}</th>
                </>
              )}
              <th className="search-results-th px-2 text-right w-[9%]">{t('search.thAvailable')}</th>
              <th className="search-results-th px-2 pr-3 text-right w-[10%]">{t('search.thFrom')}</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((hit) => {
              const productHref = buildProductHref ? buildProductHref(hit.id) : `/products/${hit.id}`;
              const { primary, secondary } = getSearchHitDisplayNames(hit, selectedLang);
              const imgUrl = getCardImageUrl(hit.image ?? null);
              const setName = hit.set_name ?? '';
              const setPageGame = resolveSetPageGameSlug(hit.game_slug, gameSlug);
              const setPageHref = setName ? buildSetPageUrl(setPageGame, setName) : null;
              const nameOriginal = secondary ?? primary;
              const nameTranslation = secondary ? primary : null;
              const priceLabel = formatPrice?.(hit) ?? '–';
              const availableLabel = formatAvailable?.(hit) ?? '–';
              const isExact = exactMatchIds?.has(hit.id) ?? false;

              return (
                <tr
                  key={hit.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(productHref)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(productHref)}
                  className={cn(
                    'search-result-row border-b border-gray-100/90 cursor-pointer outline-none',
                    isExact && 'bg-[#FF8800]/5 border-l-4 border-l-[#FF8800]'
                  )}
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
                              imageClassName="h-7 w-7 object-contain"
                            />
                          </Link>
                        ) : (
                          <div className="flex flex-shrink-0 items-center justify-center">
                            <SetIconBadge
                              setIconUri={hit.set_icon_uri}
                              setCode={hit.set_code}
                              setName={setName}
                              gameSlug={hit.game_slug}
                              imageClassName="h-7 w-7 object-contain"
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

      {/* Mobile View */}
      <div className="md:hidden flex flex-col divide-y divide-gray-100">
        {hits.map((hit) => {
          const productHref = buildProductHref ? buildProductHref(hit.id) : `/products/${hit.id}`;
          const { primary, secondary } = getSearchHitDisplayNames(hit, selectedLang);
          const imgUrl = getCardImageUrl(hit.image ?? null);
          const setName = hit.set_name ?? '';
          const setPageGame = resolveSetPageGameSlug(hit.game_slug, gameSlug);
          const setPageHref = setName ? buildSetPageUrl(setPageGame, setName) : null;
          const nameOriginal = secondary ?? primary;
          const nameTranslation = secondary ? primary : null;
          const priceLabel = formatPrice?.(hit) ?? '–';
          const availableLabel = formatAvailable?.(hit) ?? '–';
          const isExact = exactMatchIds?.has(hit.id) ?? false;

          return (
            <div
              key={hit.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(productHref)}
              onKeyDown={(e) => e.key === 'Enter' && router.push(productHref)}
              className={cn(
                'flex items-center justify-between p-3 border-l-4 border-l-transparent cursor-pointer outline-none hover:bg-gray-50/50 gap-3 min-w-0 transition-colors',
                isExact && 'bg-[#FF8800]/5 border-l-[#FF8800]'
              )}
            >
              {/* Left Section: Camera Peek & Set Icon */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
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
                        imageClassName="h-6 w-6 object-contain"
                      />
                    </Link>
                  ) : (
                    <div className="flex flex-shrink-0 items-center justify-center">
                      <SetIconBadge
                        setIconUri={hit.set_icon_uri}
                        setCode={hit.set_code}
                        setName={setName}
                        gameSlug={hit.game_slug}
                        imageClassName="h-6 w-6 object-contain"
                      />
                    </div>
                  ))}
                {editionVariant === 'text' && setName && (
                  <span
                    className="min-w-0 max-w-[4.5rem] truncate text-[10px] font-medium leading-none text-gray-500"
                    title={setName}
                  >
                    {setName}
                  </span>
                )}
              </div>

              {/* Middle Section: Card Name & Metadata */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <span className="text-[13px] font-semibold leading-tight text-[#1a5fb4] break-words">
                  {nameOriginal}
                </span>
                {nameTranslation && (
                  <p className="text-[11px] font-normal leading-tight text-gray-500 break-words">
                    {nameTranslation}
                  </p>
                )}
                {/* Metadata badges for mobile */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px] text-gray-500">
                  {showCardDetails && hit.collector_number && (
                    <span className="font-mono bg-gray-100 px-1 rounded text-[10px] font-medium text-gray-700">
                      #{hit.collector_number}
                    </span>
                  )}
                  {showCardDetails && hit.collector_number && hit.rarity && (
                    <span className="text-gray-300">•</span>
                  )}
                  {showCardDetails && hit.rarity && (
                    <span className="inline-flex items-center">
                      <RarityIndicator rarity={hit.rarity} size="sm" showLabel />
                    </span>
                  )}
                  {((showCardDetails && (hit.collector_number || hit.rarity)) && availableLabel && availableLabel !== '–') && (
                    <span className="text-gray-300">•</span>
                  )}
                  {availableLabel && availableLabel !== '–' && (
                    <span>
                      Disp: <strong className="text-gray-700 font-semibold">{availableLabel}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Right Section: Price */}
              <div className="flex flex-col items-end justify-center pl-1 flex-shrink-0">
                <span className="text-[10px] text-gray-400 font-medium leading-none mb-0.5">
                  {t('search.thFrom')}
                </span>
                <span className="text-xs font-bold text-[#FF7300] tabular-nums whitespace-nowrap">
                  {priceLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
