'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Gavel, Package } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  AUCTION_CARD_LANGUAGE_OPTIONS,
  AUCTION_CARD_CONDITION_OPTIONS,
  AUCTION_CREATE_DEFAULT_DRAFT,
  AUCTION_CREATE_GAMES,
  AUCTION_CUSTOM_DESCRIPTION_MAX,
  AUCTION_LISTING_PHOTO_MAX,
  AUCTION_LISTING_PHOTO_MIN,
  auctionConditionLabelKey,
  conditionSelectValue,
  normalizeAuctionCardLanguage,
  type AuctionCreateCardSelection,
  type AuctionCreateDraft,
  searchGameSlugToAuctionGame,
} from '@/lib/auction/auction-create-draft';
import {
  createEmbeddedDraftFromProduct,
  mergeInventoryIntoAuctionDraft,
  inventoryConditionToWizardValue,
} from '@/lib/auction/auction-embedded-draft';
import type { CardDocument } from '@/lib/product-detail';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { getCardImageUrl } from '@/lib/assets';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useCreateAuction } from '@/lib/hooks/use-auctions';
import type { AuctionCreatePayload } from '@/types/auction';
import { AuctionCreateCardPicker } from './AuctionCreateCardPicker';
import { AuctionListingPhotoUpload, ListingPhotoThumbnailsRow, listingPhotosComplete } from './AuctionListingPhotoUpload';

type WizardStepId =
  | 'q_card'
  | 'card_pick'
  | 'inventory_pick'
  | 'noncard_game'
  | 'details'
  | 'price'
  | 'shipping'
  | 'photos'
  | 'review';

const NON_CARD_GAME_OPTIONS = AUCTION_CREATE_GAMES.filter((g) => g.value !== 'other');

function getStepOrder(
  isCard: boolean | null,
  opts: { variant: 'standalone' | 'embedded'; hasEmbeddedInventory: boolean }
): WizardStepId[] {
  if (opts.variant === 'embedded') {
    const tail: WizardStepId[] = ['details', 'price', 'shipping', 'photos', 'review'];
    if (opts.hasEmbeddedInventory) return ['inventory_pick', ...tail];
    return tail;
  }
  if (isCard === true) return ['q_card', 'card_pick', 'details', 'price', 'shipping', 'photos', 'review'];
  if (isCard === false) return ['q_card', 'noncard_game', 'details', 'price', 'shipping', 'photos', 'review'];
  return ['q_card', 'noncard_game', 'details', 'price', 'shipping', 'photos', 'review'];
}

function getPreviousStepId(
  stepId: WizardStepId,
  draft: AuctionCreateDraft,
  opts: { variant: 'standalone' | 'embedded'; hasEmbeddedInventory: boolean }
): WizardStepId | 'cancel' {
  if (opts.variant === 'embedded') {
    if (stepId === 'inventory_pick') return 'cancel';
    if (stepId === 'details' && opts.hasEmbeddedInventory) return 'inventory_pick';
    if (stepId === 'details' && !opts.hasEmbeddedInventory) return 'cancel';
    if (stepId === 'price') return 'details';
    if (stepId === 'shipping') return 'price';
    if (stepId === 'photos') return 'shipping';
    if (stepId === 'review') return 'photos';
    return 'cancel';
  }
  if (stepId === 'q_card') return 'cancel';
  if (stepId === 'card_pick') return 'q_card';
  if (stepId === 'noncard_game') return 'q_card';
  if (stepId === 'details') return draft.isCard ? 'card_pick' : 'noncard_game';
  if (stepId === 'price') return 'details';
  if (stepId === 'shipping') return 'price';
  if (stepId === 'photos') return 'shipping';
  if (stepId === 'review') return 'photos';
  return 'q_card';
}

export type AuctionCreateWizardProps = {
  variant?: 'standalone' | 'embedded';
  /** Pagina prodotto: carta/già nota. */
  embeddedCard?: CardDocument;
  /** Righe inventario Sync filtrate per blueprint (solo se variant embedded). */
  embeddedInventoryItems?: InventoryItemWithCatalog[];
  /** Chiusura flusso embedded (es. cambio tab). */
  onEmbeddedCancel?: () => void;
  /** Classi aggiuntive sul contenitore esterno (es. tab prodotto). */
  className?: string;
};

export function AuctionCreateWizard({
  variant = 'standalone',
  embeddedCard,
  embeddedInventoryItems = [],
  onEmbeddedCancel,
  className,
}: AuctionCreateWizardProps = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const isEmbedded = variant === 'embedded' && Boolean(embeddedCard);
  const hasEmbeddedInventory = isEmbedded && embeddedInventoryItems.length > 0;

  const [embeddedInventoryPick, setEmbeddedInventoryPick] = useState<'unset' | 'skip' | number>('unset');

  const [stepId, setStepId] = useState<WizardStepId>(() =>
    isEmbedded && embeddedCard
      ? hasEmbeddedInventory
        ? 'inventory_pick'
        : 'details'
      : 'q_card'
  );
  const [draft, setDraft] = useState<AuctionCreateDraft>(() =>
    isEmbedded && embeddedCard ? createEmbeddedDraftFromProduct(embeddedCard) : AUCTION_CREATE_DEFAULT_DRAFT
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [createdAuctionInfo, setCreatedAuctionInfo] = useState<{
    id: number | null;
    startIso: string;
    endIso: string;
    publishMode: 'now' | 'scheduled';
  } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDesktopFloatingNav, setShowDesktopFloatingNav] = useState(false);
  const [isAtFormBottom, setIsAtFormBottom] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const wizardShellRef = useRef<HTMLDivElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const stepVariant = isEmbedded ? 'embedded' : 'standalone';

  const stepOrder = useMemo(
    () => getStepOrder(draft.isCard, { variant: stepVariant, hasEmbeddedInventory }),
    [draft.isCard, stepVariant, hasEmbeddedInventory]
  );
  const totalSteps = stepOrder.length;
  const activeStepIndex = stepOrder.indexOf(stepId);
  const currentStepNumber = activeStepIndex >= 0 ? activeStepIndex + 1 : 1;

  const formatEuro = useCallback((n: number) => formatEuroNoSpace(n, 'it-IT'), []);

  const update = useCallback(<K extends keyof AuctionCreateDraft>(key: K, value: AuctionCreateDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  }, []);

  const setListingPhotos = useCallback((next: File[]) => {
    setDraft((d) => ({ ...d, listingPhotos: next }));
    setError(null);
  }, []);

  const stepperLabels = useMemo(() => {
    if (stepVariant === 'embedded') {
      return [
        ...(hasEmbeddedInventory ? [t('auctions.createStepInventoryPick')] : []),
        t('auctions.createStepDetails'),
        t('auctions.createStepPrice'),
        t('auctions.createStepShipping'),
        t('auctions.createStepPhotos'),
        t('auctions.createStepReview'),
      ];
    }
    const branchLabel =
      draft.isCard === true
        ? t('auctions.createStepPickCard')
        : draft.isCard === false
          ? t('auctions.createStepNonCardGame')
          : t('auctions.createStepNonCardGame');
    return [
      t('auctions.createStepperQCard'),
      branchLabel,
      t('auctions.createStepDetails'),
      t('auctions.createStepPrice'),
      t('auctions.createStepShipping'),
      t('auctions.createStepPhotos'),
      t('auctions.createStepReview'),
    ];
  }, [draft.isCard, hasEmbeddedInventory, stepVariant, t]);

  const stepHeading = useMemo(() => {
    switch (stepId) {
      case 'q_card':
        return t('auctions.createAskIsCard');
      case 'card_pick':
        return t('auctions.createStepPickCard');
      case 'inventory_pick':
        return t('auctions.createStepInventoryPick');
      case 'noncard_game':
        return t('auctions.createStepNonCardGame');
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
      default:
        return '';
    }
  }, [stepId, t]);

  const stepHint = useMemo(() => {
    switch (stepId) {
      case 'q_card':
        return '';
      case 'card_pick':
        return t('auctions.createStepPickCardHint');
      case 'inventory_pick':
        return t('auctions.createStepInventoryPickHint');
      case 'noncard_game':
        return t('auctions.createNonCardGameHint');
      case 'details':
        return draft.isCard ? t('auctions.createStep2HintCardAuction') : t('auctions.createStep2Hint');
      case 'price':
        return t('auctions.createStep3Hint');
      case 'shipping':
        return t('auctions.createStep4Hint');
      case 'photos':
        return t('auctions.createStepPhotosHint');
      case 'review':
        return t('auctions.createStep5Hint');
      default:
        return '';
    }
  }, [stepId, draft.isCard, t]);

  const validateStepId = useCallback(
    (id: WizardStepId): boolean => {
      if (id === 'inventory_pick') {
        if (embeddedInventoryPick === 'unset') {
          setError(t('auctions.createValidationPickInventory'));
          return false;
        }
      }
      if (id === 'card_pick') {
        if (!draft.cardSelection) {
          setError(t('auctions.createValidationPickCard'));
          return false;
        }
      }
      if (id === 'noncard_game') {
        if (!draft.game) {
          setError(t('auctions.createValidationGame'));
          return false;
        }
      }
      if (id === 'details') {
        if (!draft.title.trim()) {
          setError(t('auctions.createValidationTitle'));
          return false;
        }
        if (draft.isCard) {
          const note = draft.description.trim();
          if (!note) {
            setError(t('auctions.createValidationAuctionNote'));
            return false;
          }
          if (draft.description.length > AUCTION_CUSTOM_DESCRIPTION_MAX) {
            setError(t('auctions.createValidationAuctionNoteMax'));
            return false;
          }
        }
      }
      if (id === 'price') {
        const start = Number(String(draft.startingBidEur).replace(',', '.'));
        if (!Number.isFinite(start) || start <= 0) {
          setError(t('auctions.createValidationStart'));
          return false;
        }
      }
      if (id === 'shipping') {
        if (draft.shippingPayer === 'buyer') {
          const flat = Number(String(draft.shippingFlatEur).replace(',', '.'));
          if (!Number.isFinite(flat) || flat < 0) {
            setError(t('auctions.createValidationShipping'));
            return false;
          }
        }
      }
      if (id === 'photos') {
        if (!listingPhotosComplete(draft.listingPhotos)) {
          setError(
            t('auctions.createValidationPhotos', {
              min: AUCTION_LISTING_PHOTO_MIN,
              max: AUCTION_LISTING_PHOTO_MAX,
            })
          );
          return false;
        }
      }
      if (id === 'review' && draft.publishMode === 'scheduled') {
        if (!draft.publishAtDate || !draft.publishAtTime) {
          setError('Se scegli la pubblicazione programmata, inserisci data e orario.');
          return false;
        }
        const scheduled = new Date(`${draft.publishAtDate}T${draft.publishAtTime}`);
        if (!Number.isFinite(scheduled.getTime())) {
          setError('Data o orario di pubblicazione non validi.');
          return false;
        }
        if (scheduled.getTime() <= Date.now() + 60_000) {
          setError('La pubblicazione programmata deve essere almeno 1 minuto nel futuro.');
          return false;
        }
      }
      setError(null);
      return true;
    },
    [draft, embeddedInventoryPick, t]
  );

  const handleCardSelect = useCallback((sel: AuctionCreateCardSelection) => {
    const img =
      getCardImageUrl(sel.image) ?? (sel.image.trim().startsWith('http') ? sel.image : '');
    setDraft((d): AuctionCreateDraft => {
      const base = {
        ...d,
        cardSelection: sel,
        title: sel.title,
        description: '',
        imageUrl: img,
        game: searchGameSlugToAuctionGame(sel.gameSlug),
        isCard: true,
        nonCardCategory: '' as const,
      };
      if (sel.inventoryItemId != null) {
        return {
          ...base,
          condition: inventoryConditionToWizardValue(sel.condition),
          cardLanguage: normalizeAuctionCardLanguage(sel.cardLanguage) || '',
          startingBidEur: sel.startingBidEur || '',
          selectedInventoryItemId: String(sel.inventoryItemId),
        };
      }
      return {
        ...base,
        selectedInventoryItemId: null,
        startingBidEur: '',
      };
    });
    setError(null);
  }, []);

  const chooseYesCard = () => {
    setDraft((d) => ({
      ...d,
      isCard: true,
      cardSelection: null,
      listingPhotos: [],
    }));
    setError(null);
    setStepId('card_pick');
  };

  const chooseNoCard = () => {
    setDraft((d) => ({
      ...d,
      isCard: false,
      cardSelection: null,
      game: '',
      nonCardCategory: '',
      listingPhotos: [],
    }));
    setError(null);
    setStepId('noncard_game');
  };

  const goNext = () => {
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
    setTimeout(() => setIsTransitioning(false), 400);
  };

  const goBack = () => {
    setError(null);
    setIsTransitioning(true);
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
    if (stepId === 'details' && draft.isCard && prev === 'card_pick') {
      setDraft((d) => ({
        ...d,
        cardSelection: null,
        title: '',
        description: '',
        imageUrl: '',
        game: '',
      }));
    }
    if (stepId === 'card_pick') {
      setDraft((d) => ({
        ...d,
        isCard: null,
        cardSelection: null,
        title: '',
        imageUrl: '',
        game: '',
        listingPhotos: [],
      }));
    }
    if (stepId === 'noncard_game') {
      setDraft((d) => ({
        ...d,
        isCard: null,
        game: '',
        nonCardCategory: '',
        listingPhotos: [],
      }));
    }
    setStepId(prev);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  const createAuctionMutation = useCreateAuction();

  const openPublishConfirm = () => {
    setError(null);
    setPublishConfirmOpen(true);
  };

  const closePublishConfirm = () => {
    setPublishConfirmOpen(false);
  };

  const editFromPublishConfirm = () => {
    setPublishConfirmOpen(false);
    setError(null);
    setStepId('details');
  };

  const publish = async () => {
    const order = getStepOrder(draft.isCard, { variant: stepVariant, hasEmbeddedInventory });
    for (const id of order) {
      if (!validateStepId(id)) {
        setStepId(id);
        return;
      }
    }

    const startingPrice = Number(String(draft.startingBidEur).replace(',', '.'));
    const reservePrice = draft.reservePriceEur
      ? Number(String(draft.reservePriceEur).replace(',', '.'))
      : undefined;
    const now = new Date();
    let startDate = now;
    if (draft.publishMode === 'scheduled') {
      const scheduled = new Date(`${draft.publishAtDate}T${draft.publishAtTime}`);
      if (!Number.isFinite(scheduled.getTime()) || scheduled.getTime() <= Date.now() + 60_000) {
        setError('Data/ora di pubblicazione non valida. Controlla e riprova.');
        return;
      }
      startDate = scheduled;
    }
    const endDate = new Date(startDate.getTime() + (draft.durationDays || 7) * 86_400_000);
    const imageFront = draft.imageUrl || '';
    const imageBack = draft.imageUrl || '';

    const payload: AuctionCreatePayload = {
      title: draft.title,
      description: draft.description || '',
      starting_price: startingPrice,
      reserve_price: reservePrice ?? null,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      product: {
        name: draft.title,
        description: draft.description || '',
        image_front: imageFront,
        image_back: imageBack,
        condition: draft.condition || '',
      },
      image_front: imageFront,
      image_back: imageBack,
    };

    try {
      const created = await createAuctionMutation.mutateAsync(payload);
      setCreatedAuctionInfo({
        id: created?.data?.id ?? null,
        startIso: created?.data?.start_time ?? payload.start_time,
        endIso: created?.data?.end_time ?? payload.end_time,
        publishMode: draft.publishMode,
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Errore nella creazione dell\'asta'
      );
    }
  };

  const isLastStep = stepId === 'review';

  useEffect(() => {
    if (stepId !== 'review' && publishConfirmOpen) {
      setPublishConfirmOpen(false);
    }
  }, [stepId, publishConfirmOpen]);

  /** Continua disabilitato finché non si risponde o non si sceglie una carta (stesso criterio di goNext). */
  const continueDisabled = useMemo(() => {
    if (stepId === 'q_card') return true;
    if (stepId === 'card_pick') return !draft.cardSelection;
    if (stepId === 'inventory_pick') return embeddedInventoryPick === 'unset';
    if (stepId === 'photos') return !listingPhotosComplete(draft.listingPhotos);
    return false;
  }, [stepId, draft.cardSelection, draft.listingPhotos, embeddedInventoryPick]);

  const previewImageSrc = draft.imageUrl ? getCardImageUrl(draft.imageUrl) ?? draft.imageUrl : null;
  const cardLanguageLabel = useMemo(
    () => AUCTION_CARD_LANGUAGE_OPTIONS.find((opt) => opt.value === draft.cardLanguage)?.label ?? '—',
    [draft.cardLanguage]
  );

  /** Barra navigazione fissa solo nello standalone; embedded usa footer inline nel card. */
  const showStickyNav = !isEmbedded && stepId !== 'q_card';

  // Desktop nav visibile solo quando il centro viewport cade nel range verticale del wizard.
  useEffect(() => {
    if (!showStickyNav) {
      setShowDesktopFloatingNav(false);
      return;
    }

    let rafId = 0;
    const updateDesktopNavVisibility = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const shell = wizardShellRef.current;
        if (!shell) {
          setShowDesktopFloatingNav(false);
          return;
        }
        const rect = shell.getBoundingClientRect();
        const viewportCenterY = window.innerHeight * 0.5;
        const inRange = rect.top + 24 <= viewportCenterY && rect.bottom - 24 >= viewportCenterY;
        setShowDesktopFloatingNav((prev) => (prev === inRange ? prev : inRange));
      });
    };

    updateDesktopNavVisibility();
    window.addEventListener('scroll', updateDesktopNavVisibility, { passive: true });
    window.addEventListener('resize', updateDesktopNavVisibility);

    return () => {
      window.removeEventListener('scroll', updateDesktopNavVisibility);
      window.removeEventListener('resize', updateDesktopNavVisibility);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [showStickyNav, stepId]);

  // Detect when user scrolls to bottom of form for button docking
  useEffect(() => {
    if (!showStickyNav) {
      setIsAtFormBottom(false);
      return;
    }

    let rafId = 0;
    const updateBottomState = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const card = formCardRef.current;
        if (!card) {
          setIsAtFormBottom(false);
          return;
        }
        const rect = card.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const atBottom = rect.bottom <= viewportHeight + 40; // 40px tolerance
        setIsAtFormBottom((prev) => (prev === atBottom ? prev : atBottom));
      });
    };

    updateBottomState();
    window.addEventListener('scroll', updateBottomState, { passive: true });
    window.addEventListener('resize', updateBottomState);

    return () => {
      window.removeEventListener('scroll', updateBottomState);
      window.removeEventListener('resize', updateBottomState);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [showStickyNav, stepId]);

  const formatDateTimeLong = useCallback((iso: string) => {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(d);
  }, []);

  const localDateInputValue = useCallback((date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // On every step change, scroll to top of page (at title level) and focus the first actionable field.
  useEffect(() => {
    if (!isEmbedded) {
      // Scrolla in cima alla pagina, all'altezza del titolo "Crea asta"
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }

    // Focus sul primo campo dopo un ritardo (per attendere lo scroll)
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

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
        </div>
        <h1 className="mt-6 text-xl font-bold uppercase tracking-wide text-gray-900">{t('auctions.createSuccessTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('auctions.createSuccessBody')}</p>
        {createdAuctionInfo && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Dettagli pubblicazione</p>
            <p className="mt-2 text-sm text-emerald-900">
              Modalita: {createdAuctionInfo.publishMode === 'scheduled' ? 'Programmata' : 'Immediata'}
            </p>
            <p className="mt-1 text-sm text-emerald-900">Inizio asta: {formatDateTimeLong(createdAuctionInfo.startIso)}</p>
            <p className="mt-1 text-sm text-emerald-900">Fine asta: {formatDateTimeLong(createdAuctionInfo.endIso)}</p>
            {createdAuctionInfo.id ? (
              <p className="mt-1 text-sm text-emerald-900">ID asta: #{createdAuctionInfo.id}</p>
            ) : null}
          </div>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/aste/mie"
            className="inline-flex items-center justify-center rounded-full bg-[#FF7300] px-8 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#e86800]"
          >
            {t('auctions.createViewListings')}
          </Link>
          <Link
            href="/aste"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-8 py-3 text-sm font-semibold uppercase text-gray-800 transition hover:bg-gray-50"
          >
            {t('auctions.createBackToHub')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div
      ref={wizardShellRef}
      className={cn(
        'mx-auto max-w-3xl lg:px-12 xl:px-16',
        isEmbedded && 'max-w-full px-0',
        className,
        showStickyNav &&
          (isEmbedded
            ? 'pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]'
            : 'pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]')
      )}
    >
      {isEmbedded ? (
        <div className="mb-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {t('auctions.createProgress', { current: currentStepNumber, total: totalSteps })}
            </span>
          </div>
          <div className="mt-1.5 flex gap-[3px]">
            {stepperLabels.map((label, i) => {
              const active = i === activeStepIndex;
              const complete = i < activeStepIndex;
              return (
                <div
                  key={`${label}-${i}`}
                  className={cn(
                    'h-[3px] flex-1 rounded-full transition-all duration-300',
                    complete ? 'bg-primary' : active ? 'bg-[#1D3160]' : 'bg-zinc-200'
                  )}
                  aria-current={active ? 'step' : undefined}
                  title={label}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            {stepperLabels[activeStepIndex] ?? ''}
          </p>
          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#FF7300] transition-[width] duration-700 ease-out"
              style={{
                width: `${totalSteps > 1 ? (activeStepIndex / (totalSteps - 1)) * 100 : 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div ref={formCardRef} className={cn('relative rounded-2xl border border-gray-200 bg-white shadow-sm', isEmbedded && 'rounded-xl border-zinc-200/70 bg-white/95 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.08)]')}>
        <div
          className={cn(
            'relative border-b border-gray-100 px-5 py-4 sm:px-8 sm:py-5',
            isEmbedded && 'border-b-zinc-100/50 px-3 py-1.5 sm:px-4 sm:py-2'
          )}
        >
          {/* Progress bar transition indicator */}
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
              isEmbedded && 'text-[13px] font-extrabold tracking-[0.06em] sm:text-sm'
            )}
          >
            {stepHeading}
          </h1>
        </div>

        <div ref={stepContentRef} className={cn('px-5 py-6 sm:px-8 sm:py-8', isEmbedded && 'px-3 py-2 sm:px-3.5 sm:py-2.5')}>
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

          {stepId === 'q_card' && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={chooseYesCard}
                  data-step-focus="true"
                  className="rounded-xl border-2 border-[#FF7300] bg-[#FF7300] px-8 py-4 text-sm font-bold uppercase text-white transition hover:bg-[#e86800]"
                >
                  {t('auctions.createIsCardYes')}
                </button>
                <button
                  type="button"
                  onClick={chooseNoCard}
                  className="rounded-xl border-2 border-[#1D3160] bg-white px-8 py-4 text-sm font-bold uppercase text-[#1D3160] transition hover:bg-[#1D3160]/5"
                >
                  {t('auctions.createIsCardNo')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => router.push('/aste')}
                className="text-xs font-semibold uppercase tracking-wide text-gray-500 underline decoration-gray-300 underline-offset-4 transition hover:text-[#1D3160] hover:decoration-[#1D3160]/40"
              >
                {t('auctions.createCancel')}
              </button>
            </div>
          )}

          {stepId === 'card_pick' && (
            <AuctionCreateCardPicker
              selectedId={draft.cardSelection?.id ?? null}
              selectedTitle={draft.cardSelection?.title ?? null}
              onSelect={handleCardSelect}
            />
          )}

          {stepId === 'inventory_pick' && embeddedCard && (
            <div className={cn('space-y-4', isEmbedded && 'space-y-2')}>
              <p className={cn('text-sm text-gray-600', isEmbedded && 'text-[11px] leading-snug text-zinc-500')}>
                {t('auctions.createStepInventoryPickIntro')}
              </p>

              {isEmbedded ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof embeddedInventoryPick === 'number') return;
                      const firstId = embeddedInventoryItems[0]?.id;
                      if (typeof firstId === 'number') setEmbeddedInventoryPick(firstId);
                    }}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-left text-xs transition',
                      typeof embeddedInventoryPick === 'number'
                        ? 'border-[#FF7300] bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-[#1D3160]">
                      Usa una copia in inventario
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      Seleziona la copia gia presente e parti da quei dati.
                    </span>
                  </button>

                  <select
                    value={typeof embeddedInventoryPick === 'number' ? String(embeddedInventoryPick) : ''}
                    onChange={(e) => setEmbeddedInventoryPick(Number(e.target.value))}
                    className={cn(
                      'w-full rounded-lg border bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                      typeof embeddedInventoryPick === 'number'
                        ? 'border-[#FF7300]/60'
                        : 'border-gray-300'
                    )}
                  >
                    <option value="" disabled>
                      Seleziona una copia
                    </option>
                    {embeddedInventoryItems.map((item) => {
                      const props = item.properties as Record<string, unknown> | undefined;
                      const cond = typeof props?.condition === 'string' ? props.condition : '';
                      return (
                        <option key={item.id} value={item.id}>
                          #{item.id} · {t('auctions.createInventoryQtyLabel', { n: item.quantity })} · {formatEuro(item.price_cents / 100)}{cond ? ` · ${cond}` : ''}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={() => setEmbeddedInventoryPick('skip')}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#1D3160] transition',
                      embeddedInventoryPick === 'skip'
                        ? 'border-[#FF7300] bg-orange-50'
                        : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                    )}
                  >
                    {t('auctions.createInventorySkipCta')}
                  </button>
                </div>
              ) : (
                <>
                  <ul className={cn('space-y-2', isEmbedded && 'space-y-1.5')}>
                    {embeddedInventoryItems.map((item) => {
                      const props = item.properties as Record<string, unknown> | undefined;
                      const cond = typeof props?.condition === 'string' ? props.condition : '';
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => setEmbeddedInventoryPick(item.id)}
                            className={cn(
                              'w-full rounded-xl border px-4 py-3 text-left text-sm transition',
                              isEmbedded && 'rounded-lg px-3 py-2 text-xs',
                              embeddedInventoryPick === item.id
                                ? 'border-[#FF7300] bg-orange-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            )}
                          >
                            <span className="font-semibold text-[#1D3160]">#{item.id}</span>
                            <span className="text-gray-600"> · {t('auctions.createInventoryQtyLabel', { n: item.quantity })}</span>
                            <span className="text-gray-600"> · {formatEuro(item.price_cents / 100)}</span>
                            {cond ? <span className="text-xs text-gray-500"> · {cond}</span> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setEmbeddedInventoryPick('skip')}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#1D3160] transition',
                      isEmbedded && 'rounded-lg px-3 py-2 text-xs',
                      embeddedInventoryPick === 'skip'
                        ? 'border-[#FF7300] bg-orange-50'
                        : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                    )}
                  >
                    {t('auctions.createInventorySkipCta')}
                  </button>
                </>
              )}
            </div>
          )}

          {stepId === 'noncard_game' && (
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1D3160]">
                  {t('auctions.createNonCardGameSection')}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {NON_CARD_GAME_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setDraft((d) => ({ ...d, game: value, nonCardCategory: '' }));
                        setError(null);
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all',
                        draft.game === value
                          ? 'border-[#FF7300] bg-orange-50/80 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      <Gavel className="h-5 w-5 shrink-0 text-[#FF7300]" aria-hidden />
                      <span className="text-sm font-semibold uppercase tracking-wide text-gray-900">{t(labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-[#1D3160]/25 bg-[#f8f9fb] p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1D3160]">
                  {t('auctions.createNonCardCategorySection')}
                </p>
                <p className="mt-1 text-sm text-gray-600">{t('auctions.createNonCardCategorySectionHint')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setDraft((d) => ({ ...d, game: 'other', nonCardCategory: 'other_object' }));
                    setError(null);
                  }}
                  className={cn(
                    'mt-4 flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left text-sm font-bold uppercase tracking-wide transition-all sm:w-auto sm:min-w-[200px]',
                    draft.game === 'other'
                      ? 'border-[#FF7300] bg-[#FF7300] text-white shadow-sm'
                      : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                  )}
                >
                  <Package className="h-5 w-5 shrink-0 text-current" aria-hidden />
                  {t('auctions.createNonCardCategoryOther')}
                </button>
              </div>
            </div>
          )}

          {stepId === 'details' && draft.isCard && (
            <div className={cn('space-y-5', isEmbedded && 'space-y-3')}>
              <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start', isEmbedded && 'gap-3')}>
                {previewImageSrc && (
                  <div
                    className={cn(
                      'relative mx-auto h-40 w-[7.25rem] shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 sm:mx-0',
                      isEmbedded && 'h-24 w-[4.5rem] rounded-md border-zinc-200/80'
                    )}
                  >
                    <Image src={previewImageSrc} alt="" fill className="object-cover" sizes="116px" unoptimized />
                  </div>
                )}
                <div className={cn('min-w-0 flex-1 space-y-3', isEmbedded && 'space-y-1.5')}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('auctions.createTitleLabel')}</p>
                    <p className="mt-1 text-base font-semibold text-[#1D3160]">{draft.title || '—'}</p>
                  </div>
                  {draft.cardSelection?.setName?.trim() ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('auctions.createCatalogSetLabel')}</p>
                      <p className="mt-1 text-sm text-gray-800">{draft.cardSelection.setName}</p>
                    </div>
                  ) : null}
                </div>
              </div>
              <div>
                <label htmlFor="ac-desc" className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-600">{t('auctions.createAuctionNoteLabel')}</span>
                  <span className="text-[11px] tabular-nums text-gray-400">
                    {draft.description.length}/{AUCTION_CUSTOM_DESCRIPTION_MAX}
                  </span>
                </label>
                <textarea
                  id="ac-desc"
                  value={draft.description}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.length <= AUCTION_CUSTOM_DESCRIPTION_MAX) update('description', v);
                  }}
                  rows={isEmbedded ? 3 : 4}
                  maxLength={AUCTION_CUSTOM_DESCRIPTION_MAX}
                  className={cn(
                    'mt-1.5 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                    isEmbedded && 'py-2 text-sm'
                  )}
                  placeholder={t('auctions.createAuctionNotePlaceholder')}
                />
                <p className={cn('mt-1 text-xs text-gray-500', isEmbedded && 'mt-0.5 text-[11px] leading-snug')}>
                  {t('auctions.createAuctionNoteHint')}
                </p>
              </div>
              <div>
                <label htmlFor="ac-condition" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                  {t('auctions.createConditionLabel')}
                </label>
                <select
                  id="ac-condition"
                  value={conditionSelectValue(draft.condition)}
                  onChange={(e) => update('condition', e.target.value)}
                  className={cn(
                    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                    isEmbedded && 'py-2'
                  )}
                >
                  {AUCTION_CARD_CONDITION_OPTIONS.map(({ value, labelKey }) => (
                    <option key={value} value={value}>
                      {t(labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ac-language" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                  Lingua carta
                </label>
                <select
                  id="ac-language"
                  value={draft.cardLanguage}
                  onChange={(e) => update('cardLanguage', e.target.value)}
                  className={cn(
                    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                    isEmbedded && 'py-2'
                  )}
                >
                  <option value="">Non specificata</option>
                  {AUCTION_CARD_LANGUAGE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {stepId === 'details' && draft.isCard === false && (
            <div className={cn('space-y-5', isEmbedded && 'space-y-3')}>
              <div>
                <label htmlFor="ac-title-nc" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                  {t('auctions.createTitleLabel')}
                </label>
                <input
                  id="ac-title-nc"
                  value={draft.title}
                  onChange={(e) => update('title', e.target.value)}
                  className={cn(
                    'mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                    isEmbedded && 'py-2'
                  )}
                  placeholder={t('auctions.createTitlePlaceholder')}
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="ac-desc-nc" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                  {t('auctions.createDescLabel')}
                </label>
                <textarea
                  id="ac-desc-nc"
                  value={draft.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={isEmbedded ? 3 : 4}
                  className={cn(
                    'mt-1.5 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                    isEmbedded && 'py-2'
                  )}
                  placeholder={t('auctions.createDescPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="ac-condition-nc" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                  {t('auctions.createConditionLabel')}
                </label>
                <select
                  id="ac-condition-nc"
                  value={conditionSelectValue(draft.condition)}
                  onChange={(e) => update('condition', e.target.value)}
                  className={cn(
                    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                    isEmbedded && 'py-2'
                  )}
                >
                  {AUCTION_CARD_CONDITION_OPTIONS.map(({ value, labelKey }) => (
                    <option key={value} value={value}>
                      {t(labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {stepId === 'price' && (
            <div className={cn('space-y-5', isEmbedded && 'space-y-3')}>
              <div className={cn('grid gap-5 sm:grid-cols-2', isEmbedded && 'gap-2.5')}>
                <div>
                  <label htmlFor="ac-start" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                    {t('auctions.createStartingBidLabel')}
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
                    <input
                      id="ac-start"
                      value={draft.startingBidEur}
                      onChange={(e) => update('startingBidEur', e.target.value)}
                      className={cn(
                        'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                        isEmbedded && 'py-2'
                      )}
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="ac-res" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                    {t('auctions.createReserveLabel')}
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
                    <input
                      id="ac-res"
                      value={draft.reservePriceEur}
                      onChange={(e) => update('reservePriceEur', e.target.value)}
                      className={cn(
                        'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                        isEmbedded && 'py-2'
                      )}
                      inputMode="decimal"
                      placeholder="—"
                    />
                  </div>
                  <p className={cn('mt-1 text-xs text-gray-500', isEmbedded && 'mt-0.5 text-[11px]')}>
                    {t('auctions.createReserveHint')}
                  </p>
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wide text-gray-600">{t('auctions.createDurationLabel')}</span>
                <div className={cn('mt-2 flex flex-wrap gap-2', isEmbedded && 'mt-1 gap-1')}>
                  {([3, 5, 7] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => update('durationDays', d)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                        isEmbedded && 'px-3 py-1.5 text-[11px]',
                        draft.durationDays === d
                          ? 'border-[#FF7300] bg-[#FF7300] text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      )}
                    >
                      {t('auctions.createDurationDays', { days: d })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stepId === 'shipping' && (
            <div className={cn('space-y-6', isEmbedded && 'space-y-4')}>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wide text-gray-600">{t('auctions.createShippingWhoLabel')}</span>
                <div className={cn('mt-3 space-y-2', isEmbedded && 'mt-2 space-y-1.5')}>
                  <button
                    type="button"
                    onClick={() => update('shippingPayer', 'buyer')}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all',
                      isEmbedded && 'rounded-lg py-2.5',
                      draft.shippingPayer === 'buyer'
                        ? 'border-[#FF7300] bg-orange-50/80'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Package className={cn('h-5 w-5 text-[#1D3160]', isEmbedded && 'h-4 w-4')} aria-hidden />
                    <div>
                      <p className={cn('text-sm font-semibold text-gray-900', isEmbedded && 'text-xs')}>{t('auctions.createShippingBuyer')}</p>
                      <p className={cn('text-xs text-gray-500', isEmbedded && 'text-[11px]')}>{t('auctions.createShippingBuyerHint')}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => update('shippingPayer', 'seller')}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all',
                      isEmbedded && 'rounded-lg py-2.5',
                      draft.shippingPayer === 'seller'
                        ? 'border-[#FF7300] bg-orange-50/80'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Package className={cn('h-5 w-5 text-[#1D3160]', isEmbedded && 'h-4 w-4')} aria-hidden />
                    <div>
                      <p className={cn('text-sm font-semibold text-gray-900', isEmbedded && 'text-xs')}>{t('auctions.createShippingSeller')}</p>
                      <p className={cn('text-xs text-gray-500', isEmbedded && 'text-[11px]')}>{t('auctions.createShippingSellerHint')}</p>
                    </div>
                  </button>
                </div>
              </div>
              {draft.shippingPayer === 'buyer' && (
                <div>
                  <label htmlFor="ac-ship" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                    {t('auctions.createShippingFlatLabel')}
                  </label>
                  <div className="relative mt-1.5 max-w-xs">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
                    <input
                      id="ac-ship"
                      value={draft.shippingFlatEur}
                      onChange={(e) => update('shippingFlatEur', e.target.value)}
                      className={cn(
                        'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                        isEmbedded && 'py-2'
                      )}
                      inputMode="decimal"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {stepId === 'photos' && (
            <AuctionListingPhotoUpload
              photos={draft.listingPhotos}
              onPhotosChange={setListingPhotos}
              compact={isEmbedded}
            />
          )}

          {stepId === 'review' && (
            <div className={cn('space-y-4', isEmbedded && 'space-y-3')}>
              <div className={cn('rounded-xl border border-[#1D3160]/15 bg-[#f8f9fb] p-4', isEmbedded && 'rounded-lg border-zinc-200/60 bg-zinc-50/80 p-2.5')}>
                <p className="text-xs font-bold uppercase tracking-wide text-[#1D3160]">Pubblicazione</p>
                <div className={cn('mt-3 grid gap-2 sm:grid-cols-2', isEmbedded && 'mt-1.5 gap-1')}>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft((d) => ({ ...d, publishMode: 'now', publishAtDate: '', publishAtTime: '' }));
                      setError(null);
                    }}
                    className={cn(
                      'rounded-xl border-2 px-4 py-3 text-left transition-all',
                      isEmbedded && 'rounded-lg px-3 py-2',
                      draft.publishMode === 'now'
                        ? 'border-[#FF7300] bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <span className="block text-sm font-semibold text-gray-900">Pubblica subito</span>
                    <span className="mt-0.5 block text-xs text-gray-500">L'asta parte appena confermi.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft((d) => {
                        if (d.publishMode === 'scheduled') return d;
                        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
                        return {
                          ...d,
                          publishMode: 'scheduled',
                          publishAtDate: d.publishAtDate || localDateInputValue(oneHourFromNow),
                          publishAtTime: d.publishAtTime || `${String(oneHourFromNow.getHours()).padStart(2, '0')}:${String(oneHourFromNow.getMinutes()).padStart(2, '0')}`,
                        };
                      });
                      setError(null);
                    }}
                    className={cn(
                      'rounded-xl border-2 px-4 py-3 text-left transition-all',
                      isEmbedded && 'rounded-lg px-3 py-2',
                      draft.publishMode === 'scheduled'
                        ? 'border-[#FF7300] bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <span className="block text-sm font-semibold text-gray-900">Programma data e ora</span>
                    <span className="mt-0.5 block text-xs text-gray-500">Imposta quando deve iniziare l'asta.</span>
                  </button>
                </div>
                {draft.publishMode === 'scheduled' && (
                  <div className={cn('mt-3 grid gap-3 sm:grid-cols-2', isEmbedded && 'mt-2 gap-2')}>
                    <div>
                      <label htmlFor="ac-publish-date" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                        Data pubblicazione
                      </label>
                      <input
                        id="ac-publish-date"
                        type="date"
                        value={draft.publishAtDate}
                        min={localDateInputValue(new Date())}
                        onChange={(e) => update('publishAtDate', e.target.value)}
                        className={cn(
                          'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                          isEmbedded && 'py-2'
                        )}
                      />
                    </div>
                    <div>
                      <label htmlFor="ac-publish-time" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
                        Orario pubblicazione
                      </label>
                      <input
                        id="ac-publish-time"
                        type="time"
                        step={60}
                        value={draft.publishAtTime}
                        onChange={(e) => update('publishAtTime', e.target.value)}
                        className={cn(
                          'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                          isEmbedded && 'py-2'
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {isEmbedded ? (
                <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 p-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-white px-2.5 py-1.5 ring-1 ring-zinc-100">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Base</p>
                      <p className="text-xs font-extrabold text-zinc-900">€{draft.startingBidEur || '—'}</p>
                    </div>
                    <div className="rounded-md bg-white px-2.5 py-1.5 ring-1 ring-zinc-100">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Durata</p>
                      <p className="text-xs font-extrabold text-zinc-900">{t('auctions.createDurationDays', { days: draft.durationDays })}</p>
                    </div>
                    <div className="rounded-md bg-white px-2.5 py-1.5 ring-1 ring-zinc-100">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Spedizione</p>
                      <p className="text-xs font-extrabold text-zinc-900">
                        {draft.shippingPayer === 'buyer' ? t('auctions.createShippingBuyer') : t('auctions.createShippingSeller')}
                      </p>
                    </div>
                    <div className="rounded-md bg-white px-2.5 py-1.5 ring-1 ring-zinc-100">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Foto</p>
                      <p className="text-xs font-extrabold text-zinc-900">{draft.listingPhotos.length}</p>
                    </div>
                  </div>
                  <div className="mt-2 rounded-md bg-white px-2.5 py-2 ring-1 ring-zinc-100">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Titolo</p>
                    <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-zinc-900">{draft.title || '—'}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{draft.publishMode === 'scheduled' ? `Programmata: ${draft.publishAtDate || '—'} ${draft.publishAtTime || '—'}` : 'Pubblicazione immediata'}</p>
                  </div>
                  <div className="mt-2">
                    <ListingPhotoThumbnailsRow photos={draft.listingPhotos} />
                  </div>
                </div>
              ) : (
                <dl className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/80">
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createAskIsCard')}</dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                      {draft.isCard === true ? t('auctions.createIsCardYes') : draft.isCard === false ? t('auctions.createIsCardNo') : '—'}
                    </dd>
                  </div>
                  {draft.isCard && draft.cardSelection && (
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createStepPickCard')}</dt>
                      <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                        {draft.cardSelection.title}
                        {draft.cardSelection.setName ? ` — ${draft.cardSelection.setName}` : ''}
                        {draft.cardSelection.inventoryItemId != null ? (
                          <span className="mt-1 block text-xs font-normal text-gray-500">
                            {t('auctions.createFromCollectionItem', { id: draft.cardSelection.inventoryItemId })}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  )}
                  {draft.isCard === false && draft.game === 'other' && (
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t('auctions.createNonCardCategorySection')}
                      </dt>
                      <dd className="text-sm font-medium text-gray-900 sm:col-span-2">{t('auctions.createNonCardCategoryOther')}</dd>
                    </div>
                  )}
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.filterGame')}</dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                      {draft.game
                        ? t(AUCTION_CREATE_GAMES.find((g) => g.value === draft.game)?.labelKey ?? 'auctions.gameOther')
                        : '—'}
                    </dd>
                  </div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createTitleLabel')}</dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2">{draft.title || '—'}</dd>
                  </div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {draft.isCard ? t('auctions.createAuctionNoteLabel') : t('auctions.createDescLabel')}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2 whitespace-pre-wrap">{draft.description || '—'}</dd>
                  </div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createConditionLabel')}</dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2">{t(auctionConditionLabelKey(draft.condition))}</dd>
                  </div>
                  {draft.isCard && (
                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lingua carta</dt>
                      <dd className="text-sm font-medium text-gray-900 sm:col-span-2">{cardLanguageLabel}</dd>
                    </div>
                  )}
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createStartingBidLabel')}</dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2">€{draft.startingBidEur || '—'}</dd>
                  </div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createDurationLabel')}</dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                      {t('auctions.createDurationDays', { days: draft.durationDays })}
                    </dd>
                  </div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modalita pubblicazione</dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                      {draft.publishMode === 'scheduled'
                        ? `Programmata: ${draft.publishAtDate || '—'} ${draft.publishAtTime || '—'}`
                        : 'Immediata'}
                    </dd>
                  </div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createShippingWhoLabel')}</dt>
                    <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                      {draft.shippingPayer === 'buyer' ? t('auctions.createShippingBuyer') : t('auctions.createShippingSeller')}
                      {draft.shippingPayer === 'buyer' && (
                        <span className="text-gray-600"> — €{draft.shippingFlatEur}</span>
                      )}
                    </dd>
                  </div>
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createStepPhotos')}</dt>
                    <dd className="sm:col-span-2">
                      <ListingPhotoThumbnailsRow photos={draft.listingPhotos} />
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          )}
        </div>

        {isEmbedded && stepId !== 'q_card' && (
          <div className="border-t border-zinc-200/70 bg-zinc-50/70 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1D3160] transition hover:border-zinc-400"
              >
                <ChevronLeft className="h-3 w-3" aria-hidden />
                {t('auctions.createBack')}
              </button>

              {!isLastStep ? (
                <button
                  type="button"
                  disabled={continueDisabled}
                  title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                  onClick={goNext}
                  className={cn(
                    'inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white transition',
                    continueDisabled
                      ? 'cursor-not-allowed bg-[#FF7300]/35 opacity-60'
                      : 'bg-[#FF7300] hover:bg-[#e86800]'
                  )}
                >
                  {t('auctions.createContinue')}
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openPublishConfirm}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#FF7300] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#e86800]"
                >
                  <Gavel className="h-3 w-3" aria-hidden />
                  {t('auctions.createSubmit')}
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Static footer nav – appears when scrolled to the bottom of the form */}
      {showStickyNav && (
        <div
          className={cn(
            'transition-all duration-300 ease-out',
            isAtFormBottom
              ? 'mt-4 max-h-[200px] opacity-100 sm:mt-6'
              : 'pointer-events-none max-h-0 overflow-hidden opacity-0'
          )}
          aria-hidden={!isAtFormBottom}
        >
          <div
            className={cn(
              'flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm sm:gap-4 sm:px-6 sm:py-4',
              isEmbedded && 'rounded-xl px-3 py-2.5'
            )}
          >
            <button
              type="button"
              onClick={goBack}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white font-semibold uppercase tracking-wide text-[#1D3160] transition hover:bg-zinc-50',
                'min-h-[48px] flex-1 px-5 py-2.5 text-sm sm:min-h-[52px] sm:flex-none sm:px-8 sm:text-base'
              )}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              {t('auctions.createBack')}
            </button>

            {!isLastStep ? (
              <button
                type="button"
                disabled={continueDisabled}
                title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                onClick={goNext}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition',
                  'min-h-[48px] flex-1 sm:min-h-[52px] sm:flex-none sm:px-8 sm:text-base',
                  continueDisabled
                    ? 'cursor-not-allowed bg-[#FF7300]/40 opacity-60'
                    : 'bg-[#FF7300] hover:bg-[#e86800]'
                )}
              >
                {t('auctions.createContinue')}
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={openPublishConfirm}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF7300] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#e86800] sm:min-h-[52px] sm:flex-none sm:px-8 sm:text-base"
              >
                <Gavel className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                {t('auctions.createSubmit')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>

    {showStickyNav && (
      <>
        {/* Desktop: visibili solo nel range dei campi del wizard */}
        {showDesktopFloatingNav && !isAtFormBottom && (
          <>
            <button
              type="button"
              onClick={goBack}
              className={cn(
                'group fixed left-[max(10px,calc(50vw-31rem))] top-1/2 z-50 hidden min-h-[42px] -translate-y-1/2 items-center justify-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-[0_6px_18px_-4px_rgba(29,49,96,0.2)] backdrop-blur-md transition-all duration-200 ease-out hover:bg-white hover:shadow-[0_10px_24px_-6px_rgba(29,49,96,0.28)] hover:border-[#1D3160]/30 active:scale-95 sm:inline-flex',
                isEmbedded && 'left-3 min-h-[38px] px-3 py-1.5 text-[10px]'
              )}
              aria-label={t('auctions.createBack')}
            >
              <ChevronLeft className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
              <span className="whitespace-nowrap">{t('auctions.createBack')}</span>
            </button>

            {!isLastStep ? (
              <button
                type="button"
                disabled={continueDisabled}
                title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                onClick={goNext}
                className={cn(
                  'group fixed right-[max(10px,calc(50vw-31rem))] top-1/2 z-50 hidden min-h-[42px] -translate-y-1/2 items-center justify-center gap-1.5 rounded-full border border-white/70 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_6px_18px_-4px_rgba(255,115,0,0.38)] backdrop-blur-md transition-all duration-200 ease-out active:scale-95 sm:inline-flex',
                  isEmbedded && 'right-3 min-h-[38px] px-3 py-1.5 text-[10px]',
                  continueDisabled
                    ? 'cursor-not-allowed bg-[#FF7300]/40 opacity-60'
                    : 'bg-[#FF7300] hover:bg-[#FF8800] hover:shadow-[0_10px_24px_-6px_rgba(255,115,0,0.52)] hover:border-white/80'
                )}
                aria-label={t('auctions.createContinue')}
              >
                <span className="whitespace-nowrap">{t('auctions.createContinue')}</span>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={openPublishConfirm}
                className={cn(
                  'group fixed right-[max(10px,calc(50vw-31rem))] top-1/2 z-50 hidden min-h-[42px] -translate-y-1/2 items-center justify-center gap-1.5 rounded-full border border-white/70 bg-[#FF7300] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_6px_18px_-4px_rgba(255,115,0,0.38)] backdrop-blur-md transition-all duration-200 ease-out hover:bg-[#FF8800] hover:shadow-[0_10px_24px_-6px_rgba(255,115,0,0.52)] hover:border-white/80 active:scale-95 sm:inline-flex',
                  isEmbedded && 'right-3 min-h-[38px] px-3 py-1.5 text-[10px]'
                )}
                aria-label={t('auctions.createSubmit')}
              >
                <span className="whitespace-nowrap">{t('auctions.createSubmit')}</span>
                <Gavel className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden />
              </button>
            )}
          </>
        )}

        {/* Mobile: pillola fluttuante quando non in fondo */}
        {!isAtFormBottom && (
        <div
          className={cn(
            'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1 sm:hidden',
            isEmbedded && 'px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]',
            // Quando ancorata, usa padding minore e togli il pt-1
            isAtFormBottom && '!pb-[max(0.5rem,env(safe-area-inset-bottom))] !pt-0'
          )}
          role="presentation"
        >
          <footer
            className={cn(
              'pointer-events-auto inline-flex max-w-full items-center transition-all duration-300 ease-out',
              // Stato fluttuante (default)
              !isAtFormBottom && [
                'gap-1.5 rounded-[1.35rem] border border-white/55 bg-white/40 px-1.5 py-1 shadow-[0_8px_32px_-4px_rgba(29,49,96,0.18),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-2xl backdrop-saturate-150',
                isEmbedded && 'gap-1 py-0.5',
              ],
              // Stato ancorato (quando in fondo)
              isAtFormBottom && [
                'w-full gap-3 rounded-t-2xl border-x border-t border-zinc-200/80 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]',
                isEmbedded && 'gap-2 px-3 py-2.5',
              ]
            )}
            style={!isAtFormBottom ? { WebkitBackdropFilter: 'blur(20px) saturate(180%)' } : undefined}
          >
            <button
              type="button"
              onClick={goBack}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 font-semibold uppercase tracking-wide text-[#1D3160] transition active:scale-[0.98]',
                // Stato fluttuante
                !isAtFormBottom && [
                  'min-h-[36px] rounded-xl px-3 py-1.5 text-[11px] hover:bg-white/50',
                  isEmbedded && 'min-h-[32px] px-2.5 py-1',
                ],
                // Stato ancorato (più grande)
                isAtFormBottom && [
                  'min-h-[48px] flex-1 justify-center rounded-xl border border-zinc-300 bg-white px-6 text-sm hover:bg-zinc-50',
                  isEmbedded && 'min-h-[40px] px-4 text-[13px]',
                ]
              )}
            >
              <ChevronLeft className={cn('shrink-0', isAtFormBottom ? 'h-4 w-4' : 'h-3.5 w-3.5 opacity-80')} aria-hidden />
              {t('auctions.createBack')}
            </button>

            {/* Divider solo in stato fluttuante */}
            {!isAtFormBottom && <span className="h-5 w-px shrink-0 bg-[#1D3160]/10" aria-hidden />}

            {!isLastStep ? (
              <button
                type="button"
                disabled={continueDisabled}
                title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                onClick={goNext}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 font-bold uppercase tracking-wide text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition active:scale-[0.98]',
                  // Stato fluttuante
                  !isAtFormBottom && [
                    'min-h-[36px] rounded-[1.1rem] px-3.5 py-1.5 text-[11px]',
                    isEmbedded && 'min-h-[32px] px-3 py-1',
                    continueDisabled
                      ? 'cursor-not-allowed bg-[#FF7300]/35 opacity-60'
                      : 'bg-[#FF7300] hover:bg-[#e86800]',
                  ],
                  // Stato ancorato (più grande)
                  isAtFormBottom && [
                    'min-h-[48px] flex-1 justify-center rounded-xl px-6 text-sm',
                    isEmbedded && 'min-h-[40px] text-[13px]',
                    continueDisabled
                      ? 'cursor-not-allowed bg-[#FF7300]/40 opacity-60'
                      : 'bg-[#FF7300] hover:bg-[#e86800]',
                  ]
                )}
              >
                {t('auctions.createContinue')}
                <ChevronRight className={cn('shrink-0', isAtFormBottom ? 'h-4 w-4' : 'h-3.5 w-3.5')} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={openPublishConfirm}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 font-bold uppercase tracking-wide text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition hover:bg-[#e86800] active:scale-[0.98]',
                  // Stato fluttuante
                  !isAtFormBottom && [
                    'min-h-[36px] rounded-[1.1rem] bg-[#FF7300] px-3.5 py-1.5 text-[11px]',
                    isEmbedded && 'min-h-[32px] px-3 py-1',
                  ],
                  // Stato ancorato (più grande)
                  isAtFormBottom && [
                    'min-h-[48px] flex-1 justify-center rounded-xl bg-[#FF7300] px-6 text-sm',
                    isEmbedded && 'min-h-[40px] text-[13px]',
                  ]
                )}
              >
                <Gavel className={cn('shrink-0', isAtFormBottom ? 'h-4 w-4' : 'h-3.5 w-3.5')} aria-hidden />
                {t('auctions.createSubmit')}
              </button>
            )}
          </footer>
        </div>
        )}

        {publishConfirmOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1D3160]/45 px-4" role="presentation">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="publish-confirm-title"
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
            >
              <h2 id="publish-confirm-title" className="text-lg font-bold uppercase tracking-wide text-[#1D3160]">
                Asta pronta alla pubblicazione
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Avrai a disposizione 5 minuti per verificare e apportare eventuali modifiche finali. Trascorso questo
                intervallo, la pubblicazione verra confermata in modo definitivo e non sara piu reversibile.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={closePublishConfirm}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50"
                >
                  Controlla
                </button>
                <button
                  type="button"
                  onClick={editFromPublishConfirm}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50"
                >
                  Modifica
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPublishConfirmOpen(false);
                  void publish();
                }}
                className="mt-3 w-full rounded-xl bg-[#FF7300] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#e86800]"
              >
                Continua
              </button>
            </div>
          </div>
        )}
      </>
    )}
    </>
  );
}
