'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { useSearchCards } from '@/lib/hooks/use-search';
import { useBestSellers } from '@/lib/hooks/use-best-sellers';
import { getCdnImageUrl } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { TOURNAMENTS_PORTAL_LINK_PROPS } from '@/lib/config/tournaments';

import { cn } from '@/lib/utils';
import { FeaturesSection } from './FeaturesSection';
import { AsteInCorsoCarousel } from './aste/AsteInCorsoCarousel';
import { ScambiInCorsoCarousel } from './scambi/ScambiInCorsoCarousel';
import { CardFoilOverlay } from './product/detail/CardFoilOverlay';

/** Velo "foil" arcobaleno molto attenuato per le 3 card blu (Best Sellers/Aste/Scambi):
 * riusa l'overlay olografico delle pagine prodotto, smorzato con opacity così resta
 * un accento ambientale e non un effetto "premium carta". */
function DashboardCardFoil() {
  return <CardFoilOverlay className="dashboard-card-foil rounded-2xl opacity-[0.14]" />;
}

const SECTION_RADIUS = '0.625rem';

/** Singola voce card (immagine + label + prezzo) – dati da backend */
export type HomeCardItem = {
  id?: string;
  imageUrl?: string | null;
  label: string;
  price?: string;
};

/** Sezione "Compra e vendi" – dati da backend */
export type CompraVendiData = {
  topCards: HomeCardItem[];
  listItems: HomeCardItem[];
  vediTuttoHref?: string;
};

/** Sezione "Scambia ora" – dati da backend */
export type ScambiaData = {
  topCards: HomeCardItem[];
  listItems: HomeCardItem[];
  vediTuttoHref?: string;
};

const headerOrange = {
  backgroundColor: '#ff7300',
};

type SearchHit = {
  id: string;
  name: string;
  set_name: string;
  image?: string | null;
};

const POKEMON_HITS: SearchHit[] = Array(12).fill(null).map((_, i) => ({
  id: `pk-${i}`,
  name: i === 0 ? 'Pikachu EX' : 'Charizard VMAX',
  set_name: 'Scarlet & Violet',
  image: 'https://images.pokemontcg.io/sv1/198_hi.png'
}));

const OP_HITS: SearchHit[] = Array(12).fill(null).map((_, i) => ({
  id: `op-${i}`,
  name: i === 0 ? 'Monkey D. Luffy' : 'Roronoa Zoro',
  set_name: 'Romance Dawn',
  image: 'https://product-images.tcgplayer.com/fit-in/437x437/285149.jpg'
}));

const MTG_HITS_FALLBACK: SearchHit[] = Array(12).fill(null).map((_, i) => ({
  id: `mtg-fallback-${i}`,
  name: i === 0 ? 'Black Lotus' : 'Mox Pearl',
  set_name: 'Alpha Edition',
  image: getCdnImageUrl('card-1.png') // Fallback using a local CDN image
}));

function MagicSearchCard({ hit, useLightText = false }: { hit: SearchHit; useLightText?: boolean }) {
  const { t } = useTranslation();
  const imgUrl = getCardImageUrl(hit.image ?? null);
  return (
    <Link href={`/products/${hit.id}`} className="group flex flex-col items-center" aria-label={t('marketplace.openDetail', { name: hit.name })}>
      {imgUrl ? (
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Image src={imgUrl} alt={hit.name} fill className="object-cover transition-transform group-hover:scale-[1.02]" unoptimized />
        </div>
      ) : (
        <div className="w-full aspect-[3/4] rounded-lg border border-gray-200 bg-gray-100" aria-hidden />
      )}
      <p className={cn(
        "mt-1.5 line-clamp-1 text-center text-xs font-semibold",
        useLightText ? "text-white" : "text-slate-900"
      )}>{hit.name}</p>
      <p className={cn(
        "line-clamp-1 text-center text-[11px] font-medium",
        useLightText ? "text-slate-300" : "text-gray-600"
      )}>{hit.set_name}</p>
    </Link>
  );
}

function BestSellerRankRow({ hit, rank, useLightText = false }: { hit: SearchHit; rank: number; useLightText?: boolean }) {
  return (
    <li key={hit.id} className={cn(
      "group/row flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm transition-colors md:px-3.5 md:py-3",
      useLightText ? "hover:bg-white/10" : "hover:bg-orange-50/80"
    )}>
      <span className={cn(
        "w-6 shrink-0 text-sm font-bold",
        useLightText ? "text-slate-400" : "text-gray-500"
      )}>{rank}.</span>
      {(() => {
        const cardSrc = getCardImageUrl(hit.image ?? null);
        return cardSrc ? (
          <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded shadow-sm">
            <Image src={cardSrc} alt={hit.name} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="h-10 w-8 shrink-0 rounded bg-gray-200" aria-hidden />
        );
      })()}
      <Link
        href={`/products/${hit.id}`}
        className={cn(
          "flex-1 truncate font-medium transition-colors group-hover/row:text-[#ff7300]",
          useLightText ? "text-white" : "text-slate-900"
        )}
      >
        {hit.name}
      </Link>
      <span className={cn(
        "truncate text-[11px]",
        useLightText ? "text-slate-300" : "text-gray-600"
      )}>{hit.set_name}</span>
    </li>
  );
}

/** Mini spieghino Tornei live — card compatta, sostituisce "Semplice. Sicuro. Tuo." */
function TorneiMiniSection() {
  const { t } = useTranslation();
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-white/95 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-8 before:absolute before:inset-0 before:z-0 before:bg-[url('/brx-sfondo-logo-tile.svg')] before:bg-[length:60px_60px] before:bg-[position:0_0] before:bg-repeat before:opacity-[0.35]"
    >
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 md:text-2xl">
            {t('home.tornei.title')}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
            {t('home.tornei.description')}
          </p>
        </div>
        <a
          {...TOURNAMENTS_PORTAL_LINK_PROPS}
          className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-violet-400/40 bg-violet-500/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-violet-700 transition-colors hover:bg-violet-500/20 md:self-auto"
        >
          {t('home.tornei.cta')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  );
}

/** Dati nuove espansioni — placeholder, da sostituire con dati reali (es. Cardmarket) */
export type NuovaEspansioneItem = {
  id: string;
  name: string;
  releaseDate: string;
  imageUrl: string;
};

const NUOVE_ESPANSIONI_PLACEHOLDER: NuovaEspansioneItem[] = [
  {
    id: '1',
    name: 'Foundations',
    releaseDate: '15 Nov 2024',
    imageUrl: '/images/mtg_foundations.png',
  },
  {
    id: '2',
    name: 'Duskmourn: House of Horror',
    releaseDate: '27 Set 2024',
    imageUrl: '/images/mtg_duskmourn.png',
  },
  {
    id: '3',
    name: 'Bloomburrow',
    releaseDate: '02 Ago 2024',
    imageUrl: '/images/mtg_bloomburrow.png',
  },
];

/** Sezione Nuove Espansioni — striscia larga e bassa, non a card */
function NuoveEspansioniSection({ items }: { items: NuovaEspansioneItem[] }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/80 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:px-8 md:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
        <div className="shrink-0 lg:pr-4 lg:w-1/4">
          <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 md:text-xl">
            {t('home.nuoveEspansioni.title')}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 md:text-sm">
            {t('home.nuoveEspansioni.subtitle')}
          </p>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-4">
          {items.map((item, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={item.id}
                className={`${
                  isFirst ? 'sm:col-span-2' : 'sm:col-span-1'
                } flex items-center gap-3 sm:gap-4 rounded-xl border border-slate-200/60 bg-gradient-to-br from-white/95 to-slate-50/70 p-3 shadow-sm hover:scale-[1.01] hover:shadow-md hover:border-indigo-300/80 transition-all duration-300 group`}
              >
                <div
                  className={`relative shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm ${
                    isFirst ? 'h-16 w-24 sm:w-28' : 'h-16 w-16'
                  }`}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 ${
                      isFirst ? 'text-base font-extrabold' : 'text-sm font-bold'
                    }`}
                  >
                    {item.name}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 ${
                      isFirst ? 'bg-slate-100/80 px-2 py-0.5 rounded-full inline-block w-fit' : ''
                    }`}
                  >
                    {t('home.nuoveEspansioni.releaseDate', { date: item.releaseDate })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MarketplaceDashboard({
  compraVendi: _compraVendi,
  scambia: _scambia,
  gameSlug = 'mtg',
  useUnifiedBackground = false,
  showFeaturesBelowTopRow = false,
}: {
  compraVendi?: CompraVendiData;
  scambia?: ScambiaData;
  gameSlug?: GameSlug;
  useUnifiedBackground?: boolean;
  /** Mostra i 4 bannerini (FeaturesSection) sotto le card Best Sellers/Aste in corso invece che sopra. */
  showFeaturesBelowTopRow?: boolean;
} = {}) {
  const { t } = useTranslation();

  const isMtg = !gameSlug || gameSlug === 'mtg';

  // Best sellers REALI: carte in vendita dai venditori registrati (feed pubblico).
  const { data: bestSellersData } = useBestSellers(
    { game: gameSlug ?? 'mtg', limit: 12 },
    { enabled: isMtg },
  );

  // Fallback: catalogo Meilisearch (mostrato finché il feed best-sellers è vuoto/non attivo).
  const { data: searchData, isLoading: magicLoading } = useSearchCards(
    { game: 'mtg', category_id: 1, limit: 30, sort: 'name_asc' },
    { enabled: isMtg },
  );

  const magicHits = useMemo<SearchHit[]>(() => {
    if (gameSlug === 'pokemon') return POKEMON_HITS;
    if (gameSlug === 'op') return OP_HITS;
    // 1ª scelta: carte realmente in vendita dai venditori registrati.
    const bestSellers = (bestSellersData?.items ?? [])
      .filter((it) => it?.card_id && it?.name)
      .map<SearchHit>((it) => ({
        id: it.card_id,
        name: it.name,
        set_name: it.set_name,
        image: it.image,
      }));
    if (bestSellers.length > 0) return bestSellers;
    // 2ª scelta: catalogo. 3ª: mock di fallback.
    const hits = (searchData?.hits ?? []).filter((h) => h?.id && h?.name);
    return hits.length > 0 ? hits : MTG_HITS_FALLBACK;
  }, [gameSlug, bestSellersData, searchData]);

  const [magicOffset, setMagicOffset] = useState(0);

  useEffect(() => {
    if (magicHits.length < 4) return;
    const timer = setInterval(() => {
      setMagicOffset((prev) => (prev + 1) % magicHits.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [magicHits.length]);

  const pickCards = useCallback(
    (start: number, count: number): SearchHit[] => {
      if (magicHits.length === 0) return [];
      return Array.from({ length: count }, (_, i) => magicHits[(start + i) % magicHits.length]);
    },
    [magicHits]
  );

  const orderedBestSellerCards = useMemo(() => pickCards(magicOffset, 12), [pickCards, magicOffset]);
  const topBestSellerCards = orderedBestSellerCards.slice(0, 6);
  const buyListCards = orderedBestSellerCards.slice(6, 9);
  const tradeListCards = orderedBestSellerCards.slice(9, 12);

  return (
    <div
      className={`w-full font-sans transition-colors duration-300 ${
        useUnifiedBackground
          ? 'bg-transparent text-gray-900'
          : "bg-[#F1F5F9] bg-[linear-gradient(rgba(241,245,249,0.8),rgba(241,245,249,0.8)),url('/brx-sfondo-logo-tile.svg')] bg-[length:100%_100%,162px_162px] bg-repeat"
      }`}
    >
      <div className="container-content space-y-4 pb-5 pt-0 md:space-y-8 md:pb-10 md:pt-3">
        {/* MOBILE: Layout semplificato - 1 carta principale + 5 sotto */}
        <div className="block lg:hidden">
          {/* Titolo sezione Best Sellers - Mobile */}
          <div className="mb-2.5 flex items-center px-4 py-1.5">
            <div className="flex flex-col">
              <h2 className={`text-xl font-black uppercase tracking-wide font-sans ${useUnifiedBackground ? 'text-slate-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]' : 'text-slate-900'}`}>Best Sellers</h2>
              <div className="mt-1.5 h-1 w-16 rounded-full bg-gradient-to-r from-[#ff7300] to-[#ff9900]" />
            </div>
          </div>
          <div
            className={`relative isolate flex flex-col overflow-hidden rounded-2xl ${
              useUnifiedBackground
                ? 'border border-white/10 bg-[#0f172a]/65 backdrop-blur-[8px] shadow-[0_10px_28px_rgba(0,0,0,0.35)]'
                : 'border border-gray-200/55 bg-white/30 backdrop-blur-[4px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]'
            }`}
            style={{ borderRadius: SECTION_RADIUS }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[56%] bg-gradient-to-b from-slate-950/55 via-slate-900/35 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[44%] bg-gradient-to-t from-slate-100/92 via-slate-100/68 to-transparent"
            />
            {useUnifiedBackground && <DashboardCardFoil />}
            {/* Card principale */}
            <div className="relative z-10 p-3">
              {magicHits.length > 0 ? (
                <Link
                  href={`/products/${magicHits[0]?.id}`}
                  className="group relative mx-auto block w-[46%] max-w-[190px] overflow-hidden rounded-xl"
                  aria-label={t('marketplace.openDetail', { name: magicHits[0]?.name })}
                >
                  {(() => {
                    const cardSrc = getCardImageUrl(magicHits[0]?.image ?? null);
                    return cardSrc ? (
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <Image
                          src={cardSrc || MTG_HITS_FALLBACK[0].image!}
                          alt={magicHits[0]?.name || 'Card'}
                          fill
                          className="object-cover transition-transform group-hover:scale-[1.02]"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] w-full rounded-xl border border-gray-200 bg-gray-100" aria-hidden />
                    );
                  })()}
                  <p className={`mt-2 text-center text-sm font-semibold ${useUnifiedBackground ? 'text-slate-100' : 'text-gray-900'}`}>{magicHits[0]?.name}</p>
                  <p className={`text-center text-xs ${useUnifiedBackground ? 'text-slate-300' : 'text-gray-500'}`}>{magicHits[0]?.set_name}</p>
                </Link>
              ) : (
                <div className="mx-auto aspect-[3/4] w-[46%] max-w-[190px] rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
              )}
            </div>

            {/* Lista 5 carte sotto */}
            <div className={`relative z-10 border-t border-[#ff7300]/20 px-4 py-2.5 ${useUnifiedBackground ? 'bg-[#0f172a]/70' : ''}`}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#ff7300]">
                Altre carte
              </p>
              <ul className="space-y-2">
                {magicHits.slice(1, 6).map((hit) => (
                  <li key={hit.id} className={`flex items-center gap-3 text-sm ${useUnifiedBackground ? 'text-slate-200' : 'text-gray-800'}`}>
                    {(() => {
                      const cardSrc = getCardImageUrl(hit.image ?? null);
                      return cardSrc ? (
                        <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded">
                          <Image src={cardSrc} alt={hit.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-10 w-7 shrink-0 rounded bg-gray-200" aria-hidden />
                      );
                    })()}
                    <Link href={`/products/${hit.id}`} className="flex-1 truncate text-sm hover:text-[#ff7300] hover:underline">
                      {hit.name}
                    </Link>
                    <span className={`truncate text-xs ${useUnifiedBackground ? 'text-slate-400' : 'text-gray-500'}`}>{hit.set_name}</span>
                  </li>
                ))}
                {magicHits.length === 0 && !magicLoading && (
                  <li className={`text-sm ${useUnifiedBackground ? 'text-slate-300' : 'text-gray-500'}`}>{t('marketplace.noSingles')}</li>
                )}
              </ul>
              <Link
                href="/search"
                className="mt-3 block text-center text-sm font-medium text-[#ff7300] hover:underline"
              >
                {t('marketplace.seeAll')}
              </Link>
            </div>
          </div>
          {/* Mobile: Aste in corso */}
          <div
            className={`relative isolate mt-4 flex flex-col overflow-hidden rounded-2xl ${
              useUnifiedBackground
                ? 'border border-white/10 bg-[#0f172a]/65 backdrop-blur-[8px] shadow-[0_10px_28px_rgba(0,0,0,0.35)]'
                : 'border border-gray-200/55 bg-white/30 backdrop-blur-[4px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]'
            }`}
          >
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[56%] bg-gradient-to-b from-slate-950/55 via-slate-900/35 to-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[44%] bg-gradient-to-t from-slate-100/92 via-slate-100/68 to-transparent" />
            {useUnifiedBackground && <DashboardCardFoil />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between gap-4 px-5 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="h-4.5 w-1 rounded-full bg-gradient-to-b from-[#ff7300] to-[#ff9900]" />
                <h3 className={`text-lg font-black uppercase tracking-wide font-sans ${useUnifiedBackground ? 'text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.42)]' : 'text-slate-900'}`}>
                  {t('auctions.liveAuctionsTitle')}
                </h3>
              </div>
              <Link
                href="/aste"
                className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors hover:text-orange-600"
              >
                {t('marketplace.seeAll')}
              </Link>
            </div>

            <div className="relative z-10 flex flex-col overflow-hidden">
              <AsteInCorsoCarousel useLightText compact />
            </div>
          </div>

          {/* Mobile: Prova gli scambi */}
          <div
            className={`relative isolate mt-3 flex flex-col overflow-hidden rounded-2xl ${
              useUnifiedBackground
                ? 'border border-white/10 bg-[#0f172a]/65 backdrop-blur-[8px] shadow-[0_10px_28px_rgba(0,0,0,0.35)]'
                : 'border border-gray-200/55 bg-white/30 backdrop-blur-[4px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]'
            }`}
          >
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[56%] bg-gradient-to-b from-slate-950/55 via-slate-900/35 to-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[44%] bg-gradient-to-t from-slate-100/92 via-slate-100/68 to-transparent" />
            {useUnifiedBackground && <DashboardCardFoil />}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between gap-4 px-5 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="h-4.5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                <h3 className={`text-lg font-black uppercase tracking-wide font-sans ${useUnifiedBackground ? 'text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.42)]' : 'text-slate-900'}`}>
                  {t('home.scambi.title')}
                </h3>
              </div>
              <Link
                href="/scambi"
                className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors hover:text-orange-600"
              >
                {t('home.scambi.seeAll')}
              </Link>
            </div>

            <div className="relative z-10 flex flex-col overflow-hidden">
              <ScambiInCorsoCarousel useLightText compact />
            </div>
          </div>
        </div>

        {/* DESKTOP: Layout originale a due colonne */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
          {/* ═══ Card VENDITE ═══ */}
          <div
            className={`relative isolate flex min-h-[437px] flex-col justify-between overflow-hidden rounded-2xl lg:col-span-2 ${
              useUnifiedBackground
                ? 'border border-white/10 bg-[#0f172a]/65 backdrop-blur-[8px] shadow-[0_10px_28px_rgba(0,0,0,0.35)]'
                : 'border border-gray-200/55 bg-white/30 backdrop-blur-[4px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]'
            }`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[56%] bg-gradient-to-b from-slate-950/55 via-slate-900/35 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[44%] bg-gradient-to-t from-slate-100/92 via-slate-100/68 to-transparent"
            />
            {useUnifiedBackground && <DashboardCardFoil />}
            <div className="relative z-10 flex items-center justify-between gap-4 px-6 py-3">
              <div className="flex flex-col">
                <h2 className="text-3xl font-black uppercase tracking-wide font-sans text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.42)]">Best Sellers</h2>
                <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#ff7300] to-[#ff9900]" />
              </div>
              <Link
                href="/search"
                className="inline-flex items-center text-sm font-semibold uppercase tracking-wide text-[#ff7300] transition-colors hover:text-orange-600"
              >
                {t('marketplace.seeAll')}
              </Link>
            </div>
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <div className="px-5 pt-5 md:px-6 md:pt-6">
                <div className="grid grid-cols-6 gap-3">
                  {topBestSellerCards.length > 0
                    ? topBestSellerCards.map((hit) => <MagicSearchCard key={hit.id} hit={hit} useLightText={useUnifiedBackground} />)
                    : Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-lg border border-gray-200 bg-gray-100" aria-hidden />
                      ))}
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 px-5 pb-6 pt-5 md:gap-5 md:px-6 md:pb-7 md:pt-6">
                <div className="flex min-w-0 flex-col">
                  <ul className="flex-1 flex flex-col justify-center space-y-3 lg:space-y-4">
                    {(buyListCards.length > 0 ? buyListCards : []).map((hit, i) => {
                      return <BestSellerRankRow key={hit.id} hit={hit} rank={i + 7} useLightText={useUnifiedBackground} />;
                    })}
                    {!magicLoading && buyListCards.length === 0 && (
                      <li className="text-sm text-gray-600">{t('marketplace.noSingles')}</li>
                    )}
                  </ul>
                </div>

                <div className="flex min-w-0 flex-col">
                  <ul className="flex-1 flex flex-col justify-center space-y-3 lg:space-y-4">
                    {(tradeListCards.length > 0 ? tradeListCards : []).map((hit, i) => {
                      return <BestSellerRankRow key={hit.id} hit={hit} rank={i + 10} useLightText={useUnifiedBackground} />;
                    })}
                    {!magicLoading && tradeListCards.length === 0 && (
                      <li className="text-sm text-gray-600">{t('marketplace.noSingles')}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Card ASTE + SCAMBI (DESKTOP) ═══ */}
          <div className="flex flex-col gap-3">
            {/* Aste in corso */}
            <div
              className={`relative isolate flex flex-col overflow-hidden rounded-2xl ${
                useUnifiedBackground
                  ? 'border border-white/10 bg-[#0f172a]/65 backdrop-blur-[8px] shadow-[0_10px_28px_rgba(0,0,0,0.35)]'
                  : 'border border-gray-200/55 bg-white/30 backdrop-blur-[4px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]'
              }`}
            >
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[56%] bg-gradient-to-b from-slate-950/55 via-slate-900/35 to-transparent" />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[44%] bg-gradient-to-t from-slate-100/92 via-slate-100/68 to-transparent" />
              {useUnifiedBackground && <DashboardCardFoil />}

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between gap-4 px-5 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <div className="h-4.5 w-1 rounded-full bg-gradient-to-b from-[#ff7300] to-[#ff9900]" />
                  <h3 className="text-lg font-black uppercase tracking-wide font-sans text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.42)]">
                    {t('auctions.liveAuctionsTitle')}
                  </h3>
                </div>
                <Link
                  href="/aste"
                  className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors hover:text-orange-600"
                >
                  {t('marketplace.seeAll')}
                </Link>
              </div>

              <div className="relative z-10 flex flex-col overflow-hidden">
                <AsteInCorsoCarousel useLightText compact />
              </div>
            </div>

            {/* Prova gli scambi */}
            <div
              className={`relative isolate flex flex-col overflow-hidden rounded-2xl ${
                useUnifiedBackground
                  ? 'border border-white/10 bg-[#0f172a]/65 backdrop-blur-[8px] shadow-[0_10px_28px_rgba(0,0,0,0.35)]'
                  : 'border border-gray-200/55 bg-white/30 backdrop-blur-[4px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]'
              }`}
            >
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[56%] bg-gradient-to-b from-slate-950/55 via-slate-900/35 to-transparent" />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[44%] bg-gradient-to-t from-slate-100/92 via-slate-100/68 to-transparent" />
              {useUnifiedBackground && <DashboardCardFoil />}

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between gap-4 px-5 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <div className="h-4.5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                  <h3 className="text-lg font-black uppercase tracking-wide font-sans text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.42)]">
                    {t('home.scambi.title')}
                  </h3>
                </div>
                <Link
                  href="/scambi"
                  className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors hover:text-orange-600"
                >
                  {t('home.scambi.seeAll')}
                </Link>
              </div>

              <div className="relative z-10 flex flex-col overflow-hidden">
                <ScambiInCorsoCarousel useLightText compact />
              </div>
            </div>
          </div>
        </div>

        {showFeaturesBelowTopRow && <FeaturesSection useUnifiedBackground={useUnifiedBackground} />}

        <TorneiMiniSection />

        <NuoveEspansioniSection items={NUOVE_ESPANSIONI_PLACEHOLDER} />
      </div>
    </div>
  );
}
