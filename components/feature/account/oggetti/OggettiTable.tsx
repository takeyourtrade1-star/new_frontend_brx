'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import {
  CheckSquare,
  Edit3,
  Flame,
  Library,
  PenLine,
  Sparkles,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Square,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { syncClient } from '@/lib/api/sync-client';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { isDemoEbartexListing } from '@/lib/sync/inventory-types';
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
import { getCardDisplayNames } from '@/lib/card-display-name';
import {
  getInventoryConditionCode,
  getInventoryLanguageLabel,
} from '@/lib/inventory/inventory-filter-utils';
import { CardLanguageFlag } from '@/components/ui/CardLanguageFlag';
import { RarityIndicator } from '@/components/ui/RarityIndicator';
import { RarityLegendProvider } from '@/components/ui/RarityLegendProvider';
import { SetIconBadge } from '@/components/ui/SetIconBadge';
import { CardArtStripHoverPreview } from '@/components/ui/CardArtStripHoverPreview';
import { buildSetPageUrl, resolveSetPageGameSlug } from '@/lib/search/set-page-url';
import { formatEuroNoSpace } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { OggettiMobileList } from '@/components/feature/account/OggettiMobileList';
import type { MessageKey } from '@/lib/i18n/messages/en';

export type OggettiViewMode = 'table' | 'cards';

export type OggettiTableProps = {
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
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};
export function OggettiTable({
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
}: OggettiTableProps) {
  const router = useRouter();
  const { selectedLang } = useLanguage();
  const intlLocale = useIntlLocale();
  const [editItem, setEditItem] = useState<InventoryItemWithCatalog | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [qtyUpdatingId, setQtyUpdatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectionMode = selectedIds != null && onToggleSelect != null;
  // FE-REV-023: helper sicuro al posto di `selectedIds!` — niente crash se la tabella è riusata senza selection props.
  const isSelected = (id: number) => selectedIds?.has(id) ?? false;
  const allSelected =
    selectionMode &&
    (allFilteredSelected ??
      (items.length > 0 && items.every((i) => isSelected(i.id))));

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
          const tradeLocked = (item.reserved_quantity ?? 0) > 0;
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
                      disabled={tradeLocked}
                      onClick={() => onToggleSelect?.(item.id)}
                      className={`absolute left-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-xl shadow-md backdrop-blur-sm transition-all disabled:opacity-40 md:left-3 md:top-3 md:h-auto md:w-auto md:rounded-lg md:p-2 ${
                        isSelected(item.id) 
                          ? 'bg-primary text-white' 
                          : 'bg-white/90 text-gray-400 hover:text-primary'
                      }`}
                    >
                      {isSelected(item.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {/* Quick Stats Badges - Top Right - Glass Effect */}
                  <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
                    {tradeLocked && (
                      <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase text-amber-800 shadow-sm">
                        {t('trades.inventoryLocked')}
                      </span>
                    )}
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
                      disabled={mutationsDisabled || tradeLocked}
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
                        disabled={tradeLocked || mutationsDisabled || qtyUpdatingId === item.id || deletingId === item.id}
                        onClick={() => handleQtyDelta(item, -1)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 active:scale-95 disabled:opacity-50 md:h-7 md:w-7 md:rounded-md"
                        aria-label={t('accountPage.itemsDecreaseQty')}
                      >
                        {qtyUpdatingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums text-gray-800">
                        {item.quantity}
                        {tradeLocked && (
                          <span className="block text-[9px] uppercase text-amber-700">
                            {t('trades.inventoryReserved', { count: item.reserved_quantity ?? 0 })}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={
                          tradeLocked ||
                          mutationsDisabled ||
                          qtyUpdatingId === item.id ||
                          deletingId === item.id ||
                          item.quantity >= 999
                        }
                        onClick={() => handleQtyDelta(item, 1)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 md:h-7 md:w-7 md:rounded-md"
                        aria-label={t('accountPage.itemsIncreaseQty')}
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
                disabled={tradeLocked || mutationsDisabled || deletingId === item.id}
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
              const tradeLocked = (item.reserved_quantity ?? 0) > 0;
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
                        disabled={tradeLocked}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect?.(item.id);
                        }}
                        className={`inline-flex items-center justify-center rounded p-1 transition-colors disabled:opacity-40 ${
                          isSelected(item.id)
                            ? 'text-primary'
                            : 'text-gray-400 hover:text-primary'
                        }`}
                        aria-label={isSelected(item.id) ? 'Deseleziona' : 'Seleziona'}
                      >
                        {isSelected(item.id) ? (
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
                          tradeLocked || mutationsDisabled || qtyUpdatingId === item.id || deletingId === item.id
                        }
                        onClick={() => handleQtyDelta(item, -1)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                        aria-label={t('accountPage.itemsDecreaseQty')}
                      >
                        {qtyUpdatingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="min-w-[1.25rem] text-center text-[13px] font-semibold tabular-nums text-gray-800">
                        {item.quantity}
                        {tradeLocked && (
                          <span className="block text-[8px] font-bold uppercase text-amber-700">
                            {t('trades.inventoryLocked')}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={
                          tradeLocked ||
                          mutationsDisabled ||
                          qtyUpdatingId === item.id ||
                          deletingId === item.id ||
                          item.quantity >= 999
                        }
                        onClick={() => handleQtyDelta(item, 1)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                        aria-label={t('accountPage.itemsIncreaseQty')}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="search-results-td px-1 align-middle text-right text-[13px] font-bold tabular-nums text-[#FF7300]">
                    {formatEuroNoSpace((item.price_cents ?? 0) / 100, intlLocale)}
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
                        disabled={tradeLocked || mutationsDisabled}
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
                        disabled={tradeLocked || mutationsDisabled || deletingId === item.id}
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
