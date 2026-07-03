'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { Camera, Edit3, FileText, ImageIcon, Layers, MapPin, Truck } from 'lucide-react';
import {
  AUCTION_CREATE_GAMES,
  auctionConditionLabelKey,
  buildAuctionLanguageOptions,
  type AuctionCreateDraft,
} from '@/lib/auction/auction-create-draft';
import { getCardImageUrl } from '@/lib/assets';
import { SalesTagIcon } from '@/components/ui/SalesTagIcon';
import {
  ListingPhotoThumbnailsRow,
  resolveListingPhotoPreviewUrl,
  type ListingPhotoUploadStatus,
} from '../AuctionListingPhotoUpload';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

export type AuctionCreateReviewStepProps = {
  draft: AuctionCreateDraft;
  photoUploadStatuses?: ListingPhotoUploadStatus[];
  onEditSection?: (section: 'item' | 'price' | 'shipping' | 'photos' | 'notes') => void;
};

const NOT_SET = 'auctions.createSummary.notSet';
const BRAND_ORANGE = '#FF7300';
const REVIEW_ICON_SM = 'h-3.5 w-3.5';

function SectionIconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#FF7300]/15 bg-[#FF7300]/10 text-[#FF7300]">
      {children}
    </span>
  );
}

const REVIEW_SECTION_ICONS = {
  item: (
    <SectionIconBadge>
      <Layers className={REVIEW_ICON_SM} strokeWidth={2.25} aria-hidden />
    </SectionIconBadge>
  ),
  price: (
    <SectionIconBadge>
      <SalesTagIcon className={REVIEW_ICON_SM} stroke={BRAND_ORANGE} strokeWidth={2.25} />
    </SectionIconBadge>
  ),
  shipping: (
    <SectionIconBadge>
      <Truck className={REVIEW_ICON_SM} strokeWidth={2.25} aria-hidden />
    </SectionIconBadge>
  ),
  photos: (
    <SectionIconBadge>
      <Camera className={REVIEW_ICON_SM} strokeWidth={2.25} aria-hidden />
    </SectionIconBadge>
  ),
  notes: (
    <SectionIconBadge>
      <FileText className={REVIEW_ICON_SM} strokeWidth={2.25} aria-hidden />
    </SectionIconBadge>
  ),
} as const;

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
  icon,
  title,
  subtitle,
  headerAction,
  className,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
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
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {icon}
          <div className="min-w-0">
            <h2 className="truncate text-xs font-bold uppercase tracking-wide text-[#1D3160]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {subtitle}
              </p>
            ) : null}
          </div>
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
  className,
}: {
  label: string;
  children: React.ReactNode;
  emphasized?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2',
        className
      )}
    >
      <p className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-500" title={label}>
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 line-clamp-2 text-sm leading-snug',
          emphasized ? 'font-bold text-[#1D3160]' : 'font-medium text-gray-900'
        )}
      >
        {children || <span className="text-gray-400">—</span>}
      </p>
    </div>
  );
}

function PriceCell({
  label,
  value,
  primary = false,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  primary?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border px-2 py-2',
        primary
          ? 'border-[#1D3160]/10 bg-[#1D3160]/5'
          : muted
            ? 'border-dashed border-gray-200 bg-white/60'
            : 'border-gray-100 bg-gray-50/70'
      )}
    >
      <p
        className={cn(
          'text-[10px] font-bold uppercase leading-tight',
          muted ? 'text-gray-400' : 'text-gray-500'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-1 break-words tabular-nums',
          primary
            ? 'text-xl font-extrabold text-[#1D3160]'
            : muted
              ? 'text-base font-semibold text-gray-300'
              : 'text-base font-bold text-[#1D3160]'
        )}
      >
        {value}
      </p>
    </div>
  );
}
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 py-1.5 last:border-b-0">
      <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-wide text-gray-500" title={label}>
        {label}
      </span>
      <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-gray-900">{children}</span>
    </div>
  );
}

export function AuctionCreateReviewStep({
  draft,
  photoUploadStatuses,
  onEditSection,
}: AuctionCreateReviewStepProps) {
  const { t, locale } = useTranslation();

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
      const url = resolveListingPhotoPreviewUrl(
        draft.listingPhotos[0]!,
        photoUploadStatuses?.[0]
      );
      if (url) return url;
    }
    if (draft.imageUrl?.trim()) return draft.imageUrl;
    if (draft.cardSelection?.image) return getCardImageUrl(draft.cardSelection.image);
    return null;
  }, [draft.listingPhotos, draft.imageUrl, draft.cardSelection?.image, photoUploadStatuses]);

  useEffect(() => {
    const slot = draft.listingPhotos[0];
    const status = photoUploadStatuses?.[0];
    if (!slot || slot.kind !== 'local' || status?.kind === 'done' || !previewPhotoUrl) return;
    return () => URL.revokeObjectURL(previewPhotoUrl);
  }, [draft.listingPhotos, photoUploadStatuses, previewPhotoUrl]);

  const shippingCountry = (draft.shippingOriginCountry || '').toUpperCase() || null;
  const shippingCountryName = useMemo(() => {
    if (!shippingCountry) return null;
    try {
      const name = new Intl.DisplayNames([locale], { type: 'region' }).of(shippingCountry);
      return name && name !== shippingCountry ? name : null;
    } catch {
      return null;
    }
  }, [shippingCountry, locale]);
  const shippingPayerLabel =
    draft.shippingPayer === 'buyer'
      ? t('auctions.createShippingBuyer')
      : t('auctions.createShippingSeller');

  const photoCount = draft.listingPhotos.length;
  const hasDescription = Boolean(draft.description?.trim());
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

  const showReserve = draft.reserveEnabled && draft.reservePriceEur;
  const showBuyNow = draft.buyNowEnabled && draft.buyNowPriceEur;

  return (
    <div className="space-y-3.5">
      <SummarySection
        icon={REVIEW_SECTION_ICONS.item}
        title={t('auctions.createSummary.itemHeading')}
        headerAction={editAction('item', t('auctions.createSummary.itemHeading'))}
        className="border-[#1D3160]/10 bg-gradient-to-br from-[#1D3160]/[0.04] via-white to-orange-50/30"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {previewPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- CDN/remote path blob & remote URLs
            <img
              src={previewPhotoUrl}
              alt=""
              className="mx-auto h-[7.5rem] w-[5.5rem] shrink-0 rounded-lg border border-gray-200/80 object-cover shadow-sm sm:mx-0"
            />
          ) : (
            <div className="mx-auto flex h-[7.5rem] w-[5.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-200 bg-white/80 px-1 text-center text-[10px] text-gray-400 sm:mx-0">
              <ImageIcon className="h-4 w-4 text-[#FF7300]/60" aria-hidden />
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

            {draft.isCard && draft.cardSelection?.setName ? (
              <p className="mt-0.5 truncate text-xs text-gray-600" title={draft.cardSelection.setName}>
                {draft.cardSelection.setName}
              </p>
            ) : null}

            {draft.isCard ? (
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <MetaCell label={t('auctions.createSummary.itemGameLabel')}>
                  {gameLabel ? t(gameLabel) : notSet}
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
      </SummarySection>

      <div className="grid gap-3.5 md:grid-cols-2">
        <SummarySection
          icon={REVIEW_SECTION_ICONS.price}
          title={t('auctions.createSummary.priceHeading')}
          headerAction={editAction('price', t('auctions.createSummary.priceHeading'))}
        >
          <div className="grid grid-cols-3 gap-2">
            <PriceCell
              label={t('auctions.createSummary.priceStartingLabel')}
              value={formatEuro(draft.startingBidEur, notSet)}
              primary
            />
            <PriceCell
              label={t('auctions.createSummary.priceReserveLabel')}
              value={showReserve ? formatEuro(draft.reservePriceEur) : '—'}
              muted={!showReserve}
            />
            <PriceCell
              label={t('auctions.createSummary.priceBuyNowLabel')}
              value={showBuyNow ? formatEuro(draft.buyNowPriceEur) : '—'}
              muted={!showBuyNow}
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
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
          icon={REVIEW_SECTION_ICONS.shipping}
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
                  <MapPin className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
                  {shippingCountryName ? `${shippingCountryName} (${shippingCountry})` : shippingCountry}
                </span>
              ) : (
                notSet
              )}
            </MetaCell>
          </div>

          {draft.shippingPayer === 'buyer' ? (
            <div className="mt-2.5 rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {t('auctions.createSummary.shippingRatesHeading')}
              </p>
              <DetailRow label={t('auctions.createShippingNationalLabel', { country: shippingCountry ?? 'IT' })}>
                {formatEuro(draft.shippingNationalEur)}
              </DetailRow>
              <DetailRow label={t('auctions.createShippingEuLabel')}>
                {formatEuro(draft.shippingEuDefaultEur)}
              </DetailRow>
              <DetailRow label={t('auctions.createShippingExtraUeLabel')}>
                {formatEuro(draft.shippingRestOfWorldEur)}
              </DetailRow>
            </div>
          ) : (
            <p className="mt-2.5 rounded-lg border border-emerald-100 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-medium leading-snug text-emerald-900">
              {t('auctions.createSummary.shippingIncluded')}
            </p>
          )}
        </SummarySection>
      </div>

      <div
        className={cn(
          'grid gap-3.5',
          hasDescription ? 'lg:grid-cols-2' : 'grid-cols-1'
        )}
      >
        <SummarySection
          icon={REVIEW_SECTION_ICONS.photos}
          title={t('auctions.createSummary.photosHeading')}
          subtitle={t('auctions.createSummary.photosCount', { count: String(photoCount) })}
          headerAction={editAction('photos', t('auctions.createSummary.photosHeading'))}
        >
          {photoCount > 0 ? (
            <ListingPhotoThumbnailsRow
              photos={draft.listingPhotos}
              uploadStatuses={photoUploadStatuses}
              compact
            />
          ) : (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-3 py-4 text-center text-sm text-gray-400">
              {notSet}
            </p>
          )}
        </SummarySection>

        {hasDescription ? (
          <SummarySection
            icon={REVIEW_SECTION_ICONS.notes}
            title={t('auctions.createSummary.notesHeading')}
            headerAction={editAction('notes', t('auctions.createSummary.notesHeading'))}
          >
            <p className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50/70 p-2.5 text-sm leading-relaxed text-gray-800">
              {draft.description}
            </p>
          </SummarySection>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-3.5 py-3 lg:col-span-1">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-[#FF7300]/70" aria-hidden />
              <p className="text-sm text-gray-500">{t('auctions.createSummary.notesEmpty')}</p>
            </div>
            {editAction('notes', t('auctions.createSummary.notesHeading'))}
          </div>
        )}
      </div>

      <p className="pt-0.5 text-center text-[11px] text-gray-500">
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
