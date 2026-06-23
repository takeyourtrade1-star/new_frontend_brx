'use client';

import type { RefObject } from 'react';
import { Camera, ImageIcon, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AUCTION_LISTING_PHOTO_MAX, type ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';
import { ListingPhotoUpload, type ListingPhotoUploadStatus } from './ListingPhotoUpload';
import { PhotoPairingInlinePanel } from '@/components/feature/aste/create/PhotoPairingInlinePanel';
import { CompactPhotoGallery } from '@/components/feature/aste/create/CompactPhotoGallery';
import type { MessageKey } from '@/lib/i18n/messages/en';

type Pairing = ReturnType<typeof usePhotoPairingSession>;

/**
 * Piano 1.5 — step foto del wizard (riga azioni upload + pairing telefono + QR +
 * galleria), estratto verbatim da SellSingleWizard. Presentazionale: riceve stato
 * foto e callback dagli hook (useSellSinglePhotos + usePhotoPairingSession).
 */
export function SellSinglePhotoStep({
  listingPhotos,
  isEmbedded,
  galleryInputRef,
  cameraInputRef,
  onAppendPhotos,
  pairing,
  photoUploadStatuses,
  onListingPhotosChange,
  onPhotoClick,
  failedUploadFiles,
  onRetryUpload,
  t,
}: {
  listingPhotos: ListingPhotoSlot[];
  isEmbedded: boolean;
  galleryInputRef: RefObject<HTMLInputElement>;
  cameraInputRef: RefObject<HTMLInputElement>;
  onAppendPhotos: (files: FileList | null) => void;
  pairing: Pairing;
  photoUploadStatuses: ListingPhotoUploadStatus[];
  onListingPhotosChange: (next: ListingPhotoSlot[]) => void;
  onPhotoClick: (index: number) => void;
  failedUploadFiles: File[];
  onRetryUpload: (file: File) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}) {
  return (
                <div
                  className={cn(
                    'space-y-2',
                    isEmbedded && 'space-y-1.5',
                    listingPhotos.length > 0 && 'sm:flex sm:flex-row sm:items-start sm:gap-4 sm:space-y-0',
                  )}
                >
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      onAppendPhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      onAppendPhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <div
                    className={cn(
                      'flex items-stretch gap-1.5',
                      listingPhotos.length > 0
                        ? 'sm:flex sm:flex-col sm:w-1/3 sm:gap-2'
                        : 'sm:grid sm:grid-cols-2',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={listingPhotos.length >= AUCTION_LISTING_PHOTO_MAX}
                      className={cn(
                        'group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-[#1D3160]/10 bg-gradient-to-b from-white to-slate-50/60 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:border-[#FF7300]/40 hover:bg-orange-50/50 hover:shadow-md hover:shadow-[#FF7300]/10 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
                        listingPhotos.length > 0 ? 'sm:w-full' : 'sm:flex-none',
                      )}
                    >
                      <ImageIcon className="h-4 w-4 text-[#1D3160]/70 transition-colors group-hover:text-[#FF7300]" aria-hidden />
                      Carica
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={listingPhotos.length >= AUCTION_LISTING_PHOTO_MAX}
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
                        listingPhotos.length > 0 && 'sm:w-full',
                      )}
                    >
                      <QrCode className="h-4 w-4 text-[#1D3160]/70 transition-colors group-hover:text-[#FF7300]" aria-hidden />
                      Scatta da telefono
                    </button>
                  </div>
                  <div
                    className={cn(
                      listingPhotos.length > 0 && 'flex-1 sm:w-2/3 space-y-2',
                      !pairing.phoneUploadModalOpen && listingPhotos.length > 0 && 'sm:mt-0',
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
                          {t('vendi.sell.photoPairingSessionActive', {
                            count: String(pairing.remotePhotoCount),
                            max: String(pairing.maxPhotos),
                            minutes: String(pairing.expiresInMinutes ?? '—'),
                          })}
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-snug">
                          {t('vendi.sell.photoFromPhonePollingHint')}
                        </p>
                        <div className="flex gap-3 pt-1 text-[10px] font-semibold">
                          <button
                            type="button"
                            onClick={() => void pairing.regenerateQr()}
                            className="text-[#1D3160] hover:text-[#FF7300] transition-colors underline"
                          >
                            {t('vendi.sell.photoPairingRegenerateQr')}
                          </button>
                          <button
                            type="button"
                            onClick={() => void pairing.revokePairing()}
                            className="text-zinc-500 hover:text-red-600 transition-colors underline"
                          >
                            {t('vendi.sell.photoPairingCloseSession')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {isEmbedded && pairing.phoneUploadModalOpen && pairing.phonePairingQrUrl ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className={cn(listingPhotos.length > 0 ? 'sm:w-1/3' : 'w-full')}>                        
                          <PhotoPairingInlinePanel
                            compact
                            qrUrl={pairing.phonePairingQrUrl}
                            body={t('vendi.sell.photoFromPhoneModalBody')}
                            regenerateLabel={t('vendi.sell.photoPairingRegenerateQr')}
                            closeSessionLabel={t('vendi.sell.photoPairingCloseSession')}
                            onRegenerate={pairing.regenerateQr}
                            onCloseSession={pairing.revokePairing}
                          />
                        </div>
                        {listingPhotos.length > 0 ? (
                          <div className="sm:w-2/3">                          
                            <CompactPhotoGallery
                              photos={listingPhotos}
                              uploadStatuses={photoUploadStatuses}
                              onRemove={(index) => {
                                const next = listingPhotos.filter((_, i) => i !== index);
                                onListingPhotosChange(next);
                              }}
                              highlightPhotoId={pairing.flashPhotoId}
                              onPhotoClick={onPhotoClick}
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
                      <ListingPhotoUpload
                        photos={listingPhotos}
                        onPhotosChange={onListingPhotosChange}
                        compact={listingPhotos.length === 0}
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
                              onClick={() => onRetryUpload(file)}
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
  );
}
