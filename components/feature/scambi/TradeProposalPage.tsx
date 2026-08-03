'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Loader2,
  LockKeyhole,
  Send,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAccountInventory } from '@/lib/hooks/use-account-inventory';
import { usePublicUserCollection } from '@/lib/hooks/use-public-user-collection';
import { useMeilisearchCards } from '@/lib/hooks/use-meilisearch-cards';
import { useCounterTrade, useCreateTrade } from '@/lib/hooks/use-trades';
import {
  clearTradeProposalContext,
  getTradeProposalContext,
  type TradeProposalContext,
} from '@/lib/scambi/trade-proposal-context';
import type { TradeAddress, TradeItemInput } from '@/types/trade';
import { ScambiShell, TradeCardThumb, scambiGlass } from './ScambiShell';

type ProposalStep = 'cards' | 'address' | 'review';
type StepDirection = 'forward' | 'backward';

const PROPOSAL_STEP_ORDER: ProposalStep[] = ['cards', 'address', 'review'];

interface PickerItem {
  id: string;
  inventoryItemId?: number;
  marketplaceListingId?: string;
  blueprintId: number;
  quantity: number;
  name: string;
  image?: string | null;
  setName?: string;
  source: 'cardtrader' | 'marketplace';
}

const EMPTY_ADDRESS: TradeAddress = {
  full_name: '', street: '', city: '', zip: '', province: '', country: 'IT', phone: '',
};

const ADDRESS_FIELDS = [
  { key: 'full_name', label: 'trades.address.fullName', autoComplete: 'name' },
  { key: 'street', label: 'trades.address.street', autoComplete: 'street-address', wide: true },
  { key: 'city', label: 'trades.address.city', autoComplete: 'address-level2' },
  { key: 'zip', label: 'trades.address.zip', autoComplete: 'postal-code', inputMode: 'numeric' },
  { key: 'province', label: 'trades.address.province', autoComplete: 'address-level1' },
  { key: 'country', label: 'trades.address.country', autoComplete: 'country-name' },
  { key: 'phone', label: 'trades.address.phone', autoComplete: 'tel', inputMode: 'tel' },
] as const;

function proposalItemKey(item: {
  source: 'sync' | 'marketplace';
  inventoryItemId?: number;
  marketplaceListingId?: string;
}): string | null {
  if (item.source === 'marketplace' && item.marketplaceListingId) {
    return `marketplace:${item.marketplaceListingId}`;
  }
  if (item.source === 'sync' && item.inventoryItemId) {
    return `sync:${item.inventoryItemId}`;
  }
  return null;
}

function toTradeItems(selected: Record<string, number>, items: PickerItem[]): TradeItemInput[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const result: TradeItemInput[] = [];
  for (const [id, selectedQuantity] of Object.entries(selected)) {
    const item = byId.get(id);
    if (!item) continue;
    const quantity = Math.max(1, Math.min(item.quantity, selectedQuantity));
    if (item.marketplaceListingId) {
      result.push({ marketplace_listing_id: item.marketplaceListingId, quantity });
    } else if (item.inventoryItemId) {
      result.push({ inventory_item_id: item.inventoryItemId, quantity });
    }
  }
  return result;
}

function ItemPicker({ title, empty, items, selected, locked, onChange }: {
  title: string;
  empty: string;
  items: PickerItem[];
  selected: Record<string, number>;
  locked?: Set<string>;
  onChange: (next: Record<string, number>) => void;
}) {
  const { t } = useTranslation();
  const selectedCount = Object.values(selected).reduce((sum, quantity) => sum + quantity, 0);
  const toggle = (item: PickerItem) => {
    if (locked?.has(item.id)) return;
    const next = { ...selected };
    if (next[item.id]) delete next[item.id]; else next[item.id] = 1;
    onChange(next);
  };

  return (
    <section className="overflow-hidden rounded-[1.3rem] border border-white/10 bg-[#09152E]/28 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-white">{title}</h2>
          <p className="mt-0.5 text-[11px] font-semibold text-white/40">{t('trades.availableCount', { count: items.length })}</p>
        </div>
        <span className={cn(
          'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
          selectedCount ? 'bg-[#FF7300] text-white' : 'bg-white/10 text-white/40',
        )} aria-live="polite" aria-atomic="true">
          {t('trades.selectedCount', { count: selectedCount })}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-52 items-center justify-center px-6 py-10 text-center">
          <p className="max-w-xs text-sm font-semibold text-white/45">{empty}</p>
        </div>
      ) : (
        <div className="max-h-[430px] space-y-2 overflow-y-auto p-3 sm:p-4">
          {items.map((item) => {
            const quantity = selected[item.id] ?? 0;
            const isSelected = quantity > 0;
            const isLocked = Boolean(locked?.has(item.id));
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-200 motion-reduce:transform-none',
                  isSelected
                    ? 'scambi-selection-live border-[#FF8A26]/60 bg-[#FF7300]/12 shadow-[0_6px_18px_rgba(255,115,0,0.08)]'
                    : 'border-white/10 bg-white/[0.055]',
                  !isSelected && !isLocked && 'hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.09]',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-disabled={isLocked}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60',
                    isLocked && 'cursor-default',
                  )}
                >
                  <TradeCardThumb image={item.image} name={item.name} className="h-[58px] w-[42px] shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-white">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/40">
                      {item.setName || t('trades.availableCount', { count: item.quantity })}
                    </span>
                    {isLocked && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-[#FF7300]">
                        <LockKeyhole className="h-3 w-3" aria-hidden /> {t('trades.lockedCard')}
                      </span>
                    )}
                  </span>
                  <span className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                    isSelected ? 'border-[#FF7300] bg-[#FF7300] text-white' : 'border-white/25 bg-white/5 text-transparent',
                  )}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                </button>

                {isSelected && (
                  <input
                    type="number"
                    min={1}
                    max={item.quantity}
                    value={quantity}
                    onChange={(event) => onChange({ ...selected, [item.id]: Math.max(1, Math.min(item.quantity, Number(event.target.value) || 1)) })}
                    onFocus={(event) => event.currentTarget.select()}
                    className="h-9 w-14 rounded-xl border border-white/15 bg-white/90 px-1 text-center text-sm font-black text-[#1D3160] outline-none focus:ring-2 focus:ring-[#FF7300]/35"
                    aria-label={t('trades.quantityFor', { card: item.name })}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TradeTableSide({
  items,
  selected,
  label,
  side,
}: {
  items: PickerItem[];
  selected: Record<string, number>;
  label: string;
  side: 'offered' | 'requested';
}) {
  const { t } = useTranslation();
  const visibleItems = items.slice(0, 5);
  const totalCards = items.reduce((sum, item) => sum + (selected[item.id] ?? 0), 0);

  return (
    <div className="relative h-full min-w-0">
      <div className={cn(
        'absolute inset-x-8 bottom-5 flex items-center gap-3',
        side === 'requested' && 'flex-row-reverse text-right',
      )}>
        <span className={cn(
          'h-px flex-1',
          side === 'offered' ? 'bg-gradient-to-r from-transparent to-sky-200/35' : 'bg-gradient-to-l from-transparent to-orange-200/40',
        )} aria-hidden />
        <div>
          <p className={cn(
            'text-[10px] font-black uppercase tracking-[0.16em]',
            side === 'offered' ? 'text-sky-100/75' : 'text-orange-100/80',
          )}>{label}</p>
          <p className="mt-0.5 text-xs font-black text-white/90">{t('trades.cardsCount', { count: totalCards })}</p>
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-16 top-12">
        {visibleItems.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center gap-3" aria-hidden>
            {[-1, 0, 1].map((slot) => (
              <span
                key={slot}
                className="block h-[102px] w-[72px] rounded-xl border border-dashed border-white/15 bg-black/5 shadow-inner"
                style={{ transform: `rotate(${slot * 5}deg) translateY(${Math.abs(slot) * 5}px)` }}
              />
            ))}
          </div>
        ) : visibleItems.map((item, index) => {
          const centerOffset = index - (visibleItems.length - 1) / 2;
          const rotation = centerOffset * (side === 'offered' ? 6 : -6);
          return (
            <div
              key={item.id}
              className="absolute bottom-1 left-1/2 origin-bottom"
              style={{
                zIndex: index + 1,
                transform: `translateX(calc(-50% + ${centerOffset * 48}px)) rotate(${rotation}deg) translateY(${Math.abs(centerOffset) * 5}px)`,
              }}
            >
              <div className="group/card relative transition-transform duration-200 hover:-translate-y-3 hover:scale-105 motion-reduce:transform-none" title={item.name}>
                <TradeCardThumb
                  image={item.image}
                  name={item.name}
                  className="h-[112px] w-20 rounded-xl border-white/70 shadow-[0_14px_28px_rgba(0,0,0,0.38)] ring-1 ring-black/20"
                />
                <span className={cn(
                  'absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white px-1.5 text-[10px] font-black text-white shadow-lg',
                  side === 'offered' ? 'bg-[#1D5E9A]' : 'bg-[#FF7300]',
                )}>
                  ×{selected[item.id] ?? 0}
                </span>
              </div>
            </div>
          );
        })}
        {items.length > visibleItems.length && (
          <span className={cn(
            'absolute bottom-3 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-black text-white/80 backdrop-blur-sm',
            side === 'offered' ? 'right-2' : 'left-2',
          )}>+{items.length - visibleItems.length}</span>
        )}
      </div>
    </div>
  );
}

function TradeProposalTable({
  offeredItems,
  requestedItems,
  offered,
  requested,
}: {
  offeredItems: PickerItem[];
  requestedItems: PickerItem[];
  offered: Record<string, number>;
  requested: Record<string, number>;
}) {
  const { t } = useTranslation();

  return (
    <section
      className="relative mb-5 hidden h-[286px] overflow-hidden rounded-[1.75rem] border border-[#C08A57]/45 bg-[#25130D] p-2 shadow-[0_24px_55px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.12)] lg:block"
      aria-label={t('trades.tableAria')}
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:repeating-linear-gradient(8deg,transparent_0,transparent_7px,rgba(255,255,255,.035)_8px,transparent_9px)]" aria-hidden />
      <div className="relative h-full overflow-hidden rounded-[1.35rem] border border-emerald-100/15 bg-[radial-gradient(ellipse_at_center,rgba(39,121,107,.9)_0%,rgba(16,77,72,.96)_48%,rgba(7,45,45,1)_100%)] shadow-[inset_0_0_55px_rgba(0,0,0,.42)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:24px_24px]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-8 top-5 flex items-start justify-between" aria-hidden>
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/85">
              <Sparkles className="h-3.5 w-3.5 text-orange-300" /> {t('trades.tableTitle')}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-white/40">{t('trades.tableHint')}</p>
          </div>
        </div>

        <div className="absolute inset-y-14 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/18 to-transparent" aria-hidden />
        <div className="absolute left-1/2 top-1/2 z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#071E22]/80 text-orange-200 shadow-[0_8px_25px_rgba(0,0,0,.32)] backdrop-blur-md" aria-hidden>
          <ArrowLeftRight className="h-5 w-5" />
        </div>

        <div className="grid h-full grid-cols-2">
          <TradeTableSide items={offeredItems} selected={offered} label={t('trades.youOffer')} side="offered" />
          <TradeTableSide items={requestedItems} selected={requested} label={t('trades.youReceive')} side="requested" />
        </div>

        {[[18, 18], [82, 18], [18, 82], [82, 82]].map(([left, top]) => (
          <span
            key={`${left}-${top}`}
            className="pointer-events-none absolute h-2 w-2 rounded-full border border-white/15 bg-black/25 shadow-inner"
            style={{ left: `${left}%`, top: `${top}%` }}
            aria-hidden
          />
        ))}
      </div>
    </section>
  );
}

export function TradeProposalPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [ctx, setCtx] = useState<TradeProposalContext | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [offered, setOffered] = useState<Record<string, number>>({});
  const [requested, setRequested] = useState<Record<string, number>>({});
  const [address, setAddress] = useState<TradeAddress>(EMPTY_ADDRESS);
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<ProposalStep>('cards');
  const [stepDirection, setStepDirection] = useState<StepDirection>('forward');
  const stepPanelRef = useRef<HTMLDivElement>(null);
  const focusNextStepRef = useRef(false);
  const createTrade = useCreateTrade();
  const counterTrade = useCounterTrade();

  useEffect(() => {
    const stored = user?.id ? getTradeProposalContext(user.id) : null;
    setCtx(stored);
    if (stored) {
      const initial: Record<string, number> = {};
      if (stored.requestedItems?.length) {
        for (const item of stored.requestedItems) {
          const key = proposalItemKey(item);
          if (key) initial[key] = Math.max(1, item.quantity);
        }
      } else if (stored.listing.quantity > 0) {
        const key = stored.listing.source === 'marketplace'
          ? `marketplace:${stored.listing.id.replace(/^mkt:/, '')}`
          : `sync:${stored.listing.id.replace(/^sync:/, '')}`;
        initial[key] = 1;
      }
      setRequested(initial);
    }
    setHydrated(true);
  }, [user?.id]);

  useEffect(() => {
    if (!focusNextStepRef.current) return;
    focusNextStepRef.current = false;
    const frame = window.requestAnimationFrame(() => stepPanelRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const isCounter = ctx?.mode === 'counter';
  const inventory = useAccountInventory(user?.id, accessToken);
  const publicCollection = usePublicUserCollection(
    ctx?.seller.name ?? '',
    { limit: 100, offset: 0 },
    Boolean(ctx && !isCounter),
  );

  const requestedBlueprintIds = useMemo(() => [
    ...(publicCollection.data?.items ?? []).map((item) => item.blueprint_id),
    ...(ctx?.requestedItems ?? []).map((item) => item.blueprintId),
  ].filter((id) => id > 0), [ctx?.requestedItems, publicCollection.data?.items]);
  const { data: requestedCatalog = {} } = useMeilisearchCards([...new Set(requestedBlueprintIds)]);

  const myItems = useMemo<PickerItem[]>(() => inventory.inventoryRaw
    .filter((item) => item.quantity > 0)
    .filter((item) => (
      item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id)
    ) || (
      item.listing_source === 'sync' && item.source === 'cardtrader'
    ))
    .map((item) => {
      const isMarketplace = item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id);
      const card = inventory.catalogMap[item.blueprint_id];
      return {
        id: isMarketplace ? `marketplace:${item.marketplace_listing_id}` : `sync:${item.id}`,
        inventoryItemId: isMarketplace ? undefined : item.id,
        marketplaceListingId: isMarketplace ? item.marketplace_listing_id : undefined,
        blueprintId: item.blueprint_id,
        quantity: item.quantity,
        name: card?.name || item.description || t('trades.cardFallback', { id: item.blueprint_id }),
        image: card?.image,
        setName: card?.set_name,
        source: isMarketplace ? 'marketplace' : 'cardtrader',
      };
    }), [inventory.catalogMap, inventory.inventoryRaw, t]);

  const otherItems = useMemo<PickerItem[]>(() => {
    if (ctx?.requestedItems?.length) {
      return ctx.requestedItems.flatMap((item) => {
        const id = proposalItemKey(item);
        if (!id || item.quantity <= 0) return [];
        const card = requestedCatalog[item.blueprintId];
        return [{
          id,
          inventoryItemId: item.inventoryItemId,
          marketplaceListingId: item.marketplaceListingId,
          blueprintId: item.blueprintId,
          quantity: item.quantity,
          name: item.name || card?.name || t('trades.cardFallback', { id: item.blueprintId }),
          image: card?.image,
          setName: card?.set_name,
          source: item.source === 'marketplace' ? 'marketplace' as const : 'cardtrader' as const,
        }];
      });
    }
    const items: PickerItem[] = (publicCollection.data?.items ?? [])
      .filter((item) => item.quantity > 0)
      .map((item) => {
      const card = requestedCatalog[item.blueprint_id];
      return {
        id: `sync:${item.id}`,
        inventoryItemId: item.id,
        blueprintId: item.blueprint_id,
        quantity: item.quantity,
        name: card?.name || t('trades.cardFallback', { id: item.blueprint_id }),
        image: card?.image,
        setName: card?.set_name,
        source: 'cardtrader',
      };
    });
    if (ctx && ctx.listing.quantity > 0) {
      const isMarketplace = ctx.listing.source === 'marketplace';
      const marketplaceListingId = isMarketplace ? ctx.listing.id.replace(/^mkt:/, '') : undefined;
      const inventoryItemId = isMarketplace ? undefined : Number(ctx.listing.id.replace(/^sync:/, ''));
      const baseId = isMarketplace ? `marketplace:${marketplaceListingId}` : `sync:${inventoryItemId}`;
      if (!items.some((item) => item.id === baseId)) {
        items.unshift({
          id: baseId,
          inventoryItemId,
          marketplaceListingId,
          blueprintId: ctx.card.blueprintId || Number(ctx.card.id) || 0,
          quantity: ctx.listing.quantity,
          name: ctx.card.name,
          image: ctx.card.image,
          source: isMarketplace ? 'marketplace' : 'cardtrader',
        });
      }
    }
    return items;
  }, [ctx, publicCollection.data?.items, requestedCatalog, t]);

  const lockedRequested = useMemo(() => {
    if (ctx?.mode === 'counter') return new Set<string>();
    if (ctx?.requestedItems?.length) {
      return new Set(ctx.requestedItems.flatMap((item) => {
        const key = proposalItemKey(item);
        return key ? [key] : [];
      }));
    }
    if (!ctx || ctx.listing.quantity <= 0) return new Set<string>();
    const id = ctx.listing.source === 'marketplace'
      ? `marketplace:${ctx.listing.id.replace(/^mkt:/, '')}`
      : `sync:${ctx.listing.id.replace(/^sync:/, '')}`;
    return new Set([id]);
  }, [ctx]);

  const validAddress = Boolean(address.full_name && address.street && address.city && address.zip && address.country);
  const offeredPayload = useMemo(() => toTradeItems(offered, myItems), [myItems, offered]);
  const requestedPayload = useMemo(() => toTradeItems(requested, otherItems), [otherItems, requested]);
  const offeredCount = offeredPayload.reduce((sum, item) => sum + item.quantity, 0);
  const requestedCount = requestedPayload.reduce((sum, item) => sum + item.quantity, 0);
  const canSubmit = Boolean(ctx && offeredPayload.length && requestedPayload.length && validAddress);
  const busy = createTrade.isPending || counterTrade.isPending;

  const updateAddress = (key: keyof TradeAddress, value: string) => setAddress((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!ctx || !canSubmit || busy) return;
    setSubmitError(null);
    const common = {
      offered: offeredPayload,
      requested: requestedPayload,
      message: message.trim() || undefined,
      offered_credits_cents: 0 as const,
      requested_credits_cents: 0 as const,
      ship_address: address,
    };
    try {
      const response = isCounter && ctx.parentTradeId
        ? await counterTrade.mutateAsync({ tradeId: ctx.parentTradeId, input: common })
        : await createTrade.mutateAsync({ ...common, receiver_id: ctx.listing.sellerId, delivery_method: 'direct' });
      clearTradeProposalContext();
      router.replace(`/scambi/${response.data.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('trades.actionError'));
    }
  };

  if (!hydrated) return <ScambiShell className="min-h-[60vh]">{null}</ScambiShell>;
  if (!ctx) {
    return (
      <ScambiShell>
        <div className="container-content flex min-h-[65vh] items-center justify-center py-12">
          <div className={cn(scambiGlass, 'flex max-w-lg flex-col items-center rounded-[2rem] p-8 text-center')}>
            <h1 className="mt-5 text-xl font-black uppercase text-white">{t('trades.noSelection')}</h1>
            <p className="mt-2 text-sm text-white/60">{t('trades.selectRealListing')}</p>
            <button type="button" onClick={() => router.push('/scambi')} className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#1D3160]">{t('trades.back')}</button>
          </div>
        </div>
      </ScambiShell>
    );
  }

  const steps: Array<{ id: ProposalStep; label: string; ready: boolean }> = [
    { id: 'cards', label: t('trades.stepCards'), ready: offeredCount > 0 && requestedCount > 0 },
    { id: 'address', label: t('trades.stepAddress'), ready: validAddress },
    { id: 'review', label: t('trades.stepSend'), ready: canSubmit },
  ];
  const activeStepIndex = steps.findIndex((item) => item.id === step);
  const goToStep = (nextStep: ProposalStep) => {
    const currentIndex = PROPOSAL_STEP_ORDER.indexOf(step);
    const nextIndex = PROPOSAL_STEP_ORDER.indexOf(nextStep);
    setStepDirection(nextIndex >= currentIndex ? 'forward' : 'backward');
    focusNextStepRef.current = true;
    setStep(nextStep);
  };
  const stepMotionClass = stepDirection === 'forward'
    ? 'slide-in-from-right-3'
    : 'slide-in-from-left-3';
  const selectedOfferedItems = myItems.filter((item) => offered[item.id]);
  const selectedRequestedItems = otherItems.filter((item) => requested[item.id]);

  return (
    <ScambiShell>
      <div className="container-content mx-auto max-w-6xl pb-20 pt-6 md:pt-8">
        <button type="button" onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
          <ArrowLeft className="h-4 w-4" /> {t('trades.back')}
        </button>

        <section className={cn(scambiGlass, 'animate-in overflow-hidden rounded-[1.75rem] fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none')}>
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold text-white/55">{t('trades.withUser', { user: ctx.seller.name })}</p>
              <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                {isCounter ? t('trades.counterTitle') : t('trades.proposeTitle')}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">{t('trades.proposalIntro')}</p>
            </div>

            <nav aria-label={t('trades.progressLabel')}>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-1 backdrop-blur-md">
                <span className="pointer-events-none absolute inset-1" aria-hidden>
                  <span
                    className="block h-full w-1/3 rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
                    style={{ transform: `translateX(${activeStepIndex * 100}%)` }}
                  />
                </span>
                <div className="relative grid grid-cols-3">
                  {steps.map(({ id, label, ready }, index) => {
                    const active = step === id;
                    const accessible = index <= activeStepIndex || (index === 1 && steps[0].ready) || (index === 2 && steps[0].ready && steps[1].ready);
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={!accessible}
                        onClick={() => goToStep(id)}
                        aria-current={active ? 'step' : undefined}
                        className={cn(
                          'relative min-w-0 rounded-lg px-2.5 py-2.5 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60 sm:min-w-32 sm:px-3',
                          active ? 'text-[#1D3160]' : 'text-white/50 hover:text-white disabled:cursor-default disabled:opacity-40',
                        )}
                      >
                        <span className={cn('block text-[10px] font-black uppercase tracking-[0.14em]', active ? 'text-[#FF7300]' : ready ? 'text-emerald-300' : 'text-white/35')}>
                          {ready && index < activeStepIndex ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : `0${index + 1}`}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] font-black uppercase tracking-wide sm:text-[11px]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>

          <div className="border-t border-white/10 bg-[#071226]/14 p-4 sm:p-6">
            {(inventory.loading || publicCollection.isLoading) && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-3 text-sm text-white/60" role="status">
                <Loader2 className="h-4 w-4 animate-spin text-[#FF8A26]" aria-hidden /> {t('trades.loadingInventory')}
              </div>
            )}
            {(inventory.isError || publicCollection.isError) && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100" role="alert">
                <span>{t('trades.inventoryLoadError')}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (inventory.isError) void inventory.refetchInventory();
                    if (publicCollection.isError) void publicCollection.refetch();
                  }}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  {t('trades.retry')}
                </button>
              </div>
            )}

            <div ref={stepPanelRef} tabIndex={-1} className="outline-none">
              {step === 'cards' && (
              <div className={cn('animate-in fade-in duration-300 motion-reduce:animate-none', stepMotionClass)}>
                <TradeProposalTable
                  offeredItems={selectedOfferedItems}
                  requestedItems={selectedRequestedItems}
                  offered={offered}
                  requested={requested}
                />
                <div className="relative grid gap-4 md:grid-cols-2">
                  <ItemPicker title={t('trades.chooseOffered')} empty={t('trades.noTradableInventory')} items={myItems} selected={offered} onChange={setOffered} />
                  <span
                    className={cn(
                      'scambi-flow-track pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 md:block',
                      offeredCount > 0 && requestedCount > 0 ? 'opacity-100' : 'opacity-25',
                    )}
                    data-active={offeredCount > 0 && requestedCount > 0}
                    aria-hidden
                  />
                  <ItemPicker title={t('trades.chooseRequested')} empty={t('trades.noRequestedInventory')} items={otherItems} selected={requested} locked={lockedRequested} onChange={setRequested} />
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={!steps[0].ready}
                    onClick={() => goToStep('address')}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none motion-reduce:transform-none"
                  >
                    {t('trades.continue')} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              )}

              {step === 'address' && (
              <form
                className={cn('mx-auto max-w-3xl animate-in fade-in duration-300 motion-reduce:animate-none', stepMotionClass)}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (validAddress) goToStep('review');
                }}
              >
                <div className="mb-5">
                  <h2 className="text-lg font-black uppercase tracking-wide text-white">{t('trades.yourShippingAddress')}</h2>
                  <p className="mt-1 text-sm text-white/50">{t('trades.shippingNote')}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ADDRESS_FIELDS.map(({ key, label, autoComplete, ...field }) => (
                    <label key={key} className={cn('text-[10px] font-black uppercase tracking-wide text-white/50', 'wide' in field && field.wide && 'sm:col-span-2')}>
                      {t(label)}
                      <input
                        required={['full_name', 'street', 'city', 'zip', 'country'].includes(key)}
                        value={address[key] ?? ''}
                        onChange={(event) => updateAddress(key, event.target.value)}
                        autoComplete={autoComplete}
                        inputMode={'inputMode' in field ? field.inputMode : undefined}
                        className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 text-sm font-semibold normal-case tracking-normal text-white outline-none transition-all duration-200 placeholder:text-white/25 hover:bg-white/[0.10] focus:border-[#FF8A26]/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#FF7300]/15"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-[10px] font-black uppercase tracking-wide text-white/50">
                    {t('trades.message')}
                    <textarea value={message} maxLength={1000} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-white/10 bg-white/[0.07] p-3 text-sm font-semibold normal-case tracking-normal text-white outline-none transition-all duration-200 hover:bg-white/[0.10] focus:border-[#FF8A26]/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#FF7300]/15" />
                  </label>
                  <p className="mt-1 text-right text-[10px] font-semibold tabular-nums text-white/35">{message.length}/1000</p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => goToStep('cards')} className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                    {t('trades.previous')}
                  </button>
                  <button type="submit" disabled={!validAddress} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none motion-reduce:transform-none">
                    {t('trades.continue')} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
              )}

              {step === 'review' && (
              <form
                className={cn('mx-auto max-w-4xl animate-in fade-in duration-300 motion-reduce:animate-none', stepMotionClass)}
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: t('trades.youOffer'), items: selectedOfferedItems, quantities: offered, count: offeredCount },
                    { label: t('trades.youReceive'), items: selectedRequestedItems, quantities: requested, count: requestedCount },
                  ].map((group) => (
                    <section key={group.label} className="rounded-[1.3rem] border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-black uppercase tracking-wide text-white">{group.label}</h2>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/60">{t('trades.cardsCount', { count: group.count })}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#09152E]/35 p-2">
                            <TradeCardThumb image={item.image} name={item.name} className="h-12 w-[35px] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-white">{item.name}</p>
                              <p className="truncate text-[11px] text-white/40">{item.setName}</p>
                            </div>
                            <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-white">× {group.quantities[item.id]}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-white/40">{t('trades.yourShippingAddress')}</p>
                      <p className="mt-1 text-sm font-bold text-white">{address.full_name}</p>
                      <p className="text-sm text-white/55">{address.street}, {address.zip} {address.city} ({address.country})</p>
                    </div>
                    <button type="button" onClick={() => goToStep('address')} className="text-left text-xs font-black uppercase tracking-wide text-[#FF9B45] hover:text-[#FFB477]">{t('trades.edit')}</button>
                  </div>
                  {message && <p className="mt-3 break-words border-t border-white/10 pt-3 text-sm italic text-white/55">“{message}”</p>}
                </div>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-white/45">{t('trades.directOnly')}</p>
                {submitError && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-400/15 p-3 text-xs text-red-100" role="alert">{submitError}</p>}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => goToStep('address')} className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                    {t('trades.previous')}
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit || busy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF8A26] to-[#FF7300] px-6 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-[#FF7300]/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transform-none"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                      {isCounter ? t('trades.sendCounter') : t('trades.sendProposal')}
                      <Send className="h-4 w-4" />
                    </>}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </ScambiShell>
  );
}
