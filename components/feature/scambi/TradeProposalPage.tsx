'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
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

interface PickerItem {
  id: string;
  inventoryItemId?: number;
  marketplaceListingId?: string;
  blueprintId: number;
  quantity: number;
  name: string;
  source: 'cardtrader' | 'marketplace';
}

const EMPTY_ADDRESS: TradeAddress = {
  full_name: '', street: '', city: '', zip: '', province: '', country: 'IT', phone: '',
};

function ItemPicker({ title, empty, items, selected, locked, onChange }: {
  title: string;
  empty: string;
  items: PickerItem[];
  selected: Record<string, number>;
  locked?: Set<string>;
  onChange: (next: Record<string, number>) => void;
}) {
  const toggle = (item: PickerItem) => {
    if (locked?.has(item.id)) return;
    const next = { ...selected };
    if (next[item.id]) delete next[item.id]; else next[item.id] = 1;
    onChange(next);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[#1D3160]">{title}</h2>
      {items.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">{empty}</p> : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const quantity = selected[item.id] ?? 0;
            const isSelected = quantity > 0;
            return (
              <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isSelected ? 'border-[#FF7300] bg-orange-50/40' : 'border-slate-200'}`}>
                <button type="button" onClick={() => toggle(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-[#FF7300] bg-[#FF7300] text-white' : 'border-slate-300'}`}>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-800">{item.name}</span>
                    <span className="block text-xs text-slate-400">#{item.id} · {item.source}</span>
                  </span>
                </button>
                {isSelected && (
                  <input
                    type="number"
                    min={1}
                    max={item.quantity}
                    value={quantity}
                    onChange={(event) => onChange({ ...selected, [item.id]: Math.max(1, Math.min(item.quantity, Number(event.target.value) || 1)) })}
                    className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-center text-sm font-bold"
                    aria-label={item.name}
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
  const createTrade = useCreateTrade();
  const counterTrade = useCounterTrade();

  useEffect(() => {
    const stored = getTradeProposalContext();
    setCtx(stored);
    if (stored) {
      const initial: Record<string, number> = {};
      if (stored.requestedItems?.length) {
        for (const item of stored.requestedItems) {
          const key = item.source === 'marketplace'
            ? `marketplace:${item.marketplaceListingId}`
            : `sync:${item.inventoryItemId}`;
          initial[key] = Math.max(1, item.quantity);
        }
      } else {
        const key = stored.listing.source === 'marketplace'
          ? `marketplace:${stored.listing.id.replace(/^mkt:/, '')}`
          : `sync:${stored.listing.id.replace(/^sync:/, '')}`;
        initial[key] = 1;
      }
      setRequested(initial);
    }
    setHydrated(true);
  }, []);

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
  ], [ctx?.requestedItems, publicCollection.data?.items]);
  const { data: requestedCatalog = {} } = useMeilisearchCards([...new Set(requestedBlueprintIds)]);

  const myItems = useMemo<PickerItem[]>(() => inventory.inventoryRaw
    .filter((item) => (
      item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id)
    ) || (
      item.listing_source === 'sync' && item.source === 'cardtrader'
    ))
    .map((item) => {
      const isMarketplace = item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id);
      return {
        id: isMarketplace ? `marketplace:${item.marketplace_listing_id}` : `sync:${item.id}`,
        inventoryItemId: isMarketplace ? undefined : item.id,
        marketplaceListingId: isMarketplace ? item.marketplace_listing_id : undefined,
        blueprintId: item.blueprint_id,
        quantity: item.quantity,
        name: inventory.catalogMap[item.blueprint_id]?.name || item.description || t('trades.cardFallback', { id: item.blueprint_id }),
        source: isMarketplace ? 'marketplace' : 'cardtrader',
      };
    }), [inventory.catalogMap, inventory.inventoryRaw, t]);

  const otherItems = useMemo<PickerItem[]>(() => {
    if (ctx?.requestedItems?.length) {
      return ctx.requestedItems.map((item) => ({
        id: item.source === 'marketplace'
          ? `marketplace:${item.marketplaceListingId}`
          : `sync:${item.inventoryItemId}`,
        inventoryItemId: item.inventoryItemId,
        marketplaceListingId: item.marketplaceListingId,
        blueprintId: item.blueprintId,
        quantity: item.quantity,
        name: item.name || requestedCatalog[item.blueprintId]?.name || t('trades.cardFallback', { id: item.blueprintId }),
        source: item.source === 'marketplace' ? 'marketplace' : 'cardtrader',
      }));
    }
    const items: PickerItem[] = (publicCollection.data?.items ?? []).map((item) => ({
      id: `sync:${item.id}`,
      inventoryItemId: item.id,
      blueprintId: item.blueprint_id,
      quantity: item.quantity,
      name: requestedCatalog[item.blueprint_id]?.name || t('trades.cardFallback', { id: item.blueprint_id }),
      source: 'cardtrader',
    }));
    if (ctx) {
      const isMarketplace = ctx.listing.source === 'marketplace';
      const marketplaceListingId = isMarketplace ? ctx.listing.id.replace(/^mkt:/, '') : undefined;
      const inventoryItemId = isMarketplace ? undefined : Number(ctx.listing.id.replace(/^sync:/, ''));
      const baseId = isMarketplace ? `marketplace:${marketplaceListingId}` : `sync:${inventoryItemId}`;
      if (!items.some((item) => item.id === baseId)) {
        items.unshift({
          id: baseId,
          inventoryItemId,
          marketplaceListingId,
          blueprintId: Number(ctx.card.id) || 0,
          quantity: ctx.listing.quantity,
          name: ctx.card.name,
          source: isMarketplace ? 'marketplace' : 'cardtrader',
        });
      }
    }
    return items;
  }, [ctx, publicCollection.data?.items, requestedCatalog, t]);

  const lockedRequested = useMemo(() => {
    if (ctx?.requestedItems?.length) {
      return new Set(ctx.requestedItems.map((item) => item.source === 'marketplace'
        ? `marketplace:${item.marketplaceListingId}`
        : `sync:${item.inventoryItemId}`));
    }
    if (!ctx) return new Set<string>();
    const id = ctx.listing.source === 'marketplace'
      ? `marketplace:${ctx.listing.id.replace(/^mkt:/, '')}`
      : `sync:${ctx.listing.id.replace(/^sync:/, '')}`;
    return new Set([id]);
  }, [ctx]);
  const validAddress = Boolean(address.full_name && address.street && address.city && address.zip && address.country);
  const canSubmit = Boolean(ctx && Object.keys(offered).length && Object.keys(requested).length && validAddress);
  const busy = createTrade.isPending || counterTrade.isPending;

  const updateAddress = (key: keyof TradeAddress, value: string) => setAddress((current) => ({ ...current, [key]: value }));
  const toTradeItems = (selected: Record<string, number>, items: PickerItem[]): TradeItemInput[] => {
    const byId = new Map(items.map((item) => [item.id, item]));
    const result: TradeItemInput[] = [];
    for (const [id, quantity] of Object.entries(selected)) {
      const item = byId.get(id);
      if (!item) continue;
      if (item.marketplaceListingId) {
        result.push({ marketplace_listing_id: item.marketplaceListingId, quantity });
      } else if (item.inventoryItemId) {
        result.push({ inventory_item_id: item.inventoryItemId, quantity });
      }
    }
    return result;
  };
  const submit = async () => {
    if (!ctx || !canSubmit) return;
    setSubmitError(null);
    const common = {
      offered: toTradeItems(offered, myItems),
      requested: toTradeItems(requested, otherItems),
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

  if (!hydrated) return <div className="min-h-[60vh] bg-[#F5F4F0]" />;
  if (!ctx) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#F5F4F0] px-4 text-center">
        <h1 className="text-xl font-black text-[#1D3160]">{ctx ? t('trades.notTradable') : t('trades.noSelection')}</h1>
        <p className="max-w-md text-sm text-gray-500">{t('trades.selectRealListing')}</p>
        <button type="button" onClick={() => router.push('/scambi')} className="rounded-full bg-[#FF7300] px-5 py-2.5 text-sm font-bold text-white">{t('trades.back')}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] pb-16">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        <button type="button" onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#FF7300]">
          <ArrowLeft className="h-4 w-4" /> {t('trades.back')}
        </button>
        <h1 className="text-2xl font-black uppercase tracking-wide text-[#1D3160]">
          {isCounter ? t('trades.counterTitle') : t('trades.proposeTitle')}
        </h1>
        <p className="mb-6 mt-1 text-sm text-gray-500">{t('trades.withUser', { user: ctx.seller.name })}</p>

        {(inventory.loading || publicCollection.isLoading) && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-white p-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> {t('trades.loadingInventory')}</div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <ItemPicker title={t('trades.chooseOffered')} empty={t('trades.noTradableInventory')} items={myItems} selected={offered} onChange={setOffered} />
          <ItemPicker title={t('trades.chooseRequested')} empty={t('trades.noRequestedInventory')} items={otherItems} selected={requested} locked={lockedRequested} onChange={setRequested} />
        </div>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black uppercase text-[#1D3160]">{t('trades.yourShippingAddress')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['full_name', 'trades.address.fullName'], ['street', 'trades.address.street'], ['city', 'trades.address.city'],
              ['zip', 'trades.address.zip'], ['province', 'trades.address.province'], ['country', 'trades.address.country'],
              ['phone', 'trades.address.phone'],
            ] as const).map(([key, label]) => (
              <label key={key} className="text-xs font-bold text-slate-600">
                {t(label)}
                <input value={address[key] ?? ''} onChange={(event) => updateAddress(key, event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-[#FF7300]" />
              </label>
            ))}
          </div>
          <label className="mt-4 block text-xs font-bold text-slate-600">
            {t('trades.message')}
            <textarea value={message} maxLength={1000} onChange={(event) => setMessage(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal outline-none focus:border-[#FF7300]" />
          </label>
          <p className="mt-3 text-xs text-slate-400">{t('trades.directOnly')}</p>
          {submitError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
          <button type="button" disabled={!canSubmit || busy} onClick={() => void submit()} className="mt-5 inline-flex min-w-44 items-center justify-center rounded-full bg-[#FF7300] px-6 py-3 text-sm font-black uppercase text-white shadow-sm transition hover:bg-[#e66800] disabled:cursor-not-allowed disabled:bg-slate-300">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : isCounter ? t('trades.sendCounter') : t('trades.sendProposal')}
          </button>
        </section>
      </div>
    </div>
  );
}
