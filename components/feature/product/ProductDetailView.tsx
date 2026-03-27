'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Minus, Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { getCardImageUrl } from '@/lib/assets';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getGameLabel, buildBreadcrumbsFromCard, type CardDocument } from '@/lib/product-detail';
import { syncClient, type InventoryItemResponse, type ListingItem } from '@/lib/api/sync-client';
import { fetchCardsByBlueprintIds } from '@/lib/meilisearch-cards-by-ids';
import type { CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import { AuctionCreateWizard } from '@/components/feature/aste/create/AuctionCreateWizard';
import { InventoryEditModal } from '@/components/feature/sync/InventoryEditModal';
import { listingToInventoryEditItem } from '@/lib/product-detail/listing-to-inventory-item';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { getCdnImageUrl } from '@/lib/config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { COUNTRIES } from '@/lib/registrati/schema';
import { ProductPriceChart } from '@/components/feature/product/ProductPriceChart';

const PRIMARY_BLUE = '#1D3160';

/** Restituisce l’emoji bandiera per un codice paese ISO 2 lettere (es. IT → 🇮🇹). */
function countryFlag(code: string): string {
  if (code.length !== 2) return '';
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('');
}
const ACCENT_ORANGE = '#f97316';

type ProductDetailViewProps =
  | { card: CardDocument; slug?: string; title?: string; subtitle?: string; breadcrumbs?: { label: string; href?: string }[]; imageSrc?: string }
  | { card?: never; slug: string; title?: string; subtitle?: string; breadcrumbs?: { label: string; href?: string }[]; imageSrc?: string };

export function ProductDetailView(props: ProductDetailViewProps) {
  const { card } = props;
  const { selectedLang } = useLanguage();
  const { t } = useTranslation();
  const displayNames = card ? getCardDisplayNames(card, selectedLang) : null;

  const slug = props.slug ?? card?.id ?? '';
  const title =
    props.title ??
    (displayNames ? displayNames.primary.toUpperCase() : card ? card.name.toUpperCase() : "MOWGLI - CUCCIOLO D'UOMO");
  const subtitle =
    props.subtitle ??
    (card && displayNames
      ? (displayNames.secondary ? `${displayNames.secondary} – ${card.set_name}` : card.set_name)
      : card
        ? card.set_name
        : "SUSSURRI NEL POZZO - MOWGLI - MAN CUB - SINGLES");
  const breadcrumbs = props.breadcrumbs ?? (card ? buildBreadcrumbsFromCard(card) : [
    { label: 'MAGIC: THE GATHERING', href: '#' },
    { label: 'SINGLES', href: '#' },
    { label: 'ECLISSI DI QUALCOSA', href: '#' },
    { label: 'STORMO DELLA SCISSIONE', href: '#' },
  ]);
  const imageSrc = props.imageSrc ?? (card?.image != null ? getCardImageUrl(card.image) : null) ?? getCdnImageUrl('kyurem.png');
  const [activeTab, setActiveTab] = useState<'INFO' | 'VENDI' | 'SCAMBIA' | 'ASTA'>('INFO');
  const [sellerSubTab, setSellerSubTab] = useState<'VENDITORI' | 'SCAMBIO' | 'ASTA'>('VENDITORI');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [soloFoil, setSoloFoil] = useState(false);
  const [tipoVenditore, setTipoVenditore] = useState<string | null>(null);
  const [firmata, setFirmata] = useState<'SÌ' | 'NO' | 'ENTRAMBI'>('ENTRAMBI');
  const [alterata, setAlterata] = useState<'SÌ' | 'NO' | 'ENTRAMBI'>('ENTRAMBI');
  const [quantita, setQuantita] = useState(33);
  const [posizioneVenditore, setPosizioneVenditore] = useState<string>(() => COUNTRIES[0].code);

  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore(
    (s) => s.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null)
  );

  const blueprintIdForAuction = useMemo(() => {
    const raw = card?.cardtrader_id;
    if (raw == null) return null;
    const n =
      typeof raw === 'number'
        ? raw
        : parseInt(String(raw).includes(':') ? String(raw).split(':')[0] : String(raw), 10);
    return Number.isFinite(n) && n >= 1 ? n : null;
  }, [card?.cardtrader_id]);

  const [auctionInventoryItems, setAuctionInventoryItems] = useState<InventoryItemWithCatalog[]>([]);
  const [auctionInventoryLoading, setAuctionInventoryLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !accessToken || !blueprintIdForAuction) {
      setAuctionInventoryItems([]);
      setAuctionInventoryLoading(false);
      return;
    }
    let cancelled = false;
    setAuctionInventoryLoading(true);
    (async () => {
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
        const filtered = allItems.filter((i) => i.blueprint_id === blueprintIdForAuction);
        let blueprintToCard: Record<number, CardCatalogHit> = {};
        if (filtered.length > 0) {
          const map = await fetchCardsByBlueprintIds([blueprintIdForAuction]);
          blueprintToCard = { ...map };
        }
        const merged: InventoryItemWithCatalog[] = filtered.map((item) => ({
          ...item,
          card: blueprintToCard[item.blueprint_id],
        }));
        if (!cancelled) setAuctionInventoryItems(merged);
      } catch {
        if (!cancelled) setAuctionInventoryItems([]);
      } finally {
        if (!cancelled) setAuctionInventoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, accessToken, blueprintIdForAuction]);

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItemWithCatalog | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<number | null>(null);
  const [listingActionMessage, setListingActionMessage] = useState<string | null>(null);
  const [purchaseListing, setPurchaseListing] = useState<ListingItem | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);

  /* Form "Metti in vendita" (tab VENDI) */
  const [quantitaVendi, setQuantitaVendi] = useState(1);
  const [linguaVendi, setLinguaVendi] = useState('en');
  const [condizioneVendi, setCondizioneVendi] = useState('near_mint');
  const [commentiVendi, setCommentiVendi] = useState('');
  const [prezzoVendi, setPrezzoVendi] = useState('0.00');
  const [saveSettings, setSaveSettings] = useState(false);
  const [extraFoil, setExtraFoil] = useState(false);
  const [extraSigned, setExtraSigned] = useState(false);
  const [extraAltered, setExtraAltered] = useState(false);

  /* Modal Condizione */
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [modalCondition, setModalCondition] = useState(condizioneVendi);

  const CONDIZIONE_OPTIONS = ['HT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'] as const;
  const [condizioneMinima, setCondizioneMinima] = useState<string>('HT');
  const [linguaCarta, setLinguaCarta] = useState<string | null>(null);

  const CONDITION_OPTIONS_MAP: { value: string; label: string }[] = [
    { value: 'near_mint', label: 'Near Mint' },
    { value: 'mint', label: 'Mint' },
    { value: 'ex', label: 'Excellent' },
    { value: 'gd', label: 'Good' },
    { value: 'lp', label: 'Light Played' },
    { value: 'pl', label: 'Played' },
    { value: 'po', label: 'Poor' },
  ];

  const LINGUA_CARTA = [
    { code: 'IT', label: 'Italia' },
    { code: 'JP', label: 'Giappone' },
    { code: 'GB', label: 'Regno Unito' },
    { code: 'ES', label: 'Spagna' },
    { code: 'DE', label: 'Germania' },
    { code: 'FR', label: 'Francia' },
  ] as const;

  /** Mappa codice lingua → etichetta per select Lingua (tab VENDI) e per Lingue disponibili (INFO). */
  const LANG_OPTIONS: { code: string; label: string }[] = useMemo(
    () => [
      { code: 'en', label: 'English' },
      { code: 'it', label: 'Italiano' },
      { code: 'de', label: 'Deutsch' },
      { code: 'fr', label: 'Français' },
      { code: 'es', label: 'Español' },
      { code: 'pt', label: 'Português' },
      { code: 'ja', label: '日本語' },
      { code: 'jp', label: '日本語' },
      { code: 'ko', label: '한국어' },
      { code: 'zh', label: '中文' },
    ],
    []
  );
  const langLabelByCode = useMemo(() => Object.fromEntries(LANG_OPTIONS.map((o) => [o.code, o.label])), [LANG_OPTIONS]);

  /** Opzioni Lingua nel tab VENDI: se la carta ha available_languages, solo quelle; altrimenti tutte. */
  const vendiLanguageOptions = useMemo(() => {
    if (card?.available_languages?.length) {
      return card.available_languages
        .map((code) => ({ code, label: langLabelByCode[code] ?? code }))
        .filter((o, i, arr) => arr.findIndex((x) => x.code === o.code) === i);
    }
    return LANG_OPTIONS.filter((o) => o.code !== 'jp');
  }, [card?.available_languages, langLabelByCode]);

  useEffect(() => {
    if (vendiLanguageOptions.length && !vendiLanguageOptions.some((o) => o.code === linguaVendi)) {
      setLinguaVendi(vendiLanguageOptions[0].code);
    }
  }, [vendiLanguageOptions, linguaVendi]);

  const refreshListings = useCallback(async () => {
    const raw = card?.cardtrader_id;
    if (raw == null) {
      setListings([]);
      setListingsLoading(false);
      setListingsError(null);
      return;
    }
    const blueprintId =
      typeof raw === 'number'
        ? raw
        : parseInt(String(raw).includes(':') ? String(raw).split(':')[0] : String(raw), 10);
    if (!Number.isFinite(blueprintId) || blueprintId < 1) {
      setListings([]);
      setListingsLoading(false);
      setListingsError(null);
      return;
    }
    setListingsLoading(true);
    setListingsError(null);
    try {
      const res = await syncClient.getListingsByBlueprint(blueprintId);
      setListings(res.listings ?? []);
    } catch (err) {
      setListings([]);
      setListingsError(err instanceof Error ? err.message : 'Errore caricamento venditori');
    } finally {
      setListingsLoading(false);
    }
  }, [card?.cardtrader_id]);

  useEffect(() => {
    void refreshListings();
  }, [refreshListings]);

  const pollSyncTaskThenRefresh = useCallback(
    async (taskId: string) => {
      const maxPolls = 60;
      const intervalMs = 1500;
      if (!accessToken) return;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((r) => setTimeout(r, intervalMs));
        try {
          const status = await syncClient.getTaskStatus(taskId, accessToken);
          if (status.ready) {
            await refreshListings();
            return;
          }
        } catch {
          // transient
        }
      }
    },
    [accessToken, refreshListings]
  );

  const isOwnListing = useCallback(
    (item: ListingItem) => Boolean(user?.id && String(user.id) === String(item.seller_id)),
    [user?.id]
  );

  const handleOwnerQtyDelta = useCallback(
    async (item: ListingItem, delta: -1 | 1) => {
      if (!user?.id || !accessToken) {
        setListingActionMessage('Accedi per gestire le tue inserzioni.');
        return;
      }
      setListingActionMessage(null);
      setRowBusyId(item.item_id);
      try {
        if (delta === -1 && item.quantity <= 1) {
          if (
            !confirm(
              'Rimuovere questo articolo dall’inventario? Se la sincronizzazione CardTrader è attiva, verrà aggiornata anche lì.'
            )
          ) {
            return;
          }
          const res = await syncClient.deleteInventoryItem(user.id, item.item_id, accessToken);
          await refreshListings();
          if (res.sync_queue_error) setListingActionMessage(res.sync_queue_error);
          else if (res.sync_task_id) void pollSyncTaskThenRefresh(res.sync_task_id);
        } else {
          const nextQty = Math.max(0, item.quantity + delta);
          if (nextQty < 1) return;
          const res = await syncClient.updateInventoryItem(
            user.id,
            item.item_id,
            { quantity: nextQty },
            accessToken
          );
          await refreshListings();
          if (res.sync_queue_error) setListingActionMessage(res.sync_queue_error);
          else if (res.sync_task_id) void pollSyncTaskThenRefresh(res.sync_task_id);
        }
      } catch (e) {
        setListingActionMessage(e instanceof Error ? e.message : 'Operazione non riuscita');
      } finally {
        setRowBusyId(null);
      }
    },
    [user?.id, accessToken, refreshListings, pollSyncTaskThenRefresh]
  );

  const handleEditSubmit = useCallback(
    async (form: {
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
      if (!editingItem || !user?.id || !accessToken) return;
      setSavingEdit(true);
      setListingActionMessage(null);
      try {
        const properties: Record<string, unknown> = {
          ...(editingItem.properties as Record<string, unknown> | undefined),
          condition: form.condition || undefined,
          mtg_language: form.mtg_language || undefined,
          signed: form.signed ?? (editingItem.properties && (editingItem.properties as Record<string, unknown>).signed),
          altered: form.altered ?? (editingItem.properties && (editingItem.properties as Record<string, unknown>).altered),
          mtg_foil: form.mtg_foil ?? (editingItem.properties && (editingItem.properties as Record<string, unknown>).mtg_foil),
        };
        const res = await syncClient.updateInventoryItem(
          user.id,
          editingItem.id,
          {
            quantity: form.quantity,
            price_cents: form.price_cents,
            description: form.description || null,
            graded: form.graded,
            properties,
          },
          accessToken
        );
        setEditingItem(null);
        await refreshListings();
        if (res.sync_queue_error) setListingActionMessage(res.sync_queue_error);
        else if (res.sync_task_id) void pollSyncTaskThenRefresh(res.sync_task_id);
      } catch (e) {
        setListingActionMessage(e instanceof Error ? e.message : 'Salvataggio non riuscito');
      } finally {
        setSavingEdit(false);
      }
    },
    [editingItem, user?.id, accessToken, refreshListings, pollSyncTaskThenRefresh]
  );

  const handleConfirmPurchase = useCallback(async () => {
    if (!purchaseListing || !user?.id || !accessToken) return;
    const safeQty = Math.max(1, Math.min(purchaseQty, purchaseListing.quantity));
    setPurchaseSubmitting(true);
    setListingActionMessage(null);
    try {
      const res = await syncClient.purchaseInventoryItem(
        purchaseListing.seller_id,
        purchaseListing.item_id,
        { quantity: safeQty },
        accessToken
      );
      if (res.status === 'success') {
        setPurchaseListing(null);
        await refreshListings();
      } else {
        setListingActionMessage(res.message || res.error || 'Acquisto non completato');
      }
    } catch (e) {
      setListingActionMessage(e instanceof Error ? e.message : 'Errore durante l’acquisto');
    } finally {
      setPurchaseSubmitting(false);
    }
  }, [purchaseListing, purchaseQty, user?.id, accessToken, refreshListings]);

  /* All’apertura della pagina i filtri partono aperti e dopo 1 secondo si chiudono in automatico (per far vedere che ci sono). */
  useEffect(() => {
    const t = setTimeout(() => setFiltersOpen(false), 1000);
    return () => clearTimeout(t);
  }, []);

  /* Quando l'utente loggato ha un paese, usa quello come "Posizione venditore". */
  useEffect(() => {
    if (user?.country) setPosizioneVenditore(user.country);
  }, [user?.country]);

  const showImagePlaceholder = imageError || !imageSrc;
  const effectiveImageSrc = showImagePlaceholder ? '' : imageSrc;
  const isLocalImage = effectiveImageSrc.startsWith('/') && !effectiveImageSrc.startsWith('//');
  const gameLabel = card ? getGameLabel(card.game_slug) : null;

  const EBARTEX_LOGO_PLACEHOLDER = '/images/Logo%20Principale%20EBARTEX.png';

  const formatEuro = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);

  const tabs = [
    { id: 'INFO' as const, label: 'INFO' },
    { id: 'VENDI' as const, label: 'VENDI' },
    { id: 'SCAMBIA' as const, label: 'SCAMBIA' },
    { id: 'ASTA' as const, label: "METTI ALL'ASTA" },
  ];

  return (
    <div className="min-h-screen font-sans bg-[#F0F0F0] text-gray-900">
      <Header />

      {/* Sezione titolo: sfondo grigio come il resto della pagina; titolo e sottotitolo allineati a sinistra */}
      <section className="w-full bg-[#F0F0F0] border-b border-gray-300">
        <div className="container-content py-2 sm:py-2.5 lg:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <nav aria-label="Breadcrumb" className="text-xs font-medium text-gray-600 sm:text-sm min-w-0">
              {breadcrumbs.map((b, i) => (
                <span key={b.label}>
                  {b.href ? (
                    <Link href={b.href} className="hover:text-gray-900 hover:underline">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900">{b.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <span className="mx-1">/</span>}
                </span>
              ))}
            </nav>
            <Link href="#" className="text-xs font-medium text-gray-600 hover:text-gray-900 sm:text-sm shrink-0">
              HAI BISOGNO DI AIUTO?
            </Link>
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold uppercase tracking-tight text-gray-900 sm:text-xl md:text-2xl lg:text-3xl break-words">
              {title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-tight text-gray-700 break-words">
              {subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contenuto principale: card bianca su sfondo grigio – responsive padding e layout */}
      <section className="w-full bg-[#F0F0F0] px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 pb-4 sm:pb-6 min-h-0">
        <div className="container-content">
          <div className="flex flex-col rounded-lg bg-white shadow-md overflow-hidden md:flex-row min-h-0">
            {/* Colonna sinistra: immagine carta più piccola per adattarsi all'altezza del contenuto INFO */}
            <aside className="flex flex-col w-full md:w-[min(280px,26vw)] lg:min-w-[260px] flex-shrink-0 items-center p-3 sm:p-4 lg:p-4 bg-white border-b md:border-b-0 md:border-r border-gray-200">
              <div
                className="relative w-full overflow-hidden rounded-md shrink-0 border border-gray-800 max-w-[260px] flex flex-col items-center justify-center bg-gray-100"
                style={{ aspectRatio: '63/88' }}
              >
              {showImagePlaceholder ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                  <img
                    src={EBARTEX_LOGO_PLACEHOLDER}
                    alt="Ebartex"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                  />
                  <p className="mt-2 text-[10px] sm:text-xs font-medium text-gray-600 leading-tight">
                    Questa immagine non è al momento disponibile
                  </p>
                </div>
              ) : isLocalImage ? (
                <img
                  src={effectiveImageSrc}
                  alt={card?.name ?? title}
                  className="h-full w-full object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Image
                  src={effectiveImageSrc}
                  alt={card?.name ?? title}
                  fill
                  className="object-contain"
                  sizes="260px"
                  unoptimized
                  onError={() => setImageError(true)}
                  priority
                />
              )}
            </div>
            <button
              type="button"
              className="mt-2 w-full max-w-[240px] sm:max-w-[260px] flex items-center justify-center gap-2 py-1.5 px-3 rounded-md border border-gray-300 bg-white text-gray-700 hover:border-[#FF8800] hover:text-[#FF8800] transition-colors"
              aria-label="Aggiungi ai preferiti"
            >
              <svg width="20" height="18" viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
                <path d="M16 26s-14-8-14-15a6.5 6.5 0 0 1 13-2.5 6.5 6.5 0 0 1 13 2.5C28 18 16 26 16 26z" />
              </svg>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">PREFERITI</span>
            </button>
          </aside>

          {/* Colonna destra: tab squadrati (INFO = arancione sotto + linea destra) + contenuto */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#FAFAFA]">
            {/* Tab squadrati come Figma: occupano tutta la larghezza, distribuiti in modo uguale */}
            <div className="flex border-b border-gray-300 bg-[#E5E7EB]">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    'relative flex-1 min-w-0 min-h-[40px] px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold uppercase transition-colors border-r border-gray-300 last:border-r-0',
                    activeTab === t.id
                      ? 'bg-white text-gray-900 border-b-[3px] border-b-[#FF8800] border-r-2 border-r-[#FF8800]'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                  style={activeTab === t.id ? { marginBottom: '-1px' } : undefined}
                >
                  <span className="block truncate text-center">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Contenuto tab INFO: box info (sinistra) e grafico/prezzi (destra) – occupano bene lo spazio come screenshot */}
            {activeTab === 'INFO' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-3 sm:gap-4 lg:gap-4 p-3 sm:p-4 lg:p-4 min-w-0 w-full">
                {/* Box info carta: RARITÀ, NUMERO, STAMPATA IN, DISPONIBILI */}
                <div className="flex flex-col min-h-0 bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-stretch border-b border-gray-200 pb-2 sm:pb-3">
                    <div className="flex flex-col items-center pr-3 sm:pr-4 border-r border-gray-200">
                      <span className="text-[10px] font-bold uppercase text-black">RARITÀ</span>
                      <div className="mt-1">
                        {card?.rarity ? (
                          <span className="text-sm font-bold text-black">{card.rarity}</span>
                        ) : (
                          <Image src={getCdnImageUrl('stellina.png')} alt="" width={28} height={28} className="h-6 w-6 sm:h-7 sm:w-7 object-contain" aria-hidden unoptimized />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center pl-3 sm:pl-4 flex-1">
                      <span className="text-[10px] font-bold uppercase text-black">NUMERO</span>
                      <span className="mt-1 text-base sm:text-lg font-bold text-black">{card?.collector_number ?? '015'}</span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3">
                    <span className="text-[10px] font-bold uppercase text-black">STAMPATA IN</span>
                    <p className="mt-0.5 text-xs sm:text-sm font-bold uppercase text-black">
                      {card?.set_name ?? 'SUSSURRI NEL POZZO'}
                    </p>
                    {card && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        <Link
                          href={{
                            pathname: '/set',
                            query: {
                              set: card.set_name,
                              game: card.game_slug,
                            },
                          }}
                          className="inline-block text-xs font-medium text-[#FF8800] hover:underline uppercase"
                        >
                          MOSTRA IL SET
                        </Link>
                      </div>
                    )}
                  </div>
                  {card?.game_slug === 'mtg' && card?.available_languages && card.available_languages.length > 0 && (
                    <div className="mt-2 sm:mt-3">
                      <span className="text-[10px] font-bold uppercase text-black">LINGUE DISPONIBILI</span>
                      <p className="mt-0.5 text-xs sm:text-sm font-bold uppercase text-black">
                        {card.available_languages.map((code) => langLabelByCode[code] ?? code).join(', ')}
                      </p>
                    </div>
                  )}
                  <div className="mt-2 sm:mt-3">
                    <span className="text-[10px] font-bold uppercase text-black">DISPONIBILI</span>
                    <p className="mt-0.5 text-lg sm:text-xl font-bold text-black">1148</p>
                  </div>
                  <Link href="#" className="mt-2 sm:mt-3 inline-block text-[10px] font-medium text-[#FF8800] hover:underline">
                    Informazioni sull&apos;RSGP / Produttore
                  </Link>
                </div>
                {/* Box grafico e prezzi: occupa il resto della riga */}
                <div className="flex flex-col min-h-0 bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row flex-1 min-h-0 gap-3 sm:gap-4">
                    {/* Grafico prezzo stile Cardmarket: 6 mesi, frecce, arancione brand */}
                    <div className="flex flex-[1.5] min-w-0 flex-col min-h-[280px]">
                      <ProductPriceChart slug={slug} />
                    </div>
                    {/* Valore tendenza + Prezzo medio */}
                    <div className="flex flex-col justify-start sm:justify-center flex-shrink-0 sm:w-[120px] lg:w-[140px] border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-3">
                      <p className="text-xs sm:text-sm text-gray-700">Tendenza di prezzo</p>
                      <p className="mt-0.5 text-base sm:text-lg font-bold text-[#FF8800] underline">1,46 €</p>
                      <p className="mt-2 text-xs sm:text-sm font-bold text-gray-700">Prezzo medio</p>
                      <ul className="mt-1 list-none space-y-0.5 text-xs sm:text-sm">
                        <li className="flex justify-between gap-3"><span className="text-gray-600">30 gg</span><span className="font-bold text-gray-900">1,35 €</span></li>
                        <li className="flex justify-between gap-3"><span className="text-gray-600">7 gg</span><span className="font-bold text-gray-900">1,48 €</span></li>
                        <li className="flex justify-between gap-3"><span className="text-gray-600">1 gg</span><span className="font-bold text-gray-900">1,05 €</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab VENDI: form compatto stile CardMarket (sinistra) + grafico (destra) */}
            {activeTab === 'VENDI' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 sm:gap-5 lg:gap-6 p-4 sm:p-5 lg:p-6 min-w-0 w-full">
                {/* Form metti in vendita – compatto, 2 colonne dove possibile */}
                <div className="flex flex-col min-h-0 bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Quantità</label>
                        <input type="number" min={1} value={quantitaVendi} onChange={(e) => setQuantitaVendi(Number(e.target.value) || 1)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          Lingua <span className="text-gray-400" title="Info">ⓘ</span>
                        </label>
                        <select value={linguaVendi} onChange={(e) => setLinguaVendi(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white">
                          {vendiLanguageOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          Condizione{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalCondition(condizioneVendi);
                              setIsConditionModalOpen(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Info"
                          >
                            ⓘ
                          </button>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setModalCondition(condizioneVendi);
                            setIsConditionModalOpen(true);
                          }}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white text-left flex items-center justify-between hover:border-gray-400"
                        >
                          <span>{CONDITION_OPTIONS_MAP.find((opt) => opt.value === condizioneVendi)?.label}</span>
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Prezzo (€)</label>
                        <input type="text" inputMode="decimal" value={prezzoVendi} onChange={(e) => setPrezzoVendi(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="0.00" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Commenti</label>
                      <textarea value={commentiVendi} onChange={(e) => setCommentiVendi(e.target.value)} rows={2} placeholder="Commenti" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm resize-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-gray-600 shrink-0">Immagine (.jpg)</label>
                      <span className="text-[11px] text-gray-400 truncate min-w-0">Nessun file</span>
                      <label className="cursor-pointer rounded border border-gray-300 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 shrink-0">
                        Scegli file
                        <input type="file" accept=".jpg,.jpeg" className="sr-only" />
                      </label>
                    </div>
                    <div className="flex items-center gap-4 pt-0.5">
                      <span className="text-[11px] font-semibold text-gray-600">Extra</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={extraFoil} onChange={(e) => setExtraFoil(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
                        <span className="text-xs text-gray-600" aria-hidden>★</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={extraSigned} onChange={(e) => setExtraSigned(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
                        <span className="text-xs font-bold text-gray-600" aria-hidden>A</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={extraAltered} onChange={(e) => setExtraAltered(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
                        <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </label>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={saveSettings} onChange={(e) => setSaveSettings(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold text-gray-600">Salva impostazioni</span>
                      </label>
                      <button type="button" className="rounded py-2 px-4 text-xs font-bold uppercase text-white transition-opacity hover:opacity-90 shrink-0" style={{ backgroundColor: '#FF8800' }}>
                        Metti in vendita
                      </button>
                    </div>
                  </div>
                </div>
                {/* Grafico prezzo – uguale al tab INFO */}
                <div className="flex flex-col min-h-0 bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row flex-1 min-h-0 gap-3 sm:gap-4">
                    <div className="flex flex-[1.5] min-w-0 flex-col min-h-[280px]">
                      <ProductPriceChart slug={slug} />
                    </div>
                    <div className="flex flex-col justify-start sm:justify-center flex-shrink-0 sm:w-[120px] lg:w-[140px] border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-3">
                      <p className="text-xs sm:text-sm text-gray-700">Tendenza di prezzo</p>
                      <p className="mt-0.5 text-base sm:text-lg font-bold text-[#FF8800] underline">1,46 €</p>
                      <p className="mt-2 text-xs sm:text-sm font-bold text-gray-700">Prezzo medio</p>
                      <ul className="mt-1 list-none space-y-0.5 text-xs sm:text-sm">
                        <li className="flex justify-between gap-3"><span className="text-gray-600">30 gg</span><span className="font-bold text-gray-900">1,35 €</span></li>
                        <li className="flex justify-between gap-3"><span className="text-gray-600">7 gg</span><span className="font-bold text-gray-900">1,48 €</span></li>
                        <li className="flex justify-between gap-3"><span className="text-gray-600">1 gg</span><span className="font-bold text-gray-900">1,05 €</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab SCAMBIA: layout anteprima form scambio + messaggio “presto in arrivo” in evidenza */}
            {activeTab === 'SCAMBIA' && (
              <div className="relative p-4 sm:p-5 lg:p-6 min-w-0 w-full overflow-hidden rounded-b-lg">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 lg:gap-6 pointer-events-none select-none">
                  <div className="rounded-xl border border-white/30 bg-white/25 backdrop-blur-2xl shadow-lg shadow-black/5 p-3 sm:p-4 space-y-2.5">
                    <div>
                      <div className="text-[11px] font-semibold text-gray-700 mb-0.5">Cosa offri</div>
                      <div className="h-9 rounded-lg border border-white/40 bg-white/30 backdrop-blur-sm" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-700 mb-0.5">Quantità</div>
                      <div className="h-9 rounded-lg border border-white/40 bg-white/30 backdrop-blur-sm w-20" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-700 mb-0.5">Cosa cerchi</div>
                      <div className="h-9 rounded-lg border border-white/40 bg-white/30 backdrop-blur-sm" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-700 mb-0.5">Commenti</div>
                      <div className="h-16 rounded-lg border border-white/40 bg-white/30 backdrop-blur-sm" />
                    </div>
                    <div className="h-9 rounded-lg bg-white/40 backdrop-blur-sm w-3/4" />
                  </div>
                  <div className="rounded-xl border border-white/30 bg-white/25 backdrop-blur-2xl shadow-lg shadow-black/5 p-3 sm:p-4">
                    <div className="text-[11px] font-semibold text-gray-700 mb-2">Riepilogo scambio</div>
                    <div className="flex-1 min-h-[100px] rounded-lg border border-white/40 bg-white/20 backdrop-blur-sm" />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-2xl shadow-2xl shadow-black/10 px-6 py-5 sm:px-8 sm:py-6 text-center max-w-md ring-1 ring-black/5">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FF8800]/25 text-[#FF8800] mb-3 sm:mb-4" aria-hidden>
                      <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-gray-900">Funzionalità presto in arrivo</h3>
                    <p className="mt-2 text-sm text-gray-700">Stiamo lavorando per portarti lo scambio carte. Resta sintonizzato!</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#FF8800]">Coming soon</p>
                  </div>
                </div>
              </div>
            )}
            {/* Tab METTI ALL'ASTA: flusso creazione asta (stessi passi di /aste/nuova, senza scelta carta) */}
            {activeTab === 'ASTA' && card && blueprintIdForAuction && (
              <div className="min-h-[340px] border-t border-gray-200 bg-[#f8f9fb] p-1.5 sm:p-2">
                {auctionInventoryLoading ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF8800]" aria-hidden />
                    <span>{t('accountPage.itemsLoadingInventory')}</span>
                  </div>
                ) : (
                  <AuctionCreateWizard
                    key={`${card.id}-${auctionInventoryItems.length}`}
                    variant="embedded"
                    embeddedCard={card}
                    embeddedInventoryItems={auctionInventoryItems}
                    onEmbeddedCancel={() => setActiveTab('INFO')}
                    className="!max-w-full"
                  />
                )}
              </div>
            )}
            {activeTab === 'ASTA' && (!card || !blueprintIdForAuction) && (
              <div className="p-4 sm:p-5 lg:p-6">
                <p className="text-sm text-gray-500">
                  {!card
                    ? 'Seleziona un prodotto dal catalogo per creare un’asta.'
                    : 'Blueprint CardTrader non disponibile per questo prodotto: usa la pagina Nuova asta dal menu Aste.'}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* Sezione FILTRI a fianco della tabella (sinistra) + tab IN VENDITA | DISPONIBILI ALLO SCAMBIO | DISPONIBILI ALL'ASTA + tabella – filtri in striscia stretta quando chiusi, pannello pieno quando aperti */}
      <section className="w-full bg-[#F0F0F0] border-t border-gray-300">
        <div className="container-content py-2.5 sm:py-3 lg:py-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch">
            {/* Sidebar FILTRI – subito a sinistra della tabella: striscia stretta quando chiusa, pannello largo quando aperta */}
            <aside
              className={cn(
                'flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out',
                filtersOpen ? 'w-full lg:w-[280px] xl:w-[300px]' : 'w-full lg:w-14'
              )}
            >
              {!filtersOpen ? (
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="w-full h-full min-h-[120px] lg:min-h-[200px] flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label="Apri filtri"
                >
                  <svg className="h-5 w-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-xs font-bold uppercase text-gray-600 lg:hidden">Filtri</span>
                  <span className="text-[10px] font-bold uppercase text-gray-600 hidden lg:inline" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Filtri</span>
                </button>
              ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm h-full min-w-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold uppercase text-gray-900">Filtri</span>
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="flex items-center justify-center rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    aria-label="Chiudi filtri"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Posizione venditore</label>
                    <select
                      value={posizioneVenditore}
                      onChange={(e) => setPosizioneVenditore(e.target.value)}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {countryFlag(c.code)} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-2">Tipo venditore</label>
                    <div className="flex flex-wrap gap-2">
                      {(['PRIVATO', 'PROFESSIONALE', 'POWERSELLER'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipoVenditore(tipoVenditore === t ? null : t)}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-bold uppercase',
                            tipoVenditore === t ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-2">Condizione minima</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CONDIZIONE_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCondizioneMinima(c)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-bold',
                            condizioneMinima === c ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-2">Lingua carta</label>
                    <div className="flex flex-wrap gap-2">
                      {LINGUA_CARTA.map(({ code }) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setLinguaCarta(linguaCarta === code ? null : code)}
                          className={cn(
                            'flex h-8 w-10 items-center justify-center rounded border text-sm',
                            linguaCarta === code ? 'border-[#FF8800] bg-orange-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                          )}
                          title={code}
                        >
                          {code === 'IT' && '🇮🇹'}
                          {code === 'JP' && '🇯🇵'}
                          {code === 'GB' && '🇬🇧'}
                          {code === 'ES' && '🇪🇸'}
                          {code === 'DE' && '🇩🇪'}
                          {code === 'FR' && '🇫🇷'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-2">Firmata</label>
                    <div className="flex flex-wrap gap-2">
                      {(['SÌ', 'NO', 'ENTRAMBI'] as const).map((v) => (
                        <button key={v} type="button" onClick={() => setFirmata(v)} className={cn('rounded-full px-3 py-1.5 text-xs font-bold', firmata === v ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-2">Alterata</label>
                    <div className="flex flex-wrap gap-2">
                      {(['SÌ', 'NO', 'ENTRAMBI'] as const).map((v) => (
                        <button key={v} type="button" onClick={() => setAlterata(v)} className={cn('rounded-full px-3 py-1.5 text-xs font-bold', alterata === v ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Quantità</label>
                    <input
                      type="number"
                      min={1}
                      value={quantita}
                      onChange={(e) => setQuantita(Number(e.target.value) || 1)}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                      placeholder="Inserire quantità"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-gray-600">Solo foil?</span>
                    <button type="button" role="switch" aria-checked={soloFoil} onClick={() => setSoloFoil(!soloFoil)} className={cn('relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors', soloFoil ? 'border-[#FF8800] bg-[#FF8800]' : 'border-gray-300 bg-gray-200')}>
                      <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition', soloFoil ? 'translate-x-5' : 'translate-x-1')} />
                    </button>
                  </div>
                </div>
              </div>
              )}
            </aside>

            {/* Tabella Venditori / Scambio / Asta – subito a destra dei filtri */}
            <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200 bg-[#E5E7EB]">
                {(['VENDITORI', 'SCAMBIO', 'ASTA'] as const).map((tab) => {
                  const tabLabel = tab === 'VENDITORI' ? 'IN VENDITA' : tab === 'SCAMBIO' ? 'DISPONIBILI ALLO SCAMBIO' : "DISPONIBILI ALL'ASTA";
                  const iconClass = 'h-5 w-5 shrink-0';
                  return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSellerSubTab(tab)}
                    className={cn(
                      'flex flex-1 min-w-0 min-h-[48px] items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase transition-colors',
                      sellerSubTab === tab ? 'bg-[#FF8800] text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {tab === 'VENDITORI' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    )}
                    {tab === 'SCAMBIO' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
                        <polyline points="17 1 21 5 17 9" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <polyline points="7 23 3 19 7 15" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                    )}
                    {tab === 'ASTA' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
                        <path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" />
                        <path d="m16 16 6-6" />
                        <path d="m8 8 6-6" />
                        <path d="m9 7 8 8" />
                        <path d="m21 11-8-8" />
                      </svg>
                    )}
                    <span className="truncate">{tabLabel}</span>
                  </button>
                  );
                })}
              </div>
              {sellerSubTab === 'VENDITORI' && (
                <div className="overflow-x-auto">
                  {listingActionMessage && (
                    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{listingActionMessage}</div>
                  )}
                  <table className="w-full min-w-[640px] table-fixed text-left text-xs sm:text-sm">
                    <colgroup>
                      <col style={{ width: '33.33%' }} />
                      <col style={{ width: '33.33%' }} />
                      <col style={{ width: '33.34%' }} />
                    </colgroup>
                    <thead>
                      <tr className="text-xs font-medium uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 sm:px-4 sm:py-2.5 text-center">Venditore</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-2.5 text-center">Informazioni prodotto</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-2.5 text-center">Offerta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listingsLoading && (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 sm:px-4 text-center text-sm text-gray-500">
                            Caricamento venditori…
                          </td>
                        </tr>
                      )}
                      {!listingsLoading && listingsError && (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 sm:px-4 text-center text-sm text-amber-600">
                            {listingsError}
                          </td>
                        </tr>
                      )}
                      {!listingsLoading && !listingsError && listings.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-8 sm:px-4 text-center text-sm text-gray-600">
                            Presto ci saranno articoli in vendita disponibili.
                          </td>
                        </tr>
                      )}
                      {!listingsLoading && !listingsError && listings.map((item, i) => (
                        <tr key={item.item_id} className={cn('align-middle', i % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                          <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="min-w-0 truncate text-sm font-medium uppercase text-gray-900">{item.seller_display_name}</span>
                              <span className="text-sm text-gray-600">{item.country ?? '—'}</span>
                              <Image src={getCdnImageUrl('medal.png')} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" aria-hidden unoptimized />
                            </div>
                          </td>
                          <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-[22px] min-w-[44px] items-center justify-center rounded-full px-2.5 text-xs font-bold text-white" style={{ backgroundColor: '#1D3160' }}>MT</span>
                              <Image src={getCdnImageUrl('star.png')} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" aria-hidden unoptimized />
                              <span className="text-sm text-gray-700">{item.condition ?? '—'}</span>
                              {item.mtg_language && <span className="text-xs text-gray-500">({item.mtg_language})</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                            <div className="flex items-center gap-2 justify-end flex-wrap">
                              <span className="text-sm font-semibold text-blue-600 tabular-nums">{formatEuro(item.price_cents / 100)}</span>
                              <span className="text-sm text-gray-600 tabular-nums">{item.quantity}</span>
                              {isOwnListing(item) ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={rowBusyId === item.item_id}
                                    onClick={() => void handleOwnerQtyDelta(item, -1)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                                    aria-label="Diminuisci quantità o rimuovi"
                                    title="Diminuisci quantità o rimuovi"
                                  >
                                    {rowBusyId === item.item_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Minus className="h-4 w-4" strokeWidth={2.5} />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={rowBusyId === item.item_id || item.quantity >= 999}
                                    onClick={() => void handleOwnerQtyDelta(item, 1)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                    aria-label="Aumenta quantità"
                                    title="Aumenta quantità"
                                  >
                                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItem(listingToInventoryEditItem(item, card ?? null))}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-400 text-gray-900 shadow-sm transition hover:bg-amber-500"
                                    aria-label="Modifica inserzione"
                                    title="Modifica inserzione"
                                  >
                                    <Pencil className="h-4 w-4" strokeWidth={2.5} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!user || !accessToken) {
                                      setListingActionMessage('Accedi per aggiungere al carrello.');
                                      return;
                                    }
                                    setPurchaseListing(item);
                                    setPurchaseQty(1);
                                  }}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FF8800]/40 bg-white shadow-sm transition hover:bg-orange-50"
                                  aria-label="Aggiungi al carrello"
                                  style={{ color: ACCENT_ORANGE }}
                                >
                                  <Image src={getCdnImageUrl('cart-icon.png')} alt="" width={22} height={22} className="h-5 w-5 object-contain" unoptimized />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sellerSubTab === 'SCAMBIO' && <div className="p-8 text-center text-sm text-gray-500">Contenuto in preparazione per Scambio.</div>}
              {sellerSubTab === 'ASTA' && <div className="p-8 text-center text-sm text-gray-500">Contenuto in preparazione per Vedi all&apos;asta.</div>}
            </div>
          </div>
        </div>
      </section>

      {editingItem && (
        <InventoryEditModal
          item={editingItem}
          onClose={() => {
            setEditingItem(null);
            setListingActionMessage(null);
          }}
          onSubmit={handleEditSubmit}
          saving={savingEdit}
        />
      )}

      {purchaseListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pd-purchase-modal-title"
        >
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
            <h2 id="pd-purchase-modal-title" className="mb-1 text-lg font-semibold text-gray-900">
              Acquisto
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              {card?.name ?? purchaseListing.seller_display_name}
            </p>
            <div className="mb-3 text-sm text-gray-600">
              Disponibili: <span className="font-semibold">{purchaseListing.quantity}</span>
            </div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Quantità</label>
            <input
              type="number"
              min={1}
              max={purchaseListing.quantity}
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(Number(e.target.value) || 1)}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setPurchaseListing(null)}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={purchaseSubmitting}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmPurchase()}
                disabled={purchaseSubmitting}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {purchaseSubmitting ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Condizione */}
      {isConditionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="condition-modal-title"
        >
          <div className="w-full max-w-2xl rounded-xl bg-white/85 backdrop-blur-2xl backdrop-saturate-150 border border-white/40 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 id="condition-modal-title" className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Per garantire al meglio un servizio efficiente, scegli bene la condizione della carta:
              </h2>

              <div className="mt-6">
                <select
                  value={modalCondition}
                  onChange={(e) => setModalCondition(e.target.value)}
                  className="w-full rounded-lg border border-gray-300/80 bg-white/70 backdrop-blur-sm px-3 py-2.5 text-sm focus:border-[#FF8800] focus:outline-none focus:ring-2 focus:ring-[#FF8800]/25"
                >
                  {CONDITION_OPTIONS_MAP.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Immagini placeholder per la condizione selezionata */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="aspect-[4/3] rounded-lg border border-gray-200/60 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="text-center p-4">
                    <svg className="h-12 w-12 text-gray-300/80 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">Esempio condizione - Vista 1</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {CONDITION_OPTIONS_MAP.find((opt) => opt.value === modalCondition)?.label}
                    </p>
                  </div>
                </div>
                <div className="aspect-[4/3] rounded-lg border border-gray-200/60 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="text-center p-4">
                    <svg className="h-12 w-12 text-gray-300/80 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">Esempio condizione - Vista 2</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {CONDITION_OPTIONS_MAP.find((opt) => opt.value === modalCondition)?.label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setCondizioneVendi(modalCondition);
                    setIsConditionModalOpen(false);
                  }}
                  className="rounded-lg px-6 py-3 text-sm font-bold uppercase text-white transition-all hover:opacity-95 bg-[#FF8800]/85 backdrop-blur-sm border border-white/30 shadow-lg shadow-[#FF8800]/20 hover:shadow-[#FF8800]/40 hover:bg-[#FF8800]/90"
                >
                  Ho compreso, dichiaro che la condizione della carta è reale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
