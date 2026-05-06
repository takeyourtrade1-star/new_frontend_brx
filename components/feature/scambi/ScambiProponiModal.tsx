'use client';

/**
 * ScambiProponiModal v5 — Inventario reale, ricerca catalogo, lista/griglia, crediti sdoppiati.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Search, Send, Zap, Clock, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { ScambioUI, TradePayload } from '@/components/feature/scambi/scambi-types';
import { MOCK_INVENTORY_A, MOCK_INVENTORY_B } from './mock-trade-inventories';
import { useAuthStore } from '@/lib/stores/auth-store';
import { syncClient } from '@/lib/api/sync-client';
import type { InventoryItemResponse } from '@/lib/api/sync-client';
import { fetchCardsByBlueprintIds, type CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import { getCardImageUrl } from '@/lib/assets';
import { AuctionViewToggle } from '@/components/feature/aste/auctions-browse-shared';
import type { SearchHit } from '@/app/api/search/route';

interface Props {
  open: boolean;
  onClose: () => void;
  scambio: ScambioUI;
  mode: 'propose' | 'counter';
  onSubmit: (payload: TradePayload) => void;
}

const MOCK_A_PROPOSAL = {
  offeredCards: [MOCK_INVENTORY_A[0], MOCK_INVENTORY_A[1]],
  offeredCredits: 50,
  isRealtime: true,
  message: 'Ciao! Sono interessato alla tua carta. Possiamo fare uno scambio realtime?',
};

type InventoryWithCard = InventoryItemResponse & { card?: CardCatalogHit | null };

type SearchApiResponse = {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

interface TradeCardItem {
  id: string;
  name: string;
  image: string;
  condition?: string;
  badge?: string;
  qty?: number;
}

/* ------------------------------------------------------------------ */
/*  Inline keyframes & animations                                       */
/* ------------------------------------------------------------------ */

const MODAL_ANIM_CSS = `
@keyframes modal-enter {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes modal-backdrop-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes shimmer-btn {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes glow-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(255,115,0,0); }
  50%     { box-shadow: 0 0 12px 2px rgba(255,115,0,0.25); }
}
@keyframes card-shine {
  0%   { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(200%) rotate(25deg); }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes badge-pop {
  0%   { transform: scale(0); }
  60%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}
.animate-modal-enter {
  animation: modal-enter 0.35s cubic-bezier(0.22,1,0.36,1) forwards;
}
.animate-backdrop-enter {
  animation: modal-backdrop-enter 0.2s ease-out forwards;
}
.animate-shimmer-btn {
  background-size: 200% 100%;
  animation: shimmer-btn 2.5s linear infinite;
}
.animate-glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}
.animate-fade-in-up {
  animation: fade-in-up 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
  opacity: 0;
}
.animate-badge-pop {
  animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
.card-shine-wrapper {
  position: relative;
  overflow: hidden;
}
.card-shine-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255,255,255,0.35) 45%,
    rgba(255,255,255,0.5) 50%,
    rgba(255,255,255,0.35) 55%,
    transparent 60%
  );
  transform: translateX(-100%) rotate(25deg);
  pointer-events: none;
  transition: none;
}
.card-shine-wrapper:hover::after {
  animation: card-shine 0.7s ease forwards;
}
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mc}/gu, '')
    .replace(/\p{Mn}/gu, '');
}

function matchQuery(item: TradeCardItem, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const qNorm = normalizeForSearch(q);
  const blobNorm = normalizeForSearch(`${item.name} ${item.condition ?? ''}`);
  const parts = qNorm.split(/\s+/).filter(Boolean);
  return parts.every((part) => blobNorm.includes(part));
}

function inventoryToTradeCardItem(item: InventoryWithCard): TradeCardItem {
  const card = item.card;
  const props = item.properties as Record<string, unknown> | undefined;
  const condition = typeof props?.condition === 'string' ? props.condition : '';
  return {
    id: String(item.id),
    name: card?.name ?? `Item ${item.blueprint_id}`,
    image: getCardImageUrl(card?.image ?? null) ?? '',
    condition,
    badge: "Nell'inventario",
    qty: item.quantity > 1 ? item.quantity : undefined,
  };
}

function searchHitToTradeCardItem(hit: SearchHit): TradeCardItem {
  return {
    id: hit.id,
    name: hit.name,
    image: getCardImageUrl(hit.image ?? null) ?? '',
    condition: '',
  };
}

function mockItemToTradeCardItem(item: { id: string; name: string; image: string; condition: string }): TradeCardItem {
  return {
    id: item.id,
    name: item.name,
    image: item.image,
    condition: item.condition,
    badge: 'Disponibile',
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ConditionBadge({ condition }: { condition: string }) {
  const c = condition.toLowerCase();
  let color = 'bg-gray-100/80 text-gray-600';
  if (c.includes('mint') || c.includes('nm')) color = 'bg-emerald-100/80 text-emerald-700';
  else if (c.includes('lightly') || c.includes('lp')) color = 'bg-sky-100/80 text-sky-700';
  else if (c.includes('slightly') || c.includes('sp')) color = 'bg-amber-100/80 text-amber-700';
  else if (c.includes('played') || c.includes('moderately')) color = 'bg-orange-100/80 text-orange-700';
  else if (c.includes('gradato') || c.includes('psa')) color = 'bg-purple-100/80 text-purple-700';
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm ${color}`}>
      {condition}
    </span>
  );
}

function MiniCard({
  item,
  selected,
  onClick,
  delayIdx = 0,
}: {
  item: TradeCardItem;
  selected: boolean;
  onClick: () => void;
  delayIdx?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center rounded-xl border-2 p-1.5 text-left transition-all duration-200 animate-fade-in-up ${
        selected
          ? 'border-[#FF7300] bg-orange-50/80 shadow-lg shadow-orange-500/15 animate-glow-pulse'
          : 'border-gray-100/80 bg-white/80 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5'
      }`}
      style={{ animationDelay: `${delayIdx * 40}ms` }}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7300] text-white shadow-md animate-badge-pop">
          <Check className="h-3 w-3" strokeWidth={3} />
        </div>
      )}
      {item.badge && (
        <div className="absolute left-1 top-1 z-10 rounded bg-[#1D3160] px-1 py-0.5 text-[8px] font-bold uppercase text-white shadow">
          {item.badge}
        </div>
      )}
      {item.qty && item.qty > 1 && (
        <div className="absolute bottom-1 right-1 z-10 rounded-full bg-[#FF7300] px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
          x{item.qty}
        </div>
      )}
      <div className="card-shine-wrapper relative aspect-[200/280] w-full overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={item.image}
          alt={item.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="80px"
        />
      </div>
      <div className="mt-1.5 w-full px-0.5">
        <p className="truncate text-[10px] font-bold leading-tight text-gray-900">{item.name}</p>
        {item.condition ? <p className="text-[9px] text-gray-400">{item.condition}</p> : null}
      </div>
    </button>
  );
}

function MiniCardListItem({
  item,
  selected,
  onClick,
  delayIdx = 0,
}: {
  item: TradeCardItem;
  selected: boolean;
  onClick: () => void;
  delayIdx?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl border-2 p-2 text-left transition-all duration-200 animate-fade-in-up ${
        selected
          ? 'border-[#FF7300] bg-orange-50/80 shadow-md'
          : 'border-gray-100/80 bg-white/80 hover:border-orange-300'
      }`}
      style={{ animationDelay: `${delayIdx * 40}ms` }}
    >
      <div className="card-shine-wrapper relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={item.image}
          alt={item.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="40px"
        />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-xs font-bold text-gray-900">{item.name}</p>
        {item.condition ? <p className="text-[10px] text-gray-400">{item.condition}</p> : null}
        {item.badge ? (
          <span className="mt-1 inline-block rounded bg-[#1D3160] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
            {item.badge}
          </span>
        ) : null}
        {item.qty && item.qty > 1 ? (
          <span className="ml-1 mt-1 inline-block rounded-full bg-[#FF7300] px-1.5 py-0.5 text-[9px] font-bold text-white">
            x{item.qty}
          </span>
        ) : null}
      </div>
      {selected && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF7300] text-white animate-badge-pop">
          <Check className="h-3 w-3" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

function CreditField({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-24 rounded-lg border border-gray-200/80 bg-white/80 px-3 py-2 text-sm font-bold text-gray-900 outline-none backdrop-blur-sm transition focus:border-[#FF7300] focus:ring-2 focus:ring-[#FF7300]/20 focus:bg-white"
        />
        <span className="text-xs text-gray-400">crediti</span>
      </div>
    </div>
  );
}

function ModeToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase transition-all duration-200 ${
          !checked
            ? 'border-[#FF7300] bg-gradient-to-r from-orange-50 to-orange-100/50 text-[#FF7300] shadow-sm shadow-orange-500/10'
            : 'border-gray-200/80 bg-gray-50/50 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Clock className="h-3 w-3" />
        Async
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase transition-all duration-200 ${
          checked
            ? 'border-[#FF7300] bg-gradient-to-r from-orange-50 to-orange-100/50 text-[#FF7300] shadow-sm shadow-orange-500/10'
            : 'border-gray-200/80 bg-gray-50/50 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Zap className="h-3 w-3" />
        Realtime
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shimmer Submit Button                                              */
/* ------------------------------------------------------------------ */

function SubmitButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-shimmer-btn relative ml-auto flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#FF8A3D] via-[#FF7300] to-[#E86800] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
    >
      <span className="relative z-10 flex items-center gap-1.5">
        <Send className="h-3.5 w-3.5" />
        {children}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  SearchBar (estratto per evitare ricreazioni al render)             */
/* ------------------------------------------------------------------ */

function SearchBar({
  query,
  onChange,
  placeholder,
}: {
  query: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="animate-fade-in-up flex items-center gap-2 rounded-full border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 backdrop-blur-sm transition-all focus-within:border-[#FF7300] focus-within:ring-2 focus-within:ring-[#FF7300]/15 focus-within:bg-white">
      <Search className="h-3.5 w-3.5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      {query && (
        <button type="button" onClick={() => onChange('')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export function ScambiProponiModal({ open, onClose, scambio, mode, onSubmit }: Props) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore(
    (s) => s.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null)
  );

  const [isRealtime, setIsRealtime] = useState(false);
  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>([]);
  const [offeredCredits, setOfferedCredits] = useState(0);
  const [requestedCredits, setRequestedCredits] = useState(0);
  const [selectedRequestedIds, setSelectedRequestedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [counterEditing, setCounterEditing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [inventoryItems, setInventoryItems] = useState<InventoryWithCard[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  /* Keep track of selected item data so lookups survive search changes */
  const [offeredItemData, setOfferedItemData] = useState<Record<string, TradeCardItem>>({});
  const [requestedItemData, setRequestedItemData] = useState<Record<string, TradeCardItem>>({});

  /* Load real inventory when modal opens */
  const loadInventory = useCallback(async () => {
    if (!user?.id || !accessToken) {
      setInventoryItems([]);
      setLoadingInventory(false);
      return;
    }
    setLoadingInventory(true);
    try {
      const allItems: InventoryItemResponse[] = [];
      const pageSize = 500;
      let offset = 0;
      let totalFromApi = 0;
      do {
        const res = await syncClient.getInventory(user.id, accessToken, pageSize, offset);
        const items = res.items ?? [];
        totalFromApi = res.total ?? allItems.length + items.length;
        allItems.push(...items);
        offset += items.length;
        if (items.length < pageSize || offset >= totalFromApi) break;
      } while (true);

      const blueprintIds = [...new Set(allItems.map((i) => i.blueprint_id).filter(Boolean))] as number[];
      let blueprintToCard: Record<number, CardCatalogHit> = {};
      if (blueprintIds.length > 0) {
        blueprintToCard = await fetchCardsByBlueprintIds(blueprintIds);
      }

      const merged: InventoryWithCard[] = allItems.map((item) => ({
        ...item,
        card: blueprintToCard[item.blueprint_id],
      }));

      setInventoryItems(merged);
    } catch {
      setInventoryItems([]);
    } finally {
      setLoadingInventory(false);
    }
  }, [user?.id, accessToken]);

  useEffect(() => {
    if (open) {
      void loadInventory();
    }
  }, [open, loadInventory]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  /* Search catalog when debounced query changes */
  useEffect(() => {
    const q = debouncedQuery;
    if (!q) {
      setSearchHits([]);
      setSearchError(null);
      setLoadingSearch(false);
      return;
    }
    let cancelled = false;
    setLoadingSearch(true);
    setSearchError(null);
    const params = new URLSearchParams();
    params.set('q', q);
    params.set('limit', '12');
    params.set('page', '1');
    fetch(`/api/search?${params.toString()}`)
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as SearchApiResponse & { error?: string; detail?: string };
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            (typeof json?.error === 'string' && json.error) ||
            (typeof json?.detail === 'string' && json.detail) ||
            'Errore ricerca';
          throw new Error(msg);
        }
        setSearchHits(Array.isArray(json.hits) ? json.hits : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setSearchHits([]);
          setSearchError(e instanceof Error ? e.message : 'Errore ricerca');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSearch(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (open) {
      setIsRealtime(mode === 'counter' ? MOCK_A_PROPOSAL.isRealtime : false);
      setSelectedOfferedIds([]);
      setOfferedCredits(0);
      setRequestedCredits(0);
      setSelectedRequestedIds([]);
      setMessage('');
      setSearchQuery('');
      setCounterEditing(false);
      setViewMode('grid');
      setSearchHits([]);
      setSearchError(null);
      setOfferedItemData({});
      setRequestedItemData({});
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const toggleOfferedItem = (item: TradeCardItem) => {
    const exists = selectedOfferedIds.includes(item.id);
    if (exists) {
      setSelectedOfferedIds(selectedOfferedIds.filter((x) => x !== item.id));
      const { [item.id]: _, ...rest } = offeredItemData;
      setOfferedItemData(rest);
    } else {
      setSelectedOfferedIds([...selectedOfferedIds, item.id]);
      setOfferedItemData((prev) => ({ ...prev, [item.id]: item }));
    }
  };

  const toggleRequestedItem = (item: TradeCardItem) => {
    const exists = selectedRequestedIds.includes(item.id);
    if (exists) {
      setSelectedRequestedIds(selectedRequestedIds.filter((x) => x !== item.id));
      const { [item.id]: _, ...rest } = requestedItemData;
      setRequestedItemData(rest);
    } else {
      setSelectedRequestedIds([...selectedRequestedIds, item.id]);
      setRequestedItemData((prev) => ({ ...prev, [item.id]: item }));
    }
  };

  const buildPayload = (): TradePayload => {
    const offeredItems = selectedOfferedIds.map((id) => {
      const data = offeredItemData[id];
      if (data) return { id: data.id, name: data.name, image: data.image, qty: 1 };
      return { id, name: 'Unknown', image: '', qty: 1 };
    });

    const requestedItems = selectedRequestedIds.map((id) => {
      const data = requestedItemData[id];
      if (data) return { id: data.id, name: data.name, image: data.image, qty: 1 };
      return { id, name: 'Unknown', image: '', qty: 1 };
    });

    return {
      requestedCardId: scambio.id,
      offeredItems,
      offeredCredits,
      requestedItems,
      requestedCredits,
      isRealtime,
      message,
    };
  };

  const handleSubmit = () => {
    onSubmit(buildPayload());
    onClose();
  };

  const handleAccept = () => {
    onSubmit({
      requestedCardId: scambio.id,
      offeredItems: MOCK_A_PROPOSAL.offeredCards.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        qty: 1,
      })),
      offeredCredits: MOCK_A_PROPOSAL.offeredCredits,
      requestedItems: [],
      requestedCredits: 0,
      isRealtime: MOCK_A_PROPOSAL.isRealtime,
      message: 'Accetto la proposta',
    });
    onClose();
  };

  /* Unified results for "offer" side (my inventory + catalog search) */
  const offeredInventoryItems = useMemo(() => {
    const mapped = inventoryItems.map(inventoryToTradeCardItem);
    if (!searchQuery.trim()) return mapped;
    return mapped.filter((i) => matchQuery(i, searchQuery));
  }, [inventoryItems, searchQuery]);

  const offeredCatalogItems = useMemo(() => {
    if (!debouncedQuery) return [];
    const inventoryIds = new Set(inventoryItems.map((i) => String(i.id)));
    return searchHits
      .filter((h) => !inventoryIds.has(h.id))
      .map(searchHitToTradeCardItem);
  }, [searchHits, inventoryItems, debouncedQuery]);

  /* Unified results for "request" side in counter (their mock + catalog search) */
  const requestedInventoryItems = useMemo(() => {
    const mapped = MOCK_INVENTORY_B.map(mockItemToTradeCardItem);
    if (!searchQuery.trim()) return mapped;
    return mapped.filter((i) => matchQuery(i, searchQuery));
  }, [searchQuery]);

  const requestedCatalogItems = useMemo(() => {
    if (!debouncedQuery) return [];
    const mockIds = new Set(MOCK_INVENTORY_B.map((i) => i.id));
    return searchHits
      .filter((h) => !mockIds.has(h.id))
      .map(searchHitToTradeCardItem);
  }, [searchHits, debouncedQuery]);

  if (!open) return null;

  /* ---------------------------------------------------------------- */
  /*  PROPOSE                                                          */
  /* ---------------------------------------------------------------- */

  if (mode === 'propose') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
        <style>{MODAL_ANIM_CSS}</style>

        {/* Backdrop con gradiente blu scuro come header del sito */}
        <button
          type="button"
          className="animate-backdrop-enter absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(29,49,96,0.75) 0%, rgba(15,23,42,0.85) 100%)',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Chiudi"
          onClick={onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          className="animate-modal-enter relative z-[201] flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white/95 shadow-2xl shadow-black/20 sm:h-auto sm:max-h-[85dvh] sm:rounded-2xl"
          style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
        >
          {/* Header con gradient glass */}
          <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-white/20 bg-gradient-to-r from-[#1D3160] via-[#243663] to-[#1D3160] px-5 py-3">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <h2 className="text-base font-black uppercase tracking-tight text-white drop-shadow">Proponi scambio</h2>
              <p className="text-[10px] text-white/60">Seleziona cosa offri in cambio</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Left — target card con glass */}
            <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100/60 bg-gradient-to-b from-gray-50/80 to-white/60 p-4 lg:w-72 lg:border-b-0 lg:border-r lg:border-gray-100/60 lg:bg-white/80">
              <div className="animate-fade-in-up text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Carta richiesta
              </div>

              <div className="animate-fade-in-up flex items-center gap-3" style={{ animationDelay: '60ms' }}>
                <div className="card-shine-wrapper relative h-24 w-16 shrink-0 overflow-hidden rounded-xl shadow-lg shadow-black/10 ring-1 ring-black/5 transition-transform duration-300 hover:scale-105">
                  <Image src={scambio.image} alt={scambio.title} fill unoptimized className="object-cover" sizes="64px" priority />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black uppercase text-[#1D3160]">{scambio.title}</p>
                  <div className="mt-1"><ConditionBadge condition={scambio.condition} /></div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    di <span className="font-bold text-gray-700">{scambio.seller}</span>
                  </p>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Messaggio
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ciao..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200/80 bg-white/80 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-300 backdrop-blur-sm transition-all focus:border-[#FF7300] focus:ring-2 focus:ring-[#FF7300]/15 focus:bg-white focus:outline-none"
                  />
                </div>
                <ModeToggle checked={isRealtime} onChange={setIsRealtime} />
              </div>
            </div>

            {/* Right — inventory */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4">
              <div className="animate-fade-in-up mb-2 flex flex-wrap items-center justify-between gap-2" style={{ animationDelay: '40ms' }}>
                <span className="text-xs font-black uppercase tracking-tight text-[#1D3160]">Cosa offri</span>
                <div className="flex items-center gap-2">
                  {selectedOfferedIds.length > 0 && (
                    <span className="animate-badge-pop rounded-full bg-[#FF7300] px-2.5 py-0.5 text-[9px] font-bold text-white shadow-md shadow-orange-500/25">
                      {selectedOfferedIds.length} sel.
                    </span>
                  )}
                  <AuctionViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    listLabel="Lista"
                    gridLabel="Griglia"
                  />
                </div>
              </div>

              <div className="mb-3" style={{ animationDelay: '60ms' }}>
                <SearchBar
                  query={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Cerca nel tuo inventario o nel catalogo..."
                />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {loadingInventory && (
                  <div className="flex items-center gap-2 py-4 text-xs text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Caricamento inventario...
                  </div>
                )}

                {!loadingInventory && !user?.id && (
                  <p className="py-4 text-center text-xs text-gray-400">
                    Accedi per vedere la tua collezione.
                  </p>
                )}

                {!loadingInventory && (user?.id ? (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                      {offeredInventoryItems.map((item, i) => (
                        <MiniCard
                          key={item.id}
                          item={item}
                          selected={selectedOfferedIds.includes(item.id)}
                          onClick={() => toggleOfferedItem(item)}
                          delayIdx={i}
                        />
                      ))}
                      {offeredCatalogItems.map((item, i) => (
                        <MiniCard
                          key={item.id}
                          item={item}
                          selected={selectedOfferedIds.includes(item.id)}
                          onClick={() => toggleOfferedItem(item)}
                          delayIdx={offeredInventoryItems.length + i}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {offeredInventoryItems.map((item, i) => (
                        <MiniCardListItem
                          key={item.id}
                          item={item}
                          selected={selectedOfferedIds.includes(item.id)}
                          onClick={() => toggleOfferedItem(item)}
                          delayIdx={i}
                        />
                      ))}
                      {offeredCatalogItems.map((item, i) => (
                        <MiniCardListItem
                          key={item.id}
                          item={item}
                          selected={selectedOfferedIds.includes(item.id)}
                          onClick={() => toggleOfferedItem(item)}
                          delayIdx={offeredInventoryItems.length + i}
                        />
                      ))}
                    </div>
                  )
                ) : null)}

                {loadingSearch && (
                  <div className="flex items-center gap-2 py-3 text-xs text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Ricerca in corso...
                  </div>
                )}

                {searchError && (
                  <p className="py-2 text-xs text-red-600">{searchError}</p>
                )}

                {offeredInventoryItems.length === 0 && offeredCatalogItems.length === 0 && !loadingInventory && !loadingSearch && (
                  <p className="animate-fade-in-up py-4 text-center text-xs text-gray-400">
                    Nessuna carta trovata
                  </p>
                )}
              </div>

              {/* Bottom row */}
              <div className="animate-fade-in-up flex flex-wrap items-end gap-4 pt-3" style={{ animationDelay: '200ms' }}>
                <CreditField value={offeredCredits} onChange={setOfferedCredits} label="Crediti offerti" />
                <CreditField value={requestedCredits} onChange={setRequestedCredits} label="Crediti richiesti" />
                <SubmitButton onClick={handleSubmit}>Invia proposta</SubmitButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  COUNTER                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
      <style>{MODAL_ANIM_CSS}</style>

      <button
        type="button"
        className="animate-backdrop-enter absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(29,49,96,0.75) 0%, rgba(15,23,42,0.85) 100%)',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Chiudi"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="animate-modal-enter relative z-[201] flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white/95 shadow-2xl shadow-black/20 sm:h-auto sm:max-h-[85dvh] sm:rounded-2xl"
        style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
      >
        {/* Header glass */}
        <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-white/20 bg-gradient-to-r from-[#1D3160] via-[#243663] to-[#1D3160] px-5 py-3">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-base font-black uppercase tracking-tight text-white drop-shadow">Rispondi allo scambio</h2>
            <p className="text-[10px] text-white/60">{scambio.seller} ti ha proposto uno scambio</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left — their proposal */}
          <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100/60 bg-gradient-to-b from-gray-50/80 to-white/60 p-4 lg:w-72 lg:border-b-0 lg:border-r lg:border-gray-100/60 lg:bg-white/80">
            <div className="animate-fade-in-up text-[10px] font-bold uppercase tracking-wider text-gray-400">
              La sua proposta
            </div>

            <div className="animate-fade-in-up flex items-center gap-3" style={{ animationDelay: '60ms' }}>
              <div className="card-shine-wrapper relative h-24 w-16 shrink-0 overflow-hidden rounded-xl shadow-lg shadow-black/10 ring-1 ring-black/5 transition-transform duration-300 hover:scale-105">
                <Image src={scambio.image} alt={scambio.title} fill unoptimized className="object-cover" sizes="64px" priority />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase text-[#1D3160]">{scambio.title}</p>
                <div className="mt-1"><ConditionBadge condition={scambio.condition} /></div>
              </div>
            </div>

            <div className="animate-fade-in-up rounded-xl border border-gray-200/60 bg-white/80 p-3 backdrop-blur-sm" style={{ animationDelay: '100ms' }}>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Offre</p>
              <div className="flex gap-2">
                {MOCK_A_PROPOSAL.offeredCards.map((item, i) => (
                  <div key={item.id} className="card-shine-wrapper relative h-16 w-11 overflow-hidden rounded-lg shadow transition-transform duration-200 hover:scale-105" style={{ animationDelay: `${120 + i * 50}ms` }}>
                    <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" sizes="44px" />
                  </div>
                ))}
              </div>
              {MOCK_A_PROPOSAL.offeredCredits > 0 && (
                <p className="mt-2 text-xs font-bold text-[#FF7300]">+ {MOCK_A_PROPOSAL.offeredCredits} crediti</p>
              )}
            </div>

            {MOCK_A_PROPOSAL.message && (
              <div className="animate-fade-in-up rounded-lg border-l-4 border-[#FF7300] bg-gradient-to-r from-orange-50/60 to-transparent px-3 py-2" style={{ animationDelay: '140ms' }}>
                <p className="text-[11px] italic leading-relaxed text-gray-600">&ldquo;{MOCK_A_PROPOSAL.message}&rdquo;</p>
              </div>
            )}

            <div className="animate-fade-in-up flex items-center gap-2" style={{ animationDelay: '160ms' }}>
              <span className="text-[10px] text-gray-400">Modalità:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-[#FF7300] shadow-sm shadow-orange-500/10">
                {MOCK_A_PROPOSAL.isRealtime ? <Zap className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {MOCK_A_PROPOSAL.isRealtime ? 'Realtime' : 'Async'}
              </span>
            </div>

            <div className="animate-fade-in-up mt-auto space-y-2" style={{ animationDelay: '180ms' }}>
              <button
                type="button"
                onClick={handleAccept}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <Check className="h-3.5 w-3.5" /> Accetta
              </button>
              <button
                type="button"
                onClick={() => setCounterEditing(true)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] ${
                  counterEditing
                    ? 'border-[#FF7300] bg-gradient-to-r from-orange-50 to-orange-100/30 text-[#FF7300] shadow-sm shadow-orange-500/10'
                    : 'border-gray-200/80 bg-white/80 text-gray-700 backdrop-blur-sm hover:border-gray-300 hover:bg-white hover:shadow-sm'
                }`}
              >
                Modifica proposta
              </button>
            </div>
          </div>

          {/* Right — your counter */}
          <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 ${!counterEditing ? 'hidden lg:flex' : ''}`}>
            {!counterEditing ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="animate-fade-in-up flex h-12 w-12 items-center justify-center rounded-full bg-gray-100/80 shadow-inner">
                  <Send className="h-5 w-5 text-gray-400" />
                </div>
                <p className="animate-fade-in-up mt-3 text-xs text-gray-400" style={{ animationDelay: '80ms' }}>
                  Clicca &ldquo;Modifica&rdquo; per rispondere con una controproposta
                </p>
              </div>
            ) : (
              <>
                <div className="animate-fade-in-up mb-2 flex flex-wrap items-center justify-between gap-2" style={{ animationDelay: '40ms' }}>
                  <span className="text-xs font-black uppercase tracking-tight text-[#1D3160]">Cosa chiedi</span>
                  <div className="flex items-center gap-2">
                    {selectedRequestedIds.length > 0 && (
                      <span className="animate-badge-pop rounded-full bg-[#FF7300] px-2.5 py-0.5 text-[9px] font-bold text-white shadow-md shadow-orange-500/25">
                        {selectedRequestedIds.length} sel.
                      </span>
                    )}
                    <AuctionViewToggle
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      listLabel="Lista"
                      gridLabel="Griglia"
                    />
                  </div>
                </div>

                <div className="mb-3" style={{ animationDelay: '60ms' }}>
                  <SearchBar
                    query={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={`Cerca in ${scambio.seller} o nel catalogo...`}
                  />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                      {requestedInventoryItems.map((item, i) => (
                        <MiniCard
                          key={item.id}
                          item={item}
                          selected={selectedRequestedIds.includes(item.id)}
                          onClick={() => toggleRequestedItem(item)}
                          delayIdx={i}
                        />
                      ))}
                      {requestedCatalogItems.map((item, i) => (
                        <MiniCard
                          key={item.id}
                          item={item}
                          selected={selectedRequestedIds.includes(item.id)}
                          onClick={() => toggleRequestedItem(item)}
                          delayIdx={requestedInventoryItems.length + i}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {requestedInventoryItems.map((item, i) => (
                        <MiniCardListItem
                          key={item.id}
                          item={item}
                          selected={selectedRequestedIds.includes(item.id)}
                          onClick={() => toggleRequestedItem(item)}
                          delayIdx={i}
                        />
                      ))}
                      {requestedCatalogItems.map((item, i) => (
                        <MiniCardListItem
                          key={item.id}
                          item={item}
                          selected={selectedRequestedIds.includes(item.id)}
                          onClick={() => toggleRequestedItem(item)}
                          delayIdx={requestedInventoryItems.length + i}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {loadingSearch && (
                  <div className="flex items-center gap-2 py-3 text-xs text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Ricerca in corso...
                  </div>
                )}

                {searchError && (
                  <p className="py-2 text-xs text-red-600">{searchError}</p>
                )}

                {requestedInventoryItems.length === 0 && requestedCatalogItems.length === 0 && !loadingSearch && (
                  <p className="animate-fade-in-up py-4 text-center text-xs text-gray-400">
                    Nessuna carta trovata
                  </p>
                )}

                <div className="animate-fade-in-up mt-auto flex flex-wrap items-end gap-4 pt-3" style={{ animationDelay: '200ms' }}>
                  <CreditField value={offeredCredits} onChange={setOfferedCredits} label="Crediti offerti" />
                  <CreditField value={requestedCredits} onChange={setRequestedCredits} label="Crediti richiesti" />
                  <ModeToggle checked={isRealtime} onChange={setIsRealtime} />
                  <SubmitButton onClick={handleSubmit}>Invia controproposta</SubmitButton>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
