'use client';

import type { LegacyRef, RefObject } from 'react';
import { Camera, ImageIcon, QrCode } from 'lucide-react';
import {
  AUCTION_LISTING_PHOTO_MAX,
  AUCTION_LISTING_PHOTO_MIN,
  normalizeAuctionDraftMoneyInput,
  type AuctionCreateDraft,
  type ListingPhotoSlot,
} from '@/lib/auction/auction-create-draft';
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

export type AuctionCreateEmbeddedReviewStepProps = {
  draft: AuctionCreateDraft;
  update: <K extends keyof AuctionCreateDraft>(key: K, value: AuctionCreateDraft[K]) => void;
  pairing: PhotoPairingSession;
  setListingPhotos: (next: ListingPhotoSlot[]) => void;
  photoUploadStatuses: ListingPhotoUploadStatus[];
  failedUploadFiles: File[];
  retryFailedUpload: (file: File) => void;
  appendEmbeddedPhotos: (fileList: FileList | null) => void;
  embGalleryInputRef: RefObject<HTMLInputElement | null>;
  embCameraInputRef: RefObject<HTMLInputElement | null>;
  setLightboxIndex: (index: number) => void;
  setLightboxOpen: (open: boolean) => void;
};

export function AuctionCreateEmbeddedReviewStep({
  draft,
  update,
  pairing,
  setListingPhotos,
  photoUploadStatuses,
  failedUploadFiles,
  retryFailedUpload,
  appendEmbeddedPhotos,
  embGalleryInputRef,
  embCameraInputRef,
  setLightboxIndex,
  setLightboxOpen,
}: AuctionCreateEmbeddedReviewStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5">
      <div>
        <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-600">
          {t('auctions.createShippingWhoLabel')}
        </span>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => update('shippingPayer', 'buyer')}
            className={cn(
              'rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold transition-colors',
              draft.shippingPayer === 'buyer'
                ? 'border-[#FF7300] bg-orange-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            )}
          >
            {t('auctions.createShippingBuyer')}
          </button>
          <button
            type="button"
            onClick={() => update('shippingPayer', 'seller')}
            className={cn(
              'rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold transition-colors',
              draft.shippingPayer === 'seller'
                ? 'border-[#FF7300] bg-orange-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            )}
          >
            {t('auctions.createShippingSeller')}
          </button>
        </div>
        {draft.shippingPayer === 'buyer' && (
          <div className="mt-1.5 grid grid-cols-4 gap-1">
            <div title="Paese di spedizione (codice ISO)">
              <label htmlFor="ac-ship-origin-emb" className="block truncate text-[9px] font-bold uppercase tracking-wide text-gray-500">
                Paese
              </label>
              <input
                id="ac-ship-origin-emb"
                value={draft.shippingOriginCountry}
                onChange={(e) => update('shippingOriginCountry', e.target.value.toUpperCase().slice(0, 2))}
                className="mt-0.5 w-full rounded-md border border-gray-300 px-1.5 py-1 text-center text-xs uppercase text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
                maxLength={2}
              />
            </div>
            <div title={`Spedizione nazionale (${draft.shippingOriginCountry || 'IT'})`}>
              <label htmlFor="ac-ship-national-emb" className="block truncate text-[9px] font-bold uppercase tracking-wide text-gray-500">
                Naz. ({draft.shippingOriginCountry || 'IT'})
              </label>
              <div className="relative mt-0.5">
                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">€</span>
                <input
                  id="ac-ship-national-emb"
                  value={draft.shippingNationalEur}
                  onChange={(e) => update('shippingNationalEur', e.target.value)}
                  onBlur={(e) => update('shippingNationalEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                  className="w-full rounded-md border border-gray-300 py-1 pl-5 pr-1.5 text-xs tabular-nums text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
                  inputMode="decimal"
                />
              </div>
            </div>
            <div title={t('auctions.createShippingEuLabel')}>
              <label htmlFor="ac-ship-eu-emb" className="block truncate text-[9px] font-bold uppercase tracking-wide text-gray-500">
                {t('auctions.createShippingEuLabel')}
              </label>
              <div className="relative mt-0.5">
                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">€</span>
                <input
                  id="ac-ship-eu-emb"
                  value={draft.shippingEuDefaultEur}
                  onChange={(e) => update('shippingEuDefaultEur', e.target.value)}
                  onBlur={(e) => update('shippingEuDefaultEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                  className="w-full rounded-md border border-gray-300 py-1 pl-5 pr-1.5 text-xs tabular-nums text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
                  inputMode="decimal"
                />
              </div>
            </div>
            <div title="Spedizione resto del mondo (fuori UE)">
              <label htmlFor="ac-ship-rest-world-emb" className="block truncate text-[9px] font-bold uppercase tracking-wide text-gray-500">
                Extra UE
              </label>
              <div className="relative mt-0.5">
                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">€</span>
                <input
                  id="ac-ship-rest-world-emb"
                  value={draft.shippingRestOfWorldEur}
                  onChange={(e) => update('shippingRestOfWorldEur', e.target.value)}
                  onBlur={(e) => update('shippingRestOfWorldEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                  className="w-full rounded-md border border-gray-300 py-1 pl-5 pr-1.5 text-xs tabular-nums text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-600">
          {t('auctions.createStepPhotos')} ({AUCTION_LISTING_PHOTO_MIN}–{AUCTION_LISTING_PHOTO_MAX})
        </span>
        <div
          className={cn(
            'mt-1 space-y-1.5',
            draft.listingPhotos.length > 0 && 'sm:flex sm:flex-row sm:items-start sm:gap-4 sm:space-y-0',
          )}
        >
          <input
            ref={embGalleryInputRef as LegacyRef<HTMLInputElement>}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              appendEmbeddedPhotos(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={embCameraInputRef as LegacyRef<HTMLInputElement>}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              appendEmbeddedPhotos(e.target.files);
              e.target.value = '';
            }}
          />
          <div
            className={cn(
              'flex items-stretch gap-1.5',
              draft.listingPhotos.length > 0
                ? 'sm:flex sm:flex-col sm:w-1/3 sm:gap-2'
                : 'sm:grid sm:grid-cols-2',
            )}
          >
            <button
              type="button"
              onClick={() => embGalleryInputRef.current?.click()}
              disabled={draft.listingPhotos.length >= AUCTION_LISTING_PHOTO_MAX}
              className={cn(
                'group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-[#1D3160]/10 bg-gradient-to-b from-white to-slate-50/60 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:border-[#FF7300]/40 hover:bg-orange-50/50 hover:shadow-md hover:shadow-[#FF7300]/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
                draft.listingPhotos.length > 0 ? 'sm:w-full' : 'sm:flex-none',
              )}
            >
              <ImageIcon className="h-4 w-4 text-[#1D3160]/70 transition-colors group-hover:text-[#FF7300]" aria-hidden />
              Carica
            </button>
            <button
              type="button"
              onClick={() => embCameraInputRef.current?.click()}
              disabled={draft.listingPhotos.length >= AUCTION_LISTING_PHOTO_MAX}
              className="group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-[#1D3160]/10 bg-gradient-to-b from-white to-slate-50/60 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:border-[#FF7300]/40 hover:bg-orange-50/50 hover:shadow-md hover:shadow-[#FF7300]/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:hidden"
            >
              <Camera className="h-4 w-4 text-[#1D3160]/70 transition-colors group-hover:text-[#FF7300]" aria-hidden />
              Scatta da telefono
            </button>
            <button
              type="button"
              onClick={() =>
                pairing.phoneUploadModalOpen
                  ? pairing.closePhoneUploadModal()
                  : void pairing.openPhoneUploadModal()
              }
              disabled={pairing.pairingActionLoading}
              aria-label="Carica da telefono con QR"
              title="Carica da telefono con QR"
              className={cn(
                'group hidden flex-col items-center justify-center gap-1 rounded-xl border border-[#1D3160]/10 bg-gradient-to-b from-white to-slate-50/60 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:border-[#FF7300]/40 hover:bg-orange-50/50 hover:shadow-md hover:shadow-[#FF7300]/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:flex',
                draft.listingPhotos.length > 0 && 'sm:w-full',
              )}
            >
              <QrCode className="h-4 w-4 text-[#1D3160]/70 transition-colors group-hover:text-[#FF7300]" aria-hidden />
              Scatta da telefono
            </button>
          </div>
          <div
            className={cn(
              draft.listingPhotos.length > 0 && 'flex-1 sm:w-2/3 space-y-2',
              !pairing.phoneUploadModalOpen && draft.listingPhotos.length > 0 && 'sm:mt-0',
            )}
          >
            {pairing.hasActiveSession && !pairing.phoneUploadModalOpen ? (
              <div className="rounded-xl border border-[#1D3160]/10 bg-[#1D3160]/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D3160]">
                    Collegamento telefono attivo
                  </span>
                </div>
                <div className="text-xs text-zinc-700 font-medium">
                  {t('auctions.createPhotoPairingSessionActive', {
                    count: String(pairing.remotePhotoCount),
                    max: String(pairing.maxPhotos),
                    minutes: String(pairing.expiresInMinutes ?? '—'),
                  })}
                </div>
                <p className="text-[10px] text-zinc-500 leading-snug">
                  {t('auctions.createPhotoFromPhonePollingHint')}
                </p>
                <div className="flex gap-3 pt-1 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => void pairing.regenerateQr()}
                    className="text-[#1D3160] hover:text-[#FF7300] transition-colors underline"
                  >
                    {t('auctions.createPhotoPairingRegenerateQr')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void pairing.revokePairing()}
                    className="text-zinc-500 hover:text-red-600 transition-colors underline"
                  >
                    {t('auctions.createPhotoPairingCloseSession')}
                  </button>
                </div>
              </div>
            ) : null}
            {pairing.phoneUploadModalOpen && pairing.phonePairingQrUrl ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className={cn(draft.listingPhotos.length > 0 ? 'sm:w-1/3' : 'w-full')}>
                  <PhotoPairingInlinePanel
                    compact
                    qrUrl={pairing.phonePairingQrUrl}
                    body={t('auctions.createPhotoFromPhoneModalBody')}
                    regenerateLabel={t('auctions.createPhotoPairingRegenerateQr')}
                    closeSessionLabel={t('auctions.createPhotoPairingCloseSession')}
                    onRegenerate={pairing.regenerateQr}
                    onCloseSession={pairing.revokePairing}
                  />
                </div>
                {draft.listingPhotos.length > 0 ? (
                  <div className="sm:w-2/3">
                    <CompactPhotoGallery
                      photos={draft.listingPhotos}
                      uploadStatuses={photoUploadStatuses}
                      onRemove={(index) => {
                        const next = draft.listingPhotos.filter((_, i) => i !== index);
                        setListingPhotos(next);
                      }}
                      highlightPhotoId={pairing.flashPhotoId}
                      onPhotoClick={(index) => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            {pairing.phonePhotoToast ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-900">
                {pairing.phonePhotoToast}
              </p>
            ) : null}
            {pairing.pairingActionError ? (
              <p className="text-[11px] text-red-700">{pairing.pairingActionError}</p>
            ) : null}
            {!pairing.phoneUploadModalOpen ? (
              <AuctionListingPhotoUpload
                photos={draft.listingPhotos}
                onPhotosChange={setListingPhotos}
                compact={draft.listingPhotos.length === 0}
                hideAddTile
                uploadStatuses={photoUploadStatuses}
                highlightPhotoId={pairing.flashPhotoId}
              />
            ) : null}
            {failedUploadFiles.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-900">
                <p className="font-semibold">Alcune foto non sono state caricate.</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {failedUploadFiles.map((file, i) => (
                    <button
                      key={`${file.name}-${i}`}
                      type="button"
                      onClick={() => retryFailedUpload(file)}
                      className="rounded border border-red-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-red-800 hover:bg-red-100"
                    >
                      Riprova
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 p-2">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-100">
            <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">Base</p>
            <p className="text-[11px] font-extrabold text-zinc-900">€{draft.startingBidEur || '—'}</p>
          </div>
          <div className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-100">
            <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">Durata</p>
            <p className="text-[11px] font-extrabold text-zinc-900">
              {t('auctions.createDurationDays', { days: draft.durationDays })}
            </p>
          </div>
          <div className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-100">
            <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">Spedizione</p>
            <p className="line-clamp-1 text-[11px] font-extrabold text-zinc-900">
              {draft.shippingPayer === 'buyer' ? t('auctions.createShippingBuyer') : t('auctions.createShippingSeller')}
            </p>
          </div>
          <div className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-100">
            <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">Foto</p>
            <p className="text-[11px] font-extrabold text-zinc-900">{draft.listingPhotos.length}</p>
          </div>
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-zinc-500">
          L&apos;asta parte subito alla pubblicazione (non è possibile programmarla).
        </p>
      </div>
    </div>
  );
}
