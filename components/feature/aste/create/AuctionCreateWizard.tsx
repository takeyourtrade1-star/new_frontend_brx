'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Gavel, Package } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  AUCTION_CARD_CONDITION_OPTIONS,
  AUCTION_CREATE_DEFAULT_DRAFT,
  AUCTION_CREATE_GAMES,
  AUCTION_CUSTOM_DESCRIPTION_MAX,
  AUCTION_LISTING_PHOTO_MAX,
  AUCTION_LISTING_PHOTO_MIN,
  auctionConditionLabelKey,
  conditionSelectValue,
  type AuctionCreateCardSelection,
  type AuctionCreateDraft,
  searchGameSlugToAuctionGame,
} from '@/lib/auction/auction-create-draft';
import { createEmbeddedDraftFromProduct, mergeInventoryIntoAuctionDraft } from '@/lib/auction/auction-embedded-draft';
import type { CardDocument } from '@/lib/product-detail';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { getCardImageUrl } from '@/lib/assets';
import { cn } from '@/lib/utils';
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

  const stepVariant = isEmbedded ? 'embedded' : 'standalone';

  const stepOrder = useMemo(
    () => getStepOrder(draft.isCard, { variant: stepVariant, hasEmbeddedInventory }),
    [draft.isCard, stepVariant, hasEmbeddedInventory]
  );
  const totalSteps = stepOrder.length;
  const activeStepIndex = stepOrder.indexOf(stepId);
  const currentStepNumber = activeStepIndex >= 0 ? activeStepIndex + 1 : 1;

  const formatEuro = useCallback((n: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
  }, []);

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
      setError(null);
      return true;
    },
    [draft, embeddedInventoryPick, t]
  );

  const handleCardSelect = useCallback((sel: AuctionCreateCardSelection) => {
    const img =
      getCardImageUrl(sel.image) ?? (sel.image.trim().startsWith('http') ? sel.image : '');
    setDraft((d) => ({
      ...d,
      cardSelection: sel,
      title: sel.title,
      description: '',
      imageUrl: img,
      game: searchGameSlugToAuctionGame(sel.gameSlug),
      isCard: true,
      nonCardCategory: '',
    }));
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
  };

  const goBack = () => {
    setError(null);
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
  };

  const publish = () => {
    const order = getStepOrder(draft.isCard, { variant: stepVariant, hasEmbeddedInventory });
    for (const id of order) {
      if (id === 'review') continue;
      if (!validateStepId(id)) {
        setStepId(id);
        return;
      }
    }
    setDone(true);
  };

  const isLastStep = stepId === 'review';

  /** Continua disabilitato finché non si risponde o non si sceglie una carta (stesso criterio di goNext). */
  const continueDisabled = useMemo(() => {
    if (stepId === 'q_card') return true;
    if (stepId === 'card_pick') return !draft.cardSelection;
    if (stepId === 'inventory_pick') return embeddedInventoryPick === 'unset';
    if (stepId === 'photos') return !listingPhotosComplete(draft.listingPhotos);
    return false;
  }, [stepId, draft.cardSelection, draft.listingPhotos, embeddedInventoryPick]);

  const previewImageSrc = draft.imageUrl ? getCardImageUrl(draft.imageUrl) ?? draft.imageUrl : null;

  /** Barra navigazione fissa solo dal passo 2 in poi (dopo «È una carta?»). */
  const showStickyNav = stepId !== 'q_card';

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
        </div>
        <h1 className="mt-6 text-xl font-bold uppercase tracking-wide text-gray-900">{t('auctions.createSuccessTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('auctions.createSuccessBody')}</p>
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
      className={cn(
        'mx-auto max-w-3xl',
        isEmbedded && 'max-w-full',
        className,
        showStickyNav &&
          (isEmbedded
            ? 'pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]'
            : 'pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]')
      )}
    >
      <div className={cn('mb-8', isEmbedded && 'mb-2.5')}>
        <p
          className={cn(
            'text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500',
            isEmbedded && 'text-[10px] tracking-[0.14em]'
          )}
        >
          {t('auctions.createProgress', { current: currentStepNumber, total: totalSteps })}
        </p>
        <div className={cn('mt-4 flex items-center justify-between gap-1 px-1 sm:gap-2', isEmbedded && 'mt-2 gap-0.5 px-0')}>
          {stepperLabels.map((label, i) => {
            const active = i === activeStepIndex;
            const complete = i < activeStepIndex;
            return (
              <div
                key={`${label}-${i}`}
                className={cn('flex min-w-0 flex-1 flex-col items-center gap-1.5', isEmbedded && 'gap-1')}
              >
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isEmbedded ? 'h-7 w-7 text-[10px] sm:h-8 sm:w-8' : 'h-9 w-9 sm:h-10 sm:w-10',
                    complete && 'bg-[#FF7300] text-white',
                    active && !complete && 'bg-[#1D3160] text-white',
                    active && !complete && (isEmbedded ? 'ring-1 ring-[#FF7300] ring-offset-1' : 'ring-2 ring-[#FF7300] ring-offset-2'),
                    !active && !complete && 'border-2 border-gray-200 bg-white text-gray-400'
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {complete ? (
                    <Check
                      className={cn(isEmbedded ? 'h-3.5 w-3.5' : 'h-4 w-4 sm:h-5 sm:w-5')}
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    'hidden text-center font-semibold uppercase leading-tight tracking-wide sm:block',
                    isEmbedded ? 'text-[8px] sm:text-[9px]' : 'text-[10px]',
                    active ? 'text-[#1D3160]' : 'text-gray-400'
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cn('relative rounded-2xl border border-gray-200 bg-white shadow-sm', isEmbedded && 'rounded-lg shadow-sm')}>
        <div
          className={cn(
            'border-b border-gray-100 px-5 py-4 sm:px-8 sm:py-5',
            isEmbedded && 'px-3 py-2 sm:px-4 sm:py-2.5'
          )}
        >
          <h1
            className={cn(
              'text-lg font-bold uppercase tracking-wide text-[#1D3160] sm:text-xl',
              isEmbedded && 'text-base sm:text-lg'
            )}
          >
            {stepHeading}
          </h1>
          {stepHint ? (
            <p className={cn('mt-1 text-sm text-gray-500', isEmbedded && 'mt-0.5 text-xs leading-snug')}>{stepHint}</p>
          ) : null}
        </div>

        <div className={cn('px-5 py-6 sm:px-8 sm:py-8', isEmbedded && 'px-3 py-3 sm:px-4 sm:py-4')}>
          {error && (
            <p
              className={cn(
                'mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800',
                isEmbedded && 'mb-3 py-1.5 text-xs'
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
              <p className={cn('text-sm text-gray-600', isEmbedded && 'text-xs leading-snug')}>
                {t('auctions.createStepInventoryPickIntro')}
              </p>
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
                      isEmbedded && 'h-28 w-[5.5rem]'
                    )}
                  >
                    <Image src={previewImageSrc} alt="" fill className="object-cover" sizes="116px" unoptimized />
                  </div>
                )}
                <div className={cn('min-w-0 flex-1 space-y-3', isEmbedded && 'space-y-2')}>
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
              <div className={cn('grid gap-5 sm:grid-cols-2', isEmbedded && 'gap-3')}>
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
                <div className={cn('mt-2 flex flex-wrap gap-2', isEmbedded && 'mt-1.5 gap-1.5')}>
                  {([3, 5, 7, 10] as const).map((d) => (
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
                      isEmbedded && 'rounded-lg py-3',
                      draft.shippingPayer === 'buyer'
                        ? 'border-[#FF7300] bg-orange-50/80'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Package className="h-5 w-5 text-[#1D3160]" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t('auctions.createShippingBuyer')}</p>
                      <p className="text-xs text-gray-500">{t('auctions.createShippingBuyerHint')}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => update('shippingPayer', 'seller')}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all',
                      isEmbedded && 'rounded-lg py-3',
                      draft.shippingPayer === 'seller'
                        ? 'border-[#FF7300] bg-orange-50/80'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Package className="h-5 w-5 text-[#1D3160]" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t('auctions.createShippingSeller')}</p>
                      <p className="text-xs text-gray-500">{t('auctions.createShippingSellerHint')}</p>
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
            <dl
              className={cn(
                'divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/80',
                isEmbedded && 'rounded-lg text-sm'
              )}
            >
              <div
                className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createAskIsCard')}</dt>
                <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                  {draft.isCard === true ? t('auctions.createIsCardYes') : draft.isCard === false ? t('auctions.createIsCardNo') : '—'}
                </dd>
              </div>
              {draft.isCard && draft.cardSelection && (
                <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
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
                <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('auctions.createNonCardCategorySection')}
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 sm:col-span-2">{t('auctions.createNonCardCategoryOther')}</dd>
                </div>
              )}
              <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.filterGame')}</dt>
                <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                  {draft.game
                    ? t(AUCTION_CREATE_GAMES.find((g) => g.value === draft.game)?.labelKey ?? 'auctions.gameOther')
                    : '—'}
                </dd>
              </div>
              <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createTitleLabel')}</dt>
                <dd className="text-sm font-medium text-gray-900 sm:col-span-2">{draft.title || '—'}</dd>
              </div>
              <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {draft.isCard ? t('auctions.createAuctionNoteLabel') : t('auctions.createDescLabel')}
                </dt>
                <dd className="text-sm font-medium text-gray-900 sm:col-span-2 whitespace-pre-wrap">{draft.description || '—'}</dd>
              </div>
              <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createConditionLabel')}</dt>
                <dd className="text-sm font-medium text-gray-900 sm:col-span-2">{t(auctionConditionLabelKey(draft.condition))}</dd>
              </div>
              <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createStartingBidLabel')}</dt>
                <dd className="text-sm font-medium text-gray-900 sm:col-span-2">€{draft.startingBidEur || '—'}</dd>
              </div>
              <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createDurationLabel')}</dt>
                <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                  {t('auctions.createDurationDays', { days: draft.durationDays })}
                </dd>
              </div>
              <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createShippingWhoLabel')}</dt>
                <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                  {draft.shippingPayer === 'buyer' ? t('auctions.createShippingBuyer') : t('auctions.createShippingSeller')}
                  {draft.shippingPayer === 'buyer' && (
                    <span className="text-gray-600"> — €{draft.shippingFlatEur}</span>
                  )}
                </dd>
              </div>
              <div className={cn('grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4', isEmbedded && 'px-3 py-2 sm:gap-3')}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('auctions.createStepPhotos')}</dt>
                <dd className="sm:col-span-2">
                  <ListingPhotoThumbnailsRow photos={draft.listingPhotos} />
                </dd>
              </div>
            </dl>
          )}
        </div>

        {/* Desktop: frecce ai lati fuori dalla card */}
        {showStickyNav && (
          <>
            <button
              type="button"
              onClick={goBack}
              className={cn(
                'absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/80 text-[#1D3160] shadow-[0_4px_20px_-2px_rgba(29,49,96,0.15)] backdrop-blur-md transition hover:bg-white hover:shadow-[0_6px_24px_-2px_rgba(29,49,96,0.2)] active:scale-95 sm:flex sm:-left-5 lg:-left-14 lg:h-12 lg:w-12',
                isEmbedded && 'h-8 w-8 lg:-left-12 lg:h-10 lg:w-10'
              )}
              aria-label={t('auctions.createBack')}
            >
              <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden />
            </button>

            {!isLastStep ? (
              <button
                type="button"
                disabled={continueDisabled}
                title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                onClick={goNext}
                className={cn(
                  'absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 text-white shadow-[0_4px_20px_-2px_rgba(255,115,0,0.3)] backdrop-blur-md transition active:scale-95 sm:flex sm:-right-5 lg:-right-14 lg:h-12 lg:w-12',
                  isEmbedded && 'h-8 w-8 lg:-right-12 lg:h-10 lg:w-10',
                  continueDisabled
                    ? 'cursor-not-allowed bg-[#FF7300]/40 opacity-60'
                    : 'bg-[#FF7300] hover:bg-[#e86800] hover:shadow-[0_6px_24px_-2px_rgba(255,115,0,0.4)]'
                )}
                aria-label={t('auctions.createContinue')}
              >
                <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={publish}
                className={cn(
                  'absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-[#FF7300] text-white shadow-[0_4px_20px_-2px_rgba(255,115,0,0.3)] backdrop-blur-md transition hover:bg-[#e86800] hover:shadow-[0_6px_24px_-2px_rgba(255,115,0,0.4)] active:scale-95 sm:flex sm:-right-5 lg:-right-14 lg:h-12 lg:w-12',
                  isEmbedded && 'h-8 w-8 lg:-right-12 lg:h-10 lg:w-10'
                )}
                aria-label={t('auctions.createSubmit')}
              >
                <Gavel className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden />
              </button>
            )}
          </>
        )}
      </div>
    </div>

    {showStickyNav && (
      <>
        {/* Mobile: pillola fissa in basso */}
        <div
          className={cn(
            'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1 sm:hidden',
            isEmbedded && 'px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
          )}
          role="presentation"
        >
          <footer
            className={cn(
              'pointer-events-auto inline-flex max-w-full items-center gap-1.5 rounded-[1.35rem] border border-white/55 bg-white/40 px-1.5 py-1 shadow-[0_8px_32px_-4px_rgba(29,49,96,0.18),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-2xl backdrop-saturate-150',
              isEmbedded && 'gap-1 py-0.5'
            )}
            style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
          >
            <button
              type="button"
              onClick={goBack}
              className={cn(
                'inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160]/85 transition hover:bg-white/50 active:scale-[0.98]',
                isEmbedded && 'min-h-[32px] px-2.5 py-1'
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              {t('auctions.createBack')}
            </button>
            <span className="h-5 w-px shrink-0 bg-[#1D3160]/10" aria-hidden />
            {!isLastStep ? (
              <button
                type="button"
                disabled={continueDisabled}
                title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                onClick={goNext}
                className={cn(
                  'inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-[1.1rem] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition active:scale-[0.98]',
                  isEmbedded && 'min-h-[32px] px-3 py-1',
                  continueDisabled
                    ? 'cursor-not-allowed bg-[#FF7300]/35 opacity-60'
                    : 'bg-[#FF7300] hover:bg-[#e86800]'
                )}
              >
                {t('auctions.createContinue')}
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={publish}
                className={cn(
                  'inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-[1.1rem] bg-[#FF7300] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition hover:bg-[#e86800] active:scale-[0.98]',
                  isEmbedded && 'min-h-[32px] px-3 py-1'
                )}
              >
                <Gavel className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('auctions.createSubmit')}
              </button>
            )}
          </footer>
        </div>
      </>
    )}
    </>
  );
}
