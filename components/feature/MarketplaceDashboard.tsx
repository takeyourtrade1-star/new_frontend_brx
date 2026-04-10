'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getCdnImageUrl } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameSlug } from '@/lib/contexts/GameContext';

import { SimpleSecureTuoSection } from './SimpleSecureTuoSection';
import { AsteInCorsoCarousel } from './aste/AsteInCorsoCarousel';

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

/** Dati per le card Nuove Espansioni (in futuro dal backend) */
export type NuovaEspansioneItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  link?: string;
};

const NUOVE_ESPANSIONI_PLACEHOLDER: NuovaEspansioneItem[] = [
  { id: '1', title: 'Le espansioni sono', subtitle: 'presto in arrivo', imageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png') },
  { id: '2', title: 'Nuovi set in', subtitle: 'fase di arrivo', imageUrl: getCdnImageUrl('card-3/8b5d86761fe7404aee02bee1471c3e0fc815d3bb.png') },
  { id: '3', title: 'Prossimamente su', subtitle: 'BRX Marketplace', imageUrl: getCdnImageUrl('card-3/a8020835a8ffd96555a4b53cd6ef0d04866ca8b1.png') },
];

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

function MagicSearchCard({ hit }: { hit: SearchHit }) {
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
      <p className="mt-1 line-clamp-1 text-center text-xs font-medium text-gray-900">{hit.name}</p>
      <p className="line-clamp-1 text-center text-[11px] font-normal text-gray-500">{hit.set_name}</p>
    </Link>
  );
}

/** Carousel Nuove Espansioni: più corto su mobile, pillola in risalto */
function NuoveEspansioniCarousel({ items }: { items: NuovaEspansioneItem[] }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const goTo = useCallback(
    (i: number) => {
      setIndex((prev) => Math.max(0, Math.min(i, items.length - 1)));
    },
    [items.length]
  );

  if (items.length === 0) return null;

  const current = items[index];

  return (
    <div
      className="relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl shadow-lg md:min-h-[380px]"
      style={{ borderRadius: SECTION_RADIUS }}
    >
      {/* Blue beam border layer - matches header gradient */}
      <div
        className="absolute -inset-[1px] rounded-[10px]"
        style={{
          background: 'linear-gradient(90deg, #3d65c6, #0f172a, #3d65c6, #5a7fd4, #3d65c6)',
          backgroundSize: '200% 100%',
          animation: 'flowBeam 4s linear infinite',
          zIndex: -1,
        }}
      />
      {/* Inner white card - immagine full-bleed come sfondo */}
      <div
        className="relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl shadow-lg md:min-h-[380px]"
        style={{
          borderRadius: SECTION_RADIUS,
          backgroundColor: '#ffffff',
          margin: '1px',
          boxShadow: '0 0 25px rgba(61, 101, 198, 0.12), 0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Immagine del set a tutta card come sfondo */}
        {current.imageUrl ? (
          <Image
            src={current.imageUrl}
            alt={current.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" aria-hidden />
        )}
        {/* Gradient scuro per leggibilità testo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        {/* Contenuto testuale in basso */}
        <div className="relative z-10 mt-auto flex flex-col p-5 md:p-6">
          {current.link ? (
            <Link
              href={current.link}
              className="text-left text-lg font-bold uppercase leading-tight text-white drop-shadow-md hover:underline md:text-2xl"
            >
              {current.title}
              {current.subtitle ? (<><br />{current.subtitle}</>) : null}
            </Link>
          ) : (
            <p className="text-left text-lg font-bold uppercase leading-tight text-white drop-shadow-md md:text-2xl">
              {current.title}
              {current.subtitle ? (<><br />{current.subtitle}</>) : null}
            </p>
          )}
          <div className="mt-3 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all focus:outline-none ${i === index ? 'w-5 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'}`}
                aria-label={t('gameHero.goToSlide', { n: i + 1 })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketplaceDashboard({
  compraVendi: _compraVendi,
  scambia: _scambia,
  nuoveEspansioni,
  gameSlug = 'mtg',
  useUnifiedBackground = false,
}: {
  compraVendi?: CompraVendiData;
  scambia?: ScambiaData;
  nuoveEspansioni?: NuovaEspansioneItem[];
  gameSlug?: GameSlug;
  useUnifiedBackground?: boolean;
} = {}) {
  const { t } = useTranslation();

  const [magicHits, setMagicHits] = useState<SearchHit[]>([]);
  const [magicOffset, setMagicOffset] = useState(0);
  const [magicLoading, setMagicLoading] = useState(true);
  const espansioniItems = nuoveEspansioni?.length
    ? nuoveEspansioni
    : NUOVE_ESPANSIONI_PLACEHOLDER;

  useEffect(() => {
    let isMounted = true;
    const loadMagicCards = async () => {
      // Se non è Magic, usiamo i placeholder e non chiamiamo il backend
      if (gameSlug === 'pokemon') {
        setMagicHits(POKEMON_HITS);
        setMagicLoading(false);
        return;
      }
      if (gameSlug === 'op') {
        setMagicHits(OP_HITS);
        setMagicLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/search?game=mtg&category_id=1&limit=30&sort=name_asc');
        if (!res.ok) {
          throw new Error('API Fallback');
        }
        const json = (await res.json()) as { hits?: SearchHit[] };
        const hits = Array.isArray(json.hits) ? json.hits.filter((h) => h?.id && h?.name) : [];
        if (isMounted) setMagicHits(hits.length > 0 ? hits : MTG_HITS_FALLBACK);
      } catch {
        // Fallback to mock data if API fails to ensure UI remains beautiful
        if (isMounted) setMagicHits(MTG_HITS_FALLBACK);
      } finally {
        if (isMounted) setMagicLoading(false);
      }
    };
    loadMagicCards();
    return () => {
      isMounted = false;
    };
  }, [gameSlug]);

  useEffect(() => {
    if (magicHits.length < 4) return;
    const timer = setInterval(() => {
      setMagicOffset((prev) => (prev + 1) % magicHits.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [magicHits.length]);

  const pickThreeCards = useCallback(
    (start: number): SearchHit[] => {
      if (magicHits.length === 0) return [];
      return [0, 1, 2].map((i) => magicHits[(start + i) % magicHits.length]);
    },
    [magicHits]
  );

  const buyTopCards = pickThreeCards(magicOffset);
  const tradeTopCards = pickThreeCards(magicOffset + 3);
  const buyListCards = pickThreeCards(magicOffset + 6);
  const tradeListCards = pickThreeCards(magicOffset + 9);

  return (
    <div
      className={`w-full font-sans transition-colors duration-300 ${
        useUnifiedBackground
          ? 'bg-transparent text-gray-900'
          : "bg-[#F1F5F9] bg-[linear-gradient(rgba(241,245,249,0.8),rgba(241,245,249,0.8)),url('/brx-sfondo-logo-tile.svg')] bg-[length:100%_100%,162px_162px] bg-repeat"
      }`}
    >
      <div className="container-content space-y-5 pb-6 pt-4 md:space-y-8 md:pb-10 md:pt-6">
        {/* MOBILE: Layout semplificato - 1 carta principale + 5 sotto */}
        <div className="block lg:hidden">
          {/* Titolo sezione Best Sellers - Mobile */}
          <div className="flex items-center px-4 py-2 mb-3">
            <div className="flex flex-col">
              <h2 className={`text-xl font-bold uppercase tracking-wider font-display ${useUnifiedBackground ? 'text-slate-100' : 'text-gray-800'}`}>Best Sellers</h2>
              <div className="mt-1.5 h-1 w-16 rounded-full bg-gradient-to-r from-[#ff7300] to-[#ff9900]" />
            </div>
          </div>
          <div
            className="flex flex-col overflow-hidden rounded-2xl shadow-lg border border-primary/40 ring-1 ring-primary/30"
            style={{ borderRadius: SECTION_RADIUS, backgroundColor: '#ffffff', boxShadow: '0 0 25px rgba(255, 115, 0, 0.12), 0 4px 20px rgba(0,0,0,0.08)' }}
          >
            {/* Card principale */}
            <div className="p-4">
              {magicHits.length > 0 ? (
                <Link
                  href={`/products/${magicHits[0]?.id}`}
                  className="group relative block w-full overflow-hidden rounded-xl"
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
                  <p className="mt-2 text-center text-sm font-semibold text-gray-900">{magicHits[0]?.name}</p>
                  <p className="text-center text-xs text-gray-500">{magicHits[0]?.set_name}</p>
                </Link>
              ) : (
                <div className="aspect-[3/4] w-full rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
              )}
            </div>

            {/* Lista 5 carte sotto */}
            <div className="border-t border-[#ff7300]/20 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#ff7300]">
                Altre carte
              </p>
              <ul className="space-y-2">
                {magicHits.slice(1, 6).map((hit) => (
                  <li key={hit.id} className="flex items-center gap-3 text-sm text-gray-800">
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
                    <span className="truncate text-xs text-gray-500">{hit.set_name}</span>
                  </li>
                ))}
                {magicHits.length === 0 && !magicLoading && (
                  <li className="text-sm text-gray-500">{t('marketplace.noSingles')}</li>
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
        </div>

        {/* DESKTOP: Layout originale a due colonne */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
          {/* ═══ Card VENDITE ═══ */}
          <div
            className={`flex min-h-[437px] flex-col justify-between overflow-hidden rounded-2xl lg:col-span-2 ${
              useUnifiedBackground
                ? 'border border-white/65 bg-white/72 backdrop-blur-[3px] backdrop-saturate-115 shadow-[0_10px_28px_rgba(15,23,42,0.12)]'
                : 'backdrop-blur-[1px]'
            }`}
          >
            {/* Titolo sezione VENDITE */}
            <div className="flex items-center px-6 py-3">
              <div className="flex flex-col">
                <h2 className={`text-3xl font-bold uppercase tracking-wider font-display ${useUnifiedBackground ? 'text-slate-100' : 'text-gray-800'}`}>Best Sellers</h2>
                <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#ff7300] to-[#ff9900]" />
              </div>
            </div>
            <div className="flex min-h-0 flex-1">
              {/* ── Colonna sinistra ── */}
              <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
                <div className="grid grid-cols-3 gap-3">
                  {buyTopCards.length > 0
                    ? buyTopCards.map((hit) => <MagicSearchCard key={hit.id} hit={hit} />)
                    : Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-lg border border-gray-200 bg-gray-100" aria-hidden />
                      ))}
                </div>
                <ul className="mt-4 flex-1 space-y-0">
                  {(buyListCards.length > 0 ? buyListCards : []).map((hit, i) => (
                    <li
                      key={hit.id}
                      className="group/row flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-800 transition-colors hover:bg-orange-50/60"
                    >
                      <span className="w-5 shrink-0 text-xs font-bold text-gray-400 group-hover/row:text-[#ff7300]">{i + 4}.</span>
                      {(() => {
                        const cardSrc = getCardImageUrl(hit.image ?? null);
                        return cardSrc ? (
                          <div className="relative h-9 w-7 shrink-0 overflow-hidden rounded shadow-sm">
                            <Image src={cardSrc} alt={hit.name} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="h-9 w-7 shrink-0 rounded bg-gray-200" aria-hidden />
                        );
                      })()}
                      <Link href={`/products/${hit.id}`} className="flex-1 truncate font-medium group-hover/row:text-[#ff7300] transition-colors">
                        {hit.name}
                      </Link>
                      <span className="truncate text-[11px] text-gray-400">{hit.set_name}</span>
                    </li>
                  ))}
                  {!magicLoading && buyListCards.length === 0 && (
                    <li className="text-sm text-gray-500">{t('marketplace.noSingles')}</li>
                  )}
                </ul>
              </div>

              {/* Divider verticale sottile */}
              <div className="flex shrink-0 flex-col py-6" aria-hidden>
                <div className={`w-px flex-1 min-h-0 ${useUnifiedBackground ? 'bg-header-bg/20' : 'bg-gray-200'}`} />
              </div>

              {/* ── Colonna destra ── */}
              <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
                <div className="grid grid-cols-3 gap-3">
                  {tradeTopCards.length > 0
                    ? tradeTopCards.map((hit) => <MagicSearchCard key={hit.id} hit={hit} />)
                    : Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-lg border border-gray-200 bg-gray-100" aria-hidden />
                      ))}
                </div>
                <ul className="mt-4 flex-1 space-y-0">
                  {(tradeListCards.length > 0 ? tradeListCards : []).map((hit, i) => (
                    <li
                      key={hit.id}
                      className="group/row flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-800 transition-colors hover:bg-orange-50/60"
                    >
                      <span className="w-5 shrink-0 text-xs font-bold text-gray-400 group-hover/row:text-[#ff7300]">{i + 4}.</span>
                      {(() => {
                        const cardSrc = getCardImageUrl(hit.image ?? null);
                        return cardSrc ? (
                          <div className="relative h-9 w-7 shrink-0 overflow-hidden rounded shadow-sm">
                            <Image src={cardSrc} alt={hit.name} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="h-9 w-7 shrink-0 rounded bg-gray-200" aria-hidden />
                        );
                      })()}
                      <Link href={`/products/${hit.id}`} className="flex-1 truncate font-medium group-hover/row:text-[#ff7300] transition-colors">
                        {hit.name}
                      </Link>
                      <span className="truncate text-[11px] text-gray-400">{hit.set_name}</span>
                    </li>
                  ))}
                  {!magicLoading && tradeListCards.length === 0 && (
                    <li className="text-sm text-gray-500">{t('marketplace.noSingles')}</li>
                  )}
                </ul>
              </div>
            </div>
            {/* Link unico centrato per tutta la card */}
            <div className="px-6 py-3 text-center">
              <Link
                href="/search"
                className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-[#ff7300] hover:text-orange-600 transition-colors"
              >
                {t('marketplace.seeAll')}
              </Link>
            </div>
          </div>

          {/* ═══ Card ASTE IN CORSO ═══ */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl ${
              useUnifiedBackground
                ? 'border border-white/65 bg-white/72 backdrop-blur-[3px] backdrop-saturate-115 shadow-[0_10px_28px_rgba(15,23,42,0.12)]'
                : 'border border-gray-200/60 backdrop-blur-[1px]'
            }`}
          >
            <div className="relative flex min-h-[380px] flex-1 flex-col overflow-hidden md:min-h-[437px]">
              <AsteInCorsoCarousel useLightText={useUnifiedBackground} />
            </div>
            {/* Link allineato con "Vedi tutto" a sinistra */}
            <div className="px-6 py-3 text-center">
              <Link
                href="/aste"
                className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-[#ff7300] hover:text-orange-600 transition-colors"
              >
                {t('auctions.discoverAll')} ➔
              </Link>
            </div>
          </div>
        </div>

        {/* Row 2: NUOVE ESPANSIONI (carousel) | SEMPLICE. SICURO. TUO. */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="flex items-center px-6 py-3">
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold uppercase tracking-wider text-gray-800 font-display">{t('marketplace.newExpansions')}</h2>
              <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#ff7300] to-[#ff9900]" />
            </div>
          </div>
          <div className="flex items-center px-6 py-3">
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold uppercase tracking-wider text-gray-800 font-display">{t('simpleSecure.title')}</h2>
              <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-[#ff7300] to-[#ff9900]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <NuoveEspansioniCarousel items={espansioniItems} />

          <div className="flex flex-col lg:min-h-[380px] lg:justify-center lg:px-6">
            <div className="mx-auto w-full max-w-[560px]">
              <SimpleSecureTuoSection hideTitleOnDesktop noCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
