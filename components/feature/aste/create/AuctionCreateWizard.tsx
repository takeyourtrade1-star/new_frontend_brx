'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listingPhotosComplete } from '@/components/feature/aste/create/AuctionListingPhotoUpload';
import {
  AUCTION_CREATE_DEFAULT_DRAFT,
  AUCTION_LISTING_PHOTO_MAX,
  AUCTION_LISTING_PHOTO_MIN,
  normalizeAuctionCardLanguage,
  normalizeAuctionDraftMoneyInput,
  type AuctionCreateCardSelection,
  type AuctionCreateDraft,
  searchGameSlugToAuctionGame,
} from '@/lib/auction/auction-create-draft';
import {
  createEmbeddedDraftFromProduct,
  mergeInventoryIntoAuctionDraft,
  inventoryConditionToWizardValue,
} from '@/lib/auction/auction-embedded-draft';
import {
  type AuctionCreateWizardProps,
  type CreatedAuctionInfo,
  type EmbeddedInventoryPick,
  type WizardStepId,
  getStepOrder,
  getPreviousStepId,
} from '@/lib/auction/auction-create-wizard-types';
import { validateAuctionCreateStep } from '@/lib/auction/auction-create-validation';
import { buildAuctionCreatePayload } from '@/lib/auction/build-auction-create-payload';
import { readAuctionLanguagePreference } from '@/lib/auction/auction-language-preference';
import { buildCardLanguageOptions } from '@/lib/card-languages';
import { getCardImageUrl } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { useCreateAuction } from '@/lib/hooks/use-auctions';
import { useUserCountry } from '@/lib/hooks/use-user-country';
import { useTimeoutFn } from '@/lib/hooks/use-timeout-fn';
import { useAuctionListingPhotos } from '@/lib/hooks/use-auction-listing-photos';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { AuctionCreateSuccessScreen } from './wizard/AuctionCreateSuccessScreen';
import { AuctionCreateStepper } from './wizard/AuctionCreateStepper';
import { AuctionCreateWizardNav } from './wizard/AuctionCreateWizardNav';
import { AuctionCreatePublishConfirmModal } from './wizard/AuctionCreatePublishConfirmModal';
import { AuctionCreateStepPanel } from './wizard/AuctionCreateStepPanel';

export type { AuctionCreateWizardProps };

export function AuctionCreateWizard({
  variant = 'standalone',
  embeddedCard,
  embeddedInventoryItems = [],
  onEmbeddedCancel,
  className,
}: AuctionCreateWizardProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const detectedCountry = useUserCountry();
  const isEmbedded = variant === 'embedded' && Boolean(embeddedCard);
  const hasEmbeddedInventory = isEmbedded && embeddedInventoryItems.length > 0;

  const [embeddedInventoryPick, setEmbeddedInventoryPick] =
    useState<EmbeddedInventoryPick>('unset');

  const [stepId, setStepId] = useState<WizardStepId>(() =>
    isEmbedded && embeddedCard
      ? hasEmbeddedInventory
        ? 'inventory_pick'
        : 'details'
      : 'item_pick'
  );
  const [draft, setDraft] = useState<AuctionCreateDraft>(() =>
    isEmbedded && embeddedCard ? createEmbeddedDraftFromProduct(embeddedCard) : AUCTION_CREATE_DEFAULT_DRAFT
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [createdAuctionInfo, setCreatedAuctionInfo] = useState<CreatedAuctionInfo | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const setTransitionTimeout = useTimeoutFn();
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const embGalleryInputRef = useRef<HTMLInputElement>(null);
  const embCameraInputRef = useRef<HTMLInputElement>(null);

  const stepVariant = isEmbedded ? 'embedded' : 'standalone';

  useEffect(() => {
    if (!detectedCountry) return;
    setDraft((prev) => {
      if (prev.shippingOriginCountry && prev.shippingOriginCountry !== 'IT') return prev;
      return { ...prev, shippingOriginCountry: detectedCountry.toUpperCase() };
    });
  }, [detectedCountry]);

  // FE-REV-022: stepId/draft sono inizializzati solo al mount. Se la card embedded cambia
  // dopo (caricamento lazy o cambio prodotto nel flow), riallineiamo step e draft alla nuova card.
  const prevEmbeddedCardIdRef = useRef<string | null>(embeddedCard?.id ?? null);
  useEffect(() => {
    const currentId = embeddedCard?.id ?? null;
    if (prevEmbeddedCardIdRef.current === currentId) return;
    prevEmbeddedCardIdRef.current = currentId;
    if (!isEmbedded || !embeddedCard) return;
    setStepId(hasEmbeddedInventory ? 'inventory_pick' : 'details');
    setDraft(createEmbeddedDraftFromProduct(embeddedCard));
    setEmbeddedInventoryPick('unset');
    setError(null);
  }, [embeddedCard, isEmbedded, hasEmbeddedInventory]);

  const stepOrder = useMemo(
    () => getStepOrder(draft.isCard, { variant: stepVariant, hasEmbeddedInventory }),
    [draft.isCard, stepVariant, hasEmbeddedInventory]
  );
  const totalSteps = stepOrder.length;
  const activeStepIndex = stepOrder.indexOf(stepId);
  const currentStepNumber = activeStepIndex >= 0 ? activeStepIndex + 1 : 1;

  const update = useCallback(<K extends keyof AuctionCreateDraft>(key: K, value: AuctionCreateDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const {
    photoUploads,
    setListingPhotos,
    appendEmbeddedPhotos,
    retryFailedUpload,
    photoUploadStatuses,
    allPhotosUploaded,
    failedUploadFiles,
    lightboxUrls,
    pairing,
  } = useAuctionListingPhotos({
    draft,
    setDraft,
    stepId,
    isEmbedded,
    onErrorClear: clearError,
  });

  const validationMessages = useMemo(
    () => ({
      pickInventory: t('auctions.createValidationPickInventory'),
      continueDisabled: t('auctions.createContinueDisabledFooter'),
      pickCard: t('auctions.createValidationPickCard'),
      title: t('auctions.createValidationTitle'),
      auctionNoteMax: t('auctions.createValidationAuctionNoteMax'),
      start: t('auctions.createValidationStart'),
      reserveChoice: t('auctions.createValidationReserveChoice'),
      reserve: t('auctions.createValidationReserve'),
      buyNowChoice: t('auctions.createValidationBuyNowChoice'),
      buyNow: t('auctions.createValidationBuyNow'),
      condition: t('auctions.createValidationCondition'),
      cardLanguage: t('auctions.createValidationCardLanguage'),
      shipping: t('auctions.createValidationShipping'),
      photos: t('auctions.createValidationPhotos', {
        min: AUCTION_LISTING_PHOTO_MIN,
        max: AUCTION_LISTING_PHOTO_MAX,
      }),
      photosUploadFailed: 'Una o più foto non sono state caricate. Riprova prima di continuare.',
      photosUploadPending: 'Attendi il completamento del caricamento delle foto.',
    }),
    [t]
  );

  const validateStepId = useCallback(
    (id: WizardStepId): boolean => {
      const result = validateAuctionCreateStep({
        stepId: id,
        draft,
        isEmbedded,
        embeddedInventoryPick,
        allPhotosUploaded,
        failedUploadCount: failedUploadFiles.length,
        messages: validationMessages,
      });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setError(null);
      return true;
    },
    [
      draft,
      isEmbedded,
      embeddedInventoryPick,
      allPhotosUploaded,
      failedUploadFiles.length,
      validationMessages,
    ]
  );

  const stepperLabels = useMemo(() => {
    if (stepVariant === 'embedded') {
      return [
        ...(hasEmbeddedInventory ? [t('auctions.createStepInventoryPick')] : []),
        'Dettagli e prezzo',
        'Spedizione, foto e conferma',
      ];
    }
    return [
      t('auctions.createStepItem'),
      t('auctions.createStepDetails'),
      t('auctions.createStepPrice'),
      t('auctions.createStepShipping'),
      t('auctions.createStepPhotos'),
      t('auctions.createStepReview'),
    ];
  }, [hasEmbeddedInventory, stepVariant, t]);

  const stepHeading = useMemo(() => {
    if (isEmbedded) {
      if (stepId === 'details') return 'Dettagli e prezzo';
      if (stepId === 'review') return 'Spedizione, foto e conferma';
    }
    switch (stepId) {
      case 'item_pick':
        return t('auctions.createAskInInventory');
      case 'inventory_pick':
        return t('auctions.createStepInventoryPick');
      case 'details':
        return t('auctions.createStepDetails');
      case 'price':
        return t('auctions.createStepPrice');
      case 'shipping':
        return t('auctions.createStepShipping');
      case 'photos':
        return t('auctions.createStepPhotos');
      case 'review':
        return t('auctions.createStepReview');
      default: {
        const _exhaustive: never = stepId;
        return _exhaustive;
      }
    }
  }, [stepId, isEmbedded, t]);

  const handleCardSelect = useCallback((sel: AuctionCreateCardSelection) => {
    const img =
      getCardImageUrl(sel.image) ?? (sel.image.trim().startsWith('http') ? sel.image : '');
    // Defensive: normalize the selection title so a malformed selection
    // (undefined / whitespace-only) can't put a blank/garbage title in the draft.
    const safeTitle = typeof sel.title === 'string' ? sel.title.trim() : '';
    setDraft((d): AuctionCreateDraft => {
      const base = {
        ...d,
        cardSelection: sel,
        title: safeTitle,
        description: '',
        imageUrl: img,
        game: searchGameSlugToAuctionGame(sel.gameSlug),
        isCard: true,
        nonCardCategory: '' as const,
      };
      if (sel.inventoryItemId != null) {
        // Carta già in inventario e prezzata: il prezzo del listing diventa il
        // "Compra subito" (con selettore «tieni in vendita?»), mentre l'offerta
        // iniziale parte comunque da 1 € (modificabile).
        const listPrice = sel.startingBidEur ? normalizeAuctionDraftMoneyInput(sel.startingBidEur) : '';
        return {
          ...base,
          condition: inventoryConditionToWizardValue(sel.condition),
          cardLanguage: normalizeAuctionCardLanguage(sel.cardLanguage) || '',
          startingBidEur: '1',
          inventoryListPriceEur: listPrice,
          keepInventoryListing: listPrice !== '',
          buyNowPriceEur: listPrice,
          selectedInventoryItemId: String(sel.inventoryItemId),
        };
      }
      return {
        ...base,
        selectedInventoryItemId: null,
        condition: '',
        cardLanguage: readAuctionLanguagePreference() ?? '',
        startingBidEur: '1',
        inventoryListPriceEur: '',
        keepInventoryListing: true,
        buyNowPriceEur: '',
      };
    });
    setError(null);
  }, []);

  const handleGenericSelect = useCallback(
    (sel: AuctionCreateCardSelection) => {
      handleCardSelect(sel);
    },
    [handleCardSelect]
  );

  const chooseInInventoryYes = useCallback(() => {
    setDraft((d) => ({
      ...d,
      fromSyncInventory: true,
      isCard: true,
      cardSelection: null,
      title: '',
      description: '',
      imageUrl: '',
      game: '',
      listingPhotos: [],
    }));
    setError(null);
  }, []);

  const chooseInInventoryNo = useCallback(() => {
    setDraft((d) => ({
      ...d,
      fromSyncInventory: false,
      isCard: null,
      cardSelection: null,
      title: '',
      description: '',
      imageUrl: '',
      game: '',
      nonCardCategory: '',
      listingPhotos: [],
    }));
    setError(null);
  }, []);

  const clearCardSelection = useCallback(() => {
    setDraft((d) => ({
      ...d,
      cardSelection: null,
      title: '',
      description: '',
      imageUrl: '',
      game: '',
      selectedInventoryItemId: null,
      startingBidEur: '1',
      condition: '',
      cardLanguage: '',
    }));
    setError(null);
  }, []);

  const goNext = useCallback(() => {
    if (!validateStepId(stepId)) return;
    setIsTransitioning(true);
    if (stepId === 'inventory_pick' && isEmbedded && embeddedCard) {
      const base = createEmbeddedDraftFromProduct(embeddedCard);
      if (embeddedInventoryPick === 'skip') {
        setDraft(base);
      } else if (typeof embeddedInventoryPick === 'number') {
        const item = embeddedInventoryItems.find((i) => i.id === embeddedInventoryPick);
        if (item) setDraft(mergeInventoryIntoAuctionDraft(base, item));
      }
    }
    const idx = stepOrder.indexOf(stepId);
    if (idx >= 0 && idx < stepOrder.length - 1) {
      setStepId(stepOrder[idx + 1]!);
    }
    setTransitionTimeout(() => setIsTransitioning(false), 400);
  }, [
    validateStepId,
    stepId,
    isEmbedded,
    embeddedCard,
    embeddedInventoryPick,
    embeddedInventoryItems,
    stepOrder,
    setTransitionTimeout,
  ]);

  const goBack = useCallback(() => {
    setError(null);
    setIsTransitioning(true);
    if (stepId === 'item_pick' && draft.fromSyncInventory !== null) {
      setDraft((d) => ({
        ...d,
        fromSyncInventory: null,
        isCard: null,
        cardSelection: null,
        title: '',
        description: '',
        imageUrl: '',
        game: '',
        nonCardCategory: '',
        listingPhotos: [],
      }));
      setTransitionTimeout(() => setIsTransitioning(false), 400);
      return;
    }
    const prev = getPreviousStepId(stepId, draft, {
      variant: stepVariant,
      hasEmbeddedInventory,
    });
    if (prev === 'cancel') {
      if (isEmbedded && onEmbeddedCancel) {
        onEmbeddedCancel();
        return;
      }
      router.push('/aste');
      return;
    }
    if (stepId === 'details' && isEmbedded && hasEmbeddedInventory && prev === 'inventory_pick') {
      setDraft(embeddedCard ? createEmbeddedDraftFromProduct(embeddedCard) : AUCTION_CREATE_DEFAULT_DRAFT);
      setEmbeddedInventoryPick('unset');
    }
    setStepId(prev);
    setTransitionTimeout(() => setIsTransitioning(false), 400);
  }, [
    stepId,
    draft,
    stepVariant,
    hasEmbeddedInventory,
    isEmbedded,
    onEmbeddedCancel,
    embeddedCard,
    router,
    setTransitionTimeout,
  ]);

  const createAuctionMutation = useCreateAuction();

  const openPublishConfirm = useCallback(() => {
    setError(null);
    setPublishConfirmOpen(true);
  }, []);

  const closePublishConfirm = useCallback(() => {
    setPublishConfirmOpen(false);
  }, []);

  const editFromPublishConfirm = useCallback(() => {
    setPublishConfirmOpen(false);
    setError(null);
    setStepId('details');
  }, []);

  const editReviewSection = useCallback(
    (section: 'item' | 'price' | 'shipping' | 'photos' | 'notes') => {
      setError(null);
      switch (section) {
        case 'item':
          setStepId(draft.cardSelection || draft.title.trim() ? 'details' : 'item_pick');
          break;
        case 'price':
          setStepId('price');
          break;
        case 'shipping':
          setStepId('shipping');
          break;
        case 'photos':
          setStepId('photos');
          break;
        case 'notes':
          setStepId('details');
          break;
        default: {
          const _exhaustive: never = section;
          return _exhaustive;
        }
      }
    },
    [draft.cardSelection, draft.title]
  );

  const publish = useCallback(async () => {
    const order = getStepOrder(draft.isCard, { variant: stepVariant, hasEmbeddedInventory });
    for (const id of order) {
      if (!validateStepId(id)) {
        setStepId(id);
        return;
      }
    }

    const built = buildAuctionCreatePayload(draft, photoUploads, isEmbedded);
    if (!built.ok) {
      setError(built.error);
      setStepId(built.photoStep);
      return;
    }

    try {
      const created = await createAuctionMutation.mutateAsync(built.payload);
      setCreatedAuctionInfo({
        id: created?.data?.id ?? null,
        startIso: created?.data?.start_time ?? built.startIso,
        endIso: created?.data?.end_time ?? built.endIso,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nella creazione dell'asta");
    } finally {
      // Revoke the phone-pairing session whether publish succeeds or fails —
      // the uploaded photos are already in the payload, so a stale session is
      // never useful and leaving it open on failure leaks a live pairing token.
      pairing.revokeOnPublish();
    }
  }, [
    draft,
    stepVariant,
    hasEmbeddedInventory,
    validateStepId,
    photoUploads,
    isEmbedded,
    createAuctionMutation,
    pairing,
  ]);

  const isLastStep = stepId === 'review';

  useEffect(() => {
    if (stepId !== 'review' && publishConfirmOpen) {
      setPublishConfirmOpen(false);
    }
  }, [stepId, publishConfirmOpen]);

  const continueDisabled = useMemo(() => {
    if (stepId === 'item_pick') {
      if (draft.fromSyncInventory === null) return true;
      return !draft.cardSelection && !draft.title.trim();
    }
    if (stepId === 'inventory_pick') return embeddedInventoryPick === 'unset';
    if (stepId === 'photos') {
      if (!listingPhotosComplete(draft.listingPhotos)) return true;
      return !allPhotosUploaded;
    }
    return false;
  }, [
    stepId,
    draft.fromSyncInventory,
    draft.cardSelection,
    draft.title,
    draft.listingPhotos,
    embeddedInventoryPick,
    allPhotosUploaded,
  ]);

  const publishDisabled = useMemo(() => {
    if (!isEmbedded || stepId !== 'review') return false;
    if (!listingPhotosComplete(draft.listingPhotos)) return true;
    return !allPhotosUploaded;
  }, [isEmbedded, stepId, draft.listingPhotos, allPhotosUploaded]);

  const cardLanguageFlagOptions = useMemo(
    () => buildCardLanguageOptions(draft.cardSelection?.availableLanguages),
    [draft.cardSelection?.availableLanguages]
  );

  useEffect(() => {
    if (!isEmbedded || draft.cardLanguage) return;
    const first = cardLanguageFlagOptions[0]?.code;
    if (first) update('cardLanguage', first);
  }, [isEmbedded, draft.cardLanguage, cardLanguageFlagOptions, update]);

  const itemPickSearchActive = stepId === 'item_pick' && draft.fromSyncInventory !== null;

  const showStickyNav = !isEmbedded && (stepId !== 'item_pick' || itemPickSearchActive);

  useEffect(() => {
    if (!isEmbedded) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const timer = window.setTimeout(() => {
      const root = stepContentRef.current;
      if (!root) return;
      const firstFocusable = root.querySelector<HTMLElement>(
        [
          'input:not([type="hidden"]):not([disabled])',
          'textarea:not([disabled])',
          'select:not([disabled])',
          'button[data-step-focus="true"]',
          'button:not([disabled])',
        ].join(',')
      );
      if (firstFocusable) {
        try {
          firstFocusable.focus({ preventScroll: true });
        } catch {
          firstFocusable.focus();
        }
        return;
      }
      stepHeadingRef.current?.focus({ preventScroll: true });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [stepId, isEmbedded]);

  useEffect(() => {
    if (done) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [done]);

  if (done) {
    return (
      <AuctionCreateSuccessScreen createdAuctionInfo={createdAuctionInfo} />
    );
  }

  return (
    <>
      <div
        className={cn(
          'mx-auto max-w-3xl lg:px-12 xl:px-16',
          isEmbedded && 'max-w-full px-0',
          className
        )}
      >
        <AuctionCreateStepper
          isEmbedded={isEmbedded}
          stepperLabels={stepperLabels}
          activeStepIndex={activeStepIndex}
          totalSteps={totalSteps}
          currentStepNumber={currentStepNumber}
        />

        <div
          className={cn(
            'relative rounded-2xl border border-gray-200 bg-white shadow-sm',
            isEmbedded && 'rounded-xl border border-zinc-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
          )}
        >
          <div
            className={cn(
              'relative border-b border-gray-100 px-5 py-4 sm:px-8 sm:py-5',
              isEmbedded && 'border-b border-zinc-100 px-3 py-2'
            )}
          >
            {isTransitioning && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden bg-gray-100">
                <div className="h-full w-1/3 animate-[shimmer_1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[#FF7300] to-transparent" />
              </div>
            )}
            <h1
              ref={stepHeadingRef}
              tabIndex={-1}
              className={cn(
                'text-lg font-bold uppercase tracking-wide text-[#1D3160] sm:text-xl',
                isEmbedded && 'text-xs font-extrabold uppercase tracking-wider text-zinc-800'
              )}
            >
              {stepHeading}
            </h1>
          </div>

          <div
            ref={stepContentRef}
            className={cn('px-5 py-6 sm:px-8 sm:py-8', isEmbedded && 'px-3 py-2 sm:px-3.5 sm:py-2.5')}
          >
            {error && (
              <p
                className={cn(
                  'mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800',
                  isEmbedded && 'mb-2 rounded-md py-1 text-[11px]'
                )}
                role="alert"
              >
                {error}
              </p>
            )}

            <AuctionCreateStepPanel
              stepId={stepId}
              isEmbedded={isEmbedded}
              draft={draft}
              update={update}
              embeddedCard={embeddedCard}
              embeddedInventoryItems={embeddedInventoryItems}
              embeddedInventoryPick={embeddedInventoryPick}
              onEmbeddedInventoryPickChange={setEmbeddedInventoryPick}
              cardLanguageFlagOptions={cardLanguageFlagOptions}
              onChooseInInventoryYes={chooseInInventoryYes}
              onChooseInInventoryNo={chooseInInventoryNo}
              onCardSelect={handleCardSelect}
              onGenericSelect={handleGenericSelect}
              onClearCardSelection={clearCardSelection}
              listingPhotos={draft.listingPhotos}
              setListingPhotos={setListingPhotos}
              pairing={pairing}
              photoUploadStatuses={photoUploadStatuses}
              failedUploadFiles={failedUploadFiles}
              retryFailedUpload={retryFailedUpload}
              appendEmbeddedPhotos={appendEmbeddedPhotos}
              embGalleryInputRef={embGalleryInputRef}
              embCameraInputRef={embCameraInputRef}
              setLightboxIndex={setLightboxIndex}
              setLightboxOpen={setLightboxOpen}
              onReviewEditSection={editReviewSection}
            />
          </div>

          <AuctionCreateWizardNav
            isEmbedded={isEmbedded}
            stepId={stepId}
            itemPickSearchActive={itemPickSearchActive}
            showStickyNav={false}
            isLastStep={isLastStep}
            continueDisabled={continueDisabled}
            publishDisabled={publishDisabled}
            currentStepNumber={currentStepNumber}
            totalSteps={totalSteps}
            onBack={goBack}
            onNext={goNext}
            onOpenPublishConfirm={openPublishConfirm}
          />
        </div>

        <AuctionCreateWizardNav
          isEmbedded={isEmbedded}
          stepId={stepId}
          itemPickSearchActive={itemPickSearchActive}
          showStickyNav={showStickyNav}
          isLastStep={isLastStep}
          continueDisabled={continueDisabled}
          publishDisabled={publishDisabled}
          currentStepNumber={currentStepNumber}
          totalSteps={totalSteps}
          onBack={goBack}
          onNext={goNext}
          onOpenPublishConfirm={openPublishConfirm}
        />
      </div>

      {publishConfirmOpen && (
        <AuctionCreatePublishConfirmModal
          open
          onClose={closePublishConfirm}
          onEdit={editFromPublishConfirm}
          onPublish={() => {
            setPublishConfirmOpen(false);
            void publish();
          }}
        />
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
