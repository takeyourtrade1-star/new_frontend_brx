'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, ChevronLeft, ChevronRight, Loader2, Tag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  AUCTION_LISTING_PHOTO_MAX,
  MARKETPLACE_LISTING_PHOTO_MIN,
  type ListingPhotoSlot,
} from '@/lib/auction/auction-create-draft';
import { createListing, MarketplaceApiError } from '@/lib/api/marketplace-client';
import {
  attachListingPhotos,
  deletePhoto as deleteUploadedPhoto,
  uploadPhoto,
  type UploadedPhoto,
} from '@/lib/api/listing-photo-client';
import { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';
import { useSellGuide } from '@/components/feature/sell-guide/SellGuideProvider';
import {
  syncConditionToMarketplace,
  syncLanguageToMarketplace,
} from '@/lib/marketplace/condition-map';
import {
  SELL_SINGLE_CONDITION_IMAGES,
  SELL_SINGLE_CONDITION_OPTIONS,
} from '@/lib/marketplace/sell-single-conditions';
import {
  createSellSingleDraftFromCard,
  parseSellSinglePriceInput,
  type SellSingleDraft,
} from '@/lib/marketplace/sell-single-draft';
import { buildCardLanguageOptions, type CardLanguageOption } from '@/lib/card-languages';
import type { CardDocument } from '@/lib/product-detail';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import {
  ListingPhotoUpload,
  ListingPhotoThumbnailsRow,
  listingPhotosReady,
  type ListingPhotoUploadStatus,
} from './ListingPhotoUpload';
import { SellSingleDetailsStep } from './SellSingleDetailsStep';
import { SellSingleConfirmStep } from './SellSingleConfirmStep';
import { SellWizardLightbox, SellWizardModal } from './SellWizardModal';

type WizardStepId = 'details' | 'confirm';

function slotIncludedIn(slots: ListingPhotoSlot[], s: ListingPhotoSlot): boolean {
  if (s.kind === 'local') {
    return slots.some((x) => x.kind === 'local' && x.file === s.file);
  }
  return slots.some((x) => x.kind === 'remote' && x.photo.id === s.photo.id);
}

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
  const { notifyWizardStep } = useSellGuide();
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

  type PhotoUploadEntry = {
    status: 'uploading' | 'done' | 'error';
    progress: number;
    photo?: UploadedPhoto;
    error?: string;
    abort: AbortController;
  };
  const [photoUploads, setPhotoUploads] = useState<Map<File, PhotoUploadEntry>>(() => new Map());
  const [qrCodeSize, setQrCodeSize] = useState(168);

  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [modalCondition, setModalCondition] = useState(draft.condition);
  const [conditionLightbox, setConditionLightbox] = useState<string | null>(null);

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
    if (!publishToast) return;
    const t = window.setTimeout(() => setPublishToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [publishToast]);

  useEffect(() => {
    notifyWizardStep(stepId);
  }, [stepId, notifyWizardStep]);

  const unitPrice = useMemo(() => parseSellSinglePriceInput(draft.price), [draft.price]);
  const quantity = Number.isFinite(draft.quantity) ? Math.max(1, draft.quantity) : 1;
  const totalPrice = unitPrice * quantity;

  const update = useCallback(<K extends keyof SellSingleDraft>(key: K, value: SellSingleDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
    setActionMessage(null);
  }, []);

  const startUploadFor = useCallback((file: File) => {
    const abort = new AbortController();
    setPhotoUploads((prev) => {
      const next = new Map(prev);
      next.set(file, { status: 'uploading', progress: 0, abort });
      return next;
    });

    uploadPhoto(file, {
      signal: abort.signal,
      onProgress: (pct) => {
        setPhotoUploads((prev) => {
          const entry = prev.get(file);
          if (!entry || entry.status !== 'uploading') return prev;
          const next = new Map(prev);
          next.set(file, { ...entry, progress: pct });
          return next;
        });
      },
    })
      .then((photo) => {
        setPhotoUploads((prev) => {
          if (!prev.has(file)) return prev;
          const next = new Map(prev);
          next.set(file, { status: 'done', progress: 100, photo, abort });
          return next;
        });
      })
      .catch((err: unknown) => {
        if (abort.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Upload fallito. Riprova.';
        setPhotoUploads((prev) => {
          if (!prev.has(file)) return prev;
          const next = new Map(prev);
          next.set(file, { status: 'error', progress: 0, error: message, abort });
          return next;
        });
      });
  }, []);

  const setListingPhotos = useCallback(
    (next: ListingPhotoSlot[]) => {
      setDraft((d) => {
        const previous = d.listingPhotos;

        for (const old of previous) {
          if (slotIncludedIn(next, old)) continue;
          if (old.kind === 'local') {
            const entry = photoUploads.get(old.file);
            if (!entry) continue;
            entry.abort.abort();
            if (entry.status === 'done' && entry.photo) {
              void deleteUploadedPhoto(entry.photo.id).catch(() => {});
            }
            setPhotoUploads((prev) => {
              if (!prev.has(old.file)) return prev;
              const m = new Map(prev);
              m.delete(old.file);
              return m;
            });
          } else {
            void deleteUploadedPhoto(old.photo.id).catch(() => {});
          }
        }

        for (const s of next) {
          if (slotIncludedIn(previous, s)) continue;
          if (s.kind === 'local') startUploadFor(s.file);
        }

        return { ...d, listingPhotos: next };
      });
      setError(null);
    },
    [photoUploads, startUploadFor],
  );

  const pairing = usePhotoPairingSession({
    stepId,
    photoStepId: 'confirm',
    contextType: 'listing',
    qrBasePath: '/c/vendi-foto',
    maxPhotos: AUCTION_LISTING_PHOTO_MAX,
    listingPhotos: draft.listingPhotos,
    setListingPhotos,
    toastMessageKey: 'vendi.sell.photoReceivedFromPhone',
  });

  const retryFailedUpload = useCallback(
    (file: File) => {
      setPhotoUploads((prev) => {
        if (!prev.has(file)) return prev;
        const m = new Map(prev);
        m.delete(file);
        return m;
      });
      startUploadFor(file);
    },
    [startUploadFor],
  );

  const photoUploadStatuses = useMemo<ListingPhotoUploadStatus[]>(
    () =>
      draft.listingPhotos.map((slot) => {
        if (slot.kind === 'remote') return { kind: 'done', cdnUrl: slot.photo.cdn_url };
        const entry = photoUploads.get(slot.file);
        if (!entry) return { kind: 'idle' };
        if (entry.status === 'uploading') return { kind: 'uploading', progress: entry.progress };
        if (entry.status === 'done' && entry.photo) return { kind: 'done', cdnUrl: entry.photo.cdn_url };
        return { kind: 'error', message: entry.error || 'Upload fallito' };
      }),
    [draft.listingPhotos, photoUploads],
  );

  const allPhotosUploaded = useMemo(
    () => listingPhotosReady(draft.listingPhotos, photoUploadStatuses),
    [draft.listingPhotos, photoUploadStatuses],
  );

  const failedUploadFiles = useMemo(
    () =>
      draft.listingPhotos
        .filter(
          (s): s is Extract<ListingPhotoSlot, { kind: 'local' }> =>
            s.kind === 'local' && photoUploads.get(s.file)?.status === 'error',
        )
        .map((s) => s.file),
    [draft.listingPhotos, photoUploads],
  );

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

  const collectPhotoIds = useCallback((): number[] => {
    const ids: number[] = [];
    for (const slot of draft.listingPhotos) {
      if (slot.kind === 'remote') {
        ids.push(slot.photo.id);
        continue;
      }
      const entry = photoUploads.get(slot.file);
      if (entry?.status === 'done' && entry.photo) ids.push(entry.photo.id);
    }
    return ids;
  }, [draft.listingPhotos, photoUploads]);

  const publish = async () => {
    if (!validateDetails()) {
      setStepId('details');
      return;
    }
    if (!validatePhotos()) {
      setStepId('confirm');
      return;
    }

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
    setPhotoUploads(new Map());
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
              <div data-sell-guide="sell-price">
              <SellSingleDetailsStep
                draft={draft}
                update={update}
                cardTitle={embeddedCard.name}
                languageOptions={languageOptions}
                unitPrice={unitPrice}
                totalPrice={totalPrice}
                compact={isEmbedded}
                onOpenConditionPicker={() => {
                  setModalCondition(draft.condition);
                  setIsConditionModalOpen(true);
                }}
              />
              </div>
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
                <div className={cn('space-y-2', isEmbedded && 'space-y-1.5')} data-sell-guide="sell-photos">
                  <button
                    type="button"
                    onClick={() => void pairing.openPhoneUploadModal()}
                    disabled={pairing.pairingActionLoading}
                    className={cn(
                      'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#1D3160]/25 bg-[#f8f9fb] px-3 py-2 text-xs font-semibold text-[#1D3160] transition hover:border-[#FF7300]/50 hover:bg-orange-50/40 disabled:opacity-60',
                      isEmbedded && 'py-1.5 text-[11px]',
                    )}
                  >
                    {pairing.pairingActionLoading
                      ? t('vendi.sell.photoFromPhoneLoading')
                      : t('vendi.sell.photoFromPhone')}
                  </button>
                  {pairing.hasActiveSession ? (
                    <p className="text-[10px] leading-snug text-zinc-600">
                      {t('vendi.sell.photoPairingSessionActive', {
                        count: String(pairing.remotePhotoCount),
                        max: String(pairing.maxPhotos),
                        minutes: String(pairing.expiresInMinutes ?? '—'),
                      })}
                    </p>
                  ) : null}
                  {pairing.hasActiveSession && !pairing.phoneUploadModalOpen ? (
                    <p className="text-[10px] leading-snug text-zinc-600">
                      {t('vendi.sell.photoFromPhonePollingHint')}
                    </p>
                  ) : null}
                  {pairing.phonePhotoToast ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-900">
                      {pairing.phonePhotoToast}
                    </p>
                  ) : null}
                  {pairing.pairingActionError ? (
                    <p className="text-[11px] text-red-700">{pairing.pairingActionError}</p>
                  ) : null}
                  {pairing.hasActiveSession ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void pairing.regenerateQr()}
                        className="text-[10px] font-semibold text-[#1D3160] underline"
                      >
                        {t('vendi.sell.photoPairingRegenerateQr')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void pairing.revokePairing()}
                        className="text-[10px] font-semibold text-zinc-500 underline"
                      >
                        {t('vendi.sell.photoPairingCloseSession')}
                      </button>
                    </div>
                  ) : null}
                  <ListingPhotoUpload
                    photos={draft.listingPhotos}
                    onPhotosChange={setListingPhotos}
                    compact
                    uploadStatuses={photoUploadStatuses}
                    highlightPhotoId={pairing.flashPhotoId}
                  />
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
                  data-sell-guide="sell-publish"
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

      <SellWizardModal
        open={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        title="Scegli la condizione"
        titleId="sell-condition-modal-title"
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => {
              update('condition', modalCondition);
              setIsConditionModalOpen(false);
            }}
            className="w-full rounded-xl bg-[#FF8800] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#FF8800]/90"
          >
            Conferma condizione
          </button>
        }
      >
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Condizione
        </label>
        <select
          value={modalCondition}
          onChange={(e) => setModalCondition(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#FF8800] focus:outline-none focus:ring-2 focus:ring-[#FF8800]/25"
        >
          {SELL_SINGLE_CONDITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white"
            onClick={() =>
              setConditionLightbox(
                SELL_SINGLE_CONDITION_IMAGES[modalCondition]?.front ?? '/conditions/near-mint-front.jpeg',
              )
            }
          >
            <img
              src={SELL_SINGLE_CONDITION_IMAGES[modalCondition]?.front ?? '/conditions/near-mint-front.jpeg'}
              alt="Fronte"
              className="h-full w-full object-contain p-1"
            />
          </button>
          <button
            type="button"
            className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-white"
            onClick={() =>
              setConditionLightbox(
                SELL_SINGLE_CONDITION_IMAGES[modalCondition]?.back ?? '/conditions/near-mint-back.jpeg',
              )
            }
          >
            <img
              src={SELL_SINGLE_CONDITION_IMAGES[modalCondition]?.back ?? '/conditions/near-mint-back.jpeg'}
              alt="Retro"
              className="h-full w-full object-contain p-1"
            />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-500">Tocca un&apos;immagine per ingrandire</p>
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
    </>
  );
}
