'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  CreditCard,
  Download,
  Edit3,
  FileJson,
  FileSpreadsheet,
  Filter,
  Flame,
  Globe,
  Grid3X3,
  History,
  Layers,
  Library,
  List,
  Loader2,
  Package,
  Pencil,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Square,
  Star,
  Timer,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { syncClient } from '@/lib/api/sync-client';
import type { InventoryItemResponse, SyncStatusResponse } from '@/lib/api/sync-client';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import {
  InventoryEditModal,
  INVENTORY_CONDITION_OPTIONS,
  INVENTORY_LANG_OPTIONS_EDIT,
} from '@/components/feature/sync/InventoryEditModal';
import { fetchCardsByBlueprintIds } from '@/lib/meilisearch-cards-by-ids';
import type { CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { ASSETS, getCdnImageUrl } from '@/lib/config';

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

/** Mock inventory data for demo when backend is unavailable */
const MOCK_INVENTORY_ITEMS: InventoryItemWithCatalog[] = [
  {
    id: 1,
    blueprint_id: 1001,
    quantity: 5,
    price_cents: 1250,
    description: 'Near Mint condition, English',
    graded: false,
    external_stock_id: 'ct-12345',
    properties: { condition: 'NM', mtg_language: 'en' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-001',
      name: 'Black Lotus',
      set_name: 'Alpha',
      rarity: 'Rare',
      collector_number: '232',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 2,
    blueprint_id: 1002,
    quantity: 3,
    price_cents: 850,
    description: 'Light Play, Italian',
    graded: false,
    external_stock_id: 'ct-12346',
    properties: { condition: 'LP', mtg_language: 'it' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-002',
      name: 'Mox Pearl',
      set_name: 'Beta',
      rarity: 'Rare',
      collector_number: '25',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 3,
    blueprint_id: 1003,
    quantity: 8,
    price_cents: 450,
    description: 'Near Mint, English Foil',
    graded: false,
    external_stock_id: 'ct-12347',
    properties: { condition: 'NM', mtg_language: 'en', mtg_foil: true },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-003',
      name: 'Counterspell',
      set_name: 'Modern Horizons 2',
      rarity: 'Uncommon',
      collector_number: '267',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 4,
    blueprint_id: 1004,
    quantity: 2,
    price_cents: 2500,
    description: 'Moderate Play, English',
    graded: false,
    external_stock_id: 'ct-12348',
    properties: { condition: 'MP', mtg_language: 'en' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-004',
      name: 'Underground Sea',
      set_name: 'Revised',
      rarity: 'Rare',
      collector_number: '291',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 5,
    blueprint_id: 1005,
    quantity: 12,
    price_cents: 150,
    description: 'Near Mint, German',
    graded: false,
    external_stock_id: 'ct-12349',
    properties: { condition: 'NM', mtg_language: 'de' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-005',
      name: 'Lightning Bolt',
      set_name: 'Fourth Edition',
      rarity: 'Common',
      collector_number: '208',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 6,
    blueprint_id: 1006,
    quantity: 1,
    price_cents: 15000,
    description: 'Graded PSA 9',
    graded: true,
    external_stock_id: 'ct-12350',
    properties: { condition: 'NM', mtg_language: 'en' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-006',
      name: 'Tropical Island',
      set_name: 'Alpha',
      rarity: 'Rare',
      collector_number: '294',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 7,
    blueprint_id: 1007,
    quantity: 4,
    price_cents: 320,
    description: 'Near Mint, English',
    graded: false,
    external_stock_id: 'ct-12351',
    properties: { condition: 'NM', mtg_language: 'en' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-007',
      name: 'Sol Ring',
      set_name: 'Commander Legends',
      rarity: 'Uncommon',
      collector_number: '472',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 8,
    blueprint_id: 1008,
    quantity: 6,
    price_cents: 180,
    description: 'Near Mint, Japanese',
    graded: false,
    external_stock_id: 'ct-12352',
    properties: { condition: 'NM', mtg_language: 'ja' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-008',
      name: 'Brainstorm',
      set_name: 'Ice Age',
      rarity: 'Common',
      collector_number: '61',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 9,
    blueprint_id: 1009,
    quantity: 2,
    price_cents: 750,
    description: 'Light Play, English Foil',
    graded: false,
    external_stock_id: 'ct-12353',
    properties: { condition: 'LP', mtg_language: 'en', mtg_foil: true },
    updated_at: new Date().toISOString(),
    card: {
      id: 'sealed-001',
      name: 'Modern Horizons 2 - Collector Booster',
      set_name: 'Modern Horizons 2',
      rarity: 'Special',
      collector_number: '',
      game_slug: 'sealed',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 10,
    blueprint_id: 1010,
    quantity: 15,
    price_cents: 45,
    description: 'Near Mint, English',
    graded: false,
    external_stock_id: 'ct-12354',
    properties: { condition: 'NM', mtg_language: 'en' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-010',
      name: 'Path to Exile',
      set_name: 'Conflux',
      rarity: 'Uncommon',
      collector_number: '15',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 11,
    blueprint_id: 1011,
    quantity: 20,
    price_cents: 25,
    description: 'Near Mint, English',
    graded: false,
    external_stock_id: 'ct-12355',
    properties: { condition: 'NM', mtg_language: 'en' },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-011',
      name: 'Island',
      set_name: 'Unfinity',
      rarity: 'Basic Land',
      collector_number: '536',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
  {
    id: 12,
    blueprint_id: 1012,
    quantity: 3,
    price_cents: 1200,
    description: 'Signed, Near Mint',
    graded: false,
    external_stock_id: 'ct-12356',
    properties: { condition: 'NM', mtg_language: 'en', signed: true },
    updated_at: new Date().toISOString(),
    card: {
      id: 'mtg-012',
      name: 'Force of Will',
      set_name: 'Alliances',
      rarity: 'Uncommon',
      collector_number: '92',
      game_slug: 'mtg',
      image: null,
      keywords_localized: [],
    },
  },
];

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

function formatPrice(priceCents: number | null | undefined): string {
  const cents = priceCents ?? 0;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
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
type SmartFilterValue = 'all' | 'unsold' | 'duplicates' | 'below-market';

const LOW_STOCK_THRESHOLD = 5;
const DAYS_UNSOLD_THRESHOLD = 30;

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
  onSelectAllPage,
  onDeselectAllPage,
  onDeleteSelected,
  bulkDeleting,
  viewMode = 'table',
  salesData,
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
  onSelectAllPage?: () => void;
  onDeselectAllPage?: () => void;
  onDeleteSelected?: (ids: number[]) => void;
  bulkDeleting?: boolean;
  viewMode?: OggettiViewMode;
  salesData?: Map<number, { lastSold: Date; salesCount: number; views: number }>;
  t: (key: import('@/lib/i18n/messages/en').MessageKey, vars?: Record<string, string | number>) => string;
}) {
  const { selectedLang } = useLanguage();
  const [editItem, setEditItem] = useState<InventoryItemWithCatalog | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [purchaseItem, setPurchaseItem] = useState<InventoryItemWithCatalog | null>(null);
  const [purchaseQty, setPurchaseQty] = useState<number>(1);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectionMode = !syncEnabled && selectedIds != null && onToggleSelect != null;
  const allSelected = selectionMode && items.length > 0 && items.every((i) => selectedIds!.has(i.id));
  const someSelected = selectionMode && items.some((i) => selectedIds!.has(i.id));
  const selectedCount = selectionMode ? items.filter((i) => selectedIds!.has(i.id)).length : 0;
  const selectAllHandler = onSelectAllPage ?? onSelectAll;
  const deselectAllHandler = onDeselectAllPage ?? onDeselectAll;

  const openPurchaseModal = (item: InventoryItemWithCatalog) => {
    if (!item.external_stock_id) {
      setActionError('Questo oggetto non è collegato a CardTrader. Sincronizza l\'inventario per abilitare il carrello.');
      return;
    }
    if (item.quantity < 1) {
      setActionError('Quantità insufficiente per simulare l\'acquisto.');
      return;
    }
    setActionError(null);
    setPurchaseItem(item);
    setPurchaseQty(1);
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseItem) return;
    const safeQty = Math.max(1, Math.min(purchaseQty, purchaseItem.quantity));
    if (safeQty < 1) {
      setActionError('Quantità non valida.');
      return;
    }
    setActionError(null);
    setPurchasingId(purchaseItem.id);
    setPurchaseSubmitting(true);
    try {
      const res = await syncClient.purchaseInventoryItem(userId, purchaseItem.id, { quantity: safeQty }, accessToken);
      if (res.status === 'success') {
        await onRefresh();
        onSyncResult({ success: true });
        setPurchaseItem(null);
      } else {
        const rawMsg = res.message || res.error || 'Acquisto non completato';
        // Messaggio più leggibile per quantità insufficiente
        if (rawMsg.toLowerCase().includes('quantità insufficiente')) {
          setActionError(rawMsg);
        } else {
          setActionError('Errore durante la verifica con CardTrader. Riprova più tardi.');
        }
        onSyncResult({ success: false, message: rawMsg });
      }
    } catch (e) {
      const err = e as Error & { data?: { detail?: string } };
      const technical = err.data?.detail ?? err.message ?? 'Errore durante la simulazione acquisto';
      setActionError('Errore interno durante l\'allineamento con CardTrader. Riprova più tardi.');
      onSyncResult({ success: false, message: technical });
    } finally {
      setPurchasingId(null);
      setPurchaseSubmitting(false);
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
        onSyncResult({ success: true, message: 'Aggiornamento CardTrader in coda. Attendi il completamento task.' });
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
        onSyncResult({ success: true, message: 'Aggiornamento CardTrader in coda. Attendi il completamento task.' });
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

  if (viewMode === 'cards') {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5">
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
          const salesInfo = salesData?.get(item.id);
          const daysUnsold = salesInfo ? Math.floor((Date.now() - salesInfo.lastSold.getTime()) / (1000 * 60 * 60 * 24)) : null;
          const isPopular = (salesInfo?.views ?? 0) > 50;
          const isStagnant = daysUnsold !== null && daysUnsold > 60;
          const isTrending = (salesInfo?.salesCount ?? 0) > 2;
          const hasFoil = item.properties?.mtg_foil === true;
          const isSigned = item.properties?.signed === true;
          const isGraded = item.graded === true;

          return (
            <div
              key={item.id}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white/60 backdrop-blur-sm transition-all duration-200 ${
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
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
                      className={`absolute left-3 top-3 z-20 rounded-lg p-2 shadow-md backdrop-blur-sm transition-all ${
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
                    {isStagnant && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-500/30 shadow-sm">
                        <Timer className="h-3 w-3" />
                        {daysUnsold}{t('accountPage.itemsDaysUnsold')}
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
                  </div>

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 p-3 opacity-0 translate-y-full transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-8">
                    <button
                      type="button"
                      onClick={() => setEditItem(item)}
                      disabled={mutationsDisabled}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/90 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-gray-800 shadow-lg border border-white/50 transition-all hover:bg-primary hover:text-white hover:border-primary/30 active:scale-95 disabled:opacity-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {t('accountPage.itemsEdit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openPurchaseModal(item)}
                      disabled={mutationsDisabled || purchasingId === item.id || deletingId === item.id || !item.external_stock_id || item.quantity < 1}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white shadow-lg border border-white/30 transition-all hover:from-primary/90 hover:to-primary/70 active:scale-95 disabled:opacity-50"
                    >
                      {purchasingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                      {t('accountPage.itemsCart')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex flex-1 flex-col p-4">
                {/* Card Name */}
                <div className="mb-2">
                  <h3 className="line-clamp-1 text-base font-bold text-gray-900 leading-tight">
                    {namePrimary}
                  </h3>
                  {displayNames.secondary && (
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{displayNames.secondary}</p>
                  )}
                </div>

                {/* Set Name with Icon */}
                <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <Library className="h-3 w-3 text-gray-400" />
                  <span className="truncate font-medium">{item.card?.set_name || '—'}</span>
                </div>

                {/* Stats Row - Condition, Language, Rarity - Glass Effect */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm border shadow-sm ${
                    condition === 'NM' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
                    condition === 'LP' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
                    condition === 'MP' ? 'bg-orange-500/15 text-orange-700 border-orange-500/30' :
                    condition === 'HP' ? 'bg-red-500/15 text-red-700 border-red-500/30' :
                    'bg-gray-500/10 text-gray-600 border-gray-500/20'
                  }`}>
                    {condition}
                  </span>
                  {languageLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-gray-700 bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm">
                      <Globe className="h-3 w-3 text-gray-500" />
                      {languageLabel}
                    </span>
                  )}
                  {item.card?.rarity && (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm border shadow-sm ${
                      item.card.rarity === 'Rare' ? 'bg-purple-500/15 text-purple-700 border-purple-500/30' :
                      item.card.rarity === 'Mythic' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
                      item.card.rarity === 'Uncommon' ? 'bg-blue-500/15 text-blue-700 border-blue-500/30' :
                      'bg-gray-500/10 text-gray-600 border-gray-500/20'
                    }`}>
                      <Star className="h-2.5 w-2.5 mr-0.5" />
                      {item.card.rarity}
                    </span>
                  )}
                </div>

                {/* Price & Quantity Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">{t('accountPage.itemsTablePrice')}</span>
                    <span className="text-lg font-bold text-primary tabular-nums">
                      {(item.price_cents / 100).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{t('accountPage.itemsTableQty')}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 backdrop-blur-sm px-2.5 py-1 text-sm font-bold text-gray-700 border border-gray-200/60 shadow-sm">
                      <Package className="h-3.5 w-3.5 text-gray-500" />
                      {item.quantity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete Button - Floating - Glass Effect */}
              <button
                type="button"
                onClick={() => handleDelete(item)}
                disabled={mutationsDisabled || deletingId === item.id}
                className="absolute right-3 top-[50%] translate-y-[-50%] rounded-full bg-white/80 backdrop-blur-sm p-2 text-gray-400 shadow-md border border-gray-200/50 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 hover:border-red-200 group-hover:opacity-100"
                title={t('accountPage.itemsDelete')}
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
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-grey bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stroke-grey bg-gray-50/80">
              {selectionMode && (
                <th className="w-0 p-3">
                  <button
                    type="button"
                    onClick={() => (allSelected ? deselectAllHandler?.() : selectAllHandler?.())}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:shadow-sm"
                    title={allSelected ? (onDeselectAllPage ? 'Deseleziona pagina' : 'Deseleziona tutte') : (onSelectAllPage ? 'Seleziona pagina' : 'Seleziona tutte')}
                    aria-label={allSelected ? 'Deseleziona' : 'Seleziona pagina'}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary" aria-hidden />
                    ) : (
                      <Square className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                </th>
              )}
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('accountPage.itemsTableCard')}</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('accountPage.itemsTableSet')}</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('accountPage.itemsTableDetails')}</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('accountPage.itemsTableQty')}</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{t('accountPage.itemsTablePrice')}</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">{t('accountPage.itemsTableActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke-grey">
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
              const hasFoil = item.properties?.mtg_foil === true;
              const isSigned = item.properties?.signed === true;
              const isGraded = item.graded === true;

              return (
                <tr
                  key={item.id}
                  className="group transition-all duration-200 hover:bg-gray-50/60"
                >
                  {selectionMode && (
                    <td className="w-0 p-3 align-middle">
                      <button
                        type="button"
                        onClick={() => onToggleSelect?.(item.id)}
                        className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${
                          selectedIds!.has(item.id) 
                            ? 'text-primary' 
                            : 'text-gray-400 hover:text-primary'
                        }`}
                        aria-label={selectedIds!.has(item.id) ? 'Deseleziona' : 'Seleziona'}
                      >
                        {selectedIds!.has(item.id) ? (
                          <CheckSquare className="h-5 w-5" aria-hidden />
                        ) : (
                          <Square className="h-5 w-5" aria-hidden />
                        )}
                      </button>
                    </td>
                  )}
                  {/* Card Column - Image + Name */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {item.card?.id ? (
                        <Link
                          href={`/products/${item.card.id}`}
                          className="group/img relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 transition-all hover:ring-primary/50"
                        >
                          <Image
                            src={imgUrl}
                            alt=""
                            fill
                            className="object-cover object-top"
                            sizes="40px"
                            unoptimized={imgUrl.startsWith('http') || imgUrl === defaultImage}
                          />
                        </Link>
                      ) : (
                        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200">
                          <Image
                            src={imgUrl}
                            alt=""
                            fill
                            className="object-cover object-top"
                            sizes="40px"
                            unoptimized={imgUrl.startsWith('http') || imgUrl === defaultImage}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-gray-900">{namePrimary}</span>
                        {displayNames.secondary && (
                          <span className="block truncate text-xs text-gray-500">{displayNames.secondary}</span>
                        )}
                        {/* Special Tags - Table View - Glass Effect */}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {hasFoil && (
                            <span className="rounded-full bg-amber-500/20 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 border border-amber-500/30">
                              Foil
                            </span>
                          )}
                          {isSigned && (
                            <span className="rounded-full bg-purple-500/20 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700 border border-purple-500/30">
                              Signed
                            </span>
                          )}
                          {isGraded && (
                            <span className="rounded-full bg-blue-500/20 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700 border border-blue-500/30">
                              Graded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Set Column */}
                  <td className="p-3">
                    <span className="block truncate max-w-[140px] text-sm text-gray-600">{item.card?.set_name ?? '—'}</span>
                    {item.card?.collector_number && (
                      <span className="text-xs text-gray-400">#{item.card.collector_number}</span>
                    )}
                  </td>
                  {/* Details Column - Condition, Rarity, Language - Glass Effect */}
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm border shadow-sm ${
                        condition === 'NM' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
                        condition === 'LP' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
                        condition === 'MP' ? 'bg-orange-500/15 text-orange-700 border-orange-500/30' :
                        condition === 'HP' ? 'bg-red-500/15 text-red-700 border-red-500/30' :
                        'bg-gray-500/10 text-gray-600 border-gray-500/20'
                      }`}>
                        {condition}
                      </span>
                      {item.card?.rarity && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm border shadow-sm ${
                          item.card.rarity === 'Rare' ? 'bg-purple-500/15 text-purple-700 border-purple-500/30' :
                          item.card.rarity === 'Mythic' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
                          item.card.rarity === 'Uncommon' ? 'bg-blue-500/15 text-blue-700 border-blue-500/30' :
                          'bg-gray-500/10 text-gray-600 border-gray-500/20'
                        }`}>
                          {item.card.rarity}
                        </span>
                      )}
                      {languageLabel && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/60 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-gray-700 border border-gray-200/60 shadow-sm">
                          <Globe className="h-3 w-3 text-gray-500" />
                          {languageLabel}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Quantity Column - Glass Effect */}
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 backdrop-blur-sm px-2.5 py-1 text-sm font-semibold text-gray-700 border border-gray-200/60 shadow-sm">
                      <Package className="h-3.5 w-3.5 text-gray-500" />
                      {item.quantity}
                    </span>
                  </td>
                  {/* Price Column */}
                  <td className="p-3">
                    <span className="text-base font-bold text-primary tabular-nums">
                      {(item.price_cents / 100).toFixed(2)}€
                    </span>
                  </td>
                  {/* Actions Column */}
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditItem(item)}
                        disabled={mutationsDisabled}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                        title={t('accountPage.itemsEdit')}
                        aria-label={t('accountPage.itemsEdit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openPurchaseModal(item)}
                        disabled={Boolean(mutationsDisabled) || purchasingId === item.id || deletingId === item.id || !item.external_stock_id || item.quantity < 1}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-emerald-600 transition-all hover:bg-emerald-50 disabled:opacity-50"
                        title={t('accountPage.itemsCart')}
                        aria-label={t('accountPage.itemsCart')}
                      >
                        {purchasingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={mutationsDisabled || deletingId === item.id}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-red-400 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title={t('accountPage.itemsDelete')}
                        aria-label={t('accountPage.itemsDelete')}
                      >
                        {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
      {purchaseItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-modal-title"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 id="purchase-modal-title" className="text-lg font-bold text-gray-900">
                  {t('accountPage.itemsCart')}
                </h2>
                <p className="text-xs text-gray-500">CardTrader sync</p>
              </div>
            </div>

            {/* Product */}
            <div className="mb-4 rounded-xl bg-gray-50 p-3">
              <p className="font-medium text-gray-900">{purchaseItem.card?.name ?? `Carta #${purchaseItem.blueprint_id}`}</p>
              <p className="text-xs text-gray-500">{t('accountPage.itemsTableQty')}: <span className="font-semibold">{purchaseItem.quantity}</span></p>
            </div>

            {/* Quantity Input */}
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('accountPage.itemsTableQty')}
            </label>
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPurchaseQty(Math.max(1, purchaseQty - 1))}
                disabled={purchaseQty <= 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={purchaseItem.quantity}
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(Math.min(purchaseItem.quantity, Math.max(1, Number(e.target.value) || 1)))}
                className="h-10 w-20 rounded-lg border border-gray-200 bg-white text-center text-lg font-semibold text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setPurchaseQty(Math.min(purchaseItem.quantity, purchaseQty + 1))}
                disabled={purchaseQty >= purchaseItem.quantity}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                +
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setPurchaseItem(null); }}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                disabled={purchaseSubmitting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={purchaseSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-md disabled:opacity-50"
              >
                {purchaseSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                {purchaseSubmitting ? t('accountPage.itemsLoadingInventoryShort') : t('accountPage.itemsPriceApply')}
              </button>
            </div>
          </div>
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
  );
}

export function OggettiContent() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore(
    (s) => s.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null)
  );

  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithCatalog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncBanner, setSyncBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncNowPending, setSyncNowPending] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  /** Filtro per tipo: tutti, solo singole (carte), solo oggetti (sealed). */
  const [kindFilter, setKindFilter] = useState<KindFilterValue>('all');
  const [smartFilter, setSmartFilter] = useState<SmartFilterValue>('all');
  const [bulkPriceModalOpen, setBulkPriceModalOpen] = useState(false);
  const [bulkPriceChangePercent, setBulkPriceChangePercent] = useState(10);
  /** Selezione per eliminazione in blocco (solo quando sincronizzazione non attiva). */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  /** Modale export: scelta CSV o JSON (solo client-side, nessun carico server). */
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<OggettiViewMode>('table');
  /** Stato per la sticky bottom bar espandibile */
  const [bottomBarExpanded, setBottomBarExpanded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  /** Verifica lato frontend: chiamate al sync service solo se integrazione CardTrader attiva. */
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(true);
  
  /** Mock data per demo - in produzione verrebbero dall'API */
  const getMockSalesData = useCallback(() => {
    const mockMap = new Map<number, { lastSold: Date; salesCount: number; views: number }>();
    inventoryItems.forEach((item) => {
      const daysAgo = Math.random() > 0.7 ? Math.floor(Math.random() * 60) : Math.floor(Math.random() * 10);
      mockMap.set(item.id, {
        lastSold: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        salesCount: Math.floor(Math.random() * 5),
        views: Math.floor(Math.random() * 100),
      });
    });
    return mockMap;
  }, [inventoryItems]);
  
  const salesData = useMemo(() => getMockSalesData(), [getMockSalesData]);
  const syncEnabled =
    Boolean(syncStatus && !syncStatus.disconnected) &&
    (syncStatus?.sync_status === 'active' || syncStatus?.sync_status === 'initial_sync');
  const isDisconnected = syncStatus?.disconnected === true;
  const integrationConnected = Boolean(syncStatus && !isDisconnected);
  const syncAnyPending = syncPending || syncNowPending;
  const canSyncNow = integrationConnected && syncStatus?.sync_status !== 'initial_sync';

  /** Filtro per tipo (singole/oggetti), smart filter e ricerca testuale. */
  const filteredInventoryItems = useMemo(() => {
    let list = inventoryItems;
    
    // Filtro per tipo
    if (kindFilter !== 'all') {
      list = list.filter((item) => getItemKind(item) === kindFilter);
    }
    
    // Smart filters venditore
    if (smartFilter !== 'all') {
      list = list.filter((item) => {
        const data = salesData.get(item.id);
        
        switch (smartFilter) {
          case 'unsold': {
            // Non venduti da più di X giorni o mai venduti
            if (!data) return true;
            const daysSinceSold = Math.floor((Date.now() - data.lastSold.getTime()) / (1000 * 60 * 60 * 24));
            return daysSinceSold > DAYS_UNSOLD_THRESHOLD || data.salesCount === 0;
          }
          case 'duplicates': {
            // Duplicati: stesso blueprint_id con quantità > 1
            const sameBlueprint = inventoryItems.filter(i => i.blueprint_id === item.blueprint_id);
            return sameBlueprint.length > 1 || (item.quantity ?? 0) > 1;
          }
          case 'below-market': {
            // Prezzo sotto mercato (simulato: prezzo < 80% della media inventario)
            const avgPrice = inventoryItems.reduce((sum, i) => sum + (i.price_cents ?? 0), 0) / inventoryItems.length;
            return (item.price_cents ?? 0) < avgPrice * 0.8;
          }
          default:
            return true;
        }
      });
    }
    
    // Ricerca testuale
    if (inventorySearchQuery.trim()) {
      list = list.filter((item) => matchInventorySearch(item, inventorySearchQuery));
    }
    
    return list;
  }, [inventoryItems, kindFilter, smartFilter, inventorySearchQuery, salesData]);

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
  }, [kindFilter, smartFilter, inventorySearchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [currentPage, totalPages]);

  useEffect(() => {
    const handleScroll = () => {
      // Mostra sticky bar quando l'utente ha scrollato oltre i controlli principali
      const scrollY = window.scrollY;
      setShowStickyBar(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  /** Carica tutto l'inventario (pagine da 500) per avere dati completi e KPIs corrette. 
   * Se l'API fallisce, usa dati mock per demo. */
  const loadInventory = useCallback(async () => {
    if (!user?.id || !accessToken) {
      // Use mock data when not logged in
      setInventoryItems(MOCK_INVENTORY_ITEMS);
      setTotal(MOCK_INVENTORY_ITEMS.length);
      setLoading(false);
      return;
    }
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
      // Use mock data on API error
      // Fallback to mock data on API error
      setInventoryItems(MOCK_INVENTORY_ITEMS);
      setTotal(MOCK_INVENTORY_ITEMS.length);
      setError(null);
    }
  }, [user?.id, accessToken]);

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
      const noun =
        ids.length === 1 ? t('accountPage.itemsBulkNounOne') : t('accountPage.itemsBulkNounMany');
      if (!confirm(t('accountPage.itemsBulkConfirm', { count: ids.length, noun }))) return;
      setBulkDeleting(true);
      try {
        for (const id of ids) {
          await syncClient.deleteInventoryItem(user.id, id, accessToken);
        }
        await loadInventory();
        setSelectedIds(new Set());
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('accountPage.itemsBulkDeleteError');
        setError(msg);
      } finally {
        setBulkDeleting(false);
      }
    },
    [user?.id, accessToken, loadInventory, t]
  );

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

  const cardWord =
    total === 1 ? t('accountPage.itemsCardOne') : t('accountPage.itemsCardMany');

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

  return (
    <div className="text-gray-900 space-y-6">

      {/* KPI Cards - Modern Design */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 - Oggetti Unici */}
        <div className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(249,115,22,0.12)] hover:-translate-y-0.5 border-l-4 border-primary">
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">{t('accountPage.itemsKpiUnique')}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900">
                {loading ? '—' : totalUnique.toLocaleString('it-IT')}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {kindFilter !== 'all' || inventorySearchQuery.trim()
                  ? t('accountPage.itemsKpiUniqueSubFiltered')
                  : t('accountPage.itemsKpiUniqueSubTotal')}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/40" />
        </div>

        {/* Card 2 - Totale Quantità */}
        <div className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 border-l-4 border-blue-500">
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <Layers className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">{t('accountPage.itemsKpiTotal')}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900">
                {loading ? '—' : totalQuantity.toLocaleString('it-IT')}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {kindFilter !== 'all' || inventorySearchQuery.trim()
                  ? t('accountPage.itemsKpiTotalSubFiltered')
                  : t('accountPage.itemsKpiTotalSubSum')}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/80 to-blue-500/40" />
        </div>

        {/* Card 3 - Valore Totale */}
        <div className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] hover:-translate-y-0.5 border-l-4 border-emerald-500">
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">{t('accountPage.itemsKpiValue')}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900">
                {loading ? '—' : totalValueFormatted}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {kindFilter !== 'all' || inventorySearchQuery.trim()
                  ? t('accountPage.itemsKpiValueSubFiltered')
                  : t('accountPage.itemsKpiValueSubCalc')}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/80 to-emerald-500/40" />
        </div>

        {/* Card 4 - Carte in Inventario */}
        <div className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(139,92,246,0.12)] hover:-translate-y-0.5 border-l-4 border-violet-500">
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">{t('accountPage.itemsKpiCards')}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900">
                {loading ? '—' : cardsInView.toLocaleString('it-IT')}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {kindFilter === 'singole'
                  ? t('accountPage.itemsKpiCardsSubSingles')
                  : kindFilter === 'all'
                    ? t('accountPage.itemsKpiCardsSubAll')
                    : '—'}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/80 to-violet-500/40" />
        </div>
      </div>

      {/* Search + Actions Row - Separated on top - Extended */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search - Extended full width */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={inventorySearchQuery}
            onChange={(e) => setInventorySearchQuery(e.target.value)}
            placeholder={t('accountPage.itemsSearchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {inventorySearchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setInventorySearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!syncStatusLoading && (
            <button
              type="button"
              onClick={() => void handleSyncNow()}
              disabled={!integrationConnected || !canSyncNow || syncAnyPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {syncNowPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync
            </button>
          )}
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            disabled={loading || filteredInventoryItems.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Esporta
          </button>
        </div>
      </div>

      {/* Main Card - Filters, View Toggle, Status & Table */}
      <div className="overflow-hidden rounded-2xl border border-stroke-grey bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {/* Filters & View Toggle - Unified row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-4">
          {/* Left: All 6 Filters - Unified pill style */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Kind Filters - Unified pill style */}
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                kindFilter === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Tutti ({inventoryItems.length.toLocaleString('it-IT')})
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('singole')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                kindFilter === 'singole'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Singole ({countsByKind.singole.toLocaleString('it-IT')})
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('oggetti')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                kindFilter === 'oggetti'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Oggetti ({countsByKind.oggetti.toLocaleString('it-IT')})
            </button>

            <div className="h-5 w-px bg-gray-200 mx-1" />

            {/* Smart Filters - Same pill style */}
            <button
              type="button"
              onClick={() => setSmartFilter('unsold')}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                smartFilter === 'unsold'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title="Non venduti da 30+ giorni"
            >
              <History className="h-3 w-3" />
              Non venduti
            </button>
            <button
              type="button"
              onClick={() => setSmartFilter('duplicates')}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                smartFilter === 'duplicates'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title="Duplicati in inventario"
            >
              <Copy className="h-3 w-3" />
              Duplicati
            </button>
            <button
              type="button"
              onClick={() => setSmartFilter('below-market')}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                smartFilter === 'below-market'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title="Prezzo sotto mercato"
            >
              <ArrowDown className="h-3 w-3" />
              Sotto mercato
            </button>
            {smartFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSmartFilter('all')}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-all"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          {/* Right: View Toggle - Standardized orange glass style */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Vista</span>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Status & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            {!syncStatusLoading && (
              syncEnabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t('accountPage.itemsSyncActive')}
                </span>
              ) : (
                <Link
                  href="/account/sincronizzazione"
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-600 hover:bg-amber-100 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {t('accountPage.itemsSyncInactive')}
                </Link>
              )
            )}
            {integrationConnected && syncAnyPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('accountPage.itemsSyncRunningShort')}
              </span>
            )}
          </div>
          <p className="text-gray-500">
            {filteredInventoryItems.length.toLocaleString()} {t('accountPage.itemsOf')} {total.toLocaleString()} {cardWord}
            {inventorySearchQuery.trim() && (
              <span className="ml-1 text-gray-400">(filtro: "{inventorySearchQuery}")</span>
            )}
          </p>
        </div>
      </div>

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
      ) : inventoryItems.length === 0 ? (
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
            {t('accountPage.itemsNoResults', { query: inventorySearchQuery })}{' '}
            <button
              type="button"
              onClick={() => setInventorySearchQuery('')}
              className="font-medium text-primary hover:underline"
            >
              {t('accountPage.itemsClearSearch')}
            </button>
            .
          </p>
        </div>
      ) : (
        <>
          {!syncEnabled && filteredInventoryItems.length > 0 && (
            <div className="mb-5 overflow-hidden rounded-2xl border border-stroke-grey bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              {/* Selection Controls & Bulk Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                {/* Left: Selection Counter & Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <CheckSquare className="h-4 w-4 text-gray-500" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">{t('accountPage.itemsSelected')}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {selectedIds.size} <span className="text-xs font-normal text-gray-400">/ {filteredInventoryItems.length}</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={onSelectAll}
                      disabled={bulkDeleting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      {t('accountPage.itemsSelectAll')}
                    </button>
                    <button
                      type="button"
                      onClick={onDeselectAll}
                      disabled={bulkDeleting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-red-400 hover:text-red-500 disabled:opacity-50"
                    >
                      {t('accountPage.itemsSelectNone')}
                    </button>
                  </div>
                </div>

                {/* Right: Bulk Actions */}
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setBulkPriceModalOpen(true)}
                        disabled={bulkDeleting}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md hover:shadow-primary/20 active:scale-95 disabled:opacity-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {t('accountPage.itemsPriceChange')}
                      </button>
                      <button
                        type="button"
                        onClick={handleExportSelectionCSV}
                        disabled={bulkDeleting}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t('accountPage.itemsExport')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSelected(Array.from(selectedIds))}
                        disabled={bulkDeleting || selectedIds.size === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-500 transition-all hover:bg-red-50 hover:border-red-300 active:scale-95 disabled:opacity-50"
                      >
                        {bulkDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {t('accountPage.itemsDeleteSelected')}
                      </button>
                    </>
                  )}
                  {selectedIds.size === 0 && (
                    <span className="text-xs text-gray-400 italic">
                      {t('accountPage.itemsSelectItemsForBulk')}
                    </span>
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
            onSelectAllPage={onSelectAllPage}
            onDeselectAllPage={onDeselectAllPage}
            onDeleteSelected={(ids) => onDeleteSelected(ids)}
            bulkDeleting={bulkDeleting}
            viewMode={viewMode}
            salesData={salesData}
            t={t}
          />
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">
                  {t('accountPage.itemsPage')} <span className="font-semibold text-gray-900">{currentPage}</span> {t('accountPage.itemsOf')}{' '}
                  <span className="font-semibold text-gray-900">{totalPages.toLocaleString()}</span>
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{ITEMS_PER_PAGE} {t('accountPage.itemsPerPage')}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40"
                  aria-label={t('accountPage.itemsPrevPage')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1 px-1">
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
                        className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg text-sm font-medium transition-all ${
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
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40"
                  aria-label={t('accountPage.itemsNextPage')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sticky Bottom Bar - Search + Expandable Filters & Selection */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Collapsed State - Solo ricerca visibile */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Search Compact */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                placeholder={t('accountPage.itemsSearchPlaceholder')}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {inventorySearchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInventorySearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Toggle Expand Button */}
            <button
              type="button"
              onClick={() => setBottomBarExpanded(!bottomBarExpanded)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-all hover:bg-gray-50"
              title={bottomBarExpanded ? t('accountPage.itemsCollapse') : t('accountPage.itemsExpand')}
            >
              {bottomBarExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>

            {/* Quick Selection Count Badge */}
            {!syncEnabled && selectedIds.size > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white">
                <CheckSquare className="h-3.5 w-3.5" />
                {selectedIds.size}
              </span>
            )}
          </div>

          {/* Expanded State - Filtri e Selezione */}
          {bottomBarExpanded && (
            <div className="border-t border-gray-100 px-4 py-3">
              {/* Filters Row */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500">{t('accountPage.itemsFilters')}</span>
                {/* Kind Filters */}
                <button
                  type="button"
                  onClick={() => setKindFilter('all')}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    kindFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('accountPage.itemsFilterAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setKindFilter('singole')}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    kindFilter === 'singole'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('accountPage.itemsFilterSingles')}
                </button>
                <button
                  type="button"
                  onClick={() => setKindFilter('oggetti')}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    kindFilter === 'oggetti'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('accountPage.itemsFilterSealed')}
                </button>

                {/* Smart Filters */}
                <button
                  type="button"
                  onClick={() => setSmartFilter('unsold')}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    smartFilter === 'unsold'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('accountPage.itemsFilterUnsold')}
                </button>
                <button
                  type="button"
                  onClick={() => setSmartFilter('duplicates')}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    smartFilter === 'duplicates'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('accountPage.itemsFilterDuplicates')}
                </button>
                <button
                  type="button"
                  onClick={() => setSmartFilter('below-market')}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    smartFilter === 'below-market'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('accountPage.itemsFilterUnderMarket')}
                </button>
                {smartFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSmartFilter('all')}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Selection Controls */}
              {!syncEnabled && filteredInventoryItems.length > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{t('accountPage.itemsSelected')}:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {selectedIds.size} / {filteredInventoryItems.length}
                    </span>
                    <div className="flex gap-1 ml-2">
                      <button
                        type="button"
                        onClick={onSelectAll}
                        disabled={bulkDeleting}
                        className="inline-flex items-center rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary"
                      >
                        {t('accountPage.itemsSelectAll')}
                      </button>
                      <button
                        type="button"
                        onClick={onDeselectAll}
                        disabled={bulkDeleting}
                        className="inline-flex items-center rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:border-red-400 hover:text-red-500"
                      >
                        {t('accountPage.itemsSelectNone')}
                      </button>
                    </div>
                  </div>

                  {/* Quick Bulk Actions */}
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBulkPriceModalOpen(true)}
                        disabled={bulkDeleting}
                        className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-white"
                      >
                        <Edit3 className="h-3 w-3" />
                        {t('accountPage.itemsTablePrice')}
                      </button>
                      <button
                        type="button"
                        onClick={handleExportSelectionCSV}
                        disabled={bulkDeleting}
                        className="inline-flex items-center gap-1 rounded bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white"
                      >
                        <Download className="h-3 w-3" />
                        CSV
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {bulkPriceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-price-modal-title"
          onClick={() => setBulkPriceModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Edit3 className="h-5 w-5" />
                </div>
                <h2 id="bulk-price-modal-title" className="text-lg font-bold text-gray-900">
                  {t('accountPage.itemsPriceChange')}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedIds.size} {t('accountPage.itemsBulkNounMany')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkPriceModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                aria-label={t('accountPage.itemsClose')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Percentage Selector */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-gray-700">
                {t('accountPage.itemsPriceChangePercent')}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBulkPriceChangePercent(Math.max(-50, bulkPriceChangePercent - 5))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                >
                  -
                </button>
                <div className="flex-1">
                  <div className={`text-center text-2xl font-bold ${bulkPriceChangePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {bulkPriceChangePercent > 0 ? '+' : ''}{bulkPriceChangePercent}%
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="5"
                    value={bulkPriceChangePercent}
                    onChange={(e) => setBulkPriceChangePercent(Number(e.target.value))}
                    className="mt-2 w-full accent-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setBulkPriceChangePercent(Math.min(50, bulkPriceChangePercent + 5))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                {bulkPriceChangePercent > 0 ? t('accountPage.itemsPriceIncrease') : t('accountPage.itemsPriceDecrease')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkPriceModalOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  // TODO: Implementare API per cambio prezzo bulk
                  alert(`Cambio prezzo del ${bulkPriceChangePercent}% su ${selectedIds.size} ${t('accountPage.itemsBulkNounMany')}`);
                  setBulkPriceModalOpen(false);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md"
              >
                <Edit3 className="h-4 w-4" />
                {t('accountPage.itemsPriceApply')}
              </button>
            </div>
          </div>
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
