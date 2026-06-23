'use client';

import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Check } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { cn } from '@/lib/utils';
import { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';
import {
  SELL_SINGLE_CONDITION_IMAGES,
  sellSingleConditionLabel,
} from '@/lib/marketplace/sell-single-conditions';
import type { SellSingleDraft } from '@/lib/marketplace/sell-single-draft';
import type { ListingPhotoUploadStatus } from './ListingPhotoUpload';
import { SellWizardLightbox, SellWizardModal } from './SellWizardModal';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import type { MessageKey } from '@/lib/i18n/messages/en';

/**
 * Piano 1.5 — cluster modali del wizard (QR telefono, guida condizione, conferma
 * pubblicazione, lightbox condizione/foto, toast) estratto verbatim da
 * SellSingleWizard. Presentazionale: prop con gli stessi nomi degli identificatori
 * originali per minimizzare il churn.
 */
export function SellSingleWizardModals({
  isEmbedded,
  pairing,
  t,
  qrCodeSize,
  isConditionModalOpen,
  setIsConditionModalOpen,
  draft,
  setConditionLightbox,
  setDontShowConditionModal,
  isConfirmPublishModalOpen,
  setIsConfirmPublishModalOpen,
  doPublish,
  setDontShowConfirmModal,
  photoUploadStatuses,
  conditionLightbox,
  publishToast,
  lightboxOpen,
  lightboxUrls,
  lightboxIndex,
  setLightboxOpen,
  setLightboxIndex,
}: {
  isEmbedded: boolean;
  pairing: ReturnType<typeof usePhotoPairingSession>;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  qrCodeSize: number;
  isConditionModalOpen: boolean;
  setIsConditionModalOpen: Dispatch<SetStateAction<boolean>>;
  draft: SellSingleDraft;
  setConditionLightbox: Dispatch<SetStateAction<string | null>>;
  setDontShowConditionModal: Dispatch<SetStateAction<boolean>>;
  isConfirmPublishModalOpen: boolean;
  setIsConfirmPublishModalOpen: Dispatch<SetStateAction<boolean>>;
  doPublish: () => void;
  setDontShowConfirmModal: Dispatch<SetStateAction<boolean>>;
  photoUploadStatuses: ListingPhotoUploadStatus[];
  conditionLightbox: string | null;
  publishToast: { message: string; type: 'success' | 'error' } | null;
  lightboxOpen: boolean;
  lightboxUrls: string[];
  lightboxIndex: number;
  setLightboxOpen: Dispatch<SetStateAction<boolean>>;
  setLightboxIndex: Dispatch<SetStateAction<number>>;
}) {
  return (
    <>
      {!isEmbedded ? (
        <SellWizardModal
          open={Boolean(pairing.phoneUploadModalOpen && pairing.pairingSessionId && pairing.phonePairingQrUrl)}
          onClose={pairing.closePhoneUploadModal}
          title={t('vendi.sell.photoFromPhoneModalTitle')}
          titleId="sell-phone-upload-qr-title"
          footer={
            <button
              type="button"
              onClick={() => pairing.closePhoneUploadModal()}
              className="w-full rounded-xl bg-[#1D3160] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1D3160]/90"
            >
              {t('vendi.sell.photoFromPhoneModalClose')}
            </button>
          }
        >
          <p className="text-sm leading-relaxed text-gray-700">
            {t('vendi.sell.photoFromPhoneModalBody')}
          </p>
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
            {t('vendi.sell.photoFromPhoneModalCloseHint')}
          </p>
          <div className="mt-3 flex justify-center rounded-xl border border-gray-100 bg-white p-3">
            {pairing.phonePairingQrUrl ? (
              <QRCodeSVG value={pairing.phonePairingQrUrl} size={qrCodeSize} level="M" className="h-auto w-auto max-w-full" />
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-center text-[10px] text-gray-500" title={pairing.phonePairingQrUrl}>
            {pairing.phonePairingQrUrl}
          </p>
        </SellWizardModal>
      ) : null}

      <SellWizardModal
        open={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        title={sellSingleConditionLabel(draft.condition)}
        titleId="sell-condition-modal-title"
        size="xl"
        className="sm:max-w-[52rem] sm:max-h-[min(92dvh,864px)]"
        contentClassName="px-6 py-5"
        hideCloseButton
        footer={
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConditionModalOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF8800] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#FF8800]/90 hover:shadow-md active:scale-[0.98]"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Ho compreso la condizione
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('sell_condition_modal_dont_show', 'true');
                setDontShowConditionModal(true);
                setIsConditionModalOpen(false);
              }}
              className="text-[10px] font-semibold text-zinc-500 underline transition hover:text-zinc-700"
            >
              Non mostrare più
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white"
            onClick={() =>
              setConditionLightbox(
                SELL_SINGLE_CONDITION_IMAGES[draft.condition]?.front ?? '/conditions/near-mint-front.jpeg',
              )
            }
          >
            <div className="relative h-full w-full p-1">
              <Image
                src={SELL_SINGLE_CONDITION_IMAGES[draft.condition]?.front ?? '/conditions/near-mint-front.jpeg'}
                alt="Fronte"
                fill
                sizes="(max-width: 640px) 45vw, 280px"
                className="object-contain"
              />
            </div>
          </button>
          <button
            type="button"
            className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white"
            onClick={() =>
              setConditionLightbox(
                SELL_SINGLE_CONDITION_IMAGES[draft.condition]?.back ?? '/conditions/near-mint-back.jpeg',
              )
            }
          >
            <div className="relative h-full w-full p-1">
              <Image
                src={SELL_SINGLE_CONDITION_IMAGES[draft.condition]?.back ?? '/conditions/near-mint-back.jpeg'}
                alt="Retro"
                fill
                sizes="(max-width: 640px) 45vw, 280px"
                className="object-contain"
              />
            </div>
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">Tocca un&apos;immagine per ingrandire</p>
      </SellWizardModal>

      <SellWizardModal
        open={isConfirmPublishModalOpen}
        onClose={() => setIsConfirmPublishModalOpen(false)}
        title="Conferma condizione"
        titleId="sell-confirm-publish-title"
        size="xl"
        className="sm:max-w-[46rem] sm:max-h-[min(92dvh,780px)]"
        contentClassName="px-6 py-5"
        hideCloseButton
        footer={
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmPublishModalOpen(false)}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1D3160] transition hover:bg-zinc-50"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmPublishModalOpen(false);
                  void doPublish();
                }}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#FF8800] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#FF8800]/90 hover:shadow-md active:scale-[0.98]"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Confermo che la condizione corrisponde
              </button>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('sell_confirm_publish_modal_dont_show', 'true');
                  setDontShowConfirmModal(true);
                  setIsConfirmPublishModalOpen(false);
                  void doPublish();
                }}
                className="text-[10px] font-semibold text-zinc-500 underline transition hover:text-zinc-700"
              >
                Non mostrare più
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#1D3160]">
              Esempio condizione: {sellSingleConditionLabel(draft.condition)}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="relative h-full w-full p-1">
                  <Image
                    src={SELL_SINGLE_CONDITION_IMAGES[draft.condition]?.front ?? '/conditions/near-mint-front.jpeg'}
                    alt="Fronte esempio"
                    fill
                    sizes="(max-width: 640px) 45vw, 280px"
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="relative h-full w-full p-1">
                  <Image
                    src={SELL_SINGLE_CONDITION_IMAGES[draft.condition]?.back ?? '/conditions/near-mint-back.jpeg'}
                    alt="Retro esempio"
                    fill
                    sizes="(max-width: 640px) 45vw, 280px"
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {draft.listingPhotos.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#1D3160]">
                Le tue foto
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {draft.listingPhotos.map((slot, i) => {
                  const status = photoUploadStatuses[i];
                  const url = status?.kind === 'done' ? status.cdnUrl : null;
                  if (!url) return null;
                  return (
                    <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <div className="relative h-full w-full p-1">
                        <Image src={url} alt={`Foto ${i + 1}`} fill sizes="(max-width: 640px) 45vw, 280px" className="object-contain" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SellWizardModal>

      <SellWizardLightbox
        open={Boolean(conditionLightbox)}
        imageSrc={conditionLightbox ?? ''}
        onClose={() => setConditionLightbox(null)}
        alt="Condizione carta"
      />

      {publishToast && (
        <div className="fixed right-5 top-5 z-[90] flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              publishToast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500',
            )}
          />
          <span className="text-sm font-medium text-gray-800">{publishToast.message}</span>
        </div>
      )}

      <ImageLightbox
        open={lightboxOpen}
        urls={lightboxUrls}
        startIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}
