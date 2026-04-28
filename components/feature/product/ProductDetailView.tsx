'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Minus, Pencil, Plus, X, ChevronLeft, ChevronRight, Heart, Eye, EyeOff, Zap } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'INFO' | 'VENDI' | 'TORNEI' | 'ASTA'>('INFO');
  const [sellerSubTab, setSellerSubTab] = useState<'VENDITORI' | 'ASTA' | 'TCG_EXPRESS'>('VENDITORI');
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
  const [hoverPreviewOpen, setHoverPreviewOpen] = useState(false);
  const hoverPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const handleHoverPreviewOpen = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return;
    if (hoverPreviewTimeoutRef.current) {
      clearTimeout(hoverPreviewTimeoutRef.current);
      hoverPreviewTimeoutRef.current = null;
    }
    setHoverPreviewOpen(true);
  };
  const handleHoverPreviewClose = () => {
    hoverPreviewTimeoutRef.current = setTimeout(() => {
      setHoverPreviewOpen(false);
    }, 250);
  };
  const handleHoverPreviewCancelClose = () => {
    if (hoverPreviewTimeoutRef.current) {
      clearTimeout(hoverPreviewTimeoutRef.current);
      hoverPreviewTimeoutRef.current = null;
    }
    setHoverPreviewOpen(true);
  };

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
    { id: 'ASTA' as const, label: "METTI ALL'ASTA", mobileLabel: 'ASTA' },
    { id: 'TORNEI' as const, label: 'TORNEI LIVE', mobileLabel: 'TORNEI' },
  ];

  return (
    <div className="min-h-screen font-sans bg-[#F0F0F0] text-gray-900">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>

      {/* Sezione titolo: MOBILE - titolo più grande, edizione sotto, aiuto in fondo; DESKTOP - layout originale */}
      <section className="w-full bg-[#F0F0F0] border-b border-gray-300">
        <div className="container-content container-content-card-detail py-3 sm:py-2.5 lg:py-3">
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
      <section className="w-full bg-[#F0F0F0] px-0 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 pb-4 sm:pb-6 min-h-0">
        <div className="container-content container-content-card-detail">
          <div
            className={cn(
              'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/95 backdrop-blur-[2px] shadow-[0_1px_4px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.06)] sm:flex-row',
              activeTab === 'ASTA'
                ? 'sm:min-h-[420px]'
                : activeTab === 'INFO'
                  ? 'sm:min-h-[320px] sm:h-auto'
                  : 'sm:h-[320px]'
            )}
          >
            {/* Colonna sinistra: immagine carta compatta */}
            <aside
              className={cn(
                'flex w-full flex-shrink-0 flex-col items-center justify-center bg-gradient-to-br from-zinc-50/80 via-white to-zinc-100/60 p-3 sm:h-full sm:w-[180px] sm:max-w-none sm:justify-center sm:border-b-0 sm:border-r sm:border-zinc-200/50 sm:p-4 md:w-[200px] lg:w-[220px]',
                mobileDetailsOpen ? 'border-b border-zinc-200/50' : 'border-b-0'
              )}
            >
              <div
                className={cn(
                  'relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-300/50 bg-zinc-100/60 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md sm:max-w-[180px] sm:max-h-[300px] md:max-w-[200px] md:max-h-[360px] lg:max-w-[220px] lg:max-h-[420px]',
                  mobileDetailsOpen ? 'max-w-[144px] max-h-[201px]' : 'max-w-[96px] max-h-[134px]'
                )}
                style={{ aspectRatio: '63/88' }}
                onClick={handleLightboxOpen}
                onMouseEnter={handleHoverPreviewOpen}
                onMouseLeave={handleHoverPreviewClose}
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
              className="mt-3 inline-flex w-auto max-w-full items-center gap-2 self-center rounded-full border border-zinc-200/60 bg-white/90 px-3 py-1.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-zinc-50 sm:hidden"
              aria-expanded={mobileDetailsOpen}
              aria-controls="product-mobile-info-panel"
            >
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-700">
                {mobileDetailsOpen ? 'Nascondi dettagli' : 'Mostra dettagli'}
              </span>
              <svg
                className={cn('h-3.5 w-3.5 text-zinc-400 transition-transform duration-300', mobileDetailsOpen && 'rotate-180')}
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
            className={cn('flex-1 min-w-0 flex flex-col bg-zinc-50/80 overflow-hidden sm:h-full', !mobileDetailsOpen && 'hidden sm:flex')}
          >
            <div className="flex gap-1 border-b border-zinc-100 bg-zinc-100/70 p-1 sm:p-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex-1 min-w-0 rounded-lg px-1.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.06em] transition-all duration-250',
                    activeTab === tab.id
                      ? 'bg-white text-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-zinc-900/[0.04]'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/50'
                  )}
                >
                  <span className="block truncate text-center sm:hidden">{tab.mobileLabel}</span>
                  <span className="hidden truncate text-center sm:block">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Contenuto tab INFO: MOBILE compatta con espansione grafico; DESKTOP layout completo */}
            {activeTab === 'INFO' && (
              <>
                {/* MOBILE: blocco compatto premium */}
                <div className="sm:hidden flex h-full min-h-0 w-full min-w-0 flex-col gap-2 overflow-y-auto p-2.5">
                  <div className="rounded-xl bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="divide-y divide-zinc-100">
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Rarità</span>
                        <span className="text-xs font-bold text-zinc-900">{card?.rarity ?? 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Numero</span>
                        <span className="text-xs font-bold text-zinc-900 tabular-nums">{card?.collector_number ?? '015'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Set</span>
                        <span className="truncate ml-4 text-xs font-bold text-zinc-900 text-right">{card?.set_name ?? 'SUSSURRI NEL POZZO'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Lingue</span>
                        <span className="truncate ml-4 text-[11px] font-medium text-zinc-600 text-right">
                          {card?.game_slug === 'mtg'
                            ? (card?.available_languages?.length
                              ? card.available_languages.slice(0, 2).map((code) => langLabelByCode[code] ?? code).join(', ')
                              : 'English')
                            : 'N/D'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">In vendita</span>
                        <span className="text-sm font-extrabold text-primary tabular-nums">{cardsInSaleLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-amber-50/80 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600/80">Trend</p>
                      <p className="mt-0.5 text-sm font-extrabold text-amber-700">{formatEuro(trendPriceValue)}</p>
                    </div>
                    <div className="rounded-xl bg-sky-50/70 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600/80">Vend.</p>
                      <p className="mt-0.5 text-sm font-extrabold text-sky-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-100/70 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Media</p>
                      <p className="mt-0.5 text-sm font-extrabold text-zinc-800">{formatEuro(averageSalePriceValue)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-800">Ristampe</span>
                      <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 tabular-nums">{reprints.length}</span>
                    </div>
                    {reprintsLoading ? (
                      <div className="flex gap-2 overflow-hidden">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-[52px] w-[37px] flex-shrink-0 rounded-lg bg-zinc-100 animate-pulse" />
                        ))}
                      </div>
                    ) : reprints.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory -mx-0.5 px-0.5">
                        {reprints.slice(0, 6).map((r) => (
                          <div key={r.id} className="relative h-[52px] w-[37px] flex-shrink-0 snap-start overflow-hidden rounded-lg bg-zinc-50 shadow-sm transition-transform duration-200 hover:scale-105" title={r.setName}>
                            {r.imageSrc ? (
                              <Image src={r.imageSrc} alt="" fill className="object-cover" sizes="37px" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[8px] font-medium text-zinc-400">N/A</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">Nessuna ristampa.</p>
                    )}
                  </div>
                </div>

                {/* DESKTOP: Layout ottimizzato - Dati prioritari | Ristampe compatte | KPI verticali */}
                <div className={cn(
                  'hidden sm:grid min-w-0 w-full transition-all duration-500',
                  showChart
                    ? 'gap-2.5 p-2.5 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.22fr_0.28fr_1.5fr]'
                    : 'gap-2.5 p-2.5 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.35fr_0.7fr_0.95fr]'
                )}>
                  {/* Colonna 1: Dati carta più densi e meglio distribuiti */}
                  <div className="flex min-h-0 flex-col rounded-xl bg-white/85 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-800">Dati carta</h3>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                        {gameLabel ?? 'Gioco N/D'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Rarità</p>
                        <p className="mt-1 text-sm font-extrabold text-zinc-900">
                          {card?.rarity || <Image src={getCdnImageUrl('stellina.png')} alt="" width={14} height={14} className="h-3.5 w-3.5 object-contain" aria-hidden unoptimized />}
                        </p>
                      </div>
                      <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Numero</p>
                        <p className="mt-1 text-sm font-extrabold tabular-nums text-zinc-900">{card?.collector_number ?? '015'}</p>
                      </div>
                      <div className="col-span-2 rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Set</p>
                        <p className="mt-1 truncate text-sm font-extrabold text-zinc-900">{card?.set_name ?? 'SUSSURRI NEL POZZO'}</p>
                      </div>
                      <div className="col-span-2 rounded-lg border border-zinc-200/70 bg-zinc-50/60 px-2.5 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Lingue disponibili</p>
                        <p className="mt-1 truncate text-[12px] font-semibold text-zinc-700">
                          {card?.game_slug === 'mtg'
                            ? (card?.available_languages?.length
                              ? card.available_languages.slice(0, 4).map((code) => langLabelByCode[code] ?? code).join(', ')
                              : 'English')
                            : 'N/D'}
                        </p>
                      </div>
                      <div className="col-span-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-primary/70">In vendita</p>
                        <p className="mt-1 text-xl font-extrabold tabular-nums text-primary">{cardsInSaleLabel}</p>
                      </div>
                    </div>
                  </div>

                  {/* Colonna 2: Ristampe compatte (meno dominante) */}
                  <div className={cn('flex min-h-0 flex-col rounded-xl bg-white/85', showChart ? 'p-1' : 'p-3')}>
                    <div className={cn('flex items-center justify-between gap-1', showChart ? 'mb-1.5' : 'mb-2')}>
                      <h3 className={cn('font-extrabold uppercase tracking-wider text-zinc-800 truncate', showChart ? 'text-[9px]' : 'text-[10px]')}>Ristampe</h3>
                      <span className={cn('rounded-full bg-zinc-100 font-bold text-zinc-400 tabular-nums', showChart ? 'px-1 py-0 text-[8px]' : 'px-1.5 py-0.5 text-[9px]')}>{reprints.length}</span>
                    </div>

                    {reprintsLoading ? (
                      <div className={cn('grid gap-1.5', showChart ? 'grid-cols-1 gap-0.5' : 'grid-cols-2')}>
                        {[...Array(showChart ? 1 : 4)].map((_, i) => (
                          <div key={i} className={cn('rounded-lg bg-zinc-100 animate-pulse', showChart ? 'h-[26px]' : 'h-[56px]')} />
                        ))}
                      </div>
                    ) : reprints.length > 0 ? (
                      <div className={cn('grid gap-1.5', showChart ? 'grid-cols-1 gap-0.5' : 'grid-cols-2')}>
                        {reprints.slice(0, showChart ? 1 : 4).map((reprint) => (
                          <div
                            key={reprint.id}
                            className={cn(
                              'group relative overflow-hidden rounded-lg bg-zinc-50 shadow-sm ring-1 ring-zinc-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30',
                              showChart ? 'h-[26px]' : 'h-[56px]'
                            )}
                            title={`${reprint.setName} • ${reprint.rarity}`}
                          >
                            {reprint.imageSrc ? (
                              <Image src={reprint.imageSrc} alt={reprint.setName} fill className="object-cover" sizes="120px" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-[10px] font-semibold text-zinc-400">N/A</div>
                            )}
                            {!showChart && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3">
                                <span className="text-[8px] font-bold uppercase tracking-wide text-white/95">{reprint.setCode || 'SET'}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={cn('flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-center', showChart ? 'px-1.5 py-2' : 'px-2 py-3')}>
                        <p className={cn('text-zinc-400', showChart ? 'text-[9px] leading-tight' : 'text-xs')}>Nessuna ristampa trovata.</p>
                      </div>
                    )}
                  </div>

                  {/* Colonna 3: KPI in verticale + grafico */}
                  <div className={cn('flex min-h-0 flex-col rounded-xl bg-white/85 sm:col-span-2 md:col-span-2 lg:col-span-1', showChart ? 'p-2.5' : 'p-3')}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{trendRangeLabel}</span>
                      <button
                        type="button"
                        onClick={() => setShowChart((v) => !v)}
                        className="flex items-center gap-1 rounded-full bg-zinc-100/80 px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        {showChart ? <><EyeOff className="h-3 w-3" /> Nascondi</> : <><Eye className="h-3 w-3" /> Grafico</>}
                      </button>
                    </div>

                    {showChart ? (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="flex items-center justify-between gap-1 rounded-md border border-amber-200/70 bg-amber-50/70 px-1.5 py-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700/80">Trend</span>
                          <span className="text-[11px] font-extrabold tabular-nums text-amber-700">{formatEuro(trendPriceValue)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 rounded-md border border-sky-200/70 bg-sky-50/60 px-1.5 py-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-sky-700/80">Vendute</span>
                          <span className="text-[11px] font-extrabold tabular-nums text-sky-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 rounded-md border border-zinc-200/80 bg-zinc-100/60 px-1.5 py-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Prezzo medio</span>
                          <span className="text-[11px] font-extrabold tabular-nums text-zinc-800">{formatEuro(averageSalePriceValue)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="rounded-lg border border-amber-200/70 bg-amber-50/70 px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700/80">Trend</p>
                          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-amber-700">{formatEuro(trendPriceValue)}</p>
                        </div>
                        <div className="rounded-lg border border-sky-200/70 bg-sky-50/60 px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-700/80">Vendute</p>
                          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-sky-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</p>
                        </div>
                        <div className="rounded-lg border border-zinc-200/80 bg-zinc-100/60 px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Prezzo medio</p>
                          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-zinc-800">{formatEuro(averageSalePriceValue)}</p>
                        </div>
                      </div>
                    )}

                    <div className={cn('transition-all duration-500 ease-out overflow-hidden', showChart ? 'opacity-100 max-h-[270px] mt-1.5' : 'opacity-0 max-h-0')}>
                      {showChart && (
                        <div className="animate-in fade-in duration-300">
                          <div className="h-[250px] w-full rounded-lg bg-white/60">
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
                <div className="sm:hidden flex h-full min-h-0 w-full min-w-0 flex-col gap-2 overflow-y-auto p-2.5">
                  <div className="rounded-xl bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-zinc-900">Vendi subito</h3>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">Rapido</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Quantità</label>
                        <input
                          type="number"
                          min={1}
                          value={quantitaVendi}
                          onChange={(e) => setQuantitaVendi(Number(e.target.value) || 1)}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-xs font-medium text-zinc-900 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Prezzo (€)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={prezzoVendi}
                          onChange={(e) => setPrezzoVendi(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-xs font-medium text-zinc-900 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Lingua</label>
                        <select
                          value={linguaVendi}
                          onChange={(e) => setLinguaVendi(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-xs font-medium text-zinc-900 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
                        >
                          {vendiLanguageOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Condizione</label>
                        <button
                          type="button"
                          onClick={() => {
                            setModalCondition(condizioneVendi);
                            setIsConditionModalOpen(true);
                          }}
                          className="w-full truncate rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-left text-xs font-medium text-zinc-900 transition-colors hover:border-zinc-300"
                        >
                          {CONDITION_OPTIONS_MAP.find((opt) => opt.value === condizioneVendi)?.label ?? 'Near Mint'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Note</label>
                      <input
                        type="text"
                        value={commentiVendi}
                        onChange={(e) => setCommentiVendi(e.target.value)}
                        placeholder="Commenti per acquirente"
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-2.5 py-1.5 text-xs font-medium text-zinc-900 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <div className="rounded-lg bg-zinc-50/80 p-1.5 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Unit.</p>
                        <p className="mt-0.5 text-xs font-extrabold text-zinc-800">{formatEuro(prezzoVendiValue)}</p>
                      </div>
                      <div className="rounded-lg bg-sky-50/60 p-1.5 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600/80">Qtà</p>
                        <p className="mt-0.5 text-xs font-extrabold text-sky-700">{new Intl.NumberFormat('it-IT').format(quantitaVendiValue)}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50/70 p-1.5 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600/80">Tot.</p>
                        <p className="mt-0.5 text-xs font-extrabold text-amber-700">{formatEuro(vendiTotaleValue)}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-zinc-100 pt-2">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
                          <input
                            type="checkbox"
                            checked={extraFoil}
                            onChange={(e) => setExtraFoil(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary/25"
                          />
                          Foil
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
                          <input
                            type="checkbox"
                            checked={extraSigned}
                            onChange={(e) => setExtraSigned(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary/25"
                          />
                          Firm.
                        </label>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                      >
                        Vendi
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-amber-50/80 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600/80">Trend</p>
                      <p className="mt-0.5 text-sm font-extrabold text-amber-700">{formatEuro(trendPriceValue)}</p>
                    </div>
                    <div className="rounded-xl bg-sky-50/70 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600/80">Vend.</p>
                      <p className="mt-0.5 text-sm font-extrabold text-sky-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-100/70 p-2.5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Media</p>
                      <p className="mt-0.5 text-sm font-extrabold text-zinc-800">{formatEuro(averageSalePriceValue)}</p>
                    </div>
                  </div>
                </div>

                <div className="hidden h-full min-h-0 w-full min-w-0 gap-3 overflow-y-auto p-3 sm:grid sm:grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
                  {/* LEFT: Selling form */}
                  <div className="flex min-h-0 flex-col gap-0 rounded-2xl bg-white ring-1 ring-zinc-900/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    {/* Form header */}
                    <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">Inserzione rapida</h3>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">Vendita</span>
                    </div>

                    {/* Inputs — compact 4-col grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 px-3.5 md:grid-cols-4">
                      <div>
                        <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Quantità</label>
                        <input
                          type="number"
                          min={1}
                          value={quantitaVendi}
                          onChange={(e) => setQuantitaVendi(Number(e.target.value) || 1)}
                          className="w-full rounded-md border border-zinc-200/80 bg-zinc-50/40 px-2 py-1 text-[13px] font-medium text-zinc-900 tabular-nums transition-colors focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/15"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Lingua</label>
                        <select
                          value={linguaVendi}
                          onChange={(e) => setLinguaVendi(e.target.value)}
                          className="w-full rounded-md border border-zinc-200/80 bg-zinc-50/40 px-2 py-1 text-[13px] font-medium text-zinc-900 transition-colors focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/15"
                        >
                          {vendiLanguageOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Condizione</label>
                        <button
                          type="button"
                          onClick={() => {
                            setModalCondition(condizioneVendi);
                            setIsConditionModalOpen(true);
                          }}
                          className="w-full truncate rounded-md border border-zinc-200/80 bg-zinc-50/40 px-2 py-1 text-left text-[13px] font-medium text-zinc-900 transition-colors hover:border-zinc-300"
                        >
                          {CONDITION_OPTIONS_MAP.find((opt) => opt.value === condizioneVendi)?.label ?? 'Near Mint'}
                        </button>
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Prezzo (€)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={prezzoVendi}
                          onChange={(e) => setPrezzoVendi(e.target.value)}
                          className="w-full rounded-md border border-zinc-200/80 bg-zinc-50/40 px-2 py-1 text-[13px] font-semibold text-zinc-900 tabular-nums transition-colors focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/15"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Notes — single row */}
                    <div className="mt-1.5 px-3.5">
                      <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Note venditore</label>
                      <input
                        type="text"
                        value={commentiVendi}
                        onChange={(e) => setCommentiVendi(e.target.value)}
                        placeholder="Scrivi info utili per l'acquirente..."
                        className="w-full rounded-md border border-zinc-200/80 bg-zinc-50/40 px-2 py-1 text-[13px] font-medium text-zinc-900 transition-colors placeholder:text-zinc-300 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/15"
                      />
                    </div>

                    {/* Extras row: Foil/Firmata */}
                    <div className="mt-1.5 flex items-center gap-5 px-3.5">
                      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-zinc-700">
                        <input
                          type="checkbox"
                          checked={extraFoil}
                          onChange={(e) => setExtraFoil(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary/20"
                        />
                        Foil
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-zinc-700">
                        <input
                          type="checkbox"
                          checked={extraSigned}
                          onChange={(e) => setExtraSigned(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-primary focus:ring-primary/20"
                        />
                        Firmata
                      </label>
                    </div>

                    {/* Action strip — totals + CTA unified */}
                    <div className="mt-auto flex items-center gap-2 rounded-b-2xl border-t border-zinc-100 bg-zinc-50/50 px-3.5 py-2">
                      <div className="flex flex-1 items-center gap-1.5">
                        <div className="flex-1 rounded-lg bg-white px-2 py-1 text-center ring-1 ring-zinc-100">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Unit.</p>
                          <p className="text-xs font-extrabold tabular-nums text-zinc-800">{formatEuro(prezzoVendiValue)}</p>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-300">&times;</span>
                        <div className="w-10 rounded-lg bg-white px-2 py-1 text-center ring-1 ring-zinc-100">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Qtà</p>
                          <p className="text-xs font-extrabold tabular-nums text-zinc-800">{quantitaVendiValue}</p>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-300">=</span>
                        <div className="flex-1 rounded-lg bg-primary/5 px-2 py-1 text-center ring-1 ring-primary/15">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-primary/70">Totale</p>
                          <p className="text-xs font-extrabold tabular-nums text-primary">{formatEuro(vendiTotaleValue)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ml-1 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
                      >
                        Pubblica
                      </button>
                    </div>
                  </div>

                  {/* RIGHT: Market pricing context — uniformato a tab INFO */}
                  <div className={cn('flex min-h-0 flex-col rounded-xl bg-white/85 sm:col-span-2 md:col-span-2 lg:col-span-1', showChart ? 'p-2.5' : 'p-3')}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{trendRangeLabel}</span>
                      <button
                        type="button"
                        onClick={() => setShowChart((v) => !v)}
                        className="flex items-center gap-1 rounded-full bg-zinc-100/80 px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        {showChart ? <><EyeOff className="h-3 w-3" /> Nascondi</> : <><Eye className="h-3 w-3" /> Grafico</>}
                      </button>
                    </div>

                    {showChart ? (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="flex items-center justify-between gap-1 rounded-md border border-amber-200/70 bg-amber-50/70 px-1.5 py-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700/80">Trend</span>
                          <span className="text-[11px] font-extrabold tabular-nums text-amber-700">{formatEuro(trendPriceValue)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 rounded-md border border-sky-200/70 bg-sky-50/60 px-1.5 py-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-sky-700/80">Vendute</span>
                          <span className="text-[11px] font-extrabold tabular-nums text-sky-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 rounded-md border border-zinc-200/80 bg-zinc-100/60 px-1.5 py-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Prezzo medio</span>
                          <span className="text-[11px] font-extrabold tabular-nums text-zinc-800">{formatEuro(averageSalePriceValue)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="rounded-lg border border-amber-200/70 bg-amber-50/70 px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700/80">Trend</p>
                          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-amber-700">{formatEuro(trendPriceValue)}</p>
                        </div>
                        <div className="rounded-lg border border-sky-200/70 bg-sky-50/60 px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-700/80">Vendute</p>
                          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-sky-700">{new Intl.NumberFormat('it-IT').format(soldCopiesValue)}</p>
                        </div>
                        <div className="rounded-lg border border-zinc-200/80 bg-zinc-100/60 px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Prezzo medio</p>
                          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-zinc-800">{formatEuro(averageSalePriceValue)}</p>
                        </div>
                      </div>
                    )}

                    <div className={cn('transition-all duration-500 ease-out overflow-hidden', showChart ? 'opacity-100 max-h-[270px] mt-1.5' : 'opacity-0 max-h-0')}>
                      {showChart && (
                        <div className="animate-in fade-in duration-300">
                          <div className="h-[250px] w-full rounded-lg bg-white/60">
                            <ProductPriceChart slug={slug} onStatsChange={setChartStats} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab METTI ALL'ASTA: flusso creazione asta compatta */}
            {activeTab === 'ASTA' && card && blueprintIdForAuction && (
              <div className="min-h-0 bg-zinc-50/30 p-2 sm:p-2.5">
                {auctionInventoryLoading ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-2.5 text-xs text-zinc-500">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
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
              <div className="flex flex-1 flex-col items-center justify-center p-6 min-w-0 w-full">
                <p className="text-xs text-zinc-400 text-center max-w-[260px] leading-relaxed">
                  {!card
                    ? 'Seleziona un prodotto dal catalogo per creare un’asta.'
                    : 'Blueprint CardTrader non disponibile per questo prodotto: usa la pagina Nuova asta dal menu Aste.'}
                </p>
              </div>
            )}
            {/* Tab TORNEI LIVE: mock tornei */}
            {activeTab === 'TORNEI' && (
              <div className="flex flex-1 flex-col p-4 min-w-0 w-full gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">Tornei in diretta</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                </div>
                {[
                  { name: 'Weekly Modern League', game: 'MTG', players: 32, prize: '€150', time: 'In corso' },
                  { name: 'Pokémon Standard Cup', game: 'Pokémon', players: 24, prize: '€100', time: 'In corso' },
                  { name: 'Commander Night', game: 'MTG', players: 16, prize: 'Carte promozionali', time: 'Tra 2h' },
                ].map((t) => (
                  <div key={t.name} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">{t.name}</p>
                      <p className="text-[11px] text-zinc-500">{t.game} · {t.players} giocatori · {t.prize}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                      {t.time}
                    </span>
                  </div>
                ))}
                <p className="text-center text-[11px] text-zinc-400 mt-1">Partecipa e vinci carte esclusive — prossimamente su Ebartex</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* Sezione FILTRI a fianco della tabella (sinistra) + tab IN VENDITA | DISPONIBILI ALL'ASTA + tabella – filtri in striscia stretta quando chiusi, pannello pieno quando aperti */}
      <section className="w-full bg-[#F0F0F0] border-t border-gray-300">
        <div className="container-content container-content-card-detail py-2.5 sm:py-3 lg:py-4">
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
                    <button
                      type="button"
                      role="switch"
                      aria-checked={soloFoil}
                      onClick={() => setSoloFoil(!soloFoil)}
                      className={cn(
                        'relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8800]/40',
                        soloFoil
                          ? 'bg-[#FF8800] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_0_12px_rgba(255,136,0,0.45)]'
                          : 'bg-gray-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-6 w-6 transform rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.22),0_0_2px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform',
                          soloFoil ? 'translate-x-6' : 'translate-x-0.5'
                        )}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </div>
              )}
            </aside>

            {/* Tabella Venditori / Asta – subito a destra dei filtri */}
            <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex gap-1 border-b border-gray-200 bg-gray-100 p-1 overflow-x-auto scrollbar-hide">
                {(['VENDITORI', 'ASTA'] as const).map((tab) => {
                  const tabLabel = tab === 'VENDITORI' ? 'IN VENDITA' : 'ASTA';
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
                {/* Tab BRX Express — design premium */}
                <button
                  type="button"
                  onClick={() => setSellerSubTab('TCG_EXPRESS')}
                  className={cn(
                    'relative flex flex-1 min-w-[110px] sm:min-w-0 min-h-[36px] sm:min-h-[44px] items-center justify-center gap-1 sm:gap-2 rounded-md px-2 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-sm font-extrabold uppercase transition-all whitespace-nowrap overflow-hidden',
                    sellerSubTab === 'TCG_EXPRESS'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-300'
                      : 'bg-transparent text-orange-600 hover:bg-orange-50'
                  )}
                >
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" aria-hidden />
                  <span className="truncate">BRX Express</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500 px-1.5 py-[2px] text-[9px] font-bold text-white shadow-sm animate-pulse">
                    NUOVO
                  </span>
                </button>
              </div>
              {sellerSubTab === 'VENDITORI' && (
                <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              {sellerSubTab === 'ASTA' && (
                <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-6 text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">Asta</p>
                    <p className="mt-1 text-sm text-gray-500">Contenuto in preparazione per Vedi all&apos;asta.</p>
                  </div>
                </div>
              )}
              {sellerSubTab === 'TCG_EXPRESS' && (
                <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/60 p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 shadow-md shadow-orange-500/20">
                      <Zap className="h-6 w-6 text-white" aria-hidden />
                    </div>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-orange-700">BRX Express</p>
                    <p className="mt-1 text-sm text-orange-600/80">Spedizione ultra-rapida per le tue carte. Presto disponibile.</p>
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
      {/* Desktop hover preview: immagine ingrandita al centro, sfondo trasparente */}
      {hoverPreviewOpen && (
        <div
          className="hidden sm:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] max-w-[85vw] max-h-[90vh]"
          onMouseEnter={handleHoverPreviewCancelClose}
          onMouseLeave={handleHoverPreviewClose}
        >
          {!showImagePlaceholder && cardImages[currentImageIndex] && (
            <img
              src={cardImages[currentImageIndex]}
              alt={card?.name ?? title}
              className="h-auto w-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              draggable={false}
            />
          )}
          {showImagePlaceholder && (
            <div className="flex flex-col items-center justify-center text-zinc-700">
              <img
                src={EBARTEX_LOGO_PLACEHOLDER}
                alt="Ebartex"
                className="w-24 h-24 object-contain opacity-50"
                draggable={false}
              />
              <p className="mt-4 text-sm">Immagine non disponibile</p>
            </div>
          )}
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
            className="relative flex items-center justify-center w-full h-full max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {!showImagePlaceholder && cardImages[currentImageIndex] && (
              <img
                src={cardImages[currentImageIndex]}
                alt={card?.name ?? title}
                className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
                draggable={false}
              />
            )}
            {showImagePlaceholder && (
              <div className="flex flex-col items-center justify-center text-white/70">
                <img
                  src={EBARTEX_LOGO_PLACEHOLDER}
                  alt="Ebartex"
                  className="w-24 h-24 object-contain opacity-50"
                  draggable={false}
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
