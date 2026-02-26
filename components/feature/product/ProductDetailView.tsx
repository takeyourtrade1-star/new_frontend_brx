'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { getCardImageUrl } from '@/lib/assets';
import { getCardDisplayNames } from '@/lib/card-display-name';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getGameLabel, buildBreadcrumbsFromCard, type CardDocument } from '@/lib/product-detail';
import { syncClient, type ListingItem } from '@/lib/api/sync-client';
import { getCdnImageUrl } from '@/lib/config';

const PRIMARY_BLUE = '#1D3160';
const ACCENT_ORANGE = '#f97316';

type ProductDetailViewProps =
  | { card: CardDocument; slug?: string; title?: string; subtitle?: string; breadcrumbs?: { label: string; href?: string }[]; imageSrc?: string }
  | { card?: never; slug: string; title?: string; subtitle?: string; breadcrumbs?: { label: string; href?: string }[]; imageSrc?: string };

export function ProductDetailView(props: ProductDetailViewProps) {
  const { card } = props;
  const { selectedLang } = useLanguage();
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
  const [imageError, setImageError] = useState(false);
  const [soloFoil, setSoloFoil] = useState(false);
  const [tipoVenditore, setTipoVenditore] = useState<string | null>(null);
  const [firmata, setFirmata] = useState<'SÌ' | 'NO' | 'ENTRAMBI'>('ENTRAMBI');
  const [alterata, setAlterata] = useState<'SÌ' | 'NO' | 'ENTRAMBI'>('ENTRAMBI');
  const [quantita, setQuantita] = useState(33);

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

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

  const CONDIZIONE_OPTIONS = ['HT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'] as const;
  const [condizioneMinima, setCondizioneMinima] = useState<string>('HT');
  const [linguaCarta, setLinguaCarta] = useState<string | null>(null);

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

  useEffect(() => {
    const raw = card?.cardtrader_id;
    if (raw == null) {
      setListings([]);
      setListingsLoading(false);
      setListingsError(null);
      return;
    }
    // Normalize: backend expects integer; Meilisearch may return number or "278502:1" style string
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
    syncClient
      .getListingsByBlueprint(blueprintId)
      .then((res) => {
        setListings(res.listings ?? []);
      })
      .catch((err) => {
        setListings([]);
        setListingsError(err instanceof Error ? err.message : 'Errore caricamento venditori');
      })
      .finally(() => setListingsLoading(false));
  }, [card?.cardtrader_id]);

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
        <div className="container-content py-3 sm:py-4 lg:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
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
            <h1 className="text-xl font-bold uppercase tracking-tight text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl break-words">
              {title}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm font-bold uppercase tracking-tight text-gray-700 break-words">
              {subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contenuto principale: card bianca su sfondo grigio – responsive padding e layout */}
      <section className="w-full bg-[#F0F0F0] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-10 sm:pb-12 min-h-[50vh]">
        <div className="container-content">
          <div className="flex flex-col rounded-lg bg-white shadow-md overflow-hidden md:flex-row min-h-0">
            {/* Colonna sinistra: immagine carta più piccola per adattarsi all'altezza del contenuto INFO */}
            <aside className="flex flex-col w-full md:w-[min(280px,26vw)] lg:min-w-[260px] flex-shrink-0 items-center p-4 sm:p-5 lg:p-6 bg-white border-b md:border-b-0 md:border-r border-gray-200">
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
              className="mt-3 w-full max-w-[240px] sm:max-w-[260px] flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-gray-300 bg-white text-gray-700 hover:border-[#FF8800] hover:text-[#FF8800] transition-colors"
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
                    'relative flex-1 min-w-0 min-h-[48px] px-2 sm:px-3 py-3 text-xs sm:text-sm font-bold uppercase transition-colors border-r border-gray-300 last:border-r-0',
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
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 sm:gap-5 lg:gap-6 p-4 sm:p-5 lg:p-6 min-w-0 w-full">
                {/* Box info carta: RARITÀ, NUMERO, STAMPATA IN, DISPONIBILI */}
                <div className="flex flex-col min-h-0 bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-stretch border-b border-gray-200 pb-3 sm:pb-4">
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
                  <div className="mt-3 sm:mt-4">
                    <span className="text-[10px] font-bold uppercase text-black">STAMPATA IN</span>
                    <p className="mt-0.5 text-xs sm:text-sm font-bold uppercase text-black">{card?.set_name ?? 'SUSSURRI NEL POZZO'}</p>
                    <Link href="#" className="mt-1 inline-block text-xs font-medium text-[#FF8800] hover:underline uppercase">MOSTRA RISTAMPE</Link>
                  </div>
                  {card?.game_slug === 'mtg' && card?.available_languages && card.available_languages.length > 0 && (
                    <div className="mt-3 sm:mt-4">
                      <span className="text-[10px] font-bold uppercase text-black">LINGUE DISPONIBILI</span>
                      <p className="mt-0.5 text-xs sm:text-sm font-bold uppercase text-black">
                        {card.available_languages.map((code) => langLabelByCode[code] ?? code).join(', ')}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 sm:mt-4">
                    <span className="text-[10px] font-bold uppercase text-black">DISPONIBILI</span>
                    <p className="mt-0.5 text-xl sm:text-2xl font-bold text-black">1148</p>
                  </div>
                  <Link href="#" className="mt-3 sm:mt-4 inline-block text-[10px] font-medium text-[#FF8800] hover:underline">
                    Informazioni sull&apos;RSGP / Produttore
                  </Link>
                </div>
                {/* Box grafico e prezzi: occupa il resto della riga */}
                <div className="flex flex-col min-h-0 bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row flex-1 min-h-[200px] sm:min-h-0 gap-4 sm:gap-5">
                    {/* Grafico tendenza */}
                    <div className="flex flex-[1.5] min-w-0 flex-col">
                      <p className="text-xs sm:text-sm text-gray-700 mb-1">Tendenza di prezzo</p>
                      <div className="flex flex-1 min-h-[140px] sm:min-h-[160px] items-stretch gap-2">
                        <div className="flex shrink-0 flex-col justify-between text-[10px] font-medium text-gray-600 py-0.5">
                          {['3 €', '2 €', '1 €', '0 €'].map((l, i) => <span key={i}>{l}</span>)}
                        </div>
                        <div className="min-w-0 flex-1 bg-[#F5F5F5] rounded border border-gray-200">
                          <svg viewBox="0 0 200 120" className="h-full w-full" preserveAspectRatio="none">
                            {[0, 1, 2, 3, 4].map((i) => <line key={`h${i}`} x1="0" y1={i * 30} x2="200" y2={i * 30} stroke="#e5e7eb" strokeWidth="0.5" />)}
                            {[0, 1, 2, 3, 4].map((i) => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="120" stroke="#e5e7eb" strokeWidth="0.5" />)}
                            <polyline fill="none" stroke="#FF8800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,90 30,40 60,100 90,25 120,70 150,50 180,35 200,45" />
                          </svg>
                          <div className="flex justify-between px-1 text-[10px] text-gray-500 mt-0.5">
                            <span>01/01/28</span>
                            <span>01/01/28</span>
                            <span>01/01/28</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Valore tendenza + Prezzo medio */}
                    <div className="flex flex-col justify-start sm:justify-center flex-shrink-0 sm:w-[140px] lg:w-[160px] border-t sm:border-t-0 sm:border-l border-gray-200 pt-4 sm:pt-0 sm:pl-4">
                      <p className="text-xs sm:text-sm text-gray-700">Tendenza di prezzo</p>
                      <p className="mt-0.5 text-lg sm:text-xl font-bold text-[#FF8800] underline">1,46 €</p>
                      <p className="mt-3 text-xs sm:text-sm font-bold text-gray-700">Prezzo medio</p>
                      <ul className="mt-1.5 list-none space-y-1 text-xs sm:text-sm">
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
                          Condizione <span className="text-gray-400" title="Info">ⓘ</span>
                        </label>
                        <select value={condizioneVendi} onChange={(e) => setCondizioneVendi(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white">
                          <option value="near_mint">Near Mint</option>
                          <option value="mint">Mint</option>
                          <option value="ex">Excellent</option>
                          <option value="gd">Good</option>
                          <option value="lp">Light Played</option>
                          <option value="pl">Played</option>
                          <option value="po">Poor</option>
                        </select>
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
                <div className="flex flex-col min-h-0 bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row flex-1 min-h-[200px] sm:min-h-0 gap-4 sm:gap-5">
                    <div className="flex flex-[1.5] min-w-0 flex-col">
                      <p className="text-xs sm:text-sm text-gray-700 mb-1">Tendenza di prezzo</p>
                      <div className="flex flex-1 min-h-[140px] sm:min-h-[160px] items-stretch gap-2">
                        <div className="flex shrink-0 flex-col justify-between text-[10px] font-medium text-gray-600 py-0.5">
                          {['3 €', '2 €', '1 €', '0 €'].map((l, i) => <span key={i}>{l}</span>)}
                        </div>
                        <div className="min-w-0 flex-1 bg-[#F5F5F5] rounded border border-gray-200">
                          <svg viewBox="0 0 200 120" className="h-full w-full" preserveAspectRatio="none">
                            {[0, 1, 2, 3, 4].map((i) => <line key={`h${i}`} x1="0" y1={i * 30} x2="200" y2={i * 30} stroke="#e5e7eb" strokeWidth="0.5" />)}
                            {[0, 1, 2, 3, 4].map((i) => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="120" stroke="#e5e7eb" strokeWidth="0.5" />)}
                            <polyline fill="none" stroke="#FF8800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,90 30,40 60,100 90,25 120,70 150,50 180,35 200,45" />
                          </svg>
                          <div className="flex justify-between px-1 text-[10px] text-gray-500 mt-0.5">
                            <span>01/01/28</span>
                            <span>01/01/28</span>
                            <span>01/01/28</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-start sm:justify-center flex-shrink-0 sm:w-[140px] lg:w-[160px] border-t sm:border-t-0 sm:border-l border-gray-200 pt-4 sm:pt-0 sm:pl-4">
                      <p className="text-xs sm:text-sm text-gray-700">Tendenza di prezzo</p>
                      <p className="mt-0.5 text-lg sm:text-xl font-bold text-[#FF8800] underline">1,46 €</p>
                      <p className="mt-3 text-xs sm:text-sm font-bold text-gray-700">Prezzo medio</p>
                      <ul className="mt-1.5 list-none space-y-1 text-xs sm:text-sm">
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
            {/* Tab METTI ALL'ASTA: breve placeholder */}
            {activeTab === 'ASTA' && (
              <div className="p-4 sm:p-5 lg:p-6">
                <p className="text-sm text-gray-500">Le offerte e i venditori sono nella sezione sotto.</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* Sezione sempre visibile: FILTRI (sinistra) + tab VENDITORI | SCAMBIO | VEDI ALL'ASTA + tabella (destra) – non cambia con INFO/VENDI/SCAMBIA/METTI ALL'ASTA */}
      <section className="w-full bg-[#F0F0F0] border-t border-gray-300">
        <div className="container-content py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Sidebar FILTRI – come negli screenshot */}
            <aside className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-bold uppercase text-gray-900">Filtri</span>
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Posizione venditore</label>
                    <select className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                      <option>Paesi</option>
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
            </aside>

            {/* Area destra: tab VENDITORI | SCAMBIO | VEDI ALL'ASTA + contenuto */}
            <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200 bg-[#E5E7EB]">
                {(['VENDITORI', 'SCAMBIO', 'ASTA'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSellerSubTab(tab)}
                    className={cn(
                      'flex-1 min-w-0 min-h-[48px] px-4 py-3 text-sm font-bold uppercase transition-colors',
                      sellerSubTab === tab ? 'bg-[#FF8800] text-white' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {tab === 'ASTA' ? "VEDI ALL'ASTA" : tab}
                  </button>
                ))}
              </div>
              {sellerSubTab === 'VENDITORI' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] table-fixed text-left text-xs sm:text-sm">
                    <colgroup>
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '38%' }} />
                      <col style={{ width: '36%' }} />
                    </colgroup>
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: '#E5E7EB', borderTop: '2px solid #1D3160', borderLeft: '2px solid #1D3160', borderRight: '2px solid #1D3160', color: '#1D3160' }}>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">Venditore</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">Informazioni prodotto</th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">Offerta</th>
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
                              <button type="button" className="shrink-0 rounded-full border-2 border-[#FF8800] bg-[#EAEAEA] px-3 py-1.5 text-xs font-bold uppercase text-[#FF8800] hover:opacity-90">SCAMBIA</button>
                              <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" aria-label="Aggiungi al carrello" style={{ color: ACCENT_ORANGE }}>
                                <Image src={getCdnImageUrl('cart-icon.png')} alt="" width={22} height={22} className="h-5 w-5 object-contain" unoptimized />
                              </button>
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
    </div>
  );
}
