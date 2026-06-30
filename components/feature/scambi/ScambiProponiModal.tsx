'use client';

/**
 * ScambiProponiModal v5 — Inventario reale, ricerca catalogo, lista/griglia, crediti sdoppiati.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X, Search, Send, Check, Loader2,
  Coins, Library, Package, Sparkles,
  Zap, Clock,
} from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import Image from 'next/image';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import type { ConditionCode } from '@/components/ui/ConditionBadge';
import type { ScambioUI, TradePayload } from '@/components/feature/scambi/scambi-types';
import { MOCK_INVENTORY_A, MOCK_INVENTORY_B } from './mock-trade-inventories';
import { useAuthStore } from '@/lib/stores/auth-store';
import { syncClient } from '@/lib/api/sync-client';
import type { InventoryItemResponse } from '@/lib/api/sync-client';
import { fetchCardsByBlueprintIds, type CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import { getCardImageUrl } from '@/lib/assets';
import { AuctionViewToggle } from '@/components/feature/aste/auctions-browse-shared';
import type { SearchHit } from '@/app/api/search/route';
import { useSearchCards } from '@/lib/hooks/use-search';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Props {
  open: boolean;
  onClose: () => void;
  scambio: ScambioUI;
  mode: 'propose' | 'counter';
  onSubmit: (payload: TradePayload) => void;
  /** Pre-fill catalog search when opening from product detail. */
  initialCatalogSearch?: string;
}

type TFunction = ReturnType<typeof useTranslation>['t'];

type InventoryWithCard = InventoryItemResponse & { card?: CardCatalogHit | null };

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
  from { opacity: 0; transform: scale(0.96) translateY(16px); }
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
  50%     { box-shadow: 0 0 18px 3px rgba(255,115,0,0.22); }
}
@keyframes card-shine {
  0%   { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(200%) rotate(25deg); }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes badge-pop {
  0%   { transform: scale(0); }
  60%  { transform: scale(1.25); }
  100% { transform: scale(1); }
}
@keyframes float-soft {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-4px); }
}
.animate-modal-enter {
  animation: modal-enter 0.38s cubic-bezier(0.22,1,0.36,1) forwards;
}
.animate-backdrop-enter {
  animation: modal-backdrop-enter 0.25s ease-out forwards;
}
.animate-shimmer-btn {
  background-size: 200% 100%;
  animation: shimmer-btn 2.5s linear infinite;
}
.animate-glow-pulse {
  animation: glow-pulse 2.2s ease-in-out infinite;
}
.animate-fade-in-up {
  animation: fade-in-up 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
  opacity: 0;
}
.animate-badge-pop {
  animation: badge-pop 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
.animate-float-soft {
  animation: float-soft 4s ease-in-out infinite;
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
    rgba(255,255,255,0.28) 45%,
    rgba(255,255,255,0.48) 50%,
    rgba(255,255,255,0.28) 55%,
    transparent 60%
  );
  transform: translateX(-100%) rotate(25deg);
  pointer-events: none;
  transition: none;
}
.card-shine-wrapper:hover::after {
  animation: card-shine 0.75s ease forwards;
}
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
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

function inventoryToTradeCardItem(item: InventoryWithCard, t: TFunction): TradeCardItem {
  const card = item.card;
  const props = item.properties as Record<string, unknown> | undefined;
  const condition = typeof props?.condition === 'string' ? props.condition : '';
  return {
    id: String(item.id),
    name: card?.name ?? `Item ${item.blueprint_id}`,
    image: getCardImageUrl(card?.image ?? null) ?? '',
    condition,
    badge: t('scambi.modal.badgeInventory'),
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

function mockItemToTradeCardItem(item: { id: string; name: string; image: string; condition: string }, t: TFunction): TradeCardItem {
  return {
    id: item.id,
    name: item.name,
    image: item.image,
    condition: item.condition,
    badge: t('scambi.modal.badgeAvailable'),
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MiniCard({
  item,
  selected,
  onClick,
  delayIdx = 0,
  selectedQty,
  maxQty,
  onQtyChange,
}: {
  item: TradeCardItem;
  selected: boolean;
  onClick: () => void;
  delayIdx?: number;
  selectedQty?: number;
  maxQty?: number;
  onQtyChange?: (delta: number) => void;
}) {
  const showQtySelector = selected && maxQty && maxQty > 1 && onQtyChange;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center rounded-2xl border-2 p-2 text-left transition-all duration-200 animate-fade-in-up ${
        selected
          ? 'border-[#FF7300] bg-gradient-to-b from-orange-50 to-white shadow-xl shadow-orange-500/20 scale-[1.02]'
          : 'border-gray-100 bg-white shadow-sm shadow-black/5 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1'
      }`}
      style={{ animationDelay: `${delayIdx * 45}ms` }}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[#FF7300] text-white shadow-lg shadow-orange-500/30 animate-badge-pop">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </div>
      )}
      {item.badge && (
        <div className="absolute left-2 top-2 z-10 rounded-lg bg-[#1D3160]/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow backdrop-blur-sm">
          {item.badge}
        </div>
      )}
      {!selected && item.qty && item.qty > 1 && (
        <div className="absolute bottom-7 right-2 z-10 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#FF7300] px-1 text-[9px] font-bold text-white shadow-md">
          x{item.qty}
        </div>
      )}
      {showQtySelector && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-xl border border-[#FF7300]/30"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 transition hover:bg-gray-200 select-none"
            onClick={() => onQtyChange(-1)}
          >
            −
          </span>
          <span className="min-w-[18px] text-center text-xs font-black text-[#FF7300] tabular-nums">
            {selectedQty ?? 1}
          </span>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold select-none transition ${
              (selectedQty ?? 1) < (maxQty ?? 1)
                ? 'cursor-pointer bg-[#FF7300] text-white hover:bg-[#e86800] hover:scale-105'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
            }`}
            onClick={() => { if ((selectedQty ?? 1) < (maxQty ?? 1)) onQtyChange(1); }}
          >
            +
          </span>
        </div>
      )}
      <div className={`card-shine-wrapper relative aspect-[200/280] w-full overflow-hidden rounded-xl bg-gray-100 transition-shadow ${selected ? 'shadow-md shadow-orange-500/10' : ''}`}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="96px"
        />
      </div>
      <div className="mt-2 w-full px-0.5">
        <p className="truncate text-[11px] font-black leading-tight text-gray-900">{item.name}</p>
        {item.condition ? <p className="text-[10px] font-medium text-gray-500">{item.condition}</p> : null}
      </div>
    </button>
  );
}

function MiniCardListItem({
  item,
  selected,
  onClick,
  delayIdx = 0,
  selectedQty,
  maxQty,
  onQtyChange,
}: {
  item: TradeCardItem;
  selected: boolean;
  onClick: () => void;
  delayIdx?: number;
  selectedQty?: number;
  maxQty?: number;
  onQtyChange?: (delta: number) => void;
}) {
  const showQtySelector = selected && maxQty && maxQty > 1 && onQtyChange;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-all duration-200 animate-fade-in-up ${
        selected
          ? 'border-[#FF7300] bg-gradient-to-r from-orange-50 to-white shadow-md shadow-orange-500/10'
          : 'border-gray-100 bg-white shadow-sm shadow-black/5 hover:border-orange-200 hover:shadow-md'
      }`}
      style={{ animationDelay: `${delayIdx * 45}ms` }}
    >
      <div className={`card-shine-wrapper relative h-16 w-11 shrink-0 overflow-hidden rounded-xl bg-gray-100 ${selected ? 'shadow-md shadow-orange-500/10' : ''}`}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="48px"
        />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-black text-gray-900">{item.name}</p>
        {item.condition ? <p className="text-[11px] font-medium text-gray-500">{item.condition}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.badge ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#1D3160]/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              <Package className="h-2.5 w-2.5" />
              {item.badge}
            </span>
          ) : null}
          {!selected && item.qty && item.qty > 1 ? (
            <span className="inline-flex items-center rounded-full bg-[#FF7300] px-1.5 py-0.5 text-[9px] font-bold text-white">
              x{item.qty}
            </span>
          ) : null}
        </div>
      </div>
      {showQtySelector && (
        <div
          className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 shadow-lg border border-[#FF7300]/30"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 transition hover:bg-gray-200 select-none"
            onClick={() => onQtyChange(-1)}
          >
            −
          </span>
          <span className="min-w-[18px] text-center text-xs font-black text-[#FF7300] tabular-nums">
            {selectedQty ?? 1}
          </span>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold select-none transition ${
              (selectedQty ?? 1) < (maxQty ?? 1)
                ? 'cursor-pointer bg-[#FF7300] text-white hover:bg-[#e86800] hover:scale-105'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
            }`}
            onClick={() => { if ((selectedQty ?? 1) < (maxQty ?? 1)) onQtyChange(1); }}
          >
            +
          </span>
        </div>
      )}
      {selected && !showQtySelector && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF7300] text-white shadow-md shadow-orange-500/25 animate-badge-pop">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

function CreditField({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
}) {
  const decrement = () => onChange(Math.max(0, value - 1));
  const increment = () => onChange(value + 1);
  return (
    <div className={`animate-fade-in-up transition-opacity ${disabled ? 'opacity-50' : ''}`} style={{ animationDelay: '120ms' }}>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500">
        <Coins className="h-3 w-3" />
        {label}
      </label>
      <div
        className={`flex items-center overflow-hidden rounded-xl border-2 bg-white shadow-sm transition ${
          disabled
            ? 'border-gray-100 bg-gray-50'
            : 'border-gray-200 focus-within:border-[#FF7300] focus-within:ring-4 focus-within:ring-[#FF7300]/10'
        }`}
      >
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || value <= 0}
          className="flex h-10 w-10 items-center justify-center bg-gray-50 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          −
        </button>
        <div className="relative flex-1">
          <input
            type="number"
            min={0}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
            className={`h-10 w-full border-x-2 border-gray-100 bg-transparent px-2 py-2 text-center text-sm font-black text-gray-900 outline-none tabular-nums transition ${
              disabled ? 'text-gray-400 cursor-not-allowed' : ''
            }`}
          />
        </div>
        <button
          type="button"
          onClick={increment}
          disabled={disabled}
          className="flex h-10 w-10 items-center justify-center bg-gray-50 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
        >
          +
        </button>
      </div>
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
      className="animate-shimmer-btn group relative ml-auto flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#FF8A3D] via-[#FF7300] to-[#E86800] px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/45 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
    >
      <span className="relative z-10 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <Send className="h-3.5 w-3.5" />
        </span>
        {children}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TradeConfirmOverlay — conferma finale con resoconto dello scambio   */
/* ------------------------------------------------------------------ */

function ConfirmCardThumb({ image, name, qty }: { image: string; name: string; qty?: number }) {
  return (
    <div className="relative w-14 shrink-0">
      <div className="card-shine-wrapper relative aspect-[200/280] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm ring-1 ring-black/5">
        {image ? (
          <Image src={image} alt={name} fill unoptimized className="object-cover" sizes="56px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <Package className="h-4 w-4 text-gray-300" />
          </div>
        )}
        {qty && qty > 1 ? (
          <span className="absolute bottom-1 right-1 rounded-full bg-[#FF7300] px-1.5 py-0.5 text-[9px] font-black text-white shadow">
            x{qty}
          </span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-2 text-center text-[9px] font-bold leading-tight text-gray-700">{name}</p>
    </div>
  );
}

function ConfirmColumn({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
      <div className="flex flex-wrap items-start gap-2">{children}</div>
    </div>
  );
}

function TradeConfirmOverlay({
  t,
  offeredSummary,
  offeredCredits,
  receivedSummary,
  requestedCredits,
  onBack,
  onConfirm,
}: {
  t: TFunction;
  offeredSummary: { item: TradeCardItem; qty: number }[];
  offeredCredits: number;
  receivedSummary: { item: TradeCardItem; qty: number }[];
  requestedCredits: number;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const hasOffer = offeredSummary.length > 0 || offeredCredits > 0;
  const hasReceived = receivedSummary.length > 0 || requestedCredits > 0;
  return (
    <div className="absolute inset-0 z-[210] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="animate-backdrop-enter absolute inset-0 bg-[#0F172A]/70 backdrop-blur-md"
        aria-label={t('common.close')}
        onClick={onBack}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-modal-enter relative z-[211] w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30"
      >
        <div className="bg-gradient-to-r from-[#1D3160] via-[#2A3F73] to-[#1D3160] px-5 py-4">
          <h2 className="text-base font-black uppercase tracking-tight text-white">{t('scambi.modal.confirmTitle')}</h2>
          <p className="text-[11px] font-medium text-white/70">{t('scambi.modal.confirmSubtitle')}</p>
        </div>

        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-stretch">
          <ConfirmColumn label={t('scambi.modal.confirmYouOffer')}>
            {offeredSummary.map(({ item, qty }) => (
              <ConfirmCardThumb key={item.id} image={item.image} name={item.name} qty={qty} />
            ))}
            {offeredCredits > 0 ? (
              <span className="inline-flex items-center gap-1 self-center rounded-full bg-[#FF7300]/10 px-2.5 py-1 text-[11px] font-black text-[#FF7300]">
                <Coins className="h-3 w-3" /> {t('scambi.modal.confirmCredits', { count: offeredCredits })}
              </span>
            ) : null}
            {!hasOffer ? (
              <p className="text-[11px] font-medium text-gray-400">{t('scambi.modal.confirmNoItems')}</p>
            ) : null}
          </ConfirmColumn>

          <div className="flex items-center justify-center sm:flex-col">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D3160]/5 text-[#1D3160]">
              <ScambiIcon className="h-4 w-4" />
            </span>
          </div>

          <ConfirmColumn label={t('scambi.modal.confirmYouReceive')}>
            {receivedSummary.map(({ item, qty }) => (
              <ConfirmCardThumb key={item.id} image={item.image} name={item.name} qty={qty} />
            ))}
            {requestedCredits > 0 ? (
              <span className="inline-flex items-center gap-1 self-center rounded-full bg-[#FF7300]/10 px-2.5 py-1 text-[11px] font-black text-[#FF7300]">
                <Coins className="h-3 w-3" /> {t('scambi.modal.confirmCredits', { count: requestedCredits })}
              </span>
            ) : null}
            {!hasReceived ? (
              <p className="text-[11px] font-medium text-gray-400">{t('scambi.modal.confirmNoItems')}</p>
            ) : null}
          </ConfirmColumn>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            {t('scambi.modal.confirmBack')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF8A3D] via-[#FF7300] to-[#E86800] px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-orange-500/45 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Send className="h-3.5 w-3.5" />
            {t('scambi.modal.confirmSend')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SelectedBadge — mostra conteggio + popover hover con lista carte    */
/* ------------------------------------------------------------------ */

function SelectedBadge({ count, items, quantities }: { count: number; items: TradeCardItem[]; quantities?: Record<string, number> }) {
  const { t } = useTranslation();
  if (count === 0) return null;
  const totalQty = quantities
    ? items.reduce((sum, item) => sum + (quantities[item.id] ?? 1), 0)
    : count;
  return (
    <div className="group relative">
      <span className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-[#FF7300] px-3 py-1.5 text-[11px] font-black text-white shadow-md shadow-orange-500/25 animate-badge-pop">
        <Check className="h-3 w-3" strokeWidth={3} />
        {totalQty !== count
          ? t('scambi.modal.selectedCountWithTotal', { count, totalQty })
          : t('scambi.modal.selectedCount', { count })}
      </span>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-2xl w-56 max-h-52 overflow-y-auto">
          {items.map((item) => {
            const qty = quantities?.[item.id] ?? 1;
            return (
              <div key={item.id} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-50">
                <div className="relative h-9 w-7 shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
                  <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" sizes="28px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-gray-800">{item.name}</p>
                  {item.condition ? <p className="text-[9px] text-gray-500">{item.condition}</p> : null}
                </div>
                {qty > 1 && (
                  <span className="shrink-0 rounded-full bg-[#FF7300]/10 px-1.5 py-0.5 text-[10px] font-black text-[#FF7300]">x{qty}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
    <div className="animate-fade-in-up flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 transition-all focus-within:border-[#FF7300] focus-within:bg-white focus-within:shadow-md focus-within:shadow-orange-500/10">
      <Search className="h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      {query && (
        <button type="button" onClick={() => onChange('')} className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-700">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export function ScambiProponiModal({ open, onClose, scambio, mode, onSubmit, initialCatalogSearch }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  // FE-REV-018 (pattern): selector puro; fallback localStorage in useMemo, non dentro il selector Zustand.
  const accessTokenFromStore = useAuthStore((s) => s.accessToken);
  const accessToken = useMemo(
    () =>
      accessTokenFromStore ??
      (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null),
    [accessTokenFromStore]
  );

  const mockAProposal = useMemo(
    () => ({
      offeredCards: [MOCK_INVENTORY_A[0], MOCK_INVENTORY_A[1]],
      offeredCredits: 50,
      isRealtime: true,
      message: t('scambi.modal.defaultMessage'),
    }),
    [t]
  );

  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>([]);
  const [offeredCredits, setOfferedCredits] = useState(0);
  const [requestedCredits, setRequestedCredits] = useState(0);
  const [selectedRequestedIds, setSelectedRequestedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [counterEditing, setCounterEditing] = useState(false);
  /* Step di conferma finale con resoconto di ciò che si sta scambiando. */
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [inventoryItems, setInventoryItems] = useState<InventoryWithCard[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  /* Keep track of selected item data so lookups survive search changes */
  const [offeredItemData, setOfferedItemData] = useState<Record<string, TradeCardItem>>({});
  const [requestedItemData, setRequestedItemData] = useState<Record<string, TradeCardItem>>({});

  /* Track selected quantities per item id (only for items with qty > 1) */
  const [offeredQuantities, setOfferedQuantities] = useState<Record<string, number>>({});
  const [requestedQuantities, setRequestedQuantities] = useState<Record<string, number>>({});

  /* Mutual-exclusion credit handlers: setting one resets the other */
  const handleOfferedCreditsChange = useCallback((v: number) => {
    setOfferedCredits(v);
    if (v > 0) setRequestedCredits(0);
  }, []);

  const handleRequestedCreditsChange = useCallback((v: number) => {
    setRequestedCredits(v);
    if (v > 0) setOfferedCredits(0);
  }, []);

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
    if (open && initialCatalogSearch?.trim()) {
      setSearchQuery(initialCatalogSearch.trim());
    }
  }, [open, initialCatalogSearch]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  /* Ricerca catalogo via React Query (regola §2): cache condivisa, niente fetch manuale. */
  const {
    data: searchData,
    isLoading: loadingSearch,
    error: searchErr,
  } = useSearchCards(
    { q: debouncedQuery || undefined, limit: 12, page: 1 },
    { enabled: Boolean(debouncedQuery) },
  );
  const searchError = searchErr
    ? (searchErr instanceof Error ? searchErr.message : t('scambi.modal.searchError'))
    : null;

  useEffect(() => {
    if (open) {
      setSelectedOfferedIds([]);
      setOfferedCredits(0);
      setRequestedCredits(0);
      setSelectedRequestedIds([]);
      setMessage('');
      setSearchQuery('');
      setCounterEditing(false);
      setConfirmOpen(false);
      setViewMode('grid');
      setOfferedItemData({});
      setRequestedItemData({});
      setOfferedQuantities({});
      setRequestedQuantities({});
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
      const { [item.id]: __, ...restQ } = offeredQuantities;
      setOfferedQuantities(restQ);
    } else {
      setSelectedOfferedIds([...selectedOfferedIds, item.id]);
      setOfferedItemData((prev) => ({ ...prev, [item.id]: item }));
      if (item.qty && item.qty > 1) {
        setOfferedQuantities((prev) => ({ ...prev, [item.id]: 1 }));
      }
    }
  };

  const toggleRequestedItem = (item: TradeCardItem) => {
    const exists = selectedRequestedIds.includes(item.id);
    if (exists) {
      setSelectedRequestedIds(selectedRequestedIds.filter((x) => x !== item.id));
      const { [item.id]: _, ...rest } = requestedItemData;
      setRequestedItemData(rest);
      const { [item.id]: __, ...restQ } = requestedQuantities;
      setRequestedQuantities(restQ);
    } else {
      setSelectedRequestedIds([...selectedRequestedIds, item.id]);
      setRequestedItemData((prev) => ({ ...prev, [item.id]: item }));
      if (item.qty && item.qty > 1) {
        setRequestedQuantities((prev) => ({ ...prev, [item.id]: 1 }));
      }
    }
  };

  const buildPayload = (): TradePayload => {
    const offeredItems = selectedOfferedIds.map((id) => {
      const data = offeredItemData[id];
      const qty = offeredQuantities[id] ?? 1;
      if (data) return { id: data.id, name: data.name, image: data.image, qty };
      return { id, name: t('scambi.modal.unknownItem'), image: '', qty: 1 };
    });

    const requestedItems = selectedRequestedIds.map((id) => {
      const data = requestedItemData[id];
      const qty = requestedQuantities[id] ?? 1;
      if (data) return { id: data.id, name: data.name, image: data.image, qty };
      return { id, name: t('scambi.modal.unknownItem'), image: '', qty: 1 };
    });

    return {
      requestedCardId: scambio.id,
      offeredItems,
      offeredCredits,
      requestedItems,
      requestedCredits,
      isRealtime: false,
      message,
    };
  };

  const handleSubmit = () => {
    onSubmit(buildPayload());
    onClose();
  };

  /* Resoconto minimal per il modale di conferma finale (lato "offerta"). */
  const offeredSummary = selectedOfferedIds
    .map((id) => ({ item: offeredItemData[id], qty: offeredQuantities[id] ?? 1 }))
    .filter((x): x is { item: TradeCardItem; qty: number } => Boolean(x.item));

  /* Resoconto lato "richiesta" (carte selezionate dall'inventario del venditore
     nella controproposta) — usato per il recap di conferma del counter. */
  const requestedSummary = selectedRequestedIds
    .map((id) => ({ item: requestedItemData[id], qty: requestedQuantities[id] ?? 1 }))
    .filter((x): x is { item: TradeCardItem; qty: number } => Boolean(x.item));

  /* Carta bersaglio dello scambio come riga di recap (lato "ricevi" nel propose). */
  const targetCardSummary: { item: TradeCardItem; qty: number }[] = [
    { item: { id: scambio.id, name: scambio.title, image: scambio.image }, qty: 1 },
  ];

  const confirmAndSend = () => {
    setConfirmOpen(false);
    handleSubmit();
  };

  const handleAccept = () => {
    onSubmit({
      requestedCardId: scambio.id,
      offeredItems: mockAProposal.offeredCards.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        qty: 1,
      })),
      offeredCredits: mockAProposal.offeredCredits,
      requestedItems: [],
      requestedCredits: 0,
      isRealtime: false,
      message: t('scambi.modal.acceptMessage'),
    });
    onClose();
  };

  /* Unified results for "offer" side (my inventory + catalog search) */
  const offeredInventoryItems = useMemo(() => {
    const mapped = inventoryItems.map((item) => inventoryToTradeCardItem(item, t));
    if (!searchQuery.trim()) return mapped;
    return mapped.filter((i) => matchQuery(i, searchQuery));
  }, [inventoryItems, searchQuery, t]);

  const offeredCatalogItems = useMemo(() => {
    if (!debouncedQuery) return [];
    const inventoryIds = new Set(inventoryItems.map((i) => String(i.id)));
    return (searchData?.hits ?? [])
      .filter((h) => !inventoryIds.has(h.id))
      .map(searchHitToTradeCardItem);
  }, [searchData?.hits, inventoryItems, debouncedQuery]);

  /* Unified results for "request" side in counter (their mock + catalog search) */
  const requestedInventoryItems = useMemo(() => {
    const mapped = MOCK_INVENTORY_B.map((item) => mockItemToTradeCardItem(item, t));
    if (!searchQuery.trim()) return mapped;
    return mapped.filter((i) => matchQuery(i, searchQuery));
  }, [searchQuery, t]);

  const requestedCatalogItems = useMemo(() => {
    if (!debouncedQuery) return [];
    const mockIds = new Set(MOCK_INVENTORY_B.map((i) => i.id));
    return (searchData?.hits ?? [])
      .filter((h) => !mockIds.has(h.id))
      .map(searchHitToTradeCardItem);
  }, [searchData?.hits, debouncedQuery]);

  if (!open) return null;

  /* ---------------------------------------------------------------- */
  /*  PROPOSE                                                          */
  /* ---------------------------------------------------------------- */

  if (mode === 'propose') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
        <style>{MODAL_ANIM_CSS}</style>

        {/* Backdrop immersivo */}
        <button
          type="button"
          className="animate-backdrop-enter absolute inset-0 bg-[#0F172A]/75 backdrop-blur-md"
          aria-label={t('common.close')}
          onClick={onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          className="animate-modal-enter relative z-[201] flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none bg-[#F8F7F4] shadow-2xl shadow-black/25 sm:h-auto sm:max-h-[90dvh] sm:rounded-[28px]"
        >
          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between overflow-hidden bg-gradient-to-r from-[#1D3160] via-[#2A3F73] to-[#1D3160] px-5 py-4 sm:px-6">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner backdrop-blur-sm">
                <ScambiIcon className="h-5 w-5 text-[#FF7300]" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white drop-shadow-sm">{t('productDetail.scambi.propose')}</h2>
                <p className="text-[11px] font-medium text-white/70">{t('scambi.modal.proposeSubtitle')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Left — target card */}
            <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200/60 bg-gradient-to-b from-white to-[#F8F7F4] p-5 lg:w-80 lg:border-b-0 lg:border-r lg:border-gray-200/60">
              <div className="animate-fade-in-up flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-400">
                <Sparkles className="h-3.5 w-3.5 text-[#FF7300]" />
                {t('scambi.modal.requestedCardLabel')}
              </div>

              <div className="animate-fade-in-up flex flex-col gap-3" style={{ animationDelay: '60ms' }}>
                <div className="card-shine-wrapper animate-float-soft relative w-full overflow-hidden rounded-2xl shadow-xl shadow-black/15 ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.02]" style={{ aspectRatio: '200/280' }}>
                  <Image src={scambio.image} alt={scambio.title} fill unoptimized className="object-cover" sizes="320px" priority />
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <p className="truncate text-sm font-black uppercase text-[#1D3160]">{scambio.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <ConditionBadge condition={scambio.condition as ConditionCode} />
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-gray-500">
                    {t('scambi.modal.bySeller', { seller: scambio.seller })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right — inventory */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="animate-fade-in-up flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/60 bg-white/80 px-5 py-3 backdrop-blur-sm" style={{ animationDelay: '40ms' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black uppercase tracking-tight text-[#1D3160]">{t('scambi.modal.offerSectionTitle')}</span>
                  <span className="hidden h-4 w-px bg-gray-300 sm:block" />
                  <span className="hidden text-[11px] font-semibold text-gray-400 sm:block">
                    {offeredInventoryItems.length > 0 && t('scambi.modal.inventoryCount', { count: offeredInventoryItems.length })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AuctionViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    listLabel={t('auctions.viewList')}
                    gridLabel={t('auctions.viewGrid')}
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                <div className="mb-4" style={{ animationDelay: '60ms' }}>
                  <SearchBar
                    query={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={t('scambi.modal.searchOfferPlaceholder')}
                  />
                </div>

                {loadingInventory && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#FF7300]" />
                    {t('scambi.modal.loadingInventory')}
                  </div>
                )}

                {!loadingInventory && !user?.id && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Library className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">{t('scambi.modal.loginRequired')}</p>
                  </div>
                )}

                {!loadingInventory && (user?.id ? (
                  <>
                    {offeredInventoryItems.length > 0 && (
                      <div className="mb-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-500">
                          <Package className="h-3.5 w-3.5" />
                          {t('scambi.modal.fromInventory')}
                        </div>
                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                            {offeredInventoryItems.map((item, i) => (
                              <MiniCard
                                key={item.id}
                                item={item}
                                selected={selectedOfferedIds.includes(item.id)}
                                onClick={() => toggleOfferedItem(item)}
                                delayIdx={i}
                                selectedQty={offeredQuantities[item.id]}
                                maxQty={item.qty}
                                onQtyChange={(delta) => {
                                  const cur = offeredQuantities[item.id] ?? 1;
                                  const next = Math.max(1, Math.min(item.qty ?? 1, cur + delta));
                                  if (next === cur) return;
                                  setOfferedQuantities((prev) => ({ ...prev, [item.id]: next }));
                                }}
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
                                selectedQty={offeredQuantities[item.id]}
                                maxQty={item.qty}
                                onQtyChange={(delta) => {
                                  const cur = offeredQuantities[item.id] ?? 1;
                                  const next = Math.max(1, Math.min(item.qty ?? 1, cur + delta));
                                  if (next === cur) return;
                                  setOfferedQuantities((prev) => ({ ...prev, [item.id]: next }));
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {offeredCatalogItems.length > 0 && (
                      <div className="mb-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-500">
                          <Library className="h-3.5 w-3.5" />
                          {t('scambi.modal.fromCatalog')}
                        </div>
                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                            {offeredCatalogItems.map((item, i) => (
                              <MiniCard
                                key={item.id}
                                item={item}
                                selected={selectedOfferedIds.includes(item.id)}
                                onClick={() => toggleOfferedItem(item)}
                                delayIdx={offeredInventoryItems.length + i}
                                selectedQty={offeredQuantities[item.id]}
                                maxQty={item.qty}
                                onQtyChange={(delta) => {
                                  const cur = offeredQuantities[item.id] ?? 1;
                                  const next = Math.max(1, Math.min(item.qty ?? 1, cur + delta));
                                  if (next === cur) return;
                                  setOfferedQuantities((prev) => ({ ...prev, [item.id]: next }));
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {offeredCatalogItems.map((item, i) => (
                              <MiniCardListItem
                                key={item.id}
                                item={item}
                                selected={selectedOfferedIds.includes(item.id)}
                                onClick={() => toggleOfferedItem(item)}
                                delayIdx={offeredInventoryItems.length + i}
                                selectedQty={offeredQuantities[item.id]}
                                maxQty={item.qty}
                                onQtyChange={(delta) => {
                                  const cur = offeredQuantities[item.id] ?? 1;
                                  const next = Math.max(1, Math.min(item.qty ?? 1, cur + delta));
                                  if (next === cur) return;
                                  setOfferedQuantities((prev) => ({ ...prev, [item.id]: next }));
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null)}

                {loadingSearch && (
                  <div className="flex items-center gap-2 py-3 text-xs text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF7300]" />
                    {t('scambi.modal.searchingCatalog')}
                  </div>
                )}

                {searchError && (
                  <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                    {searchError}
                  </div>
                )}

                {offeredInventoryItems.length === 0 && offeredCatalogItems.length === 0 && !loadingInventory && !loadingSearch && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-600">{t('scambi.modal.noCardsFound')}</p>
                    <p className="text-[11px] text-gray-400">{t('scambi.modal.noCardsFoundHint')}</p>
                  </div>
                )}
              </div>

              {/* Bottom bar */}
              <div className="animate-fade-in-up flex flex-wrap items-end gap-4 border-t border-gray-200/60 bg-white/90 px-5 py-4 backdrop-blur-md" style={{ animationDelay: '200ms' }}>
                <div className="flex flex-1 flex-wrap items-end gap-4">
                  <CreditField value={offeredCredits} onChange={handleOfferedCreditsChange} label={t('scambi.modal.offerCreditsLabel')} disabled={requestedCredits > 0} />
                  <CreditField value={requestedCredits} onChange={handleRequestedCreditsChange} label={t('scambi.modal.requestCreditsLabel')} disabled={offeredCredits > 0} />
                  <SelectedBadge count={selectedOfferedIds.length} items={Object.values(offeredItemData)} quantities={offeredQuantities} />
                </div>
                <SubmitButton onClick={() => setConfirmOpen(true)}>{t('scambi.modal.sendProposal')}</SubmitButton>
              </div>
            </div>
          </div>
        </div>

        {confirmOpen && (
          <TradeConfirmOverlay
            t={t}
            offeredSummary={offeredSummary}
            offeredCredits={offeredCredits}
            receivedSummary={targetCardSummary}
            requestedCredits={requestedCredits}
            onBack={() => setConfirmOpen(false)}
            onConfirm={confirmAndSend}
          />
        )}
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
        className="animate-backdrop-enter absolute inset-0 bg-[#0F172A]/75 backdrop-blur-md"
        aria-label={t('common.close')}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="animate-modal-enter relative z-[201] flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none bg-[#F8F7F4] shadow-2xl shadow-black/25 sm:h-auto sm:max-h-[90dvh] sm:rounded-[28px]"
      >
        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between overflow-hidden bg-gradient-to-r from-[#1D3160] via-[#2A3F73] to-[#1D3160] px-5 py-4 sm:px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner backdrop-blur-sm">
              <ScambiIcon className="h-5 w-5 text-[#FF7300]" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white drop-shadow-sm">{t('scambi.modal.counterTitle')}</h2>
              <p className="text-[11px] font-medium text-white/70">{t('scambi.modal.counterSubtitle', { seller: scambio.seller })}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left — their proposal */}
          <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200/60 bg-gradient-to-b from-white to-[#F8F7F4] p-5 lg:w-80 lg:border-b-0 lg:border-r lg:border-gray-200/60">
            <div className="animate-fade-in-up flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-400">
              <Sparkles className="h-3.5 w-3.5 text-[#FF7300]" />
              {t('scambi.modal.theirProposal')}
            </div>

            <div className="animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center gap-3">
                <div className="card-shine-wrapper relative h-24 w-16 shrink-0 overflow-hidden rounded-xl shadow-md shadow-black/10 ring-1 ring-black/5">
                  <Image src={scambio.image} alt={scambio.title} fill unoptimized className="object-cover" sizes="64px" priority />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black uppercase text-[#1D3160]">{scambio.title}</p>
                  <div className="mt-1"><ConditionBadge condition={scambio.condition as ConditionCode} /></div>
                </div>
              </div>
            </div>

            <div className="animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm" style={{ animationDelay: '100ms' }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">{t('scambi.modal.offers')}</p>
                {mockAProposal.offeredCredits > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FF7300]/10 px-2 py-0.5 text-[10px] font-black text-[#FF7300]">
                    <Coins className="h-3 w-3" /> +{mockAProposal.offeredCredits}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {mockAProposal.offeredCards.map((item, i) => (
                  <div key={item.id} className="card-shine-wrapper relative h-20 w-14 overflow-hidden rounded-xl shadow-md shadow-black/10 transition-transform duration-200 hover:scale-105" style={{ animationDelay: `${120 + i * 50}ms` }}>
                    <Image src={item.image} alt={item.name} fill unoptimized className="object-cover" sizes="56px" />
                  </div>
                ))}
              </div>
            </div>

            {mockAProposal.message && (
              <div className="animate-fade-in-up rounded-2xl border-l-4 border-[#FF7300] bg-gradient-to-r from-orange-50 to-white px-4 py-3 shadow-sm" style={{ animationDelay: '140ms' }}>
                <p className="text-[12px] font-medium italic leading-relaxed text-gray-700">&ldquo;{mockAProposal.message}&rdquo;</p>
              </div>
            )}

            <div className="animate-fade-in-up flex items-center gap-2" style={{ animationDelay: '160ms' }}>
              <span className="text-[11px] font-semibold text-gray-500">{t('scambi.modal.proposalModeLabel')}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black shadow-sm ${mockAProposal.isRealtime ? 'bg-[#FF7300] text-white shadow-orange-500/25' : 'bg-gray-100 text-gray-600'}`}>
                {mockAProposal.isRealtime ? <Zap className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {mockAProposal.isRealtime ? t('scambi.modal.modeRealtime') : t('scambi.modal.modeAsync')}
              </span>
            </div>

            <div className="animate-fade-in-up mt-auto space-y-2.5" style={{ animationDelay: '180ms' }}>
              <button
                type="button"
                onClick={handleAccept}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <Check className="h-4 w-4" /> {t('scambi.modal.acceptTrade')}
              </button>
              <button
                type="button"
                onClick={() => setCounterEditing(true)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-xs font-black uppercase tracking-wide transition-all duration-200 active:scale-[0.98] ${
                  counterEditing
                    ? 'border-[#FF7300] bg-gradient-to-r from-orange-50 to-orange-100/30 text-[#FF7300] shadow-md shadow-orange-500/15'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                {t('scambi.modal.editProposal')}
              </button>
            </div>
          </div>

          {/* Right — your counter */}
          <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${!counterEditing ? 'hidden lg:flex' : ''}`}>
            {!counterEditing ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
                <div className="animate-fade-in-up flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 shadow-inner">
                  <Send className="h-6 w-6 text-gray-400" />
                </div>
                <p className="animate-fade-in-up text-sm font-bold text-gray-700" style={{ animationDelay: '80ms' }}>
                  {t('scambi.modal.counterPrompt')}
                </p>
                <p className="animate-fade-in-up max-w-xs text-[12px] text-gray-500" style={{ animationDelay: '120ms' }}>
                  {t('scambi.modal.counterPromptHint')}
                </p>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="animate-fade-in-up flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/60 bg-white/80 px-5 py-3 backdrop-blur-sm" style={{ animationDelay: '40ms' }}>
                  <span className="text-sm font-black uppercase tracking-tight text-[#1D3160]">{t('scambi.modal.requestSectionTitle')}</span>
                  <div className="flex items-center gap-2">
                    <AuctionViewToggle
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      listLabel={t('auctions.viewList')}
                      gridLabel={t('auctions.viewGrid')}
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                  <div className="mb-4" style={{ animationDelay: '60ms' }}>
                    <SearchBar
                      query={searchQuery}
                      onChange={setSearchQuery}
                      placeholder={t('scambi.modal.searchRequestPlaceholder', { seller: scambio.seller })}
                    />
                  </div>

                  {requestedInventoryItems.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-500">
                        <Package className="h-3.5 w-3.5" />
                        {t('scambi.modal.availableFromSeller', { seller: scambio.seller })}
                      </div>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                          {requestedInventoryItems.map((item, i) => (
                            <MiniCard
                              key={item.id}
                              item={item}
                              selected={selectedRequestedIds.includes(item.id)}
                              onClick={() => toggleRequestedItem(item)}
                              delayIdx={i}
                              selectedQty={requestedQuantities[item.id]}
                              maxQty={item.qty}
                              onQtyChange={(delta) => {
                                const cur = requestedQuantities[item.id] ?? 1;
                                const next = Math.max(1, Math.min(item.qty ?? 1, cur + delta));
                                if (next === cur) return;
                                setRequestedQuantities((prev) => ({ ...prev, [item.id]: next }));
                              }}
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
                              selectedQty={requestedQuantities[item.id]}
                              maxQty={item.qty}
                              onQtyChange={(delta) => {
                                const cur = requestedQuantities[item.id] ?? 1;
                                const next = Math.max(1, Math.min(item.qty ?? 1, cur + delta));
                                if (next === cur) return;
                                setRequestedQuantities((prev) => ({ ...prev, [item.id]: next }));
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {requestedCatalogItems.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-500">
                        <Library className="h-3.5 w-3.5" />
                        {t('scambi.modal.fromCatalog')}
                      </div>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                          {requestedCatalogItems.map((item, i) => (
                            <MiniCard
                              key={item.id}
                              item={item}
                              selected={selectedRequestedIds.includes(item.id)}
                              onClick={() => toggleRequestedItem(item)}
                              delayIdx={requestedInventoryItems.length + i}
                              selectedQty={requestedQuantities[item.id]}
                              maxQty={item.qty}
                              onQtyChange={(delta) => {
                                const cur = requestedQuantities[item.id] ?? 1;
                                const next = Math.max(1, Math.min(item.qty ?? 1, cur + delta));
                                if (next === cur) return;
                                setRequestedQuantities((prev) => ({ ...prev, [item.id]: next }));
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {requestedCatalogItems.map((item, i) => (
                            <MiniCardListItem
                              key={item.id}
                              item={item}
                              selected={selectedRequestedIds.includes(item.id)}
                              onClick={() => toggleRequestedItem(item)}
                              delayIdx={requestedInventoryItems.length + i}
                              selectedQty={requestedQuantities[item.id]}
                              maxQty={item.qty}
                              onQtyChange={(delta) => {
                                const cur = requestedQuantities[item.id] ?? 1;
                                const next = Math.max(1, Math.min(item.qty ?? 1, cur + delta));
                                if (next === cur) return;
                                setRequestedQuantities((prev) => ({ ...prev, [item.id]: next }));
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {loadingSearch && (
                    <div className="flex items-center gap-2 py-3 text-xs text-gray-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF7300]" />
                      {t('scambi.modal.searchingCatalog')}
                    </div>
                  )}

                  {searchError && (
                    <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                      {searchError}
                    </div>
                  )}

                  {requestedInventoryItems.length === 0 && requestedCatalogItems.length === 0 && !loadingSearch && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-gray-600">{t('scambi.modal.noCardsFound')}</p>
                      <p className="text-[11px] text-gray-400">{t('scambi.modal.noCardsFoundHint')}</p>
                    </div>
                  )}
                </div>

                {/* Bottom bar */}
                <div className="animate-fade-in-up flex flex-wrap items-end gap-4 border-t border-gray-200/60 bg-white/90 px-5 py-4 backdrop-blur-md" style={{ animationDelay: '200ms' }}>
                  <div className="flex flex-1 flex-wrap items-end gap-4">
                    <CreditField value={offeredCredits} onChange={handleOfferedCreditsChange} label={t('scambi.modal.offerCreditsLabel')} disabled={requestedCredits > 0} />
                    <CreditField value={requestedCredits} onChange={handleRequestedCreditsChange} label={t('scambi.modal.requestCreditsLabel')} disabled={offeredCredits > 0} />
                    <SelectedBadge count={selectedRequestedIds.length} items={Object.values(requestedItemData)} quantities={requestedQuantities} />
                  </div>
                  <SubmitButton onClick={() => setConfirmOpen(true)}>{t('scambi.modal.sendCounter')}</SubmitButton>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <TradeConfirmOverlay
          t={t}
          offeredSummary={offeredSummary}
          offeredCredits={offeredCredits}
          receivedSummary={requestedSummary}
          requestedCredits={requestedCredits}
          onBack={() => setConfirmOpen(false)}
          onConfirm={confirmAndSend}
        />
      )}
    </div>
  );
}
