'use client';

import type { LegacyRef, RefObject } from 'react';
import { Camera, ImageIcon, QrCode } from 'lucide-react';
import { AUCTION_LISTING_PHOTO_MAX, type ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import {
  AuctionListingPhotoUpload,
  type ListingPhotoUploadStatus,
} from '../AuctionListingPhotoUpload';
import { CompactPhotoGallery } from '../CompactPhotoGallery';
import { PhotoPairingInlinePanel } from '../PhotoPairingInlinePanel';

export type PhotoPairingSession = ReturnType<typeof usePhotoPairingSession>;

export type AuctionCreatePhotosStepProps = {
  isEmbedded: boolean;
  listingPhotos: ListingPhotoSlot[];
  onListingPhotosChange: (next: ListingPhotoSlot[]) => void;
  pairing: PhotoPairingSession;
  photoUploadStatuses: ListingPhotoUploadStatus[];
  failedUploadFiles: File[];
  onRetryFailedUpload: (file: File) => void;
  appendPhotos: (fileList: FileList | null) => void;
  galleryInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  onPhotoClick: (index: number) => void;
};

export function AuctionCreatePhotosStep({
  isEmbedded,
  listingPhotos,
  onListingPhotosChange,
  pairing,
  photoUploadStatuses,
  failedUploadFiles,
  onRetryFailedUpload,
  appendPhotos,
  galleryInputRef,
  cameraInputRef,
  onPhotoClick,
}: AuctionCreatePhotosStepProps) {
  const { t } = useTranslation();
  const hasPhotos = listingPhotos.length > 0;
  const maxReached = listingPhotos.length >= AUCTION_LISTING_PHOTO_MAX;
  const showQrPanel = pairing.phoneUploadModalOpen && Boolean(pairing.phonePairingQrUrl);

  const removePhotoAt = (index: number) => {
    onListingPhotosChange(listingPhotos.filter((_, i) => i !== index));
  };

  return (
    <div
      className={cn(
        'space-y-3',
        isEmbedded && 'space-y-2',
        hasPhotos && 'sm:flex sm:flex-row sm:items-start sm:gap-4',
      )}
    >
      <input
        ref={galleryInputRef as LegacyRef<HTMLInputElement>}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          appendPhotos(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef as LegacyRef<HTMLInputElement>}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          appendPhotos(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Colonna azioni: larghezza fissa per non comprimere la galleria */}
      <div
        className={cn(
          'flex items-stretch gap-1.5',
          hasPhotos
            ? 'sm:flex sm:w-[148px] sm:shrink-0 sm:flex-col sm:gap-2'
            : 'sm:grid sm:grid-cols-2',
        )}
      >
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={maxReached}
          className={cn(
            'group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-[#1D3160]/10 bg-gradient-to-b from-white to-slate-50/60 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:border-[#FF7300]/40 hover:bg-orange-50/50 hover:shadow-md hover:shadow-[#FF7300]/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
            hasPhotos ? 'sm:w-full' : 'sm:flex-none',
          )}
        >
          <ImageIcon className="h-4 w-4 text-[#1D3160]/70 transition-colors group-hover:text-[#FF7300]" aria-hidden />
          {t('auctions.createReview.uploadBtn')}
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={maxReached}
          className="group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-[#1D3160]/10 bg-gradient-to-b from-white to-slate-50/60 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:border-[#FF7300]/40 hover:bg-orange-50/50 hover:shadow-md hover:shadow-[#FF7300]/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:hidden"
        >
          <Camera className="h-4 w-4 text-[#1D3160]/70 transition-colors group-hover:text-[#FF7300]" aria-hidden />
          {t('auctions.createReview.captureFromPhone')}
        </button>
        <button
          type="button"
          onClick={() =>
            pairing.phoneUploadModalOpen
              ? pairing.closePhoneUploadModal()
              : void pairing.openPhoneUploadModal()
          }
          disabled={pairing.pairingActionLoading}
          aria-label={t('auctions.createReview.qrFromPhoneAria')}
          title={t('auctions.createReview.qrFromPhoneAria')}
          className={cn(
            'group hidden flex-col items-center justify-center gap-1 rounded-xl border border-[#1D3160]/10 bg-gradient-to-b from-white to-slate-50/60 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:border-[#FF7300]/40 hover:bg-orange-50/50 hover:shadow-md hover:shadow-[#FF7300]/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:flex',
            hasPhotos && 'sm:w-full',
          )}
        >
          <QrCode className="h-4 w-4 text-[#1D3160]/70 transition-colors group-hover:text-[#FF7300]" aria-hidden />
          {t('auctions.createReview.captureFromPhone')}
        </button>
      </div>

      {/* Colonna contenuto: occupa lo spazio restante senza frazioni annidate */}
      <div className={cn('min-w-0 space-y-3', hasPhotos && 'flex-1')}>
        {pairing.hasActiveSession && !pairing.phoneUploadModalOpen ? (
          <div className="space-y-2 rounded-xl border border-[#1D3160]/10 bg-[#1D3160]/5 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D3160]">
                {t('auctions.createReview.phoneLinkActive')}
              </span>
            </div>
            <div className="text-xs font-medium text-zinc-700">
              {t('auctions.createPhotoPairingSessionActive', {
                count: String(pairing.remotePhotoCount),
                max: String(pairing.maxPhotos),
                minutes: String(pairing.expiresInMinutes ?? '—'),
              })}
            </div>
            <p className="text-[10px] leading-snug text-zinc-500">
              {t('auctions.createPhotoFromPhonePollingHint')}
            </p>
            <div className="flex gap-3 pt-1 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => void pairing.regenerateQr()}
                className="text-[#1D3160] underline transition-colors hover:text-[#FF7300]"
              >
                {t('auctions.createPhotoPairingRegenerateQr')}
              </button>
              <button
                type="button"
                onClick={() => void pairing.revokePairing()}
                className="text-zinc-500 underline transition-colors hover:text-red-600"
              >
                {t('auctions.createPhotoPairingCloseSession')}
              </button>
            </div>
          </div>
        ) : null}

        {showQrPanel ? (
          <PhotoPairingInlinePanel
            compact={hasPhotos}
            qrUrl={pairing.phonePairingQrUrl!}
            body={t('auctions.createPhotoFromPhoneModalBody')}
            regenerateLabel={t('auctions.createPhotoPairingRegenerateQr')}
            closeSessionLabel={t('auctions.createPhotoPairingCloseSession')}
            onRegenerate={pairing.regenerateQr}
            onCloseSession={() => {
              void pairing.revokePairing();
              pairing.closePhoneUploadModal();
            }}
          />
        ) : null}

        {pairing.phonePhotoToast ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-900">
            {pairing.phonePhotoToast}
          </p>
        ) : null}
        {pairing.pairingActionError ? (
          <p className="text-[11px] text-red-700">{pairing.pairingActionError}</p>
        ) : null}

        {hasPhotos ? (
          <CompactPhotoGallery
            photos={listingPhotos}
            uploadStatuses={photoUploadStatuses}
            onRemove={removePhotoAt}
            highlightPhotoId={pairing.flashPhotoId}
            onPhotoClick={onPhotoClick}
          />
        ) : !showQrPanel ? (
          <AuctionListingPhotoUpload
            photos={listingPhotos}
            onPhotosChange={onListingPhotosChange}
            compact
            hideAddTile
            uploadStatuses={photoUploadStatuses}
            highlightPhotoId={pairing.flashPhotoId}
          />
        ) : null}

        {failedUploadFiles.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-900">
            <p className="font-semibold">{t('auctions.createReview.somePhotosFailed')}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {failedUploadFiles.map((file, i) => (
                <button
                  key={`${file.name}-${i}`}
                  type="button"
                  onClick={() => onRetryFailedUpload(file)}
                  className="rounded border border-red-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-red-800 hover:bg-red-100"
                >
                  {t('auctions.createReview.retry')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
