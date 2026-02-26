'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Loader2, Pencil, Search, ShoppingCart, Trash2, X, CheckSquare, Square, Download, FileJson, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { syncClient } from '@/lib/api/sync-client';
import type { InventoryItemResponse, SyncStatusResponse } from '@/lib/api/sync-client';
import { fetchCardsByBlueprintIds } from '@/lib/meilisearch-cards-by-ids';
import type { CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { ASSETS, getCdnImageUrl } from '@/lib/config';

type InventoryItemWithCatalog = InventoryItemResponse & {
  card?: CardCatalogHit | null;
};

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

/** Codice lingua (dalla singola riga inventario) → etichetta per visualizzazione. */
const LANG_CODE_TO_LABEL: Record<string, string> = {
  en: 'English',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  ja: '日本語',
  jp: '日本語',
  ko: '한국어',
  zh: '中文',
};

function getLanguageLabel(code: string | null | undefined): string {
  if (code == null || code === '') return '—';
  const c = String(code).toLowerCase().trim();
  return LANG_CODE_TO_LABEL[c] ?? c;
}

/** Distingue singole (carte: mtg, op, pk) da oggetti (sealed). Basato su id/game_slug del catalogo Meilisearch (cards_prints, op_prints, pk_prints = singole; sealed_products = oggetti). */
function getItemKind(item: InventoryItemWithCatalog): 'singole' | 'oggetti' {
  const id = item.card?.id;
  const gameSlug = item.card?.game_slug;
  if (typeof id === 'string' && id.startsWith('sealed_')) return 'oggetti';
  if (gameSlug === 'sealed' || gameSlug === 'sealed_products') return 'oggetti';
  return 'singole';
}

type KindFilterValue = 'all' | 'singole' | 'oggetti';

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

const CONDITION_OPTIONS = [
  'Near Mint',
  'Slightly Played',
  'Moderately Played',
  'Heavily Played',
  'Poor',
];

const LANG_OPTIONS_EDIT = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
];

/** Normalizza per ricerca multilingua: minuscolo e senza accenti (é→e, ü→u, etc.). */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mc}/gu, '')
    .replace(/\p{Mn}/gu, '');
}

/** Testa se un item inventario matcha la query di ricerca (solo client-side, nessuna chiamata API).
 * Cerca in tutte le lingue: name, set_name, e tutti i nomi in keywords_localized (en, de, es, fr, it, pt). */
function matchInventorySearch(item: InventoryItemWithCatalog, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const qNorm = normalizeForSearch(q);
  const condition =
    item.properties && typeof item.properties.condition === 'string' ? item.properties.condition : '';
  const langCode =
    item.properties && typeof item.properties.mtg_language === 'string'
      ? item.properties.mtg_language
      : '';
  const langLabel = getLanguageLabel(langCode);
  const localizedNames = (item.card?.keywords_localized ?? [])
    .filter((s): s is string => typeof s === 'string' && String(s).trim().length > 0)
    .join(' ');
  const searchable = [
    item.card?.name ?? '',
    item.card?.set_name ?? '',
    item.card?.rarity ?? '',
    item.card?.collector_number ?? '',
    localizedNames,
    String(item.blueprint_id),
    item.description ?? '',
    condition,
    langLabel,
    langCode,
  ]
    .join(' ');
  const searchableNorm = normalizeForSearch(searchable);
  const parts = qNorm.split(/\s+/).filter(Boolean);
  return parts.every((part) => searchableNorm.includes(part));
}

function EditItemModal({
  item,
  onClose,
  onSubmit,
  saving,
  conditionOptions,
  langOptions,
}: {
  item: InventoryItemWithCatalog;
  onClose: () => void;
  onSubmit: (form: {
    quantity: number;
    price_cents: number;
    condition: string;
    mtg_language: string;
    description: string;
    graded: boolean;
    signed?: boolean;
    altered?: boolean;
    mtg_foil?: boolean;
  }) => void;
  saving: boolean;
  conditionOptions: string[];
  langOptions: { code: string; label: string }[];
}) {
  const props = item.properties as Record<string, unknown> | undefined;
  const [quantity, setQuantity] = useState(item.quantity);
  const [priceEuro, setPriceEuro] = useState((item.price_cents / 100).toFixed(2));
  const [condition, setCondition] = useState(
    (typeof props?.condition === 'string' ? props.condition : '') || conditionOptions[0] || ''
  );
  const [mtgLanguage, setMtgLanguage] = useState(
    (typeof props?.mtg_language === 'string' ? props.mtg_language : '') || 'en'
  );
  const [description, setDescription] = useState(item.description ?? '');
  const [graded, setGraded] = useState(!!item.graded);
  const [signed, setSigned] = useState(!!props?.signed);
  const [altered, setAltered] = useState(!!props?.altered);
  const [mtgFoil, setMtgFoil] = useState(!!props?.mtg_foil);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(priceEuro) * 100) || 0;
    onSubmit({
      quantity,
      price_cents: priceCents,
      condition,
      mtg_language: mtgLanguage,
      description,
      graded,
      signed,
      altered,
      mtg_foil: mtgFoil,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="sticky top-0 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <h2 id="edit-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Modifica oggetto
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {item.card?.name ?? `Carta #${item.blueprint_id}`}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantità</label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Prezzo (€)</label>
              <input
                type="text"
                inputMode="decimal"
                value={priceEuro}
                onChange={(e) => setPriceEuro(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Condizione</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">—</option>
              {conditionOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Lingua</label>
            <select
              value={mtgLanguage}
              onChange={(e) => setMtgLanguage(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {langOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={graded} onChange={(e) => setGraded(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Graded</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={mtgFoil} onChange={(e) => setMtgFoil(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Foil</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Firmata</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={altered} onChange={(e) => setAltered(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Alterata</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-[#FF7300] px-4 py-2 text-sm font-medium text-white hover:bg-[#e66a00] disabled:opacity-50"
            >
              {saving ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
              {saving ? ' Salvataggio...' : ' Salva'}
            </button>
          </div>
        </form>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="Chiudi"
      />
    </div>
  );
}

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
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onSelectAllPage,
  onDeselectAllPage,
  onDeleteSelected,
  bulkDeleting,
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
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  /** Se presente, la checkbox in intestazione seleziona/deseleziona solo la pagina corrente. */
  onSelectAllPage?: () => void;
  onDeselectAllPage?: () => void;
  onDeleteSelected?: (ids: number[]) => void;
  bulkDeleting?: boolean;
}) {
  const { selectedLang } = useLanguage();
  const [editItem, setEditItem] = useState<InventoryItemWithCatalog | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectionMode = !syncEnabled && selectedIds != null && onToggleSelect != null;
  const allSelected = selectionMode && items.length > 0 && items.every((i) => selectedIds!.has(i.id));
  const someSelected = selectionMode && items.some((i) => selectedIds!.has(i.id));
  const selectedCount = selectionMode ? items.filter((i) => selectedIds!.has(i.id)).length : 0;
  const selectAllHandler = onSelectAllPage ?? onSelectAll;
  const deselectAllHandler = onDeselectAllPage ?? onDeselectAll;

  const handlePurchase = async (item: InventoryItemWithCatalog) => {
    const qty = Math.min(1, item.quantity);
    if (qty < 1) {
      setActionError('Quantità insufficiente per simulare l\'acquisto.');
      return;
    }
    if (!item.external_stock_id) {
      setActionError('Questo oggetto non è collegato a CardTrader. Sincronizza l\'inventario per abilitare il carrello.');
      return;
    }
    if (!confirm('Simulare l\'acquisto di 1 unità? Verrà controllato l\'inventario e CardTrader, poi la quantità verrà decrementata.')) return;
    setActionError(null);
    setPurchasingId(item.id);
    try {
      const res = await syncClient.purchaseInventoryItem(userId, item.id, { quantity: 1 }, accessToken);
      if (res.status === 'success') {
        await onRefresh();
        onSyncResult({ success: true });
      } else {
        const msg = res.message || res.error || 'Acquisto non completato';
        setActionError(msg);
        onSyncResult({ success: false, message: msg });
      }
    } catch (e) {
      const err = e as Error & { data?: { detail?: string } };
      const msg = err.data?.detail ?? err.message ?? 'Errore durante la simulazione acquisto';
      setActionError(msg);
      onSyncResult({ success: false, message: msg });
    } finally {
      setPurchasingId(null);
    }
  };

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
    if (!confirm('Eliminare questo oggetto dall\'inventario? Se la sincronizzazione con CardTrader è attiva, la rimozione verrà inviata anche lì.')) return;
    setActionError(null);
    setDeletingId(item.id);
    try {
      const res = await syncClient.deleteInventoryItem(userId, item.id, accessToken);
      await onRefresh();
      if (res.sync_queue_error) {
        onSyncResult({ success: false, message: res.sync_queue_error });
      } else if (res.sync_task_id) {
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
      const res = await syncClient.updateInventoryItem(
        userId,
        editItem.id,
        {
          quantity: form.quantity,
          price_cents: form.price_cents,
          description: form.description || null,
          graded: form.graded,
          properties,
        },
        accessToken
      );
      setEditItem(null);
      await onRefresh();
      if (res.sync_queue_error) {
        onSyncResult({ success: false, message: res.sync_queue_error });
      } else if (res.sync_task_id) {
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

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
              {selectionMode && (
                <th className="w-0 p-2 font-semibold text-gray-700 dark:text-gray-200">
                  <button
                    type="button"
                    onClick={() => (allSelected ? deselectAllHandler?.() : selectAllHandler?.())}
                    className="inline-flex items-center justify-center rounded p-1 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600"
                    title={allSelected ? (onDeselectAllPage ? 'Deseleziona pagina' : 'Deseleziona tutte') : (onSelectAllPage ? 'Seleziona pagina' : 'Seleziona tutte')}
                    aria-label={allSelected ? 'Deseleziona' : 'Seleziona pagina'}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-5 w-5 text-[#FF7300]" aria-hidden />
                    ) : (
                      <Square className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                </th>
              )}
              <th className="w-0 p-2 font-semibold text-gray-700 dark:text-gray-200">Immagine</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Nome</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Set</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Rarità</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">N. coll.</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Condizione</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Lingua</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Quantità</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Prezzo</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const imgUrl = item.card?.image
                ? buildImageUrl(item.card.image) || defaultImage
                : defaultImage;
              const condition =
                item.properties && typeof item.properties.condition === 'string'
                  ? item.properties.condition
                  : '—';
              const languageCode =
                item.properties && typeof item.properties.mtg_language === 'string'
                  ? item.properties.mtg_language
                  : null;
              const languageLabel = getLanguageLabel(languageCode);
              const displayNames: { primary: string; secondary: string | null } = item.card
                ? getCardDisplayNames(
                    { name: item.card.name ?? '', keywords_localized: item.card.keywords_localized },
                    selectedLang
                  )
                : { primary: `Carta #${item.blueprint_id}`, secondary: null };
              const namePrimary = (displayNames.primary || item.card?.name) ?? `Carta #${item.blueprint_id}`;

              return (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                >
                  {selectionMode && (
                    <td className="w-0 p-2 align-middle">
                      <button
                        type="button"
                        onClick={() => onToggleSelect?.(item.id)}
                        className="inline-flex items-center justify-center rounded p-1 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600"
                        aria-label={selectedIds!.has(item.id) ? 'Deseleziona' : 'Seleziona'}
                      >
                        {selectedIds!.has(item.id) ? (
                          <CheckSquare className="h-5 w-5 text-[#FF7300]" aria-hidden />
                        ) : (
                          <Square className="h-5 w-5" aria-hidden />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="w-0 p-2 align-middle overflow-visible">
                    {item.card?.id ? (
                      <Link
                        href={`/products/${item.card.id}`}
                        className="block group relative h-20 w-14 shrink-0 rounded bg-gray-100 dark:bg-gray-700 overflow-visible focus:outline-none focus:ring-2 focus:ring-[#FF7300] focus:ring-offset-1 rounded"
                        aria-label={`Vai al dettaglio di ${namePrimary}`}
                      >
                        <div className="absolute left-0 top-0 h-20 w-14 origin-top-left rounded transition-[transform,box-shadow] duration-200 group-hover:z-20 group-hover:scale-[2.5] group-hover:shadow-xl group-hover:ring group-hover:ring-1 group-hover:ring-[#FF7300]">
                          <Image
                            src={imgUrl}
                            alt=""
                            fill
                            className="object-cover object-top rounded"
                            sizes="56px"
                            unoptimized={imgUrl.startsWith('http') || imgUrl === defaultImage}
                          />
                        </div>
                      </Link>
                    ) : (
                      <div className="group relative h-20 w-14 shrink-0 rounded bg-gray-100 dark:bg-gray-700 overflow-visible">
                        <div className="absolute left-0 top-0 h-20 w-14 origin-top-left rounded transition-[transform,box-shadow] duration-200 group-hover:z-20 group-hover:scale-[2.5] group-hover:shadow-xl group-hover:ring group-hover:ring-1 group-hover:ring-[#FF7300]">
                          <Image
                            src={imgUrl}
                            alt=""
                            fill
                            className="object-cover object-top rounded"
                            sizes="56px"
                            unoptimized={imgUrl.startsWith('http') || imgUrl === defaultImage}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{namePrimary}</span>
                      {displayNames.secondary && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">EN: {displayNames.secondary}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {item.card?.set_name ?? '—'}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {item.card?.rarity ?? '—'}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">
                    {item.card?.collector_number ?? '—'}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{condition}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300" title={languageCode ?? undefined}>
                    {languageLabel}
                  </td>
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{item.quantity}</td>
                  <td className="p-3 font-medium text-gray-900 dark:text-white">
                    {(item.price_cents / 100).toFixed(2)} €
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditItem(item)}
                        className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        aria-label="Modifica"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifica
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePurchase(item)}
                        disabled={
                          purchasingId === item.id ||
                          deletingId === item.id ||
                          !item.external_stock_id ||
                          item.quantity < 1
                        }
                        title={
                          !item.external_stock_id
                            ? 'Collegare a CardTrader con una sincronizzazione per abilitare il carrello'
                            : item.quantity < 1
                              ? 'Quantità insufficiente'
                              : 'Simula acquisto: verifica inventario e CardTrader poi decrementa'
                        }
                        className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-white px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-gray-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20 disabled:opacity-50"
                        aria-label="Carrello (simula acquisto)"
                      >
                        {purchasingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-3.5 w-3.5" />
                        )}
                        Carrello
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-gray-700 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-50"
                        aria-label="Elimina"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Elimina
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
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {actionError}
        </div>
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => { setEditItem(null); setActionError(null); }}
          onSubmit={handleEditSubmit}
          saving={saving}
          conditionOptions={CONDITION_OPTIONS}
          langOptions={LANG_OPTIONS_EDIT}
        />
      )}
    </div>
  );
}

export function OggettiContent() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore(
    (s) => s.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null)
  );

  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithCatalog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncBanner, setSyncBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  /** Filtro per tipo: tutti, solo singole (carte), solo oggetti (sealed). */
  const [kindFilter, setKindFilter] = useState<KindFilterValue>('all');
  /** Selezione per eliminazione in blocco (solo quando sincronizzazione non attiva). */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  /** Modale export: scelta CSV o JSON (solo client-side, nessun carico server). */
  const [exportModalOpen, setExportModalOpen] = useState(false);

  /** Verifica lato frontend: chiamate al sync service solo se integrazione CardTrader attiva. */
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(true);
  const syncEnabled =
    Boolean(syncStatus && !syncStatus.disconnected) &&
    (syncStatus?.sync_status === 'active' || syncStatus?.sync_status === 'initial_sync');

  /** Filtro per tipo (singole/oggetti) poi per ricerca testuale. */
  const filteredInventoryItems = useMemo(() => {
    let list = inventoryItems;
    if (kindFilter !== 'all') {
      list = list.filter((item) => getItemKind(item) === kindFilter);
    }
    if (inventorySearchQuery.trim()) {
      list = list.filter((item) => matchInventorySearch(item, inventorySearchQuery));
    }
    return list;
  }, [inventoryItems, kindFilter, inventorySearchQuery]);

  /** Conteggi per tipo (per le etichette dei tab). */
  const countsByKind = useMemo(() => {
    let singole = 0;
    let oggetti = 0;
    for (const item of inventoryItems) {
      if (getItemKind(item) === 'oggetti') oggetti++;
      else singole++;
    }
    return { singole, oggetti };
  }, [inventoryItems]);

  /** KPI: totale oggetti unici, totale oggetti (somma quantità), valore totale (quantità × prezzo). Calcolati su tutti i dati filtrati (precisi). */
  const totalUnique = filteredInventoryItems.length;
  const totalQuantity = useMemo(
    () => filteredInventoryItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    [filteredInventoryItems]
  );
  const totalValueCents = useMemo(
    () =>
      filteredInventoryItems.reduce(
        (sum, item) => sum + (item.quantity ?? 0) * (item.price_cents ?? 0),
        0
      ),
    [filteredInventoryItems]
  );
  const totalValueFormatted =
    totalValueCents >= 0
      ? new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalValueCents / 100)
      : '—';
  /** Carte in inventario = righe di tipo "singole" nella vista corrente. */
  const cardsInView = useMemo(
    () => filteredInventoryItems.filter((item) => getItemKind(item) === 'singole').length,
    [filteredInventoryItems]
  );

  const ITEMS_PER_PAGE = 200;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredInventoryItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInventoryItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInventoryItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [kindFilter, inventorySearchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!syncBanner) return;
    const t = setTimeout(() => setSyncBanner(null), 5000);
    return () => clearTimeout(t);
  }, [syncBanner]);

  // 1) Verifica stato sync con CardTrader (una sola chiamata, prima di qualsiasi altra al sync service)
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

  /** Carica tutto l'inventario (pagine da 500) per avere dati completi e KPIs corrette. */
  const loadInventory = useCallback(async () => {
    if (!user?.id || !accessToken) return;
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

      setTotal(totalFromApi);

      const blueprintIds = [...new Set(allItems.map((i) => i.blueprint_id).filter(Boolean))] as number[];
      let blueprintToCard: Record<number, CardCatalogHit> = {};
      if (blueprintIds.length > 0) {
        const map = await fetchCardsByBlueprintIds(blueprintIds);
        blueprintToCard = { ...map };
      }

      const merged: InventoryItemWithCatalog[] = allItems.map((item) => ({
        ...item,
        card: blueprintToCard[item.blueprint_id],
      }));
      setInventoryItems(merged);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento inventario');
      setInventoryItems([]);
      setTotal(0);
    }
  }, [user?.id, accessToken]);

  // 2) Carica inventario sempre (la collezione esiste anche senza sincronizzazione CardTrader)
  useEffect(() => {
    if (!user?.id || !accessToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        await loadInventory();
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, accessToken, loadInventory]);

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

  const onSelectAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginatedItems.forEach((i) => next.add(i.id));
      return next;
    });
  }, [paginatedItems]);

  const onDeselectAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginatedItems.forEach((i) => next.delete(i.id));
      return next;
    });
  }, [paginatedItems]);

  const onDeleteSelected = useCallback(
    async (ids: number[]) => {
      if (!user?.id || !accessToken || ids.length === 0) return;
      if (
        !confirm(
          `Eliminare ${ids.length} ${ids.length === 1 ? 'oggetto' : 'oggetti'} dall'inventario? Questa azione non può essere annullata.`
        )
      )
        return;
      setBulkDeleting(true);
      try {
        for (const id of ids) {
          await syncClient.deleteInventoryItem(user.id, id, accessToken);
        }
        await loadInventory();
        setSelectedIds(new Set());
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Errore durante l\'eliminazione';
        setError(msg);
      } finally {
        setBulkDeleting(false);
      }
    },
    [user?.id, accessToken, loadInventory]
  );

  /** Export in CSV (solo dati in memoria, nessuna chiamata API). */
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
  }, [filteredInventoryItems]);

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
      <div className="text-white">
        <nav className="mb-6 flex items-center gap-2 text-sm text-white/90" aria-label="Breadcrumb">
          <Link href="/account" className="hover:text-white" aria-label="Account">
            <Home className="h-4 w-4" />
          </Link>
          <span className="text-white/60">/</span>
          <span>ACCOUNT</span>
          <span className="text-white/60">/</span>
          <span className="text-white">I MIEI OGGETTI</span>
        </nav>
        <div className="mt-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white/5 p-12 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF7300]" />
            <p className="text-sm text-white/80">Caricamento account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/90" aria-label="Breadcrumb">
        <Link href="/account" className="hover:text-white" aria-label="Account">
          <Home className="h-4 w-4" />
        </Link>
        <span className="text-white/60">/</span>
        <span>ACCOUNT</span>
        <span className="text-white/60">/</span>
        <span className="text-white">I MIEI OGGETTI</span>
      </nav>

      {/* KPI: totale oggetti unici, totale oggetti, valore totale collezione, carte in inventario (calcoli sul totale filtrato) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 dark:border-gray-600 dark:bg-gray-800/50">
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">Totale oggetti unici</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {loading ? '—' : totalUnique}
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            {kindFilter !== 'all' || inventorySearchQuery.trim()
              ? 'in vista'
              : 'righe in inventario'}
          </p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 dark:border-gray-600 dark:bg-gray-800/50">
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">Totale oggetti</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {loading ? '—' : totalQuantity}
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            {kindFilter !== 'all' || inventorySearchQuery.trim()
              ? 'pezzi in vista'
              : 'somma quantità'}
          </p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 dark:border-gray-600 dark:bg-gray-800/50">
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">Valore totale collezione</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {loading ? '—' : totalValueFormatted}
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            {kindFilter !== 'all' || inventorySearchQuery.trim()
              ? 'valore in vista'
              : 'prezzo × quantità'}
          </p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 dark:border-gray-600 dark:bg-gray-800/50">
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">Carte in inventario</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {loading ? '—' : cardsInView}
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            {kindFilter === 'singole' ? 'solo singole' : kindFilter === 'all' ? 'righe tipo carte' : '—'}
          </p>
        </div>
      </div>

      {/* Filtro per tipo: Tutti / Singole (carte) / Oggetti */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm font-medium text-white/70">Mostra:</span>
        <div className="flex flex-wrap gap-1 rounded-lg border border-white/20 bg-white/5 p-1 dark:border-gray-600 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={() => setKindFilter('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              kindFilter === 'all'
                ? 'bg-[#FF7300] text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            Tutti ({inventoryItems.length})
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('singole')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              kindFilter === 'singole'
                ? 'bg-[#FF7300] text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            Singole ({countsByKind.singole})
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('oggetti')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              kindFilter === 'oggetti'
                ? 'bg-[#FF7300] text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            Oggetti ({countsByKind.oggetti})
          </button>
        </div>
        <p className="text-xs text-white/50">
          {kindFilter === 'all' && 'Carte e prodotti sigillati'}
          {kindFilter === 'singole' && 'Solo carte (MTG, Pokémon, Yu-Gi-Oh!, ecc.)'}
          {kindFilter === 'oggetti' && 'Solo prodotti sigillati (sealed)'}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-white">
            I Miei Oggetti
          </h1>
          {!syncStatusLoading && (
            syncEnabled ? (
              <span
                className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200"
                title="Le modifiche e le eliminazioni vengono sincronizzate con CardTrader"
              >
                Sincronizzazione attiva
              </span>
            ) : (
              <Link
                href="/account/sincronizzazione"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/20 hover:text-white"
                title="Collega CardTrader per sincronizzare l'inventario"
              >
                Sincronizzazione non attiva
              </Link>
            )
          )}
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            disabled={loading || filteredInventoryItems.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            title="Esporta la collezione in vista (CSV o JSON)"
          >
            <Download className="h-4 w-4" />
            Esporta
          </button>
        </div>
        <div className="flex flex-1 min-w-0 max-w-md justify-center px-2">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={inventorySearchQuery}
              onChange={(e) => setInventorySearchQuery(e.target.value)}
              placeholder="Cerca nel tuo inventario (tutte le lingue)..."
              className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/50 focus:border-[#FF7300] focus:outline-none focus:ring-1 focus:ring-[#FF7300]"
              aria-label="Cerca nell’inventario (nome, set, rarità, condizione - tutte le lingue)"
            />
            {inventorySearchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setInventorySearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Cancella ricerca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {syncEnabled && syncPending && (
            <div
              role="status"
              className="rounded-lg border border-sky-500/50 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-200"
            >
              Sincronizzazione in corso con CardTrader…
            </div>
          )}
          {syncEnabled && syncBanner && !syncPending && (
            <div
              role="alert"
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                syncBanner.type === 'success'
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                  : 'border-red-500/50 bg-red-500/20 text-red-200'
              }`}
            >
              {syncBanner.type === 'success'
                ? 'Sincronizzazione avvenuta con successo'
                : `Errore nella sincronizzazione${syncBanner.message ? `: ${syncBanner.message}` : ''}`}
            </div>
          )}
          <p className="text-sm text-white/80">
            {inventorySearchQuery.trim() ? (
              <>
                <span className="font-medium text-white">{filteredInventoryItems.length}</span>
                {' di '}
                {total} {total === 1 ? 'carta' : 'carte'}
              </>
            ) : (
              <>
                {total} {total === 1 ? 'carta' : 'carte'} in inventario
              </>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-center gap-3 p-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF7300]" />
            <span className="text-gray-600 dark:text-gray-300">Caricamento inventario...</span>
          </div>
        </div>
      ) : inventoryItems.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-300">
            Non hai ancora oggetti in inventario. Collega CardTrader e avvia la sincronizzazione dalla pagina{' '}
            <Link href="/account/sincronizzazione" className="font-medium text-[#FF7300] hover:underline">
              Sincronizzazione
            </Link>
            {' '}per importare le tue carte.
          </p>
        </div>
      ) : filteredInventoryItems.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-300">
            Nessun risultato per &quot;{inventorySearchQuery}&quot;. Prova con altri termini o{' '}
            <button
              type="button"
              onClick={() => setInventorySearchQuery('')}
              className="font-medium text-[#FF7300] hover:underline"
            >
              cancella la ricerca
            </button>
            .
          </p>
        </div>
      ) : (
        <>
          {!syncEnabled && filteredInventoryItems.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-white/20 bg-white/5 p-3 dark:border-gray-600 dark:bg-gray-800/50">
              <span className="text-sm font-medium text-white/80">Selezione:</span>
              <button
                type="button"
                onClick={onSelectAll}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
              >
                <CheckSquare className="h-4 w-4" />
                Seleziona tutte
              </button>
              <button
                type="button"
                onClick={onDeselectAll}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                Deseleziona tutte
              </button>
              <button
                type="button"
                onClick={() => onDeleteSelected(Array.from(selectedIds))}
                disabled={bulkDeleting || selectedIds.size === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-200 hover:bg-red-500/30 disabled:opacity-50"
              >
                {bulkDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Elimina selezionate {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </button>
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
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            onSelectAllPage={onSelectAllPage}
            onDeselectAllPage={onDeselectAllPage}
            onDeleteSelected={(ids) => onDeleteSelected(ids)}
            bulkDeleting={bulkDeleting}
          />
          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/20 bg-white/5 px-4 py-3 dark:border-gray-600 dark:bg-gray-800/50">
              <p className="text-sm text-white/80">
                Pagina <span className="font-semibold text-white">{currentPage}</span> di{' '}
                <span className="font-semibold text-white">{totalPages}</span>
                {' · '}
                <span className="text-white/60">{ITEMS_PER_PAGE} per pagina</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Pagina precedente"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Precedente
                </button>
                <div className="flex items-center gap-1">
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
                        className={`min-w-[2.25rem] rounded-lg border px-2 py-1.5 text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'border-[#FF7300] bg-[#FF7300] text-white'
                            : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
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
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Pagina successiva"
                >
                  Successiva
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modale Export: scelta CSV o JSON (solo client-side) */}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          onClick={() => setExportModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/20 bg-gray-900 shadow-2xl p-6 animate-export-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-3 top-3">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 id="export-modal-title" className="pr-8 text-lg font-semibold text-white mb-1">
              Come vuoi esportare la tua collezione?
            </h2>
            <p className="text-sm text-white/70 mb-6">
              Verranno esportati i dati attualmente in vista ({filteredInventoryItems.length} oggetti). L&apos;export avviene sul tuo dispositivo, senza caricare il server.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 transition-colors"
              >
                <FileSpreadsheet className="h-5 w-5" />
                Esporta CSV
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-amber-500/50 bg-amber-500/20 px-5 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors"
              >
                <FileJson className="h-5 w-5" />
                Esporta JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
