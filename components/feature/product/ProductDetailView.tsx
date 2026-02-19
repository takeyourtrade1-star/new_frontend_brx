'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';

import group558Icon from '@/assets/images/Group_558.png';
import starIcon from '@/assets/images/star.png';
import medalIcon from '@/assets/images/medal.png';
import cartIcon from '@/assets/images/cart-icon.png';

const PRIMARY_BLUE = '#1D3160';
const ACCENT_ORANGE = '#f97316';

const PAGE_BACKGROUND = {
  backgroundImage:
    'linear-gradient(rgba(61, 101, 198, 0.85), rgba(29, 49, 96, 0.85)), url("/brx_bg.png"), linear-gradient(180deg, #3D65C6 0%, #1D3160 100%)',
  backgroundRepeat: 'no-repeat, repeat, no-repeat',
  backgroundSize: 'cover, auto, cover',
  backgroundAttachment: 'fixed',
};

const MOCK_SELLERS = [
  { rank: 250, country: 'IT', name: 'LEO', badge: true, condition: 'CARTA UNICA FOIL SPED RAPIDA', price: 18.0, qty: 11 },
  { rank: 312, country: 'IT', name: 'MARCO', badge: false, condition: 'NM FOIL', price: 17.5, qty: 3 },
  { rank: 89, country: 'DE', name: 'HANS', badge: true, condition: 'EX+ SPED RAPIDA', price: 19.0, qty: 7 },
  { rank: 445, country: 'FR', name: 'PIERRE', badge: false, condition: 'LP FOIL', price: 16.8, qty: 2 },
  { rank: 120, country: 'IT', name: 'GIULIA', badge: true, condition: 'MINT FOIL SPED RAPIDA', price: 20.0, qty: 5 },
  { rank: 501, country: 'ES', name: 'CARLOS', badge: false, condition: 'NM', price: 15.9, qty: 1 },
  { rank: 78, country: 'IT', name: 'ALESSIO', badge: true, condition: 'NM FOIL', price: 18.2, qty: 4 },
  { rank: 203, country: 'DE', name: 'STEFAN', badge: false, condition: 'EX SPED RAPIDA', price: 17.0, qty: 6 },
  { rank: 567, country: 'FR', name: 'JEAN', badge: false, condition: 'LP', price: 16.5, qty: 2 },
  { rank: 42, country: 'IT', name: 'FRANCESCA', badge: true, condition: 'MINT FOIL', price: 21.0, qty: 3 },
  { rank: 389, country: 'ES', name: 'PABLO', badge: false, condition: 'NM SPED RAPIDA', price: 17.8, qty: 8 },
  { rank: 156, country: 'IT', name: 'MATTEO', badge: true, condition: 'EX+ FOIL', price: 19.5, qty: 1 },
  { rank: 612, country: 'DE', name: 'KLAUS', badge: false, condition: 'LP FOIL SPED RAPIDA', price: 16.0, qty: 5 },
  { rank: 95, country: 'FR', name: 'LUC', badge: true, condition: 'NM', price: 18.5, qty: 9 },
];

type ProductDetailViewProps = {
  slug: string;
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  imageSrc?: string;
};

export function ProductDetailView({
  slug,
  title = "MOWGLI - CUCCIOLO D'UOMO",
  subtitle = "SUSSURRI NEL POZZO - MOWGLI - MAN CUB - SINGLES",
  breadcrumbs = [
    { label: 'MAGIC: THE GATHERING', href: '#' },
    { label: 'SINGLES', href: '#' },
    { label: 'ECLISSI DI QUALCOSA', href: '#' },
    { label: 'STORMO DELLA SCISSIONE', href: '#' },
  ],
  imageSrc = '/images/kyurem.png',
}: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'INFO' | 'VENDI' | 'SCAMBIA' | 'ASTA'>('INFO');
  const [imageError, setImageError] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [soloFoil, setSoloFoil] = useState(false);
  const [tipoVenditore, setTipoVenditore] = useState<string | null>(null);
  const [firmata, setFirmata] = useState<'SÌ' | 'NO' | 'ENTRAMBI'>('ENTRAMBI');
  const [alterata, setAlterata] = useState<'SÌ' | 'NO' | 'ENTRAMBI'>('ENTRAMBI');
  const [quantita, setQuantita] = useState(33);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

  const CONDIZIONE_MINIMA = [
    { id: 'MT', textColor: '#6DBFF8' },
    { id: 'NM', textColor: '#82C27F' },
    { id: 'EX', textColor: '#DDC597' },
    { id: 'GD', textColor: '#F7DF7F' },
    { id: 'LP', textColor: '#EDC087' },
    { id: 'PL', textColor: '#F8A8B8' },
    { id: 'PO', textColor: '#EC787C' },
  ] as const;

  const LINGUA_CARTA = [
    { code: 'IT', label: 'Italia' },
    { code: 'JP', label: 'Giappone' },
    { code: 'GB', label: 'Regno Unito' },
    { code: 'ES', label: 'Spagna' },
    { code: 'DE', label: 'Germania' },
    { code: 'FR', label: 'Francia' },
  ] as const;

  const SectionDivider = () => <hr className="border-0 border-t border-[#D0D0D0]" />;

  const effectiveImageSrc =
    imageError || !imageSrc
      ? 'https://placehold.co/280x373/e5e7eb/6b7280?text=Carta'
      : imageSrc;
  const isLocalImage = effectiveImageSrc.startsWith('/');

  const formatEuro = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);

  const tabs = [
    { id: 'INFO' as const, label: 'INFO' },
    { id: 'VENDI' as const, label: 'VENDI' },
    { id: 'SCAMBIA' as const, label: 'SCAMBIA' },
    { id: 'ASTA' as const, label: "METTI ALL'ASTA" },
  ];

  return (
    <div className="min-h-screen font-sans text-white" style={PAGE_BACKGROUND}>
      <Header />

      {/* Header: titolo, sottotitolo, Preferiti – su sfondo blu */}
      <section className="w-full text-white" style={PAGE_BACKGROUND}>
        <div className="mx-auto max-w-[90rem] px-3 py-4 sm:px-4 sm:py-5">
          <nav aria-label="Breadcrumb" className="mb-2 text-xs font-medium text-white/90 sm:text-sm">
            {breadcrumbs.map((b, i) => (
              <span key={b.label}>
                {b.href ? (
                  <Link href={b.href} className="hover:underline">
                    {b.label}
                  </Link>
                ) : (
                  <span>{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span className="mx-1">/</span>}
              </span>
            ))}
          </nav>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-white/90">{subtitle}</p>
            </div>
            <button
              type="button"
              className="flex shrink-0 flex-col items-center gap-1.5 rounded p-2 text-white transition-opacity hover:opacity-80"
              aria-label="Aggiungi ai preferiti"
            >
              <svg width="26" height="24" viewBox="0 0 32 28" fill="none" className="text-white" aria-hidden>
                <path
                  d="M16 26s-14-8-14-15a6.5 6.5 0 0 1 13-2.5 6.5 6.5 0 0 1 13 2.5C28 18 16 26 16 26z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/90">PREFERITI</span>
            </button>
          </div>
        </div>
      </section>

      {/* Scheda Prodotto: sfondo blu, tab sopra le 2 card, 3 colonne */}
      <section className="mx-auto max-w-[90rem] px-3 py-6 sm:px-4" style={PAGE_BACKGROUND}>
        {/* Layout come in riferimento: immagine a sinistra, tab sulla stessa riga in alto, sotto le 2 card */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-x-10 md:gap-y-4 md:items-start">
          {/* Colonna sinistra: immagine su 2 righe, centrata verticalmente */}
          <div className="flex min-h-[320px] justify-center md:col-span-4 md:row-span-2 md:min-h-0 md:items-center lg:col-span-3">
            <div
              className="relative shrink-0 overflow-hidden shadow-lg"
              style={{
                width: '343.8px',
                maxWidth: '100%',
                height: '472px',
                borderRadius: '30px',
                border: '3px solid #FFFFFF',
              }}
            >
              {isLocalImage ? (
                <img
                  src={effectiveImageSrc}
                  alt={title}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Image
                  src={effectiveImageSrc}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 280px"
                  unoptimized
                  onError={() => setImageError(true)}
                  priority
                />
              )}
            </div>
          </div>

          {/* Tab pill: stessa riga in alto dell'immagine, subito sopra le 2 card */}
          <div className="flex flex-wrap justify-center gap-3 pb-3 md:col-span-8 md:justify-start lg:col-span-9">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'min-h-[44px] min-w-[120px] rounded-full border px-6 py-3 text-sm font-bold uppercase tracking-wide transition-colors sm:min-w-[140px]',
                  activeTab === t.id
                    ? 'border-[#FF8800] bg-white text-[#FF8800]'
                    : 'border-[#FF8800] bg-white text-[#FF8800] hover:bg-white/95'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Colonna centro: card info – sfondo #F5F5F5, bordo ovale arancione, h 350px, testo compatto */}
          <div className="mt-3 w-full max-w-[650px] h-[350px] overflow-hidden rounded-xl bg-[#F5F5F5] px-4 py-2 shadow-md md:col-span-4 lg:col-span-5">
            <div className="flex w-full items-start gap-0">
              <div className="flex min-w-0 flex-1 flex-col items-center pr-3 text-center border-r border-black">
                <span className="text-[10px] font-bold uppercase tracking-wide text-black">RARITÀ</span>
                <div className="mt-0.5 flex justify-center">
                  <Image
                    src="/images/stellina.png"
                    alt=""
                    width={22}
                    height={22}
                    className="h-5 w-5 object-contain"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center pl-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wide text-black">NUMERO</span>
                <span className="mt-0.5 text-base font-bold text-black">015</span>
              </div>
            </div>
            <div className="mt-1.5 flex flex-col items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wide text-black">STAMPATA IN</span>
              <span className="mt-0.5 text-xs font-bold uppercase text-black">SUSSURRI NEL POZZO</span>
              <button
                type="button"
                className="mt-1 text-xs font-medium uppercase tracking-wide text-[#FF9900] hover:underline"
              >
                MOSTRA RISTAMPE
              </button>
            </div>
            <div className="mt-1.5 flex flex-col items-center">
              <button
                type="button"
                className="w-full max-w-[200px] rounded-full border-2 border-[#FF9900] bg-white px-4 py-2 text-center"
              >
                <span className="block text-[10px] font-bold uppercase tracking-wide text-black">DISPONIBILI</span>
                <span className="mt-0.5 block text-xl font-bold text-black">1148</span>
              </button>
            </div>
            <div className="mt-1.5 text-center">
              <Link
                href="#"
                className="text-[10px] font-medium text-[#FF9900] hover:underline"
              >
                Informazioni sull&apos;RSGP / Produttore
              </Link>
            </div>
          </div>

          {/* Colonna destra: card come in riferimento – sfondo #E9EBF0, grafico a sinistra ~2/3, statistiche a destra */}
          <div className="mt-3 flex h-[350px] overflow-hidden rounded-xl bg-[#E9EBF0] p-4 shadow-md md:col-span-4 lg:col-span-4">
            {/* Sinistra: grafico (circa 2/3) con assi e griglia nera */}
            <div className="flex min-w-0 flex-[2] flex-col">
              <div className="flex flex-1 items-stretch gap-1">
                <div className="flex shrink-0 flex-col justify-between text-[10px] font-medium text-gray-700">
                  {['3 €', '3 €', '3 €', '3 €', '3 €'].map((label, i) => (
                    <span key={i}>{label}</span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <svg viewBox="0 0 200 120" className="h-full w-full min-h-[140px]" preserveAspectRatio="none">
                    {/* Griglia nera */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line key={`h${i}`} x1="0" y1={i * 30} x2="200" y2={i * 30} stroke="#000" strokeWidth="0.5" />
                    ))}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="120" stroke="#000" strokeWidth="0.5" />
                    ))}
                    <polyline
                      fill="none"
                      stroke="#FF8800"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="0,90 30,40 60,100 90,25 120,70 150,50 180,35 200,45"
                    />
                  </svg>
                  <div className="mt-0.5 flex justify-between text-[10px] text-gray-700">
                    <span>01/01/26</span>
                    <span>01/01/26</span>
                    <span>01/01/26</span>
                    <span>01/01/26</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Destra: Tendenza di prezzo, valore, Prezzo medio, medie (circa 1/3) */}
            <div className="flex min-w-0 flex-1 flex-col justify-center pl-4 text-left">
              <p className="text-sm font-normal text-gray-700">Tendenza di prezzo</p>
              <p className="mt-0.5 text-xl font-bold text-gray-900">1,46 €</p>
              <p className="mt-3 text-sm font-bold text-gray-700">Prezzo medio</p>
              <ul className="mt-1.5 list-none space-y-1 text-sm">
                <li className="flex justify-between gap-4">
                  <span className="font-normal text-gray-700">30 gg</span>
                  <span className="font-bold text-gray-900">1,35 €</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="font-normal text-gray-700">7 gg</span>
                  <span className="font-bold text-gray-900">1,48 €</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="font-normal text-gray-700">1 gg</span>
                  <span className="font-bold text-gray-900">1,05 €</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Lista Venditori – FILTRI a sinistra in sidebar blu + tabella */}
      <section className="mx-auto max-w-[90rem] px-3 pb-12 sm:px-4">
        <div className={cn('flex rounded-xl border border-gray-200 border-l-0 border-t-0 border-b-0 shadow-sm', !filtersOpen && 'overflow-hidden')}>
          <aside
            ref={filtersRef}
            className={cn(
              'relative flex flex-shrink-0 flex-col transition-[width]',
              filtersOpen ? 'w-[280px]' : 'w-[18%] min-w-[140px]'
            )}
            style={PAGE_BACKGROUND}
          >
            <button
              ref={filtersButtonRef}
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-haspopup="true"
              className={cn(
                'relative flex w-full items-center justify-center rounded-tl-lg rounded-tr-lg bg-white px-3 py-2.5',
                filtersOpen ? 'rounded-br-none' : 'rounded-b-lg'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">FILTRI</span>
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="shrink-0 text-gray-700" aria-hidden>
                  <line x1="2" y1="3" x2="16" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M6 3 L6 1 M12 3 L12 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M6 11 L6 13 M12 11 L12 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500 transition-transform', filtersOpen && 'rotate-180')} aria-hidden>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {filtersOpen && (
              <div
                className="max-h-[min(80vh,900px)] min-h-[200px] overflow-y-auto rounded-[14px] border bg-[#F8F8F8] px-4 py-4 font-sans"
                style={{ borderColor: '#D0D0D0' }}
              >
                {/* Header FILTRI centrato + icona, linea sotto */}
                <div className="flex items-center justify-center gap-2 border-b border-[#D0D0D0] py-3">
                  <span className="text-sm font-semibold uppercase tracking-wide text-gray-900">FILTRI</span>
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-900" strokeWidth={2} aria-hidden />
                </div>

                <SectionDivider />

                {/* Posizione Venditore */}
                <section className="py-3">
                  <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[#1a1a2e]">POSIZIONE VENDITORE</p>
                  <button
                    type="button"
                    className="mx-auto flex w-fit items-center justify-center gap-1.5 rounded-full border border-[#c0c0c0] bg-[#E0E0E0] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#1a1a2e] hover:bg-[#D5D5D5]"
                  >
                    PAESI
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#1a1a2e]" strokeWidth={2} />
                  </button>
                </section>

                <SectionDivider />

                {/* Tipo Venditore */}
                <section className="py-3">
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-800">TIPO VENDITORE</p>
                  <div className="flex flex-col items-center gap-1.5">
                    {(['PRIVATO', 'PROFESSIONALE', 'POWERSELLER'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTipoVenditore(tipoVenditore === t ? null : t)}
                        className={cn(
                          'w-fit min-w-[140px] rounded-full border px-4 py-2 text-center text-[11px] font-medium uppercase transition-colors',
                          tipoVenditore === t
                            ? 'border-[#1D3160] bg-[#1D3160] text-white'
                            : 'border-[#D0D0D0] bg-[#E0E0E0] text-gray-800 hover:bg-[#D5D5D5]'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </section>

                <SectionDivider />

                {/* Condizione Minima */}
                <section className="py-3">
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-800">CONDIZIONE MINIMA</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CONDIZIONE_MINIMA.map(({ id, textColor }) => (
                      <button
                        key={id}
                        type="button"
                        className="rounded-full border border-[#D0D0D0] bg-[#E0E0E0] px-2 py-1 text-[10px] font-medium uppercase hover:opacity-90"
                        style={{ color: textColor }}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </section>

                <SectionDivider />

                {/* Lingua Carta – bandiere come immagini (visibili su tutti i browser) */}
                <section className="py-3">
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-800">LINGUA CARTA</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LINGUA_CARTA.map(({ code, label }) => (
                      <button
                        key={code}
                        type="button"
                        className="flex items-center justify-center rounded-full border border-[#D0D0D0] bg-[#E0E0E0] p-1.5 hover:bg-[#D5D5D5]"
                        aria-label={label}
                        title={label}
                      >
                        <img
                          src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
                          alt=""
                          width={32}
                          height={24}
                          className="h-5 w-auto object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </section>

                <SectionDivider />

                {/* Firmata */}
                <section className="py-3">
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-800">FIRMATA</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {(['SÌ', 'NO', 'ENTRAMBI'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFirmata(f)}
                        className={cn(
                          'rounded-full border px-2.5 py-1.5 text-[10px] font-medium uppercase transition-colors',
                          firmata === f
                            ? 'border-[#1D3160] bg-[#1D3160] text-white'
                            : 'border-[#D0D0D0] bg-[#E0E0E0] text-gray-800 hover:bg-[#D5D5D5]'
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </section>

                <SectionDivider />

                {/* Alterata */}
                <section className="py-3">
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-800">ALTERATA</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {(['SÌ', 'NO', 'ENTRAMBI'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAlterata(a)}
                        className={cn(
                          'rounded-full border px-2.5 py-1.5 text-[10px] font-medium uppercase transition-colors',
                          alterata === a
                            ? 'border-[#1D3160] bg-[#1D3160] text-white'
                            : 'border-[#D0D0D0] bg-[#E0E0E0] text-gray-800 hover:bg-[#D5D5D5]'
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </section>

                <SectionDivider />

                {/* Quantità */}
                <section className="py-3">
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-800">QUANTITÀ</p>
                  <div className="flex items-center gap-0 overflow-hidden rounded-full border border-[#D0D0D0] bg-[#E0E0E0]">
                    <span className="flex-1 px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-600">INSERIRE QUANTITÀ</span>
                    <input
                      type="number"
                      min={1}
                      value={quantita}
                      onChange={(e) => setQuantita(Number(e.target.value) || 1)}
                      className="mr-1.5 h-6 w-10 rounded-full border-0 bg-white text-center text-[10px] font-semibold text-gray-900 shadow-sm focus:ring-2 focus:ring-[#1D3160]"
                    />
                  </div>
                </section>

                <SectionDivider />

                {/* Solo Foil? */}
                <section className="py-3">
                  <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-800">SOLO FOIL?</p>
                  <div className="flex items-center justify-between overflow-hidden rounded-full border border-[#D0D0D0] bg-[#E0E0E0] px-3 py-2">
                    <span className="text-[10px] font-medium uppercase text-gray-800">SOLO FOIL?</span>
                    <button
                      type="button"
                      onClick={() => setSoloFoil((v) => !v)}
                      className={cn(
                        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                        soloFoil ? 'bg-gray-900' : 'bg-gray-400'
                      )}
                      aria-pressed={soloFoil}
                      aria-label="Solo foil"
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all',
                          soloFoil ? 'left-0.5' : 'right-0.5'
                        )}
                      />
                    </button>
                  </div>
                </section>
              </div>
            )}
          </aside>
          <div className="min-w-0 flex-1 overflow-hidden rounded-r-xl border border-l-0 border-b-0 border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] table-fixed text-left text-sm">
              <colgroup>
                <col style={{ width: '26%' }} />
                <col style={{ width: '38%' }} />
                <col style={{ width: '36%' }} />
              </colgroup>
              <thead>
                <tr
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: '#E5E7EB',
                    borderTop: '2px solid #1D3160',
                    borderLeft: '2px solid #1D3160',
                    borderRight: '2px solid #1D3160',
                    color: '#1D3160',
                  }}
                >
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">
                    VENDITORE
                  </th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">
                    INFORMAZIONI PRODOTTO
                  </th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">
                    OFFERTA
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SELLERS.map((seller, i) => (
                  <tr
                    key={`${seller.name}-${i}`}
                    className={cn(
                      'transition-colors align-middle',
                      i < MOCK_SELLERS.length - 1 && 'border-b border-gray-100',
                      i % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                    )}
                  >
                    <td className="px-3 py-3 align-middle sm:px-4 sm:py-3.5">
                      <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-200 text-xs font-bold text-gray-700">
                          {seller.rank}
                        </span>
                        <span className="text-base" aria-hidden>
                          🇮🇹
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium uppercase text-gray-900">
                          {seller.name}
                        </span>
                        <div className="flex justify-center">
                          <Image
                            src={medalIcon}
                            alt=""
                            width={24}
                            height={24}
                            className="h-6 w-6 shrink-0 object-contain"
                            aria-hidden
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle sm:px-4 sm:py-3.5">
                      <div className="flex items-center justify-end gap-3 mr-12">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                          {i % 2 === 0 ? (
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md"
                              style={{ backgroundColor: '#e0e0e0' }}
                              aria-label="Dettagli"
                            >
                              <Image
                                src={group558Icon}
                                alt=""
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                              />
                            </button>
                          ) : null}
                        </div>
                        <span
                          className="inline-flex h-[22px] min-w-[44px] shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-bold"
                          style={{ backgroundColor: '#212529', color: '#20c997' }}
                        >
                          MT
                        </span>
                        <Image
                          src={starIcon}
                          alt=""
                          width={24}
                          height={24}
                          className="h-6 w-6 shrink-0 object-contain"
                          aria-hidden
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle sm:px-4 sm:py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-14 shrink-0 text-right text-sm font-semibold text-blue-600 tabular-nums">
                          {formatEuro(seller.price)}
                        </span>
                        <span className="w-6 shrink-0 text-sm text-gray-600 tabular-nums">{seller.qty}</span>
                        <button
                          type="button"
                          className="shrink-0 rounded-full border-2 border-[#FF8800] bg-[#EAEAEA] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#FF8800] transition-opacity hover:opacity-90"
                        >
                          SCAMBIA
                        </button>
                        <button
                          type="button"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0"
                          aria-label="Aggiungi al carrello"
                          style={{ color: ACCENT_ORANGE }}
                        >
                          <Image
                            src={cartIcon}
                            alt=""
                            width={22}
                            height={22}
                            className="h-5 w-5 object-contain"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
