'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  FileJson,
  FileSpreadsheet,
  Flame,
  Library,
  PenLine,
  Sparkles,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { syncClient } from '@/lib/api/sync-client';
import type { InventoryItemResponse, SyncStatusResponse } from '@/lib/api/sync-client';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { isDemoEbartexListing } from '@/lib/sync/inventory-types';
import { mapListingResponseToInventoryItem } from '@/lib/marketplace/listing-map';
import { getMyListings } from '@/lib/api/marketplace-client';
import {
  deleteInventoryOrListing,
  updateInventoryOrListing,
  updateInventoryOrListingQuantity,
} from '@/lib/inventory/inventory-item-mutations';
import { DemoListingBadge } from '@/components/feature/sync/DemoListingBadge';
import {
  InventoryEditModal,
  INVENTORY_CONDITION_OPTIONS,
  INVENTORY_LANG_OPTIONS_EDIT,
} from '@/components/feature/sync/InventoryEditModal';
import { fetchCardsByBlueprintIds } from '@/lib/meilisearch-cards-by-ids';
import type { BlueprintToCardMap } from '@/lib/meilisearch-cards-by-ids';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { ASSETS, getCdnImageUrl } from '@/lib/config';
import { InventoryFiltersPanel, DEFAULT_FILTERS } from '@/components/feature/account/InventoryFiltersPanel';
import type { InventoryFilters } from '@/components/feature/account/InventoryFiltersPanel';
import { InventorySearchBar } from '@/components/feature/account/InventorySearchBar';
import { InventorySortBar } from '@/components/feature/account/InventorySortBar';
import { useInventorySearchInput } from '@/lib/hooks/useInventorySearchInput';
import { useMobileViewport } from '@/lib/hooks/useMobileViewport';
import { useHeaderStickyOffset } from '@/lib/hooks/useHeaderStickyOffset';
import {
  applyInventoryFilters,
  buildInventoryFacets,
  getInventoryConditionCode,
  getInventoryLanguageLabel,
  sanitizeInventoryFilters,
} from '@/lib/inventory/inventory-filter-utils';
import { CardLanguageFlag } from '@/components/ui/CardLanguageFlag';
import { RarityIndicator } from '@/components/ui/RarityIndicator';
import { RarityLegendProvider } from '@/components/ui/RarityLegendProvider';
import { SetIconBadge } from '@/components/ui/SetIconBadge';
import { CardArtStripHoverPreview } from '@/components/ui/CardArtStripHoverPreview';
import { buildSetPageUrl, resolveSetPageGameSlug } from '@/lib/search/set-page-url';
import { formatEuroNoSpace } from '@/lib/utils';
import { BulkPriceWizardModal } from '@/components/feature/account/BulkPriceWizardModal';
import { BulkDeleteModal } from '@/components/feature/account/BulkDeleteModal';
import { OggettiMobileList } from '@/components/feature/account/OggettiMobileList';
import { InventoryMobileQuickBar } from '@/components/feature/account/InventoryMobileQuickBar';

function buildImageUrl(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('http')) return trimmed;
  const path = trimmed.replace(/^\/img\//, '').replace(/^img\//, '');
  if (!path) return null;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return ASSETS.cdnUrl ? `${ASSETS.cdnUrl}${withSlash}` : withSlash;
}

const DEFAULT_IMAGE = getCdnImageUrl('Logo%20Principale%20EBARTEX.png');

function formatPrice(priceCents: number | null | undefined): string {
  const cents = priceCents ?? 0;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const LOW_STOCK_THRESHOLD = 5;

/** Righe massime renderizzate per pagina (performance UI). */
const INVENTORY_ITEMS_PER_PAGE = 50;
/** Chunk API inventario (solo dati grezzi, senza catalogo). */
const INVENTORY_API_CHUNK = 200;
/** Batch Meilisearch per arricchire le carte. */
const CATALOG_FETCH_BATCH = 80;

async function fetchCatalogBatched(blueprintIds: number[]): Promise<BlueprintToCardMap> {
  const unique = [...new Set(blueprintIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (unique.length === 0) return {};
  const map: BlueprintToCardMap = {};
  for (let i = 0; i < unique.length; i += CATALOG_FETCH_BATCH) {
    const batch = unique.slice(i, i + CATALOG_FETCH_BATCH);
    const fetched = await fetchCardsByBlueprintIds(batch);
    Object.assign(map, fetched);
  }
  return map;
}

/** Oggetto serializzabile per export CSV/JSON (tutti i campi utili, niente riferimenti circolari). */
function itemToExportRow(item: InventoryItemWithCatalog): Record<string, unknown> {
  const props = (item.properties as Record<string, unknown>) || {};
  return {
    id: item.id,
    blueprint_id: item.blueprint_id,
    quantity: item.quantity,
    price_cents: item.price_cents,
    price_eur: (item.price_cents ?? 0) / 100,
    condition: props.condition ?? '',
    mtg_language: props.mtg_language ?? '',
    description: item.description ?? '',
    graded: item.graded ?? false,
    external_stock_id: item.external_stock_id ?? '',
    updated_at: item.updated_at ?? '',
    created_at: (item as { created_at?: string }).created_at ?? '',
    // Da catalogo (solo lettura)
    name: item.card?.name ?? '',
    set_name: item.card?.set_name ?? '',
    rarity: item.card?.rarity ?? '',
    collector_number: item.card?.collector_number ?? '',
    game_slug: item.card?.game_slug ?? '',
    card_id: item.card?.id ?? '',
  };
}

function escapeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type OggettiViewMode = 'table' | 'cards';

function OggettiTable({
  items,
  buildImageUrl,
  defaultImage,
  userId,
  accessToken,
  onRefresh,
  onSyncResult,
  onSyncPending,
  syncEnabled,
  mutationsDisabled,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  allFilteredSelected,
  onDeleteSelected,
  bulkDeleting,
  viewMode = 'table',
  isMobile = false,
  t,
}: {
  items: InventoryItemWithCatalog[];
  buildImageUrl: (raw: string | null | undefined) => string | null;
  defaultImage: string;
  userId: string;
  accessToken: string;
  onRefresh: () => Promise<void>;
  onSyncResult: (result: { success: boolean; message?: string }) => void;
  onSyncPending?: () => void;
  syncEnabled: boolean;
  mutationsDisabled?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  allFilteredSelected?: boolean;
  onDeleteSelected?: (ids: number[]) => void;
  bulkDeleting?: boolean;
  viewMode?: OggettiViewMode;
  isMobile?: boolean;
  t: (key: import('@/lib/i18n/messages/en').MessageKey, vars?: Record<string, string | number>) => string;
}) {
  const router = useRouter();
  const { selectedLang } = useLanguage();
  const [editItem, setEditItem] = useState<InventoryItemWithCatalog | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [qtyUpdatingId, setQtyUpdatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectionMode = selectedIds != null && onToggleSelect != null;
  const allSelected =
    selectionMode &&
    (allFilteredSelected ??
      (items.length > 0 && items.every((i) => selectedIds!.has(i.id))));

  /** Poll sync task until ready, then report success/error. No blocking UI. */
  const pollSyncTaskThenNotify = useCallback(
    async (taskId: string) => {
      onSyncPending?.();
      const maxPolls = 60;
      const intervalMs = 1500;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((r) => setTimeout(r, intervalMs));
        try {
          const status = await syncClient.getTaskStatus(taskId, accessToken);
          if (status.ready) {
            if (status.error) {
              onSyncResult({
                success: false,
                message: typeof status.error === 'string' ? status.error : status.message ?? 'Sincronizzazione fallita',
              });
            } else {
              onSyncResult({ success: true });
            }
            await onRefresh();
            return;
          }
        } catch {
          // keep polling on transient errors
        }
      }
      onSyncResult({ success: false, message: 'Timeout: sincronizzazione non completata' });
    },
    [accessToken, onRefresh, onSyncResult, onSyncPending]
  );

  const handleDelete = async (item: InventoryItemWithCatalog) => {
    const confirmMsg = isDemoEbartexListing(item)
      ? t('accountPage.itemsDeleteDemoConfirm')
      : 'Eliminare questo oggetto dall\'inventario? Se la sincronizzazione esterna è attiva, la rimozione verrà inviata anche lì.';
    if (!confirm(confirmMsg)) return;
    setActionError(null);
    setDeletingId(item.id);
    try {
      const res = await deleteInventoryOrListing(userId, item, accessToken);
      await onRefresh();
      if (res.sync_queue_error) {
        onSyncResult({ success: false, message: res.sync_queue_error });
      } else if (res.sync_task_id) {
        onSyncResult({ success: true, message: 'Aggiornamento marketplace in coda. Attendi il completamento task.' });
        pollSyncTaskThenNotify(res.sync_task_id);
      } else {
        onSyncResult({ success: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore durante l\'eliminazione';
      setActionError(msg);
      onSyncResult({ success: false, message: msg });
    } finally {
      setDeletingId(null);
    }
  };

  const handleQtyDelta = async (item: InventoryItemWithCatalog, delta: -1 | 1) => {
    if (mutationsDisabled) return;
    setActionError(null);
    setQtyUpdatingId(item.id);
    try {
      if (delta === -1 && item.quantity <= 1) {
        const confirmMsg = isDemoEbartexListing(item)
          ? t('accountPage.itemsDeleteDemoConfirm')
          : 'Rimuovere questo oggetto dall\'inventario? Se la sincronizzazione esterna è attiva, verrà aggiornata anche lì.';
        if (!confirm(confirmMsg)) {
          return;
        }
        const res = await deleteInventoryOrListing(userId, item, accessToken);
        await onRefresh();
        if (res.sync_queue_error) {
          onSyncResult({ success: false, message: res.sync_queue_error });
        } else if (res.sync_task_id) {
          onSyncResult({
            success: true,
            message: 'Aggiornamento marketplace in coda. Attendi il completamento task.',
          });
          pollSyncTaskThenNotify(res.sync_task_id);
        } else {
          onSyncResult({ success: true });
        }
      } else {
        const nextQty = Math.max(0, item.quantity + delta);
        if (nextQty < 1) return;
        const res = await updateInventoryOrListingQuantity(userId, item, accessToken, nextQty);
        await onRefresh();
        if (res.sync_queue_error) {
          onSyncResult({ success: false, message: res.sync_queue_error });
        } else if (res.sync_task_id) {
          onSyncResult({
            success: true,
            message: 'Aggiornamento marketplace in coda. Attendi il completamento task.',
          });
          pollSyncTaskThenNotify(res.sync_task_id);
        } else {
          onSyncResult({ success: true });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Operazione non riuscita';
      setActionError(msg);
      onSyncResult({ success: false, message: msg });
    } finally {
      setQtyUpdatingId(null);
    }
  };

  const handleEditSubmit = async (form: {
    quantity: number;
    price_cents: number;
    condition: string;
    mtg_language: string;
    description: string;
    graded: boolean;
    signed?: boolean;
    altered?: boolean;
    mtg_foil?: boolean;
  }) => {
    if (!editItem) return;
    setActionError(null);
    setSaving(true);
    try {
      const properties: Record<string, unknown> = {
        ...(editItem.properties as Record<string, unknown> | undefined),
        condition: form.condition || undefined,
        mtg_language: form.mtg_language || undefined,
        signed: form.signed ?? (editItem.properties && (editItem.properties as Record<string, unknown>).signed),
        altered: form.altered ?? (editItem.properties && (editItem.properties as Record<string, unknown>).altered),
        mtg_foil: form.mtg_foil ?? (editItem.properties && (editItem.properties as Record<string, unknown>).mtg_foil),
      };
      const res = await updateInventoryOrListing(userId, editItem, accessToken, {
        quantity: form.quantity,
        price_cents: form.price_cents,
        condition: form.condition,
        mtg_language: form.mtg_language,
        description: form.description,
        graded: form.graded,
        properties,
      });
      setEditItem(null);
      await onRefresh();
      if (res.sync_queue_error) {
        onSyncResult({ success: false, message: res.sync_queue_error });
      } else if (res.sync_task_id) {
        onSyncResult({ success: true, message: 'Aggiornamento marketplace in coda. Attendi il completamento task.' });
        pollSyncTaskThenNotify(res.sync_task_id);
      } else {
        onSyncResult({ success: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore durante il salvataggio';
      setActionError(msg);
      onSyncResult({ success: false, message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (isMobile) {
    return (
      <RarityLegendProvider>
        <div className="w-full max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <OggettiMobileList
            items={items}
            buildImageUrl={buildImageUrl}
            defaultImage={defaultImage}
            selectedLang={selectedLang}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            selectionMode={selectionMode}
            mutationsDisabled={mutationsDisabled}
            deletingId={deletingId}
            qtyUpdatingId={qtyUpdatingId}
            onEdit={setEditItem}
            onDelete={handleDelete}
            onQtyDelta={handleQtyDelta}
            t={t}
          />
        </div>
        {actionError && (
          <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}
        {editItem && (
          <InventoryEditModal
            item={editItem}
            onClose={() => {
              setEditItem(null);
              setActionError(null);
            }}
            onSubmit={handleEditSubmit}
            saving={saving}
            conditionOptions={INVENTORY_CONDITION_OPTIONS}
            langOptions={INVENTORY_LANG_OPTIONS_EDIT}
          />
        )}
      </RarityLegendProvider>
    );
  }

  if (viewMode === 'cards') {
    return (
      <RarityLegendProvider>
      <div className="hidden grid-cols-2 gap-5 md:grid lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5">
        {items.map((item) => {
          const imgUrl = item.card?.image
            ? buildImageUrl(item.card.image) || defaultImage
            : defaultImage;
          const languageCode =
            item.properties && typeof item.properties.mtg_language === 'string'
              ? item.properties.mtg_language
              : null;
          const conditionCode = getInventoryConditionCode(
            item.properties?.condition as string | undefined
          );
          const displayNames: { primary: string; secondary: string | null } = item.card
            ? getCardDisplayNames(
                { name: item.card.name ?? '', keywords_localized: item.card.keywords_localized },
                selectedLang
              )
            : { primary: `Carta #${item.blueprint_id}`, secondary: null };
          const namePrimary = (displayNames.primary || item.card?.name) ?? `Carta #${item.blueprint_id}`;
          const isPopular = false;
          const isTrending = false;
          const hasFoil = item.properties?.mtg_foil === true;
          const isSigned = item.properties?.signed === true;
          const isGraded = item.graded === true;

          return (
            <div
              key={item.id}
              className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white/60 backdrop-blur-sm transition-all duration-200 md:rounded-2xl ${
                selectedIds?.has(item.id)
                  ? 'border-primary shadow-[0_0_0_2px_rgba(255,115,0,0.3)]'
                  : 'border-white/60 hover:border-primary/50'
              }`}
            >
              {/* Card Header - Badges & Checkbox */}
              <div className="relative">
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-white">
                  <Image
                    src={imgUrl}
                    alt={namePrimary}
                    fill
                    className="object-contain p-2 md:p-3"
                    sizes="(max-width: 767px) 45vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={imgUrl.startsWith('http') || imgUrl === defaultImage}
                  />
                  
                  {/* Card Frame Overlay for MTG feel */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-x-2 top-2 bottom-2 rounded-xl border-2 border-white/40" />
                  </div>

                  {/* Selection Checkbox - Top Left */}
                  {selectionMode && (
                    <button
                      type="button"
                      onClick={() => onToggleSelect?.(item.id)}
                      className={`absolute left-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-xl shadow-md backdrop-blur-sm transition-all md:left-3 md:top-3 md:h-auto md:w-auto md:rounded-lg md:p-2 ${
                        selectedIds!.has(item.id) 
                          ? 'bg-primary text-white' 
                          : 'bg-white/90 text-gray-400 hover:text-primary'
                      }`}
                    >
                      {selectedIds!.has(item.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {/* Quick Stats Badges - Top Right - Glass Effect */}
                  <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
                    {isPopular && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-primary border border-primary/30 shadow-sm">
                        <Flame className="h-3 w-3" />
                        {t('accountPage.itemsBadgeHot')}
                      </span>
                    )}
                    {isTrending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-500/30 shadow-sm">
                        <TrendingUp className="h-3 w-3" />
                        {t('accountPage.itemsBadgeTop')}
                      </span>
                    )}
                  </div>

                  {/* Special Tags - Bottom Left on Image - Glass Effect */}
                  <div className="absolute left-3 bottom-3 z-10 flex flex-wrap gap-1.5">
                    {hasFoil && (
                      <span className="rounded-full bg-amber-500/20 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-500/30 shadow-sm">
                        ✨ {t('accountPage.itemsBadgeFoil')}
                      </span>
                    )}
                    {isSigned && (
                      <span className="rounded-full bg-purple-500/20 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 border border-purple-500/30 shadow-sm">
                        ✍️ {t('accountPage.itemsBadgeSigned')}
                      </span>
                    )}
                    {isGraded && (
                      <span className="rounded-full bg-blue-500/20 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-500/30 shadow-sm">
                        📋 {t('accountPage.itemsBadgeGraded')}
                      </span>
                    )}
                    {isDemoEbartexListing(item) && <DemoListingBadge />}
                  </div>

                  {/* Azioni rapide: sempre visibili su mobile, hover su desktop */}
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2 pt-6 opacity-100 translate-y-0 transition-all duration-300 md:p-3 md:pt-8 md:opacity-0 md:translate-y-full md:group-hover:opacity-100 md:group-hover:translate-y-0">
                    <button
                      type="button"
                      onClick={() => setEditItem(item)}
                      disabled={mutationsDisabled}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-xs font-semibold text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary hover:text-white active:scale-95 disabled:opacity-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {t('accountPage.itemsEdit')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex flex-1 flex-col p-2.5 md:p-4">
                {/* Card Name */}
                <div className="mb-1.5 md:mb-2">
                  <h3 className="line-clamp-2 text-sm font-bold leading-tight text-gray-900 md:line-clamp-1 md:text-base">
                    {namePrimary}
                  </h3>
                  {displayNames.secondary && (
                    <p className="mt-0.5 hidden text-xs text-gray-500 line-clamp-1 md:block">{displayNames.secondary}</p>
                  )}
                </div>

                {/* Set Name with Icon */}
                <div className="mb-2 hidden items-center gap-1.5 text-xs text-gray-500 md:mb-3 md:flex">
                  <Library className="h-3 w-3 shrink-0 text-gray-400" />
                  <span className="truncate font-medium">{item.card?.set_name || '—'}</span>
                </div>

                {/* Stats Row - Condition, Language, Rarity */}
                <div className="mb-2 flex flex-wrap items-center gap-1 md:mb-3 md:gap-2">
                  {conditionCode ? (
                    <ConditionBadge condition={conditionCode} size="sm" />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                  {languageCode && (
                    <CardLanguageFlag
                      code={languageCode}
                      size="xs"
                      title={getInventoryLanguageLabel(languageCode)}
                    />
                  )}
                  {item.card?.rarity && (
                    <RarityIndicator
                      rarity={item.card.rarity}
                      size="sm"
                      showLabel
                      className="max-md:[&_span:last-child]:hidden"
                    />
                  )}
                </div>

                {/* Price & Quantity Footer */}
                <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-2 md:items-center md:pt-3">
                  <div className="flex flex-col">
                    <span className="hidden text-xs text-gray-400 md:inline">{t('accountPage.itemsTablePrice')}</span>
                    <span className="text-base font-bold tabular-nums text-primary md:text-lg">
                      {(item.price_cents / 100).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="hidden text-xs text-gray-400 md:inline">{t('accountPage.itemsTableQty')}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={mutationsDisabled || qtyUpdatingId === item.id || deletingId === item.id}
                        onClick={() => handleQtyDelta(item, -1)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 active:scale-95 disabled:opacity-50 md:h-7 md:w-7 md:rounded-md"
                        aria-label="Diminuisci quantità"
                      >
                        {qtyUpdatingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={
                          mutationsDisabled ||
                          qtyUpdatingId === item.id ||
                          deletingId === item.id ||
                          item.quantity >= 999
                        }
                        onClick={() => handleQtyDelta(item, 1)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 md:h-7 md:w-7 md:rounded-md"
                        aria-label="Aumenta quantità"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Button - Floating - Glass Effect */}
              <button
                type="button"
                onClick={() => handleDelete(item)}
                disabled={mutationsDisabled || deletingId === item.id}
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200/50 bg-white/80 text-gray-400 opacity-100 shadow-md backdrop-blur-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95 md:right-3 md:top-[50%] md:translate-y-[-50%] md:p-2 md:opacity-0 md:group-hover:opacity-100"
                title={t('accountPage.itemsDelete')}
                aria-label={t('accountPage.itemsDelete')}
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      </RarityLegendProvider>
    );
  }

  return (
    <RarityLegendProvider>
    <div className="hidden max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
      <div className="max-w-full overflow-x-auto">
        <table className="search-results-table w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
          <colgroup>
            {selectionMode && <col style={{ width: '2.5rem' }} />}
            <col style={{ width: '36%' }} />
            <col style={{ width: '4.5rem' }} />
            <col style={{ width: '5.5rem' }} />
            <col style={{ width: '4rem' }} />
            <col style={{ width: '4rem' }} />
            <col style={{ width: '8.5rem' }} />
            <col style={{ width: '7rem' }} />
            <col style={{ width: '7.5rem' }} />
          </colgroup>
          <thead>
            <tr className="search-results-thead">
              {selectionMode && (
                <th className="search-results-th pl-2 pr-0">
                  <button
                    type="button"
                    onClick={() => (allSelected ? onDeselectAll?.() : onSelectAll?.())}
                    className="inline-flex items-center justify-center rounded p-1 text-white/90 transition-colors hover:bg-white/10"
                    title={allSelected ? t('accountPage.itemsDeselectAll') : t('accountPage.itemsSelectAll')}
                    aria-label={allSelected ? t('accountPage.itemsDeselectAll') : t('accountPage.itemsSelectAll')}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4" aria-hidden />
                    ) : (
                      <Square className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </th>
              )}
              <th className="search-results-th pl-2 pr-3 text-left">{t('accountPage.itemsTableCard')}</th>
              <th className="search-results-th px-1 text-center">{t('accountPage.itemsTableCondShort')}</th>
              <th className="search-results-th px-1 text-center">{t('accountPage.itemsTableLangShort')}</th>
              <th className="search-results-th px-1 text-right">{t('search.thNumber')}</th>
              <th className="search-results-th px-1 text-center">{t('search.thRarity')}</th>
              <th className="search-results-th px-1 text-right">{t('accountPage.itemsTableQty')}</th>
              <th className="search-results-th px-1 text-right">{t('accountPage.itemsTablePrice')}</th>
              <th className="search-results-th px-2 pr-3 text-right">{t('accountPage.itemsTableActions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const imgUrl = item.card?.image
                ? buildImageUrl(item.card.image) || defaultImage
                : defaultImage;
              const languageCode =
                item.properties && typeof item.properties.mtg_language === 'string'
                  ? item.properties.mtg_language
                  : null;
              const conditionCode = getInventoryConditionCode(
                item.properties?.condition as string | undefined
              );
              const displayNames: { primary: string; secondary: string | null } = item.card
                ? getCardDisplayNames(
                    { name: item.card.name ?? '', keywords_localized: item.card.keywords_localized },
                    selectedLang
                  )
                : { primary: `Carta #${item.blueprint_id}`, secondary: null };
              const nameOriginal = displayNames.secondary ?? displayNames.primary;
              const nameTranslation = displayNames.secondary ? displayNames.primary : null;
              const namePrimary = (displayNames.primary || item.card?.name) ?? `Carta #${item.blueprint_id}`;
              const hasFoil = item.properties?.mtg_foil === true;
              const isSigned = item.properties?.signed === true;
              const isGraded = item.graded === true;
              const setName = item.card?.set_name ?? '';
              const setPageGame = resolveSetPageGameSlug(item.card?.game_slug);
              const setPageHref = setName ? buildSetPageUrl(setPageGame, setName) : null;
              const productHref = item.card?.id ? `/products/${item.card.id}` : null;
              const rowNavigable = Boolean(productHref);

              return (
                <tr
                  key={item.id}
                  role={rowNavigable ? 'button' : undefined}
                  tabIndex={rowNavigable ? 0 : undefined}
                  onClick={rowNavigable ? () => router.push(productHref!) : undefined}
                  onKeyDown={
                    rowNavigable
                      ? (e) => {
                          if (e.key === 'Enter') router.push(productHref!);
                        }
                      : undefined
                  }
                  className={`search-result-row border-b border-gray-100/90${rowNavigable ? ' cursor-pointer outline-none' : ''}`}
                >
                  {selectionMode && (
                    <td className="search-results-td pl-2 pr-0 align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect?.(item.id);
                        }}
                        className={`inline-flex items-center justify-center rounded p-1 transition-colors ${
                          selectedIds!.has(item.id)
                            ? 'text-primary'
                            : 'text-gray-400 hover:text-primary'
                        }`}
                        aria-label={selectedIds!.has(item.id) ? 'Deseleziona' : 'Seleziona'}
                      >
                        {selectedIds!.has(item.id) ? (
                          <CheckSquare className="h-4 w-4" aria-hidden />
                        ) : (
                          <Square className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="search-results-td min-w-0 pl-2 pr-3 align-middle">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CardArtStripHoverPreview
                        imageUrl={imgUrl}
                        name={namePrimary}
                        previewSide="right"
                      />
                      {(setPageHref || setName || item.card?.set_code) &&
                        (setPageHref ? (
                          <Link
                            href={setPageHref}
                            title={setName}
                            onClick={(e) => e.stopPropagation()}
                            className="flex shrink-0 items-center justify-center rounded transition-opacity hover:opacity-80 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <SetIconBadge
                              setIconUri={item.card?.set_icon_uri}
                              iconSvgUri={item.card?.icon_svg_uri}
                              setCode={item.card?.set_code}
                              setName={setName}
                              gameSlug={item.card?.game_slug}
                              imageClassName="h-6 w-6 object-contain"
                            />
                          </Link>
                        ) : (
                          <div className="flex shrink-0 items-center justify-center">
                            <SetIconBadge
                              setIconUri={item.card?.set_icon_uri}
                              iconSvgUri={item.card?.icon_svg_uri}
                              setCode={item.card?.set_code}
                              setName={setName}
                              gameSlug={item.card?.game_slug}
                              imageClassName="h-6 w-6 object-contain"
                            />
                          </div>
                        ))}
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[13px] font-semibold leading-tight ${
                            rowNavigable ? 'text-[#1a5fb4]' : 'text-gray-900'
                          }`}
                        >
                          {nameOriginal}
                        </span>
                        {nameTranslation && (
                          <p className="truncate text-[11px] leading-tight text-gray-500">{nameTranslation}</p>
                        )}
                        {setName && (
                          <p className="truncate text-[10px] leading-tight text-gray-400" title={setName}>
                            {setName}
                          </p>
                        )}
                        {isDemoEbartexListing(item) && (
                          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                            <DemoListingBadge />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    className="search-results-td px-1 align-middle text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {conditionCode ? (
                      <div className="flex justify-center">
                        <ConditionBadge condition={conditionCode} size="md" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">–</span>
                    )}
                  </td>
                  <td className="search-results-td px-1 align-middle">
                    <div className="flex items-center justify-center gap-1">
                      {languageCode ? (
                        <CardLanguageFlag
                          code={languageCode}
                          size="xs"
                          title={getInventoryLanguageLabel(languageCode)}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">–</span>
                      )}
                      {hasFoil && (
                        <span title={t('accountPage.itemsBadgeFoil')} className="text-amber-500">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      )}
                      {isSigned && (
                        <span title={t('accountPage.itemsBadgeSigned')} className="text-gray-700">
                          <PenLine className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      )}
                      {isGraded && (
                        <span
                          title={t('accountPage.itemsBadgeGraded')}
                          className="text-[9px] font-bold uppercase text-blue-600"
                        >
                          PSA
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="search-results-td px-1 align-middle text-right text-[11px] tabular-nums text-gray-600">
                    {item.card?.collector_number ?? '–'}
                  </td>
                  <td className="search-results-td px-1 align-middle text-center">
                    <div className="flex justify-center">
                      <RarityIndicator rarity={item.card?.rarity} size="sm" />
                    </div>
                  </td>
                  <td
                    className="search-results-td px-1 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        disabled={
                          mutationsDisabled || qtyUpdatingId === item.id || deletingId === item.id
                        }
                        onClick={() => handleQtyDelta(item, -1)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                        aria-label="Diminuisci quantità"
                      >
                        {qtyUpdatingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="min-w-[1.25rem] text-center text-[13px] font-semibold tabular-nums text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={
                          mutationsDisabled ||
                          qtyUpdatingId === item.id ||
                          deletingId === item.id ||
                          item.quantity >= 999
                        }
                        onClick={() => handleQtyDelta(item, 1)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                        aria-label="Aumenta quantità"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="search-results-td px-1 align-middle text-right text-[13px] font-bold tabular-nums text-[#FF7300]">
                    {formatEuroNoSpace((item.price_cents ?? 0) / 100, 'it-IT')}
                  </td>
                  <td
                    className="search-results-td px-2 pr-3 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditItem(item);
                        }}
                        disabled={mutationsDisabled}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF7300] text-white shadow-md shadow-orange-500/25 transition-all hover:bg-[#e86a00] hover:shadow-lg active:scale-95 disabled:opacity-50"
                        title={t('accountPage.itemsEdit')}
                        aria-label={t('accountPage.itemsEdit')}
                      >
                        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        disabled={mutationsDisabled || deletingId === item.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded bg-red-600 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        title={t('accountPage.itemsDelete')}
                        aria-label={t('accountPage.itemsDelete')}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {actionError && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {editItem && (
        <InventoryEditModal
          item={editItem}
          onClose={() => { setEditItem(null); setActionError(null); }}
          onSubmit={handleEditSubmit}
          saving={saving}
          conditionOptions={INVENTORY_CONDITION_OPTIONS}
          langOptions={INVENTORY_LANG_OPTIONS_EDIT}
        />
      )}
    </div>
    </RarityLegendProvider>
  );
}

/* ---- Custom KPI Icons (stroke-only, orange via currentColor) ---- */
function IconBox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconWallet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path d="M16 11a2 2 0 110 4 2 2 0 010-4z" />
      <path d="M20 7V5a2 2 0 00-2-2H6a2 2 0 00-2 2v2" />
    </svg>
  );
}

function IconCard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="7" y1="15" x2="7.01" y2="15" />
      <line x1="11" y1="15" x2="13" y2="15" />
    </svg>
  );
}

export function OggettiContent() {
  const { t } = useTranslation();
  const isMobile = useMobileViewport();
  const { stickyTopWithGap } = useHeaderStickyOffset();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore(
    (s) => s.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null)
  );

  const [inventoryRaw, setInventoryRaw] = useState<InventoryItemResponse[]>([]);
  const [catalogMap, setCatalogMap] = useState<BlueprintToCardMap>({});
  const [catalogLoading, setCatalogLoading] = useState(false);
  const catalogLoadGenRef = useRef(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncBanner, setSyncBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncNowPending, setSyncNowPending] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_FILTERS);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<OggettiViewMode>('table');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { searchValue, setSearchValue, clearSearch } = useInventorySearchInput(filters, setFilters);

  /** Verifica lato frontend: chiamate al sync service solo se integrazione marketplace attiva. */
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(true);
  
  const syncEnabled =
    Boolean(syncStatus && !syncStatus.disconnected) &&
    (syncStatus?.sync_status === 'active' || syncStatus?.sync_status === 'initial_sync');
  const isDisconnected = syncStatus?.disconnected === true;
  const integrationConnected = Boolean(syncStatus && !isDisconnected);
  const syncAnyPending = syncPending || syncNowPending;
  const canSyncNow = integrationConnected && syncStatus?.sync_status !== 'initial_sync';

  const inventoryItems = useMemo<InventoryItemWithCatalog[]>(
    () =>
      inventoryRaw.map((item) => ({
        ...item,
        card: catalogMap[item.blueprint_id],
      })),
    [inventoryRaw, catalogMap]
  );

  const facets = useMemo(() => buildInventoryFacets(inventoryItems), [inventoryItems]);

  const filteredInventoryItems = useMemo(
    () => applyInventoryFilters(inventoryItems, filters, inventoryItems),
    [inventoryItems, filters]
  );

  useEffect(() => {
    setFilters((prev) => {
      const sanitized = sanitizeInventoryFilters(prev, facets);
      return JSON.stringify(sanitized) === JSON.stringify(prev) ? prev : sanitized;
    });
  }, [facets]);



  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredInventoryItems.length / INVENTORY_ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * INVENTORY_ITEMS_PER_PAGE;
    return filteredInventoryItems.slice(start, start + INVENTORY_ITEMS_PER_PAGE);
  }, [filteredInventoryItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [currentPage, totalPages]);

  const paginatedBlueprintKey = useMemo(
    () => paginatedItems.map((i) => `${i.id}:${i.blueprint_id}`).join(','),
    [paginatedItems]
  );

  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      prevPageRef.current = currentPage;
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage]);

  /** Arricchisce subito le carte della pagina corrente se mancano nel cache. */
  useEffect(() => {
    if (paginatedItems.length === 0) return;
    const missing = [
      ...new Set(
        paginatedItems
          .map((i) => i.blueprint_id)
          .filter((id): id is number => Boolean(id) && !catalogMap[id])
      ),
    ];
    if (missing.length === 0) return;
    let cancelled = false;
    void fetchCatalogBatched(missing).then((fetched) => {
      if (cancelled || Object.keys(fetched).length === 0) return;
      setCatalogMap((prev) => ({ ...prev, ...fetched }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogMap letto per missing; key evita loop
  }, [paginatedBlueprintKey]);


  // 1) Verifica stato sync con il marketplace (una sola chiamata, prima di qualsiasi altra al sync service)
  useEffect(() => {
    if (!user?.id || !accessToken) {
      setSyncStatusLoading(false);
      return;
    }
    let cancelled = false;
    setSyncStatusLoading(true);
    syncClient
      .getSyncStatus(user.id, accessToken)
      .then((res) => {
        if (!cancelled) setSyncStatus(res);
      })
      .catch(() => {
        if (!cancelled) setSyncStatus(null);
      })
      .finally(() => {
        if (!cancelled) setSyncStatusLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id, accessToken]);

  const loadCatalogInBackground = useCallback(async (allItems: InventoryItemResponse[], generation: number) => {
    const allBlueprintIds = [
      ...new Set(allItems.map((i) => i.blueprint_id).filter((id): id is number => Boolean(id))),
    ];
    if (allBlueprintIds.length === 0) return;

    setCatalogLoading(true);
    try {
      const priorityCount = Math.min(INVENTORY_ITEMS_PER_PAGE, allItems.length);
      const priorityIds = [
        ...new Set(
          allItems.slice(0, priorityCount).map((i) => i.blueprint_id).filter((id): id is number => Boolean(id))
        ),
      ];
      const restIds = allBlueprintIds.filter((id) => !priorityIds.includes(id));

      const priorityMap = await fetchCatalogBatched(priorityIds);
      if (catalogLoadGenRef.current !== generation) return;
      setCatalogMap((prev) => ({ ...prev, ...priorityMap }));

      for (let i = 0; i < restIds.length; i += CATALOG_FETCH_BATCH) {
        if (catalogLoadGenRef.current !== generation) return;
        const batch = restIds.slice(i, i + CATALOG_FETCH_BATCH);
        const fetched = await fetchCardsByBlueprintIds(batch);
        if (catalogLoadGenRef.current !== generation) return;
        setCatalogMap((prev) => ({ ...prev, ...fetched }));
      }
    } finally {
      if (catalogLoadGenRef.current === generation) {
        setCatalogLoading(false);
      }
    }
  }, []);

  /** Carica inventario grezzo (veloce); catalogo carte in batch senza bloccare la UI. */
  const loadInventory = useCallback(async () => {
    if (!user?.id || !accessToken) {
      setInventoryRaw([]);
      setCatalogMap({});
      setTotal(0);
      setLoading(false);
      setCatalogLoading(false);
      return;
    }
    const generation = catalogLoadGenRef.current + 1;
    catalogLoadGenRef.current = generation;
    setLoading(true);
    setCatalogMap({});
    setCatalogLoading(false);
    try {
      const allItems: InventoryItemResponse[] = [];
      let offset = 0;
      let totalFromApi = 0;

      do {
        const res = await syncClient.getInventory(user.id, accessToken, INVENTORY_API_CHUNK, offset);
        const items = res.items ?? [];
        totalFromApi = res.total ?? allItems.length + items.length;
        allItems.push(
          ...items.map((item) => ({ ...item, listing_source: 'sync' as const }))
        );
        offset += items.length;
        if (items.length < INVENTORY_API_CHUNK || offset >= totalFromApi) break;
      } while (true);

      let marketplaceRows: InventoryItemWithCatalog[] = [];
      try {
        const mkt = await getMyListings({ page: 1, page_size: 200, status_filter: 'active' });
        marketplaceRows = (mkt.items ?? []).map(mapListingResponseToInventoryItem);
      } catch {
        /* marketplace opzionale */
      }

      const merged = [...allItems, ...marketplaceRows];

      if (catalogLoadGenRef.current !== generation) return;

      setInventoryRaw(merged);
      setTotal(merged.length);
      setError(null);
      setLoading(false);

      void loadCatalogInBackground(merged, generation);
    } catch {
      if (catalogLoadGenRef.current !== generation) return;
      setInventoryRaw([]);
      setCatalogMap({});
      setTotal(0);
      setError(t('accountPage.itemsLoadError'));
      setLoading(false);
      setCatalogLoading(false);
    }
  }, [user?.id, accessToken, t, loadCatalogInBackground]);

  const handleSyncNow = useCallback(async () => {
    if (!user?.id || !accessToken || !syncStatus) return;
    if (isDisconnected) return;

    setSyncNowPending(true);
    setSyncBanner(null);

    const pollTaskUntilReady = async (taskId: string) => {
      const pollIntervalMs = 2500;
      const maxPolls = 240; // ~10 min
      let lastTask: Awaited<ReturnType<typeof syncClient.getTaskStatus>> | null = null;
      for (let polls = 0; polls < maxPolls; polls++) {
        lastTask = await syncClient.getTaskStatus(taskId, accessToken);
        if (lastTask.ready) break;
        await new Promise((r) => setTimeout(r, pollIntervalMs));
      }
      if (!lastTask?.ready) throw new Error(t('accountPage.syncErrTimeout'));
      return lastTask;
    };

    const applyTaskResult = async (
      task: Awaited<ReturnType<typeof syncClient.getTaskStatus>> | null
    ): Promise<void> => {
      const [nextStatus] = await Promise.all([
        syncClient.getSyncStatus(user.id, accessToken).catch(() => syncStatus),
      ]);
      setSyncStatus(nextStatus);
      await loadInventory();

      if (!task) return;

      if (task.status === 'SUCCESS') {
        const r = (task.result ?? {}) as {
          processed?: number;
          total_products?: number;
          created?: number;
          updated?: number;
          skipped?: number;
        };
        const parts: string[] = [];
        if (typeof r.processed === 'number') {
          parts.push(
            `Processati ${r.processed}${typeof r.total_products === 'number' && r.total_products > 0 ? `/${r.total_products}` : ''}`
          );
        }
        if (
          typeof r.created === 'number' ||
          typeof r.updated === 'number' ||
          typeof r.skipped === 'number'
        ) {
          parts.push(`C:${r.created ?? 0} U:${r.updated ?? 0} S:${r.skipped ?? 0}`);
        }
        setSyncBanner({ type: 'success', message: parts.join(' · ') });
      } else {
        const msg =
          (typeof task.error === 'string' && task.error) ||
          task.message ||
          t('accountPage.syncErrFailed');
        setSyncBanner({ type: 'error', message: msg });
      }
    };

    const attachOrRecoverRunningSync = async () => {
      setSyncBanner({ type: 'info', message: 'Sincronizzazione già in corso: mi aggancio al task attivo…' });
      const progressRes = await syncClient.getSyncProgress(user.id, accessToken);
      const opId = progressRes.operation_id;
      if (opId) {
        const task = await pollTaskUntilReady(opId);
        await applyTaskResult(task);
        return;
      }

      // Stato incoerente: backend segnala sync in corso ma non espone operation_id.
      // Proviamo un avvio forzato per riallineare lo stato.
      const forced = await syncClient.startSync(user.id, accessToken, true);
      if (!forced?.task_id) throw new Error(t('accountPage.syncErrStart'));
      const forcedTask = await pollTaskUntilReady(forced.task_id);
      await applyTaskResult(forcedTask);
    };

    try {
      if (syncStatus.sync_status === 'initial_sync') {
        await attachOrRecoverRunningSync();
        return;
      }

      const startRes = await syncClient.startSync(user.id, accessToken);
      const taskId = startRes?.task_id;
      if (!taskId) throw new Error(t('accountPage.syncErrStart'));

      const lastTask = await pollTaskUntilReady(taskId);
      await applyTaskResult(lastTask);
    } catch (e) {
      const errStatus = (e as any)?.status;
      const errMsg = e instanceof Error ? e.message : (e as any)?.message;
      const isConflict =
        errStatus === 409 || (typeof errMsg === 'string' && errMsg.toLowerCase().includes('conflict'));

      if (isConflict) {
        try {
          await attachOrRecoverRunningSync();
        } catch (innerErr: any) {
          const innerMsg = innerErr instanceof Error ? innerErr.message : t('accountPage.syncErrFailed');
          setSyncBanner({ type: 'error', message: innerMsg });
        }
      } else {
        const msg = e instanceof Error ? e.message : t('accountPage.syncErrFailed');
        setSyncBanner({ type: 'error', message: msg });
      }
    } finally {
      setSyncNowPending(false);
    }
  }, [user?.id, accessToken, syncStatus, isDisconnected, loadInventory, t]);

  // 2) Carica inventario sempre (la collezione esiste anche senza sincronizzazione esterna)
  useEffect(() => {
    if (!user?.id || !accessToken) {
      setLoading(false);
      return;
    }
    setError(null);
    void loadInventory();
  }, [user?.id, accessToken, loadInventory]);

  const allFilteredSelected =
    filteredInventoryItems.length > 0 &&
    filteredInventoryItems.every((i) => selectedIds.has(i.id));

  const onToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredInventoryItems.map((i) => i.id)));
  }, [filteredInventoryItems]);

  const onDeselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const onDeleteSelected = useCallback(
    async (ids: number[]) => {
      if (!user?.id || !accessToken || ids.length === 0) return;
      setBulkDeleting(true);
      setBulkDeleteProgress({ current: 0, total: ids.length });
      let successCount = 0;
      let failCount = 0;
      const failedIds: number[] = [];
      try {
        for (let i = 0; i < ids.length; i++) {
          const item = inventoryRaw.find((row) => row.id === ids[i]);
          if (!item) {
            failCount++;
            failedIds.push(ids[i]);
            setBulkDeleteProgress({ current: i + 1, total: ids.length });
            continue;
          }
          try {
            await deleteInventoryOrListing(user.id, item, accessToken);
            successCount++;
          } catch {
            failCount++;
            failedIds.push(ids[i]);
          }
          setBulkDeleteProgress({ current: i + 1, total: ids.length });
        }
        await loadInventory();
        setSelectedIds(new Set(failedIds));
        if (failCount > 0) {
          setToast({
            message: t('accountPage.itemsBulkDeletePartial', { success: successCount, failed: failCount }),
            type: 'error',
          });
          setError(t('accountPage.itemsBulkDeleteError'));
        } else {
          setToast({
            message: t('accountPage.itemsBulkDeleteSuccess', { count: successCount }),
            type: 'success',
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('accountPage.itemsBulkDeleteError');
        setError(msg);
      } finally {
        setBulkDeleting(false);
        setBulkDeleteProgress(null);
      }
    },
    [user?.id, accessToken, inventoryRaw, loadInventory, t]
  );

  const handleBulkPriceApply = useCallback(
    async (
      ids: number[],
      operation: '+' | '-',
      percent: number,
      platform: 'ebartex' | 'all'
    ) => {
      if (!user?.id || !accessToken) return;
      const idSet = new Set(ids);
      const factor = operation === '+' ? 1 + percent / 100 : 1 - percent / 100;

      for (const item of inventoryRaw) {
        if (!idSet.has(item.id)) continue;
        const newPriceCents = Math.round((item.price_cents ?? 0) * factor);
        try {
          await updateInventoryOrListing(user.id, item, accessToken, {
            quantity: item.quantity,
            price_cents: newPriceCents,
            condition: (item.properties?.condition as string) ?? 'near_mint',
            mtg_language: (item.properties?.mtg_language as string) ?? 'en',
            description: item.description ?? '',
            graded: item.graded === true,
            properties: item.properties as Record<string, unknown> | undefined,
          });
        } catch {
          /* continue other rows */
        }
      }

      await loadInventory();

      if (platform === 'all') {
        console.log('TODO: sync price updates to all platforms', ids);
      }
      setToast({
        message: t('accountPage.bulkPriceSuccess', {
          count: ids.length,
          sign: operation === '+' ? '+' : '−',
          pct: percent,
        }),
        type: 'success',
      });
    },
    [user?.id, accessToken, inventoryRaw, loadInventory, t]
  );

  const handleBulkDelete = useCallback(
    async (deleteFromPlatforms: boolean): Promise<void> => {
      if (!user?.id || !accessToken) return;
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      setBulkDeleting(true);
      setBulkDeleteProgress({ current: 0, total: ids.length });
      let successCount = 0;
      let failCount = 0;
      const failedIds: number[] = [];

      try {
        for (let i = 0; i < ids.length; i++) {
          const item = inventoryRaw.find((row) => row.id === ids[i]);
          if (!item) {
            failCount++;
            failedIds.push(ids[i]);
            setBulkDeleteProgress({ current: i + 1, total: ids.length });
            continue;
          }
          try {
            await deleteInventoryOrListing(user.id, item, accessToken);
            successCount++;
          } catch {
            failCount++;
            failedIds.push(ids[i]);
          }
          setBulkDeleteProgress({ current: i + 1, total: ids.length });
        }

        if (deleteFromPlatforms) {
          console.log('TODO: delete from external platforms', ids);
        }

        await loadInventory();
        setSelectedIds(new Set(failedIds));

        if (failCount > 0) {
          setToast({
            message: t('accountPage.itemsBulkDeletePartial', { success: successCount, failed: failCount }),
            type: 'error',
          });
          setError(t('accountPage.itemsBulkDeleteError'));
        } else {
          setToast({
            message: t('accountPage.itemsBulkDeleteSuccess', { count: successCount }),
            type: 'success',
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('accountPage.itemsBulkDeleteError');
        setError(msg);
      } finally {
        setBulkDeleting(false);
        setBulkDeleteProgress(null);
      }
    },
    [user?.id, accessToken, selectedIds, inventoryRaw, loadInventory, t]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  /** Export selezione in CSV. */
  const handleExportSelectionCSV = useCallback(() => {
    const selectedItems = filteredInventoryItems.filter(item => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;
    
    const rows = selectedItems.map(itemToExportRow);
    const headers = Object.keys(rows[0] as object);
    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => headers.map((h) => escapeCsvCell((r as Record<string, unknown>)[h])).join(',')),
    ];
    const csv = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const filename = `selezione-ebartex-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, filename);
  }, [filteredInventoryItems, selectedIds]);

  /** Export in CSV (tutto l'inventario filtrato). */
  const handleExportCSV = useCallback(() => {
    const rows = filteredInventoryItems.map(itemToExportRow);
    if (rows.length === 0) {
      return;
    }
    const headers = Object.keys(rows[0] as object);
    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => headers.map((h) => escapeCsvCell((r as Record<string, unknown>)[h])).join(',')),
    ];
    const csv = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const filename = `collezione-ebartex-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, filename);
    setExportModalOpen(false);
  }, [filteredInventoryItems, setExportModalOpen]);

  /** Export in JSON (solo dati in memoria, nessuna chiamata API). */
  const handleExportJSON = useCallback(() => {
    const data = {
      exported_at: new Date().toISOString(),
      total_items: filteredInventoryItems.length,
      total_quantity: filteredInventoryItems.reduce((s, i) => s + (i.quantity ?? 0), 0),
      items: filteredInventoryItems.map(itemToExportRow),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const filename = `collezione-ebartex-${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(blob, filename);
    setExportModalOpen(false);
  }, [filteredInventoryItems]);

  if (!user || !accessToken) {
    return (
      <div className="text-gray-900">
      <div className="mt-8 flex justify-center">
          <div className="flex w-full max-w-3xl items-center justify-center rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF7300]" />
              <p className="text-sm text-gray-600">{t('accountPage.itemsLoading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeFilterCount = [
    filters.game !== 'all',
    filters.kind !== 'all',
    filters.conditions.length > 0,
    filters.languages.length > 0,
    filters.rarities.length > 0,
    filters.priceMin !== null || filters.priceMax !== null,
    filters.smartFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col items-start gap-0 overflow-x-hidden bg-[#F5F4F0] p-2 md:flex-row md:gap-4 md:p-4 lg:gap-6 lg:p-6">
      <InventoryFiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        itemCount={filteredInventoryItems.length}
        totalCount={inventoryItems.length}
        syncStatus={syncAnyPending ? 'syncing' : syncEnabled ? 'active' : 'inactive'}
        facets={facets}
        disabled={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onClearSearch={clearSearch}
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={setMobileFiltersOpen}
        inventoryItems={inventoryItems}
      />
      <main className="w-full min-w-0 max-w-full flex-1 overflow-x-hidden p-0 md:p-6">
        <div
          className="sticky z-40 mb-2 w-full space-y-2 border-b border-gray-200/70 bg-[#F5F4F0]/95 px-2 pb-2 pt-1.5 backdrop-blur-xl md:hidden"
          style={{ top: stickyTopWithGap }}
        >
          <div className="flex items-center justify-between gap-2">
            <h1 className="truncate text-base font-bold text-gray-900">{t('accountPage.itemsTitle')}</h1>
            <div className="flex shrink-0 items-center gap-1">
              {!syncStatusLoading && (
                <button
                  type="button"
                  onClick={() => void handleSyncNow()}
                  disabled={!integrationConnected || !canSyncNow || syncAnyPending}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-50"
                  aria-label="Sync"
                >
                  {syncNowPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                disabled={loading || filteredInventoryItems.length === 0}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50"
                aria-label={t('accountPage.itemsExport')}
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <InventorySearchBar
            value={searchValue}
            onChange={setSearchValue}
            onClear={clearSearch}
            disabled={loading}
            inputClassName="rounded-lg border-gray-200 bg-white py-2 pl-9 pr-9 text-sm shadow-none backdrop-blur-none"
          />
          <InventoryMobileQuickBar
            filters={filters}
            onFiltersChange={setFilters}
            facets={facets}
            itemCount={filteredInventoryItems.length}
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setMobileFiltersOpen(true)}
            disabled={loading}
          />
        </div>

        <nav
          className="mb-3 hidden items-center gap-1.5 px-0.5 text-sm text-gray-500 md:mb-5 md:flex"
          aria-label="Breadcrumb"
        >
          <Link href="/account" className="transition-colors hover:text-gray-900">
            Account
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-900">{t('accountPage.itemsTitle')}</span>
        </nav>

        {syncBanner && (
          <div
            className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
              syncBanner.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : syncBanner.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-sky-200 bg-sky-50 text-sky-700'
            }`}
          >
            <span>
              {syncBanner.message ||
                (syncBanner.type === 'success' ? 'Sincronizzazione completata' : '')}
            </span>
            <button
              type="button"
              onClick={() => setSyncBanner(null)}
              className="rounded p-1 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mb-3 hidden flex-wrap items-center justify-end gap-2 md:mb-4 md:flex">
          {!syncStatusLoading && (
            <button
              type="button"
              onClick={() => void handleSyncNow()}
              disabled={!integrationConnected || !canSyncNow || syncAnyPending}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 md:min-h-0 md:rounded-lg"
            >
              {syncNowPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync
            </button>
          )}
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            disabled={loading || filteredInventoryItems.length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 md:min-h-0 md:rounded-lg"
          >
            <Download className="h-4 w-4" />
            {t('accountPage.itemsExport')}
          </button>
        </div>

        <InventorySortBar
          sortBy={filters.sortBy}
          onSortChange={(sortBy) => setFilters((prev) => ({ ...prev, sortBy }))}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          itemCount={filteredInventoryItems.length}
        />

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-center gap-3 p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-gray-600">
              {t('accountPage.itemsLoadingInventory')}
            </span>
          </div>
        </div>
      ) : inventoryRaw.length === 0 ? (
        <div className="border border-gray-200 bg-white p-10 shadow-sm">
          <p className="text-center text-gray-600">
            {t('accountPage.itemsEmptyLine1')}
            <Link href="/account/sincronizzazione" className="font-medium text-primary hover:underline">
              {t('breadcrumb.sincronizzazione')}
            </Link>
            {t('accountPage.itemsEmptyLine2')}
          </p>
        </div>
      ) : filteredInventoryItems.length === 0 ? (
        <div className="border border-gray-200 bg-white p-10 shadow-sm">
          <p className="text-center text-gray-600">
            {t('accountPage.itemsNoResults', { query: filters.search })}{' '}
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="font-medium text-primary hover:underline"
            >
              {t('accountPage.itemsClearSearch')}
            </button>
            .
          </p>
        </div>
      ) : (
        <>
          {filteredInventoryItems.length > 0 && (
            <div className="mb-4 hidden overflow-hidden rounded-2xl border border-stroke-grey bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:mb-5 md:block">
              <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-4">
                {/* Counter */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <CheckSquare className="h-4 w-4 text-gray-500" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">{t('accountPage.itemsSelected')}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {selectedIds.size}{' '}
                        <span className="text-xs font-normal text-gray-400">/ {filteredInventoryItems.length}</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div className="flex flex-wrap gap-1.5 max-md:w-full">
                    <button
                      type="button"
                      onClick={onSelectAll}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-primary hover:text-primary active:scale-[0.98] md:min-h-0 md:flex-none md:rounded-lg md:py-1.5"
                    >
                      {t('accountPage.itemsSelectAll')} ({filteredInventoryItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={onDeselectAll}
                      disabled={selectedIds.size === 0}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-red-400 hover:text-red-500 active:scale-[0.98] disabled:opacity-40 md:min-h-0 md:flex-none md:rounded-lg md:py-1.5"
                    >
                      {t('accountPage.itemsSelectNone')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBulkPriceOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/10"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      {t('accountPage.itemsModifyPrices')}
                    </button>
                    {selectedIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsBulkDeleteOpen(true)}
                        disabled={bulkDeleting}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
                      >
                        {bulkDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {t('accountPage.itemsDeleteSelected')} ({selectedIds.size})
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {bulkDeleteProgress && (
                    <span className="text-xs text-gray-500">
                      {t('accountPage.itemsBulkDeleteProgress', {
                        current: bulkDeleteProgress.current,
                        total: bulkDeleteProgress.total,
                      })}
                    </span>
                  )}
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleExportSelectionCSV}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-emerald-400 hover:text-emerald-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t('accountPage.itemsExport')} ({selectedIds.size})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          <OggettiTable
            items={paginatedItems}
            buildImageUrl={buildImageUrl}
            defaultImage={DEFAULT_IMAGE}
            userId={user.id}
            accessToken={accessToken}
            onRefresh={loadInventory}
            onSyncResult={(result) => {
              setSyncPending(false);
              setSyncBanner(
                result.success
                  ? { type: 'success', message: '' }
                  : { type: 'error', message: result.message ?? '' }
              );
            }}
            onSyncPending={() => setSyncPending(true)}
            syncEnabled={syncEnabled}
            mutationsDisabled={syncAnyPending}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            allFilteredSelected={allFilteredSelected}
            onDeleteSelected={(ids) => onDeleteSelected(ids)}
            bulkDeleting={bulkDeleting}
            viewMode={viewMode}
            isMobile={isMobile}
            t={t}
          />
          {filteredInventoryItems.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-white p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-md:mb-20 md:mt-6 md:gap-3 md:p-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-500">
                  {t('accountPage.itemsPage')} <span className="font-semibold text-gray-900">{currentPage}</span> {t('accountPage.itemsOf')}{' '}
                  <span className="font-semibold text-gray-900">{totalPages.toLocaleString()}</span>
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {INVENTORY_ITEMS_PER_PAGE} {t('accountPage.itemsPerPage')}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500 tabular-nums">
                  {(filteredInventoryItems.length === 0
                    ? 0
                    : (currentPage - 1) * INVENTORY_ITEMS_PER_PAGE + 1
                  ).toLocaleString('it-IT')}
                  –
                  {Math.min(currentPage * INVENTORY_ITEMS_PER_PAGE, filteredInventoryItems.length).toLocaleString('it-IT')}{' '}
                  {t('accountPage.itemsOf')}{' '}
                  {filteredInventoryItems.length.toLocaleString('it-IT')}
                </span>
                {catalogLoading && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      Catalogo…
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-1 md:justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || totalPages <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 md:h-9 md:w-9 md:rounded-lg"
                  aria-label={t('accountPage.itemsPrevPage')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className={`flex items-center gap-1 px-1 ${totalPages <= 1 ? 'opacity-50 pointer-events-none' : ''}`}>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) pageNum = i + 1;
                    else if (currentPage <= 4) pageNum = i + 1;
                    else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                    else pageNum = currentPage - 3 + i;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-xl text-sm font-medium transition-all md:h-9 md:min-w-[2.25rem] md:rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-primary text-white shadow-sm shadow-primary/20'
                            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        aria-label={`Pagina ${pageNum}`}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || totalPages <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 md:h-9 md:w-9 md:rounded-lg"
                  aria-label={t('accountPage.itemsNextPage')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      </main>

      <BulkPriceWizardModal
        isOpen={isBulkPriceOpen}
        onClose={() => setIsBulkPriceOpen(false)}
        filteredInventoryItems={filteredInventoryItems}
        onApply={handleBulkPriceApply}
      />
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedItems={inventoryItems.filter((item) => selectedIds.has(item.id))}
        syncStatus={syncAnyPending ? 'syncing' : syncEnabled ? 'active' : 'inactive'}
        deleteProgress={bulkDeleteProgress}
        onConfirm={handleBulkDelete}
      />

      {/* Sticky action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:py-4">
          <div className="mx-auto flex max-w-screen-xl flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            {/* Left */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">
                {t('accountPage.itemsSelectedCount', { count: selectedIds.size })}
              </span>
              <button
                type="button"
                onClick={onDeselectAll}
                className="text-sm text-gray-400 transition-colors hover:text-gray-700"
              >
                {t('accountPage.itemsDeselectAll')}
              </button>
            </div>
            {bulkDeleteProgress && (
              <span className="text-xs text-gray-500">
                {t('accountPage.itemsBulkDeleteProgress', {
                  current: bulkDeleteProgress.current,
                  total: bulkDeleteProgress.total,
                })}
              </span>
            )}
            <div className="flex flex-col gap-2 sm:flex-row md:contents">
            <button
              type="button"
              onClick={() => setIsBulkPriceOpen(true)}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] md:min-h-0 md:flex-none md:rounded-xl md:py-2.5"
            >
              <TrendingUp className="h-4 w-4" />
              {t('accountPage.itemsModifyPrices')}
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={bulkDeleting}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-500 transition-all hover:border-red-400 hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 md:min-h-0 md:flex-none md:rounded-xl md:py-2.5"
            >
              {bulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('accountPage.itemsDeleteSelected')}
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed right-5 top-5 z-[60] flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg transition-all duration-300">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          <span className="text-sm font-medium text-gray-800">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 rounded-full p-0.5 text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          onClick={() => setExportModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600">
                  <Download className="h-5 w-5" />
                </div>
                <h2 id="export-modal-title" className="text-lg font-bold text-gray-900">
                  {t('accountPage.itemsExport')}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredInventoryItems.length.toLocaleString()} {t('accountPage.itemsItemsInView')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                aria-label={t('accountPage.itemsClose')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Options */}
            <div className="mb-6 grid gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{t('accountPage.itemsExportCSV')}</p>
                  <p className="text-xs text-gray-500">{t('accountPage.itemsExportCSVDesc')}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <FileJson className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{t('accountPage.itemsExportJSON')}</p>
                  <p className="text-xs text-gray-500">{t('accountPage.itemsExportJSONDesc')}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-center text-gray-400">
              {t('accountPage.itemsExportHint')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
