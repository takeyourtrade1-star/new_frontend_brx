'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Check, ChevronLeft, ChevronRight, Loader2, Tag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  AUCTION_LISTING_PHOTO_MAX,
  MARKETPLACE_LISTING_PHOTO_MIN,
} from '@/lib/auction/auction-create-draft';
import { createListing, MarketplaceApiError } from '@/lib/api/marketplace-client';
import { attachListingPhotos } from '@/lib/api/listing-photo-client';
import { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';
import {
  syncConditionToMarketplace,
  syncLanguageToMarketplace,
} from '@/lib/marketplace/condition-map';
import {
  createSellSingleDraftFromCard,
  parseSellSinglePriceInput,
  type SellSingleDraft,
} from '@/lib/marketplace/sell-single-draft';
import { buildCardLanguageOptions, type CardLanguageOption } from '@/lib/card-languages';
import { readAuctionLanguagePreference } from '@/lib/auction/auction-language-preference';
import type { CardDocument } from '@/lib/product-detail';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { useSellSinglePhotos } from '@/hooks/vendi/useSellSinglePhotos';
import { SellSingleDetailsStep } from './SellSingleDetailsStep';
import { SellSingleConfirmStep } from './SellSingleConfirmStep';
import { SellSinglePhotoStep } from './SellSinglePhotoStep';
import { SellSingleWizardModals } from './SellSingleWizardModals';

type WizardStepId = 'details' | 'confirm';


export type SellSingleWizardProps = {
  variant?: 'standalone' | 'embedded';
  embeddedCard: CardDocument;
  blueprintId?: number | null;
  className?: string;
  onPublished?: () => void | Promise<void>;
};

export function SellSingleWizard({
  variant = 'embedded',
  embeddedCard,
  blueprintId = null,
  className,
  onPublished,
}: SellSingleWizardProps) {
  const { t } = useTranslation();
  const isEmbedded = variant === 'embedded';
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [stepId, setStepId] = useState<WizardStepId>('details');
  const [draft, setDraft] = useState<SellSingleDraft>(() => createSellSingleDraftFromCard(embeddedCard));
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [publishStage, setPublishStage] = useState<'creating' | 'photos' | null>(null);
  const [done, setDone] = useState(false);
  const [publishToast, setPublishToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [qrCodeSize, setQrCodeSize] = useState(168);

  /** Input nascosti per la riga azioni foto unificata (come nel tab Asta). */
  const sellGalleryInputRef = useRef<HTMLInputElement>(null);
  const sellCameraInputRef = useRef<HTMLInputElement>(null);

  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [conditionLightbox, setConditionLightbox] = useState<string | null>(null);
  const [isConfirmPublishModalOpen, setIsConfirmPublishModalOpen] = useState(false);

  const [dontShowConditionModal, setDontShowConditionModal] = useState(false);
  const [dontShowConfirmModal, setDontShowConfirmModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDontShowConditionModal(localStorage.getItem('sell_condition_modal_dont_show') === 'true');
    setDontShowConfirmModal(localStorage.getItem('sell_confirm_publish_modal_dont_show') === 'true');
  }, []);

  const languageOptions: CardLanguageOption[] = useMemo(
    () => buildCardLanguageOptions(embeddedCard.available_languages),
    [embeddedCard.available_languages],
  );

  useEffect(() => {
    if (languageOptions.length && !languageOptions.some((o) => o.code === draft.language)) {
      setDraft((d) => ({ ...d, language: languageOptions[0]!.code }));
    }
  }, [languageOptions, draft.language]);

  useEffect(() => {
    const cached = readAuctionLanguagePreference();
    if (!cached) return;
    if (languageOptions.some((o) => o.code === cached)) {
      setDraft((d) => (d.language === cached ? d : { ...d, language: cached }));
    }
  }, [languageOptions]);

  useEffect(() => {
    if (!publishToast) return;
    const t = window.setTimeout(() => setPublishToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [publishToast]);

  const unitPrice = useMemo(() => parseSellSinglePriceInput(draft.price), [draft.price]);
  const quantity = Number.isFinite(draft.quantity) ? Math.max(1, draft.quantity) : 1;
  const totalPrice = unitPrice * quantity;

  const update = useCallback(<K extends keyof SellSingleDraft>(key: K, value: SellSingleDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
    setActionMessage(null);
  }, []);

  const {
    setListingPhotos,
    retryFailedUpload,
    appendListingPhotos,
    photoUploadStatuses,
    allPhotosUploaded,
    failedUploadFiles,
    lightboxUrls,
    collectPhotoIds,
    resetUploads,
  } = useSellSinglePhotos({ listingPhotos: draft.listingPhotos, setDraft, setError });

  const pairing = usePhotoPairingSession({
    stepId,
    photoStepId: 'confirm',
    contextType: 'listing',
    qrBasePath: '/c/vendi-foto',
    maxPhotos: AUCTION_LISTING_PHOTO_MAX,
    listingPhotos: draft.listingPhotos,
    setListingPhotos,
    toastMessageKey: 'vendi.sell.photoReceivedFromPhone',
    autoCloseOnFirstRemotePhoto: isEmbedded,
  });








  useEffect(() => {
    if (!pairing.phoneUploadModalOpen) return;
    const updateSize = () => {
      setQrCodeSize(Math.min(176, Math.max(140, Math.floor(window.innerWidth * 0.42))));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [pairing.phoneUploadModalOpen]);

  const validateDetails = useCallback((): boolean => {
    if (!user?.id || !accessToken) {
      setError('Accedi per pubblicare un\'inserzione.');
      return false;
    }
    if (!embeddedCard.id) {
      setError('Carta non disponibile per la pubblicazione.');
      return false;
    }
    if (unitPrice <= 0) {
      setError('Inserisci un prezzo valido.');
      return false;
    }
    if (quantity < 1) {
      setError('La quantità deve essere almeno 1.');
      return false;
    }
    setError(null);
    return true;
  }, [user?.id, accessToken, embeddedCard.id, unitPrice, quantity]);

  const validatePhotos = useCallback((): boolean => {
    // Foto opzionali: blocca solo se l'utente ne ha aggiunte ma non sono pronte.
    if (draft.listingPhotos.length === 0) {
      setError(null);
      return true;
    }
    if (!allPhotosUploaded) {
      setError(
        t('auctions.createContinueDisabledFooter', {
          min: MARKETPLACE_LISTING_PHOTO_MIN,
          max: AUCTION_LISTING_PHOTO_MAX,
        }),
      );
      return false;
    }
    setError(null);
    return true;
  }, [allPhotosUploaded, draft.listingPhotos.length, t]);

  const goNext = () => {
    if (stepId === 'details') {
      if (!validateDetails()) return;
      setStepId('confirm');
    }
  };

  const goBack = () => {
    setError(null);
    if (stepId === 'confirm') {
      setStepId('details');
    }
  };


  const publish = async () => {
    if (!validateDetails()) {
      setStepId('details');
      return;
    }
    if (!validatePhotos()) {
      setStepId('confirm');
      return;
    }
    if (dontShowConfirmModal) {
      void doPublish();
    } else {
      setIsConfirmPublishModalOpen(true);
    }
  };

  const doPublish = async () => {
    const photoIds = collectPhotoIds();

    const ATTACH_PHOTOS_TIMEOUT_MS = 10_000;

    setPublishSubmitting(true);
    setPublishStage('creating');
    setError(null);
    setActionMessage(null);
    try {
      const listing = await createListing({
        card_id: embeddedCard.id,
        cardtrader_blueprint_id: blueprintId ?? undefined,
        title: embeddedCard.name,
        price: unitPrice,
        quantity,
        condition: syncConditionToMarketplace(draft.condition),
        language: syncLanguageToMarketplace(draft.language),
      });

      let photosWarning: string | null = null;
      if (photoIds.length > 0) {
        setPublishStage('photos');
        try {
          await Promise.race([
            attachListingPhotos(listing.id, photoIds),
            new Promise<never>((_, reject) => {
              setTimeout(
                () => reject(new Error('Collegamento foto in timeout')),
                ATTACH_PHOTOS_TIMEOUT_MS,
              );
            }),
          ]);
        } catch (attachErr) {
          photosWarning =
            attachErr instanceof Error
              ? attachErr.message
              : 'Collegamento foto non completato';
        }
      }

      const successMsg = photosWarning
        ? 'Inserzione creata. Le foto potrebbero non essere ancora collegate — riprova dalla modifica inserzione.'
        : 'Inserzione pubblicata con successo.';
      setActionMessage(successMsg);
      setPublishToast({
        message: photosWarning
          ? 'Inserzione pubblicata; collegamento foto in sospeso.'
          : 'Inserzione pubblicata sul marketplace EBARTEX.',
        type: photosWarning ? 'error' : 'success',
      });
      if (photosWarning) {
        setError(photosWarning);
      }
      setDone(true);
      pairing.revokeOnPublish();
      try {
        await onPublished?.();
      } catch (refreshErr) {
        console.warn('[SellSingleWizard] onPublished failed:', refreshErr);
      }
    } catch (e) {
      const msg =
        e instanceof MarketplaceApiError
          ? e.detail
          : e instanceof Error
            ? e.message
            : 'Pubblicazione non riuscita';
      setError(msg);
      setActionMessage(msg);
    } finally {
      setPublishSubmitting(false);
      setPublishStage(null);
    }
  };

  const resetWizard = () => {
    setDone(false);
    setStepId('details');
    setDraft(createSellSingleDraftFromCard(embeddedCard));
    resetUploads();
    setError(null);
    setActionMessage(null);
  };

  const stepLabels = ['Dettagli', 'Foto e conferma'];
  const stepIndex = stepId === 'details' ? 0 : 1;
  const continueDisabled =
    stepId === 'confirm' && draft.listingPhotos.length > 0 && !allPhotosUploaded;

  const stepHeading =
    stepId === 'details' ? 'Dettagli inserzione' : t('vendi.sell.stepConfirm');

  if (done) {
    return (
      <div
        className={cn(
          'rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center',
          isEmbedded && 'p-3',
          className,
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
        </div>
        <p className={cn('mt-3 text-sm font-bold text-emerald-900', isEmbedded && 'text-xs')}>
          Inserzione pubblicata
        </p>
        <p className={cn('mt-1 text-xs text-emerald-800', isEmbedded && 'text-[11px]')}>
          {actionMessage ?? 'La tua carta è ora visibile sul marketplace.'}
        </p>
        <button
          type="button"
          onClick={resetWizard}
          className={cn(
            'mt-3 rounded-lg bg-primary px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-primary/90',
            isEmbedded && 'py-1.5 text-[10px]',
          )}
        >
          Nuova inserzione
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={cn('flex min-h-0 flex-col', className)}>
        <div className={cn('mb-2', isEmbedded && 'mb-1.5')}>
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Passo {stepIndex + 1} di 2
            </span>
          </div>
          <div className="mt-1.5 flex gap-[3px]">
            {stepLabels.map((label, i) => {
              const active = i === stepIndex;
              const complete = i < stepIndex;
              return (
                <div
                  key={label}
                  className={cn(
                    'h-[3px] flex-1 rounded-full transition-all',
                    complete ? 'bg-primary' : active ? 'bg-[#1D3160]' : 'bg-zinc-200',
                  )}
                  title={label}
                />
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            'rounded-xl border border-zinc-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]',
            isEmbedded && 'rounded-lg',
          )}
        >
          <div className={cn('border-b border-zinc-100 px-3 py-2', isEmbedded && 'px-2.5 py-1.5')}>
            <h3
              className={cn(
                'text-xs font-extrabold uppercase tracking-wider text-zinc-800',
                isEmbedded && 'text-[11px]',
              )}
            >
              {stepHeading}
            </h3>
          </div>

          <div className={cn('px-3 py-3', isEmbedded && 'px-2.5 py-2')}>
            {actionMessage && !error && (
              <div
                className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
                role="status"
              >
                {actionMessage}
              </div>
            )}
            {error && (
              <p
                className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                role="alert"
              >
                {error}
              </p>
            )}

            {stepId === 'details' && (
              <SellSingleDetailsStep
                draft={draft}
                update={update}
                cardTitle={embeddedCard.name}
                languageOptions={languageOptions}
                unitPrice={unitPrice}
                totalPrice={totalPrice}
                compact={isEmbedded}
                onConditionChange={(value) => {
                  update('condition', value);
                  if (!dontShowConditionModal) {
                    setIsConditionModalOpen(true);
                  }
                }}
              />
            )}

            {stepId === 'confirm' && (
              <SellSingleConfirmStep
                draft={draft}
                cardTitle={embeddedCard.name}
                languageOptions={languageOptions}
                unitPrice={unitPrice}
                totalPrice={totalPrice}
                compact={isEmbedded}
              >
                <SellSinglePhotoStep
                  listingPhotos={draft.listingPhotos}
                  isEmbedded={isEmbedded}
                  galleryInputRef={sellGalleryInputRef}
                  cameraInputRef={sellCameraInputRef}
                  onAppendPhotos={appendListingPhotos}
                  pairing={pairing}
                  photoUploadStatuses={photoUploadStatuses}
                  onListingPhotosChange={setListingPhotos}
                  onPhotoClick={(index) => { setLightboxIndex(index); setLightboxOpen(true); }}
                  failedUploadFiles={failedUploadFiles}
                  onRetryUpload={retryFailedUpload}
                  t={t}
                />
              </SellSingleConfirmStep>
            )}
          </div>

          <div className={cn('border-t border-zinc-100 bg-zinc-50/70 px-3 py-2', isEmbedded && 'px-2.5 py-1.5')}>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={goBack}
                disabled={stepId === 'details' || publishSubmitting}
                className={cn(
                  'inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1D3160] transition hover:border-zinc-400 disabled:opacity-40',
                  stepId === 'details' && 'invisible',
                )}
              >
                <ChevronLeft className="h-3 w-3" aria-hidden />
                Indietro
              </button>

              {stepId === 'details' ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-primary/90"
                >
                  Continua
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={publishSubmitting || continueDisabled}
                  onClick={() => void publish()}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                >
                  {publishSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Tag className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {publishSubmitting
                    ? publishStage === 'photos'
                      ? 'Foto…'
                      : 'Pubblicazione…'
                    : 'Pubblica'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SellSingleWizardModals
        isEmbedded={isEmbedded}
        pairing={pairing}
        t={t}
        qrCodeSize={qrCodeSize}
        isConditionModalOpen={isConditionModalOpen}
        setIsConditionModalOpen={setIsConditionModalOpen}
        draft={draft}
        setConditionLightbox={setConditionLightbox}
        setDontShowConditionModal={setDontShowConditionModal}
        isConfirmPublishModalOpen={isConfirmPublishModalOpen}
        setIsConfirmPublishModalOpen={setIsConfirmPublishModalOpen}
        doPublish={() => void doPublish()}
        setDontShowConfirmModal={setDontShowConfirmModal}
        photoUploadStatuses={photoUploadStatuses}
        conditionLightbox={conditionLightbox}
        publishToast={publishToast}
        lightboxOpen={lightboxOpen}
        lightboxUrls={lightboxUrls}
        lightboxIndex={lightboxIndex}
        setLightboxOpen={setLightboxOpen}
        setLightboxIndex={setLightboxIndex}
      />
    </>
  );
}
