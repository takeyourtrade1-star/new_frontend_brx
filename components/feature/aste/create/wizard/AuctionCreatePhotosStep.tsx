'use client';

import type { ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import {
  AuctionListingPhotoUpload,
  type ListingPhotoUploadStatus,
} from '../AuctionListingPhotoUpload';

export type PhotoPairingSession = ReturnType<typeof usePhotoPairingSession>;

export type AuctionCreatePhotosStepProps = {
  isEmbedded: boolean;
  listingPhotos: ListingPhotoSlot[];
  onListingPhotosChange: (next: ListingPhotoSlot[]) => void;
  pairing: PhotoPairingSession;
  photoUploadStatuses: ListingPhotoUploadStatus[];
  failedUploadFiles: File[];
  onRetryFailedUpload: (file: File) => void;
};

export function AuctionCreatePhotosStep({
  isEmbedded,
  listingPhotos,
  onListingPhotosChange,
  pairing,
  photoUploadStatuses,
  failedUploadFiles,
  onRetryFailedUpload,
}: AuctionCreatePhotosStepProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-3', isEmbedded && 'space-y-2')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={() => void pairing.openPhoneUploadModal()}
          disabled={pairing.pairingActionLoading}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1D3160]/25 bg-[#f8f9fb] px-4 py-2.5 text-sm font-semibold text-[#1D3160] transition hover:border-[#FF7300]/50 hover:bg-orange-50/40 disabled:cursor-not-allowed disabled:opacity-60',
            isEmbedded && 'py-2 text-xs'
          )}
        >
          {pairing.pairingActionLoading ? t('auctions.createPhotoFromPhoneLoading') : t('auctions.createPhotoFromPhone')}
        </button>
        {pairing.hasActiveSession ? (
          <p className="text-xs text-gray-600">
            {t('auctions.createPhotoPairingSessionActive', {
              count: String(pairing.remotePhotoCount),
              max: String(pairing.maxPhotos),
              minutes: String(pairing.expiresInMinutes ?? '—'),
            })}
          </p>
        ) : null}
        {pairing.hasActiveSession && !pairing.phoneUploadModalOpen ? (
          <p className="text-xs text-gray-600">{t('auctions.createPhotoFromPhonePollingHint')}</p>
        ) : null}
        {pairing.phonePhotoToast ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
            {pairing.phonePhotoToast}
          </p>
        ) : null}
      </div>
      {pairing.pairingActionError ? (
        <p className="text-sm text-red-700">{pairing.pairingActionError}</p>
      ) : null}
      {pairing.hasActiveSession ? (
        <div className="flex flex-wrap gap-3 text-xs">
          <button type="button" onClick={() => void pairing.regenerateQr()} className="font-semibold text-[#1D3160] underline">
            {t('auctions.createPhotoPairingRegenerateQr')}
          </button>
          <button type="button" onClick={() => void pairing.revokePairing()} className="font-semibold text-gray-500 underline">
            {t('auctions.createPhotoPairingCloseSession')}
          </button>
        </div>
      ) : null}
      <AuctionListingPhotoUpload
        photos={listingPhotos}
        onPhotosChange={onListingPhotosChange}
        compact={isEmbedded}
        uploadStatuses={photoUploadStatuses}
        highlightPhotoId={pairing.flashPhotoId}
      />
      {failedUploadFiles.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">Alcune foto non sono state caricate.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {failedUploadFiles.map((file, i) => (
              <button
                key={`${file.name}-${i}`}
                type="button"
                onClick={() => onRetryFailedUpload(file)}
                className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-red-800 transition hover:bg-red-100"
              >
                Riprova: {file.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
