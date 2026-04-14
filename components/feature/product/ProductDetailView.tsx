'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Minus, Pencil, Plus, X, ChevronLeft, ChevronRight, Heart, Eye, EyeOff } from 'lucide-react';
import { cn, formatEuroNoSpace } from '@/lib/utils';
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
import { getCdnImageUrl, MEILISEARCH } from '@/lib/config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { COUNTRIES } from '@/lib/registrati/schema';
import { ProductPriceChart, type ProductPriceStats, buildPriceHistoryPoints } from '@/components/feature/product/ProductPriceChart';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { CountrySelect, type CountryOption } from '@/components/ui/CountrySelect';
import { useUserCountry } from '@/lib/hooks/use-user-country';

const PRIMARY_BLUE = '#1D3160';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const ACCENT_ORANGE = '#f97316';

type ProductDetailViewProps =
  | { card: CardDocument; slug?: string; title?: string; subtitle?: string; breadcrumbs?: { label: string; href?: string }[]; imageSrc?: string }
  | { card?: never; slug: string; title?: string; subtitle?: string; breadcrumbs?: { label: string; href?: string }[]; imageSrc?: string };

type ReprintSearchHit = {
  id: string;
  set_name?: string;
  rarity?: string;
  image?: string | null;
  image_uri_small?: string | null;
  image_uri_normal?: string | null;
  image_path?: string | null;
  set_icon_uri?: string | null;
  icon_svg_uri?: string | null;
  set_code?: string | null;
};

type ReprintCard = {
  id: string;
  imageSrc: string | null;
  setName: string;
  rarity: string;
  setIconSrc: string | null;
  setCode: string;
};

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
  const breadcrumbs =
    props.breadcrumbs ??
    (card
      ? buildBreadcrumbsFromCard(card)
      : [
          { label: 'MAGIC: THE GATHERING', href: '#' },
          { label: 'SINGLES', href: '#' },
          { label: 'ECLISSI DI QUALCOSA', href: '#' },
          { label: 'STORMO DELLA SCISSIONE', href: '#' },
        ]);
  const breadcrumbItems: AppBreadcrumbItem[] = breadcrumbs.map((item, index) => ({
    href: item.href,
    label: item.label,
    isCurrent: index === breadcrumbs.length - 1,
  }));
  const imageSrc = props.imageSrc ?? (card?.image != null ? getCardImageUrl(card.image) : null) ?? getCdnImageUrl('kyurem.png');
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
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
  const detectedCountry = useUserCountry();

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
  const [listingsSort, setListingsSort] = useState<'price_asc' | 'price_desc' | 'seller' | 'condition'>('price_asc');
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
  const [dontShowConditionModal, setDontShowConditionModal] = useState(false);

  /* Verifica se l'utente ha scelto di non mostrare più il modal */
  const shouldSkipConditionModal = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hideConditionModal') === 'true';
  }, []);

  const CONDIZIONE_OPTIONS = ['HT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'] as const;
  const [condizioneMinima, setCondizioneMinima] = useState<string>('HT');
  const [linguaCarta, setLinguaCarta] = useState<string | null>(null);

  /* Lightbox per immagine carta fullscreen */
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  /* Toggle grafico - nascosto di default su tutti i device */
  const [showChart, setShowChart] = useState(false);
  const [chartStats, setChartStats] = useState<ProductPriceStats | null>(null);
  const [reprints, setReprints] = useState<ReprintCard[]>([]);
  const [reprintsLoading, setReprintsLoading] = useState(false);

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

  /** Opzioni paese con bandiere SVG per il select Posizione venditore */
  const countryOptions: CountryOption[] = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        code: c.code,
        label: c.label,
        flagCode: c.code,
      })),
    []
  );

  /** Opzioni Lingua nel tab VENDI: se la carta ha available_languages, solo quelle; altrimenti tutte. */
  const vendiLanguageOptions = useMemo(() => {
    if (card?.available_languages?.length) {
      return card.available_languages
        .map((code) => ({ code, label: langLabelByCode[code] ?? code }))
        .filter((o, i, arr) => arr.findIndex((x) => x.code === o.code) === i);
    }
    return LANG_OPTIONS.filter((o) => o.code !== 'jp');
  }, [card?.available_languages, langLabelByCode, LANG_OPTIONS]);

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

  useEffect(() => {
    if (!card?.id || !card.name || !card.game_slug || !MEILISEARCH.host) {
      setReprints([]);
      setReprintsLoading(false);
      return;
    }

    let cancelled = false;
    setReprintsLoading(true);

    (async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (MEILISEARCH.apiKey) headers.Authorization = `Bearer ${MEILISEARCH.apiKey}`;

        const escapedName = card.name.replace(/"/g, '\\"');
        const escapedGameSlug = card.game_slug.replace(/"/g, '\\"');

        const res = await fetch(`${MEILISEARCH.host}/indexes/${MEILISEARCH.indexName}/search`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            q: card.name,
            limit: 28,
            filter: [`name = "${escapedName}"`, `game_slug = "${escapedGameSlug}"`],
            attributesToRetrieve: [
              'id',
              'set_name',
              'rarity',
              'image',
              'image_uri_small',
              'image_uri_normal',
              'image_path',
              'set_icon_uri',
              'icon_svg_uri',
              'set_code',
            ],
          }),
          cache: 'no-store',
        });

        if (!res.ok) {
          if (!cancelled) setReprints([]);
          return;
        }

        const data = (await res.json()) as { hits?: ReprintSearchHit[] };
        const hits = Array.isArray(data.hits) ? data.hits : [];

        const mapped = hits
          .filter((hit) => hit.id && hit.id !== card.id)
          .map((hit) => {
            const rawImage = hit.image ?? hit.image_uri_normal ?? hit.image_uri_small ?? hit.image_path ?? null;
            const setName = hit.set_name ?? 'Set sconosciuto';
            const setCode =
              hit.set_code ??
              setName
                .split(' ')
                .filter(Boolean)
                .map((token) => token[0])
                .join('')
                .slice(0, 3)
                .toUpperCase();
            return {
              id: hit.id,
              imageSrc: getCardImageUrl(rawImage),
              setName,
              rarity: hit.rarity ?? 'N/D',
              setIconSrc: hit.set_icon_uri ?? hit.icon_svg_uri ?? null,
              setCode,
            } as ReprintCard;
          });

        const dedup = Array.from(new Map(mapped.map((item) => [item.id, item])).values()).slice(0, 18);
        if (!cancelled) setReprints(dedup);
      } catch {
        if (!cancelled) setReprints([]);
      } finally {
        if (!cancelled) setReprintsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [card?.id, card?.name, card?.game_slug]);

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

  /* Quando l'utente loggato ha un paese, usa quello; altrimenti usa la geolocalizzazione. */
  useEffect(() => {
    if (user?.country) {
      setPosizioneVenditore(user.country);
    } else if (detectedCountry) {
      setPosizioneVenditore(detectedCountry);
    }
  }, [user?.country, detectedCountry]);

  const showImagePlaceholder = imageError || !imageSrc;
  const effectiveImageSrc = showImagePlaceholder ? '' : imageSrc;
  const isLocalImage = effectiveImageSrc.startsWith('/') && !effectiveImageSrc.startsWith('//');
  const gameLabel = card ? getGameLabel(card.game_slug) : null;

  const EBARTEX_LOGO_PLACEHOLDER = '/images/Logo%20Principale%20EBARTEX.png';

  const sortedListings = useMemo(() => {
    if (!listings.length) return listings;
    const sorted = [...listings];
    switch (listingsSort) {
      case 'price_asc':
        sorted.sort((a, b) => a.price_cents - b.price_cents);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price_cents - a.price_cents);
        break;
      case 'seller':
        sorted.sort((a, b) => a.seller_display_name.localeCompare(b.seller_display_name));
        break;
      case 'condition':
        const condOrder = ['MINT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'];
        sorted.sort((a, b) => {
          const idxA = condOrder.indexOf(a.condition ?? '');
          const idxB = condOrder.indexOf(b.condition ?? '');
          return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });
        break;
    }
    return sorted;
  }, [listings, listingsSort]);

  const formatEuro = (n: number) => formatEuroNoSpace(n, 'it-IT');

  const cardsInSaleCount = useMemo(
    () => listings.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0),
    [listings]
  );
  const cardsInSaleLabel = listingsLoading ? '…' : new Intl.NumberFormat('it-IT').format(cardsInSaleCount);
  const defaultTrendStats = useMemo<ProductPriceStats>(() => {
    const points = buildPriceHistoryPoints(slug);
    const end = points[points.length - 1]?.t ?? Date.now();
    const start = end - 7 * ONE_DAY_MS;
    const rangePoints = points.filter((point) => point.t >= start && point.t <= end);
    const safePoints = rangePoints.length > 0 ? rangePoints : points.slice(-7);
    const trendPrice = safePoints[safePoints.length - 1]?.price ?? card?.market_price ?? 0;
    const soldCopies = safePoints.reduce((acc, point) => acc + (point.sales ?? 0), 0);
    const averageSalePrice =
      safePoints.length > 0
        ? safePoints.reduce((acc, point) => acc + point.price, 0) / safePoints.length
        : card?.market_price ?? 0;
    return {
      trendPrice,
      soldCopies,
      averageSalePrice,
      rangeLabel: 'Ultimi 7 giorni',
    };
  }, [slug, card?.market_price]);

  const effectiveTrendStats = chartStats ?? defaultTrendStats;
  const trendPriceValue = effectiveTrendStats.trendPrice;
  const soldCopiesValue = effectiveTrendStats.soldCopies;
  const averageSalePriceValue = effectiveTrendStats.averageSalePrice;
  const trendRangeLabel = effectiveTrendStats.rangeLabel;
  const prezzoVendiValue = useMemo(() => {
    const normalized = prezzoVendi.replace(',', '.').replace(/[^\d.]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [prezzoVendi]);
  const quantitaVendiValue = Number.isFinite(quantitaVendi) ? Math.max(1, quantitaVendi) : 1;
  const vendiTotaleValue = prezzoVendiValue * quantitaVendiValue;

  // Mock multiple images for swipe demo (front/back of card)
  const cardImages = useMemo(() => {
    const images = [effectiveImageSrc];
    // If card has back image or alternate views, add them here
    // For now, single image
    return images;
  }, [effectiveImageSrc]);

  const handleLightboxOpen = () => setIsLightboxOpen(true);
  const handleLightboxClose = () => setIsLightboxOpen(false);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev: number) => (prev === 0 ? cardImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev: number) => (prev === cardImages.length - 1 ? 0 : prev + 1));
  };

  // Web Share API handler
  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `Check out ${title} on Ebartex!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else if (navigator.clipboard) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copiato negli appunti!');
      } catch (err) {
        // Clipboard failed
      }
    }
  };

  // Swipe handlers for lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNextImage();
    } else if (distance < -minSwipeDistance) {
      handlePrevImage();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const tabs = [
    { id: 'INFO' as const, label: 'INFO', mobileLabel: 'INFO' },
    { id: 'VENDI' as const, label: 'VENDI', mobileLabel: 'VENDI' },
    { id: 'SCAMBIA' as const, label: 'SCAMBIA', mobileLabel: 'SCAMBIA' },
    { id: 'ASTA' as const, label: "METTI ALL'ASTA", mobileLabel: 'ASTA' },
  ];

  return (
    <div className="min-h-screen font-sans bg-[#F0F0F0] text-gray-900">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>

      {/* Sezione titolo: MOBILE - titolo più grande, edizione sotto, aiuto in fondo; DESKTOP - layout originale */}
      <section className="w-full bg-[#F0F0F0] border-b border-gray-300">
        <div className="container-content py-3 sm:py-2.5 lg:py-3">
          {/* MOBILE: Titolo grande, edizione sotto, aiuto in fondo - in colonna */}
          <div className="flex flex-col gap-2 sm:hidden">
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-gray-900 break-words leading-tight">
              {title}
            </h1>
            <p className="text-sm font-bold uppercase tracking-tight text-gray-700 break-words">
              {card?.set_name ?? subtitle.split(' – ').pop()?.split(' - ').pop() ?? 'SUSSURRI NEL POZZO'}
            </p>
            <Link href="/aiuto" className="text-xs font-medium text-gray-500 hover:text-[#FF8800] mt-1">
              HAI BISOGNO DI AIUTO?
            </Link>
          </div>

          {/* DESKTOP: Layout originale con bottoni azione a destra del titolo */}
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <AppBreadcrumb
              items={breadcrumbItems}
              ariaLabel="Breadcrumb"
              variant="default"
              className="w-auto text-xs font-medium sm:text-sm min-w-0"
            />
            <Link href="/aiuto" className="text-xs font-medium text-gray-600 hover:text-gray-900 sm:text-sm shrink-0">
              HAI BISOGNO DI AIUTO?
            </Link>
          </div>
          <div className="hidden sm:flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 text-left">
              <h1 className="text-lg font-bold uppercase tracking-tight text-gray-900 sm:text-xl md:text-2xl lg:text-3xl break-words">
                {title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-tight text-gray-700 break-words">
                {subtitle}
            </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-[#FF8800] hover:text-[#FF8800] shadow-sm"
                aria-label="Aggiungi ai preferiti"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-[#FF8800] hover:text-[#FF8800] shadow-sm"
                aria-label="Condividi"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contenuto principale: card bianca su sfondo grigio – responsive padding e layout */}
      <section className="w-full bg-[#F0F0F0] px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 pb-4 sm:pb-6 min-h-0">
        <div className="container-content">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-lg bg-white shadow-md sm:h-[320px] sm:flex-row">
            {/* Colonna sinistra: immagine carta compatta */}
            <aside
              className={cn(
                'flex w-full flex-shrink-0 flex-col items-center justify-center bg-white p-2 sm:h-full sm:w-[180px] sm:max-w-none sm:justify-start sm:border-b-0 sm:border-r sm:border-gray-200 sm:p-3 md:w-[200px] lg:w-[220px]',
                mobileDetailsOpen ? 'border-b border-gray-200' : 'border-b-0'
              )}
            >
              <div
                className="relative flex w-full max-w-[96px] max-h-[134px] shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-gray-100 transition-opacity hover:opacity-95 sm:max-w-[160px] sm:max-h-[240px] md:max-w-[200px] md:max-h-[280px]"
                style={{ aspectRatio: '63/88' }}
                onClick={handleLightboxOpen}
                role="button"
                aria-label="Clicca per ingrandire l'immagine"
              >
              {showImagePlaceholder ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                  <img
                    src={EBARTEX_LOGO_PLACEHOLDER}
                    alt="Ebartex"
                    className="w-14 h-14 object-contain shrink-0"
                  />
                  <p className="mt-2 text-[10px] font-medium text-gray-600 leading-tight">
                    Immagine non disponibile
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
                  sizes="200px"
                  unoptimized
                  onError={() => setImageError(true)}
                  priority
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setMobileDetailsOpen((prev) => !prev)}
              className="mt-2 flex w-full max-w-[220px] items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm sm:hidden"
              aria-expanded={mobileDetailsOpen}
              aria-controls="product-mobile-info-panel"
            >
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-700">
                {mobileDetailsOpen ? 'Nascondi info carta' : 'Mostra info carta'}
              </span>
              <svg
                className={cn('h-4 w-4 text-gray-500 transition-transform', mobileDetailsOpen && 'rotate-180')}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </aside>

          {/* Colonna destra: tab minimali + contenuto */}
          <div
            id="product-mobile-info-panel"
            className={cn('flex-1 min-w-0 flex flex-col bg-[#FAFAFA] overflow-hidden sm:h-full', !mobileDetailsOpen && 'hidden sm:flex')}
          >
            <div className="flex border-b border-gray-200 bg-gray-50/80">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    'relative flex-1 min-w-0 px-1 sm:px-4 py-1.5 sm:py-3 text-[10px] sm:text-sm font-bold uppercase tracking-[0.04em] sm:tracking-wide transition-all duration-200',
                    activeTab === t.id
                      ? 'bg-white text-[#FF7300] border-t-2 border-[#FF7300] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  )}
                >
                  <span className="block truncate text-center sm:hidden">{t.mobileLabel}</span>
                  <span className="hidden truncate text-center sm:block">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Contenuto tab INFO: MOBILE compatta con espansione grafico; DESKTOP layout completo */}
            {activeTab === 'INFO' && (
              <>
                {/* MOBILE: blocco compatto leggibile, senza collasso */}
                <div className="sm:hidden flex h-full min-h-0 w-full min-w-0 flex-col gap-1.5 overflow-y-auto p-1.5">
                  <div className="rounded-md border border-gray-200/80 bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Rarità</p>
                        <p className="text-xs font-bold text-zinc-900">{card?.rarity ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Numero</p>
                        <p className="text-xs font-bold text-zinc-900 tabular-nums">{card?.collector_number ?? '015'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Set</p>
                        <p className="truncate text-xs font-bold text-zinc-900">{card?.set_name ?? 'SUSSURRI NEL POZZO'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">In vendita</p>
                        <p className="text-base font-extrabold text-zinc-900 tabular-nums">{cardsInSaleLabel}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Lingue</p>
                        <p className="truncate text-[11px] font-medium text-zinc-700">
                          {card?.game_slug === 'mtg'
                            ? (card?.available_languages?.length
                              ? card.available_languages.slice(0, 2).map((code) => langLabelByCode[code] ?? code).join(', ')
                              : 'English')
                            : 'N/D'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded border border-orange-100 bg-orange-50/60 p-1.5 text-center">
                      <p className="text-[10px] font-semibold uppercase text-orange-700">Trend</p>
                      <p className="text-[11px] font-extrabold text-orange-700">{formatEuro(trendPriceValue)}</p>
                    </div>
                    <div className="rounded border border-blue-100 bg-blue-50/50 p-1.5 text-center">
                      <p className="text-[10px] font-semibold uppercase text-blue-700">Vend.</p>
                      <p className="text-[11px] font-extrabold text-blue-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50/50 p-1.5 text-center">
                      <p className="text-[10px] font-semibold uppercase text-gray-600">Media</p>
                      <p className="text-[11px] font-extrabold text-gray-900">{formatEuro(averageSalePriceValue)}</p>
                    </div>
                  </div>

                  <div className="rounded-md border border-gray-200/80 bg-white p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-900">Ristampe</span>
                      <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-gray-400">{reprints.length}</span>
                    </div>
                    {reprintsLoading ? (
                      <div className="grid grid-cols-4 gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-[44px] rounded-md bg-gray-100 animate-pulse" />
                        ))}
                      </div>
                    ) : reprints.length > 0 ? (
                      <div className="grid grid-cols-4 gap-1">
                        {reprints.slice(0, 4).map((r) => (
                          <div key={r.id} className="relative h-[44px] overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                            {r.imageSrc ? (
                              <Image src={r.imageSrc} alt="" fill className="object-cover" sizes="44px" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[9px] text-gray-400">N/A</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500">Nessuna ristampa.</p>
                    )}
                  </div>
                </div>

                {/* DESKTOP: Layout 3 colonne dinamiche - Info | Ristampe | Prezzi+Grafico */}
                <div className={cn(
                  'hidden sm:grid min-w-0 w-full transition-all duration-500',
                  showChart
                    ? 'gap-2 p-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-[180px_240px_1fr]'
                    : 'gap-2 p-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-[1fr_1.5fr_auto]'
                )}>
                  {/* Colonna 1: Info carta - padding compatto */}
                  <div className="flex flex-col min-h-0 bg-white rounded-lg border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2">
                    {/* Riga 1: Rarità + Numero */}
                    <div className="space-y-1.5 pb-1.5 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Rarità</span>
                        <span className="text-xs font-bold text-zinc-900">{card?.rarity || <Image src={getCdnImageUrl('stellina.png')} alt="" width={14} height={14} className="h-3 w-3 object-contain" aria-hidden unoptimized />}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Numero</span>
                        <span className="text-xs font-bold text-zinc-900 tabular-nums">{card?.collector_number ?? '015'}</span>
                      </div>
                    </div>

                    {/* Riga 2: Set */}
                    <div className="py-1.5 border-b border-gray-100">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Set</span>
                      <p className="text-xs font-bold text-zinc-900 truncate">{card?.set_name ?? 'SUSSURRI NEL POZZO'}</p>
                    </div>

                    {/* Lingue (solo MTG) */}
                    {card?.game_slug === 'mtg' && (
                      <div className="py-1.5 border-b border-gray-100">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Lingue</span>
                        <p className="text-[11px] font-medium text-zinc-700 truncate">
                          {card?.available_languages?.length ? card.available_languages.slice(0,3).map((code) => langLabelByCode[code] ?? code).join(', ') : 'English'}
                        </p>
                      </div>
                    )}

                    {/* Riga 3: Carte in vendita */}
                    <div className="pt-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">In vendita</span>
                      <p className="text-base font-extrabold text-zinc-900 tabular-nums">{cardsInSaleLabel}</p>
                    </div>
                  </div>

                  {/* Colonna 2: Ristampe compatte */}
                  <div className="flex flex-col min-h-0 bg-white rounded-lg border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2">
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <h3 className="text-[10px] font-extrabold uppercase tracking-wide text-gray-900">Ristampe</h3>
                      <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1 py-0 rounded">{reprints.length}</span>
                    </div>

                    {reprintsLoading ? (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-[70px] w-[50px] flex-shrink-0 rounded-md border border-gray-200 bg-gray-100 animate-pulse" />
                        ))}
                      </div>
                    ) : reprints.length > 0 ? (
                      <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
                        {reprints.slice(0, 8).map((reprint) => (
                          <div
                            key={reprint.id}
                            className="group relative h-[70px] w-[50px] flex-shrink-0 snap-start overflow-hidden rounded-md border border-gray-200 bg-gray-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                            title={`${reprint.setName} • ${reprint.rarity}`}
                          >
                            {reprint.imageSrc ? (
                              <Image src={reprint.imageSrc} alt={reprint.setName} fill className="object-cover" sizes="74px" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] font-semibold text-gray-400">N/A</div>
                            )}
                            <div className="absolute left-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/60 bg-black/55 px-1 backdrop-blur-sm">
                              {reprint.setIconSrc ? (
                                <img src={reprint.setIconSrc} alt="" className="h-3 w-3 object-contain" loading="lazy" />
                              ) : (
                                <span className="text-[9px] font-bold uppercase text-white">{reprint.setCode || 'SET'}</span>
                              )}
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-1.5 py-1">
                              <span className="inline-flex rounded-full border border-white/25 bg-black/45 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">{reprint.rarity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-2">Nessuna ristampa trovata.</p>
                    )}
                  </div>

                  {/* Colonna 3: Prezzi compatti */}
                  <div className="flex flex-col min-h-0 bg-white rounded-lg border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2 sm:col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{trendRangeLabel}</span>
                      <button type="button" onClick={() => setShowChart((v) => !v)} className="text-[10px] font-medium text-[#FF7300] flex items-center gap-0.5">
                        {showChart ? <><EyeOff className="h-3 w-3" /> Nascondi</> : <><Eye className="h-3 w-3" /> Grafico</>}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="rounded border border-orange-100 bg-orange-50/60 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-orange-700">Trend</p>
                        <p className="text-xs font-extrabold text-orange-700">{formatEuro(trendPriceValue)}</p>
                      </div>
                      <div className="rounded border border-blue-100 bg-blue-50/50 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-blue-700">Vend.</p>
                        <p className="text-xs font-extrabold text-blue-700">{soldCopiesValue}</p>
                      </div>
                      <div className="rounded border border-gray-200 bg-gray-50/50 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-gray-600">Media</p>
                        <p className="text-xs font-extrabold text-gray-900">{formatEuro(averageSalePriceValue)}</p>
                      </div>
                    </div>
                    {/* Grafico espandibile - altezza limitata */}
                    <div className={cn('transition-all duration-500 ease-out overflow-hidden', showChart ? 'opacity-100 max-h-[140px] mt-2' : 'opacity-0 max-h-0')}>
                      {showChart && (
                        <div className="animate-in fade-in duration-300">
                          <div className="h-[120px] w-full">
                            <ProductPriceChart slug={slug} onStatsChange={setChartStats} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab VENDI: form ultra-compatto */}
            {activeTab === 'VENDI' && (
              <>
                <div className="sm:hidden flex h-full min-h-0 w-full min-w-0 flex-col gap-1.5 overflow-y-auto p-1.5">
                  <div className="rounded-md border border-gray-200 bg-white p-2 shadow-sm">
                    <div className="mb-1.5 flex items-center justify-between">
                      <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-gray-900">Vendi subito</h3>
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-[#FF7300]">Rapido</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-gray-600">Quantità</label>
                        <input
                          type="number"
                          min={1}
                          value={quantitaVendi}
                          onChange={(e) => setQuantitaVendi(Number(e.target.value) || 1)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-gray-600">Prezzo (€)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={prezzoVendi}
                          onChange={(e) => setPrezzoVendi(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-gray-600">Lingua</label>
                        <select
                          value={linguaVendi}
                          onChange={(e) => setLinguaVendi(e.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                        >
                          {vendiLanguageOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold text-gray-600">Condizione</label>
                        <button
                          type="button"
                          onClick={() => {
                            setModalCondition(condizioneVendi);
                            setIsConditionModalOpen(true);
                          }}
                          className="w-full truncate rounded border border-gray-300 bg-white px-2 py-1 text-left text-xs"
                        >
                          {CONDITION_OPTIONS_MAP.find((opt) => opt.value === condizioneVendi)?.label ?? 'Near Mint'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-1.5">
                      <label className="mb-0.5 block text-[10px] font-semibold text-gray-600">Note</label>
                      <input
                        type="text"
                        value={commentiVendi}
                        onChange={(e) => setCommentiVendi(e.target.value)}
                        placeholder="Commenti per acquirente"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                    </div>

                    <div className="mt-1.5 grid grid-cols-3 gap-1">
                      <div className="rounded border border-gray-200 bg-gray-50 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-gray-500">Unit.</p>
                        <p className="text-[11px] font-extrabold text-gray-900">{formatEuro(prezzoVendiValue)}</p>
                      </div>
                      <div className="rounded border border-blue-100 bg-blue-50/60 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-blue-600">Qtà</p>
                        <p className="text-[11px] font-extrabold text-blue-700">{new Intl.NumberFormat('it-IT').format(quantitaVendiValue)}</p>
                      </div>
                      <div className="rounded border border-orange-100 bg-orange-50/70 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-orange-600">Tot.</p>
                        <p className="text-[11px] font-extrabold text-orange-700">{formatEuro(vendiTotaleValue)}</p>
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-600">
                          <input
                            type="checkbox"
                            checked={extraFoil}
                            onChange={(e) => setExtraFoil(e.target.checked)}
                            className="h-3 w-3 rounded border-gray-300"
                          />
                          Foil
                        </label>
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-600">
                          <input
                            type="checkbox"
                            checked={extraSigned}
                            onChange={(e) => setExtraSigned(e.target.checked)}
                            className="h-3 w-3 rounded border-gray-300"
                          />
                          Firm.
                        </label>
                      </div>
                      <button
                        type="button"
                        className="rounded-md bg-[#FF8800] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white hover:opacity-90"
                      >
                        Vendi
                      </button>
                    </div>
                  </div>

                  <div className="rounded-md border border-gray-200 bg-white p-1.5 shadow-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Prezzi mercato</span>
                      <span className="text-[10px] font-medium text-gray-400">Grafico su desktop</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="rounded border border-orange-100 bg-orange-50/60 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-orange-700">Trend</p>
                        <p className="text-[11px] font-extrabold text-orange-700">{formatEuro(trendPriceValue)}</p>
                      </div>
                      <div className="rounded border border-blue-100 bg-blue-50/50 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-blue-700">Vend.</p>
                        <p className="text-[11px] font-extrabold text-blue-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</p>
                      </div>
                      <div className="rounded border border-gray-200 bg-gray-50/50 p-1 text-center">
                        <p className="text-[9px] font-semibold uppercase text-gray-600">Media</p>
                        <p className="text-[11px] font-extrabold text-gray-900">{formatEuro(averageSalePriceValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden h-full min-h-0 w-full min-w-0 gap-2 p-2 sm:grid sm:grid-cols-[1.2fr_1fr]">
                  <div className="flex min-h-0 flex-col rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">Inserzione rapida</h3>
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#FF7300]">Vendita</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div>
                        <label className="mb-0.5 block text-[11px] font-semibold text-gray-600">Quantità</label>
                        <input
                          type="number"
                          min={1}
                          value={quantitaVendi}
                          onChange={(e) => setQuantitaVendi(Number(e.target.value) || 1)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[11px] font-semibold text-gray-600">Lingua</label>
                        <select
                          value={linguaVendi}
                          onChange={(e) => setLinguaVendi(e.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
                        >
                          {vendiLanguageOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[11px] font-semibold text-gray-600">Condizione</label>
                        <button
                          type="button"
                          onClick={() => {
                            setModalCondition(condizioneVendi);
                            setIsConditionModalOpen(true);
                          }}
                          className="w-full truncate rounded border border-gray-300 bg-white px-2 py-1.5 text-left text-sm"
                        >
                          {CONDITION_OPTIONS_MAP.find((opt) => opt.value === condizioneVendi)?.label ?? 'Near Mint'}
                        </button>
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[11px] font-semibold text-gray-600">Prezzo (€)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={prezzoVendi}
                          onChange={(e) => setPrezzoVendi(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="mb-0.5 block text-[11px] font-semibold text-gray-600">Note venditore</label>
                      <textarea
                        value={commentiVendi}
                        onChange={(e) => setCommentiVendi(e.target.value)}
                        placeholder="Scrivi info utili per l'acquirente..."
                        rows={2}
                        className="w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-sm"
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase text-gray-500">Unitario</p>
                        <p className="text-sm font-extrabold text-gray-900">{formatEuro(prezzoVendiValue)}</p>
                      </div>
                      <div className="rounded-md border border-blue-100 bg-blue-50/60 p-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase text-blue-600">Qtà</p>
                        <p className="text-sm font-extrabold text-blue-700">{new Intl.NumberFormat('it-IT').format(quantitaVendiValue)}</p>
                      </div>
                      <div className="rounded-md border border-orange-100 bg-orange-50/70 p-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase text-orange-600">Totale</p>
                        <p className="text-sm font-extrabold text-orange-700">{formatEuro(vendiTotaleValue)}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                          <input
                            type="checkbox"
                            checked={extraFoil}
                            onChange={(e) => setExtraFoil(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                          Foil
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                          <input
                            type="checkbox"
                            checked={extraSigned}
                            onChange={(e) => setExtraSigned(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                          Firmata
                        </label>
                      </div>
                      <button
                        type="button"
                        className="rounded-md bg-[#FF8800] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:opacity-90"
                      >
                        Metti in vendita
                      </button>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prezzi di mercato</span>
                      <button
                        type="button"
                        onClick={() => setShowChart((v) => !v)}
                        className="text-xs font-semibold text-[#FF7300]"
                      >
                        {showChart ? 'Nascondi grafico' : 'Mostra grafico'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded border border-orange-100 bg-orange-50/60 p-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase text-orange-700">Trend</p>
                        <p className="text-sm font-extrabold text-orange-700">{formatEuro(trendPriceValue)}</p>
                      </div>
                      <div className="rounded border border-blue-100 bg-blue-50/50 p-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase text-blue-700">Vendute</p>
                        <p className="text-sm font-extrabold text-blue-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</p>
                      </div>
                      <div className="rounded border border-gray-200 bg-gray-50/50 p-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase text-gray-600">Media</p>
                        <p className="text-sm font-extrabold text-gray-900">{formatEuro(averageSalePriceValue)}</p>
                      </div>
                    </div>

                    <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-md border border-gray-200 bg-[#fafafa]">
                      {showChart ? (
                        <div className="h-full min-h-[110px] animate-in fade-in duration-300">
                          <ProductPriceChart slug={slug} onStatsChange={setChartStats} />
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center px-3 text-center">
                          <p className="text-sm font-semibold text-gray-700">Usa il grafico per posizionare meglio il prezzo</p>
                          <p className="mt-1 text-xs text-gray-500">Range attuale: {trendRangeLabel}</p>
                          <button
                            type="button"
                            onClick={() => setShowChart(true)}
                            className="mt-2 rounded-md border border-[#FF7300]/40 bg-white px-2.5 py-1 text-xs font-semibold text-[#FF7300] hover:bg-orange-50"
                          >
                            Apri grafico prezzi
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab SCAMBIA: messaggio compatto */}
            {activeTab === 'SCAMBIA' && (
              <div className="flex flex-col items-center justify-center p-4 min-w-0 w-full h-full">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FF8800]/25 text-[#FF8800] mb-2" aria-hidden>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-sm font-bold uppercase text-gray-900">Scambio - Coming Soon</h3>
                <p className="mt-1 text-xs text-gray-600">Funzionalità in arrivo prossimamente.</p>
              </div>
            )}
            {/* Tab METTI ALL'ASTA: flusso creazione asta compatta */}
            {activeTab === 'ASTA' && card && blueprintIdForAuction && (
              <div className="min-h-0 overflow-y-auto border-t border-gray-200 bg-[#f8f9fb] p-1.5">
                {auctionInventoryLoading ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-xs text-gray-600">
                    <Loader2 className="h-6 w-6 animate-spin text-[#FF8800]" aria-hidden />
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
              <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto">
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
                  className="w-full lg:h-full lg:min-h-[200px] flex items-center justify-center gap-2 lg:flex-col lg:gap-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label="Apri filtri"
                >
                  {/* MOBILE: Layout orizzontale compatto */}
                  <svg className="h-4 w-4 text-gray-600 shrink-0 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-xs font-bold uppercase text-gray-600 lg:hidden">Filtri</span>
                  {/* DESKTOP: Layout verticale - icona sopra, testo sotto */}
                  <svg className="h-5 w-5 text-gray-600 shrink-0 hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase text-zinc-600 hidden lg:inline leading-none">FILTRI</span>
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
                  <div className="lg:hidden">
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Ordina</label>
                    <select
                      value={listingsSort}
                      onChange={(e) => setListingsSort(e.target.value as typeof listingsSort)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                    >
                      <option value="price_asc">Prezzo: più basso</option>
                      <option value="price_desc">Prezzo: più alto</option>
                      <option value="seller">Venditore: A-Z</option>
                      <option value="condition">Condizione: migliore</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Posizione venditore</label>
                    <CountrySelect
                      options={countryOptions}
                      value={posizioneVenditore}
                      onChange={setPosizioneVenditore}
                      size="sm"
                    />
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
              <div className="flex gap-1 border-b border-gray-200 bg-gray-100 p-1 overflow-x-auto scrollbar-hide">
                {(['VENDITORI', 'SCAMBIO', 'ASTA'] as const).map((tab) => {
                  const tabLabel = tab === 'VENDITORI' ? 'IN VENDITA' : tab === 'SCAMBIO' ? 'SCAMBIO' : 'ASTA';
                  const iconClass = 'h-4 w-4 sm:h-5 sm:w-5 shrink-0';
                  return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSellerSubTab(tab)}
                    className={cn(
                      'flex flex-1 min-w-[96px] sm:min-w-0 min-h-[36px] sm:min-h-[44px] items-center justify-center gap-1 sm:gap-2 rounded-md px-2 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-sm font-bold uppercase transition-colors whitespace-nowrap',
                      sellerSubTab === tab
                        ? 'bg-white text-[#FF8800] shadow-sm ring-1 ring-[#FF8800]/30'
                        : 'bg-transparent text-gray-600 hover:bg-white/70'
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
                  {/* Desktop Table */}
                  <table className="hidden sm:table w-full table-fixed text-left text-sm">
                    <colgroup>
                      <col style={{ width: '33.33%' }} />
                      <col style={{ width: '33.33%' }} />
                      <col style={{ width: '33.34%' }} />
                    </colgroup>
                    <thead>
                      <tr className="text-xs font-medium uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2.5 text-center">Venditore</th>
                        <th className="px-4 py-2.5 text-center">Informazioni prodotto</th>
                        <th className="px-4 py-2.5 text-center">Offerta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listingsLoading && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                            Caricamento venditori…
                          </td>
                        </tr>
                      )}
                      {!listingsLoading && listingsError && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-sm text-amber-600">
                            {listingsError}
                          </td>
                        </tr>
                      )}
                      {!listingsLoading && !listingsError && listings.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-600">
                            Presto ci saranno articoli in vendita disponibili.
                          </td>
                        </tr>
                      )}
                      {!listingsLoading && !listingsError && listings.map((item, i) => (
                        <tr key={item.item_id} className={cn('align-middle', i % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="min-w-0 truncate text-sm font-medium uppercase text-gray-900">{item.seller_display_name}</span>
                              {item.country && <FlagIcon country={item.country} size="sm" />}
                              <Image src={getCdnImageUrl('medal.png')} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" aria-hidden unoptimized />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-[22px] min-w-[44px] items-center justify-center rounded-full px-2.5 text-xs font-bold text-white" style={{ backgroundColor: '#1D3160' }}>MT</span>
                              <Image src={getCdnImageUrl('star.png')} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" aria-hidden unoptimized />
                              <span className="text-sm text-gray-700">{item.condition ?? '—'}</span>
                              {item.mtg_language && <span className="text-xs text-gray-500">({item.mtg_language})</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
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
                  {/* Mobile Cards */}
                  <div className="sm:hidden">
                    {listingsLoading && (
                      <div className="divide-y divide-gray-200">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={cn('px-4 py-4', i % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                            {/* Skeleton Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                              </div>
                              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                            </div>
                            {/* Skeleton Info Row */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-5 w-10 bg-gray-200 rounded-full animate-pulse" />
                              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                            </div>
                            {/* Skeleton Action Row */}
                            <div className="flex items-center justify-between">
                              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                              <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!listingsLoading && listingsError && (
                      <div className="px-4 py-6 text-center text-sm text-amber-600">
                        {listingsError}
                      </div>
                    )}
                    {!listingsLoading && !listingsError && sortedListings.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-gray-600">
                        Presto ci saranno articoli in vendita disponibili.
                      </div>
                    )}
                    {!listingsLoading && !listingsError && sortedListings.map((item, i) => (
                      <div key={item.item_id} className={cn('px-4 py-4 border-b border-gray-200', i % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                        {/* Header: Venditore + Badge + Price */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium uppercase text-gray-900 truncate">{item.seller_display_name}</span>
                            <Image src={getCdnImageUrl('medal.png')} alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" aria-hidden unoptimized />
                          </div>
                          <span className="text-sm font-semibold text-blue-600 tabular-nums shrink-0">{formatEuro(item.price_cents / 100)}</span>
                        </div>
                        {/* Info Row */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="inline-flex h-[20px] min-w-[40px] items-center justify-center rounded-full px-2 text-xs font-bold text-white" style={{ backgroundColor: '#1D3160' }}>MT</span>
                          <Image src={getCdnImageUrl('star.png')} alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" aria-hidden unoptimized />
                          <span className="text-sm text-gray-700">{item.condition ?? '—'}</span>
                          {item.mtg_language && <span className="text-xs text-gray-500">({item.mtg_language})</span>}
                          {item.country && <FlagIcon country={item.country} size="xs" />}
                        </div>
                        {/* Action Row */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          {isOwnListing(item) ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={rowBusyId === item.item_id}
                                onClick={() => void handleOwnerQtyDelta(item, -1)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                                aria-label="Diminuisci quantità o rimuovi"
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
                              >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItem(listingToInventoryEditItem(item, card ?? null))}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-400 text-gray-900 shadow-sm transition hover:bg-amber-500"
                                aria-label="Modifica inserzione"
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sellerSubTab === 'SCAMBIO' && (
                <div className="p-6 sm:p-8">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-6 text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">Scambio</p>
                    <p className="mt-1 text-sm text-gray-500">Contenuto in preparazione per Scambio.</p>
                  </div>
                </div>
              )}
              {sellerSubTab === 'ASTA' && (
                <div className="p-6 sm:p-8">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-6 text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">Asta</p>
                    <p className="mt-1 text-sm text-gray-500">Contenuto in preparazione per Vedi all&apos;asta.</p>
                  </div>
                </div>
              )}
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
              Carte in vendita: <span className="font-semibold">{purchaseListing.quantity}</span>
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

              {/* Checkbox non mostrare più */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowConditionModal}
                  onChange={(e) => setDontShowConditionModal(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#FF8800] focus:ring-[#FF8800]/25 cursor-pointer"
                />
                <label htmlFor="dontShowAgain" className="text-sm text-gray-600 cursor-pointer select-none">
                  Non mostrare più
                </label>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setCondizioneVendi(modalCondition);
                    if (dontShowConditionModal && typeof window !== 'undefined') {
                      localStorage.setItem('hideConditionModal', 'true');
                    }
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
      {/* Lightbox Modal per immagine carta fullscreen */}
      {isLightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
          onClick={handleLightboxClose}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header con chiusura e indicatore */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
            <span className="text-white/70 text-sm font-medium">
              {cardImages.length > 1 ? `${currentImageIndex + 1} / ${cardImages.length}` : ''}
            </span>
            <button
              onClick={handleLightboxClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Chiudi"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Immagine */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {!showImagePlaceholder && cardImages[currentImageIndex] && (
              <Image
                src={cardImages[currentImageIndex]}
                alt={card?.name ?? title}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
                priority
              />
            )}
            {showImagePlaceholder && (
              <div className="flex flex-col items-center justify-center text-white/70">
                <img
                  src={EBARTEX_LOGO_PLACEHOLDER}
                  alt="Ebartex"
                  className="w-24 h-24 object-contain opacity-50"
                />
                <p className="mt-4 text-sm">Immagine non disponibile</p>
              </div>
            )}
          </div>

          {/* Controlli navigazione (visibili solo se più immagini) */}
          {cardImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Immagine precedente"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Immagine successiva"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Istruzione swipe */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            {cardImages.length > 1 ? 'Swipe per cambiare immagine' : 'Tocca per chiudere'}
          </div>
        </div>
      )}
    </div>
  );
}
