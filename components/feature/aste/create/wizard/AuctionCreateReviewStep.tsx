'use client';

import { useMemo } from 'react';
import {
  AlignLeft,
  CircleDollarSign,
  Edit3,
  ImageIcon,
  MapPin,
  Package,
  Truck,
} from 'lucide-react';
import {
  AUCTION_CREATE_GAMES,
  auctionConditionLabelKey,
  buildAuctionLanguageOptions,
  type AuctionCreateDraft,
} from '@/lib/auction/auction-create-draft';
import { getCardImageUrl } from '@/lib/assets';
import { ListingPhotoThumbnailsRow } from '../AuctionListingPhotoUpload';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

export type AuctionCreateReviewStepProps = {
  draft: AuctionCreateDraft;
  onEditSection?: (section: 'item' | 'price' | 'shipping' | 'photos' | 'notes') => void;
};

const NOT_SET = 'auctions.createSummary.notSet';

function formatEuro(value: string | number | undefined | null, fallback = '—') {
  if (value == null || value === '') return fallback;
  const str = String(value).trim();
  if (!str) return fallback;
  const normalized = str.replace(',', '.');
  const num = Number(normalized);
  if (!Number.isFinite(num)) return `€${str}`;
  return `€${num.toLocaleString('it-IT', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function EditButton({
  onClick,
  ariaLabel,
  label,
}: {
  onClick: () => void;
  ariaLabel: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1D3160] transition hover:border-[#FF7300]/40 hover:bg-orange-50/50 hover:text-[#FF7300]"
    >
      <Edit3 className="h-3 w-3" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

function SummarySection({
  icon: Icon,
  title,
  headerAction,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  headerAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm sm:p-4',
        className
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1D3160]/8 text-[#1D3160]">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <h2 className="truncate text-xs font-bold uppercase tracking-wide text-[#1D3160]">
            {title}
          </h2>
        </div>
        {headerAction}
      </header>
      {children}
    </section>
  );
}

function MetaCell({
  label,
  children,
  emphasized = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-sm leading-snug',
          emphasized ? 'font-bold text-[#1D3160]' : 'font-medium text-gray-900'
        )}
      >
        {children || <span className="text-gray-400">—</span>}
      </p>
    </div>
  );
}

export function AuctionCreateReviewStep({ draft, onEditSection }: AuctionCreateReviewStepProps) {
  const { t } = useTranslation();

  const cardLanguageLabel = useMemo(() => {
    if (!draft.isCard) return null;
    const cardLanguageOptions = buildAuctionLanguageOptions(draft.cardSelection?.availableLanguages);
    if (!draft.cardLanguage) return null;
    return cardLanguageOptions.find((opt) => opt.value === draft.cardLanguage)?.label ?? null;
  }, [draft.isCard, draft.cardSelection?.availableLanguages, draft.cardLanguage]);

  const gameLabel = useMemo(() => {
    if (!draft.game) return null;
    return AUCTION_CREATE_GAMES.find((g) => g.value === draft.game)?.labelKey ?? null;
  }, [draft.game]);

  const isOtherItem =
    !draft.isCard && (draft.nonCardCategory === 'other_object' || (!draft.title.trim() && !draft.isCard));

  const previewPhotoUrl = useMemo(() => {
    if (draft.listingPhotos.length > 0) {
      const slot = draft.listingPhotos[0];
      if (slot.kind === 'remote') return slot.photo.cdn_url;
      if (slot.kind === 'local') return null;
    }
    if (draft.cardSelection?.image) return getCardImageUrl(draft.cardSelection.image);
    return null;
  }, [draft.listingPhotos, draft.cardSelection?.image]);

  const shippingCountry = (draft.shippingOriginCountry || '').toUpperCase() || null;
  const shippingPayerLabel =
    draft.shippingPayer === 'buyer'
      ? t('auctions.createShippingBuyer')
      : t('auctions.createShippingSeller');

  const photoCount = draft.listingPhotos.length;
  const notSet = t(NOT_SET);
  const editLabel = t('common.edit');

  const editAction = (section: 'item' | 'price' | 'shipping' | 'photos' | 'notes', heading: string) =>
    onEditSection ? (
      <EditButton
        onClick={() => onEditSection(section)}
        ariaLabel={t('auctions.createSummary.editSectionAria', { section: heading })}
        label={editLabel}
      />
    ) : null;

  const hasOptionalPrices =
    (draft.reserveEnabled && draft.reservePriceEur) || (draft.buyNowEnabled && draft.buyNowPriceEur);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2.5">
        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
        <p className="text-sm font-medium leading-snug text-amber-900">
          {t('auctions.createCancelWindowBanner')}
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#1D3160]/10 bg-gradient-to-br from-[#1D3160]/[0.04] via-white to-orange-50/30 p-3.5 sm:p-4">
        <header className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1D3160]/10 text-[#1D3160]">
              <Package className="h-3.5 w-3.5" aria-hidden />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#1D3160]">
              {t('auctions.createSummary.itemHeading')}
            </h2>
          </div>
          {editAction('item', t('auctions.createSummary.itemHeading'))}
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {previewPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- CDN/remote path blob & remote URLs
            <img
              src={previewPhotoUrl}
              alt=""
              className="mx-auto h-28 w-[88px] shrink-0 rounded-lg border border-gray-200/80 object-cover shadow-sm sm:mx-0"
            />
          ) : (
            <div className="mx-auto flex h-28 w-[88px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-200 bg-white/80 text-[10px] text-gray-400 sm:mx-0">
              <ImageIcon className="h-4 w-4" aria-hidden />
              {t('auctions.createSummary.itemPhoto')}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className="text-base font-bold leading-snug text-[#1D3160] sm:text-lg"
              title={draft.title || undefined}
            >
              {draft.title || notSet}
            </p>

            {draft.isCard ? (
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MetaCell label={t('auctions.createSummary.itemGameLabel')}>
                    {gameLabel ? t(gameLabel) : notSet}
                  </MetaCell>
                  <MetaCell label={t('auctions.createSummary.itemSetLabel')}>
                    {draft.cardSelection?.setName ?? notSet}
                  </MetaCell>
                  <MetaCell label={t('auctions.createSummary.itemConditionLabel')}>
                    {auctionConditionLabelKey(draft.condition).startsWith('auctions.')
                      ? t(auctionConditionLabelKey(draft.condition))
                      : notSet}
                  </MetaCell>
                  <MetaCell label={t('auctions.createSummary.itemLanguageLabel')}>
                    {cardLanguageLabel ?? notSet}
                  </MetaCell>
              </div>
            ) : (
              <p className="mt-1.5 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {isOtherItem ? t('auctions.createSummary.itemCategoryOther') : notSet}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <SummarySection
          icon={CircleDollarSign}
          title={t('auctions.createSummary.priceHeading')}
          headerAction={editAction('price', t('auctions.createSummary.priceHeading'))}
        >
          <div className="rounded-lg border border-[#1D3160]/10 bg-[#1D3160]/5 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#1D3160]/70">
              {t('auctions.createSummary.priceStartingLabel')}
            </p>
            <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-[#1D3160]">
              {formatEuro(draft.startingBidEur, notSet)}
            </p>
          </div>

          {hasOptionalPrices ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {draft.reserveEnabled && draft.reservePriceEur ? (
                <MetaCell label={t('auctions.createSummary.priceReserveLabel')} emphasized>
                  {formatEuro(draft.reservePriceEur)}
                </MetaCell>
              ) : null}
              {draft.buyNowEnabled && draft.buyNowPriceEur ? (
                <MetaCell label={t('auctions.createSummary.priceBuyNowLabel')} emphasized>
                  {formatEuro(draft.buyNowPriceEur)}
                </MetaCell>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-100 pt-2">
            <MetaCell label={t('auctions.createSummary.priceDurationLabel')}>
              {t('auctions.createDurationDays', { days: draft.durationDays })}
            </MetaCell>
            <MetaCell label={t('auctions.createSummary.priceAntiSnipeLabel')}>
              {draft.antiSnipeEnabled
                ? `${t('auctions.createSummary.priceAntiSnipeOn')} · ${t('auctions.createAntiSnipeMinutes', { minutes: String(draft.antiSnipeMinutes) })}`
                : t('auctions.createSummary.priceAntiSnipeOff')}
            </MetaCell>
          </div>
        </SummarySection>

        <SummarySection
          icon={Truck}
          title={t('auctions.createSummary.shippingHeading')}
          headerAction={editAction('shipping', t('auctions.createSummary.shippingHeading'))}
        >
          <div className="grid grid-cols-2 gap-2">
            <MetaCell label={t('auctions.createSummary.shippingPayerLabel')}>
              {shippingPayerLabel}
            </MetaCell>
            <MetaCell label={t('auctions.createSummary.shippingOriginLabel')}>
              {shippingCountry ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-400" aria-hidden />
                  {shippingCountry}
                </span>
              ) : (
                notSet
              )}
            </MetaCell>
          </div>

          {draft.shippingPayer === 'buyer' ? (
            <div className="mt-2.5 rounded-lg border border-gray-100 bg-gray-50/70 p-2.5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {t('auctions.createSummary.shippingRatesHeading')}
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                <MetaCell label={t('auctions.createShippingNationalLabel', { country: shippingCountry ?? 'IT' })}>
                  {formatEuro(draft.shippingNationalEur)}
                </MetaCell>
                <MetaCell label={t('auctions.createShippingEuLabel')}>
                  {formatEuro(draft.shippingEuDefaultEur)}
                </MetaCell>
                <MetaCell label={t('auctions.createShippingExtraUeLabel')}>
                  {formatEuro(draft.shippingRestOfWorldEur)}
                </MetaCell>
              </div>
            </div>
          ) : (
            <p className="mt-2.5 rounded-lg border border-emerald-100 bg-emerald-50/70 px-2.5 py-2 text-xs font-medium leading-snug text-emerald-900">
              {t('auctions.createSummary.shippingIncluded')}
            </p>
          )}
        </SummarySection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummarySection
          icon={ImageIcon}
          title={t('auctions.createSummary.photosHeading')}
          headerAction={editAction('photos', t('auctions.createSummary.photosHeading'))}
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            {t('auctions.createSummary.photosCount', { count: String(photoCount) })}
          </p>
          {photoCount > 0 ? (
            <ListingPhotoThumbnailsRow photos={draft.listingPhotos} />
          ) : (
            <p className="text-sm text-gray-400">{notSet}</p>
          )}
        </SummarySection>

        <SummarySection
          icon={AlignLeft}
          title={t('auctions.createSummary.notesHeading')}
          headerAction={editAction('notes', t('auctions.createSummary.notesHeading'))}
        >
          {draft.description?.trim() ? (
            <p className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50/70 p-2.5 text-sm leading-relaxed text-gray-800">
              {draft.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400">{t('auctions.createSummary.notesEmpty')}</p>
          )}
        </SummarySection>
      </div>

      <p className="text-center text-[11px] text-gray-500">
        <span
          className="cursor-help underline decoration-dotted underline-offset-2"
          title={t('auctions.createPublishTermsTooltip')}
        >
          {t('auctions.createPublishTermsLabel')}
        </span>
      </p>
    </div>
  );
}
