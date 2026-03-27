'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getCdnImageUrl } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { MOCK_AUCTIONS, isAuctionEnded } from '@/components/feature/aste/mock-auctions';
import { isMyAuctionListing } from '@/components/feature/aste/mock-user-auctions';
import { SimpleSecureTuoSection } from './SimpleSecureTuoSection';

const SECTION_RADIUS = '1rem';

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

/** Sezione "L'asta termina tra 10 minuti" – dati da backend */
export type AstaData = {
  featuredImageUrl?: string | null;
  featuredTitle?: string;
  linkText?: string;
  href?: string;
};

/** Dati per le card Nuove Espansioni (in futuro dal backend) */
export type NuovaEspansioneItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  link?: string;
};

/** Placeholder: dati verranno dal backend */
const PLACEHOLDER_ASTA: AstaData = {
  featuredImageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png'),
  href: '/aste',
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
      <p className="mt-1 line-clamp-1 text-center text-xs font-semibold text-gray-900">{hit.name}</p>
      <p className="line-clamp-1 text-center text-[11px] text-gray-500">{hit.set_name}</p>
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
      className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl shadow-lg md:min-h-[380px]"
      style={{ borderRadius: SECTION_RADIUS, border: '2px solid #ff7300', backgroundColor: '#ffffff' }}
    >
      {/* Titolo sezione – inline, come le altre card */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <div className="h-2 w-2 rounded-full bg-[#ff7300]" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">{t('marketplace.newExpansions')}</h2>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gray-700/80" aria-hidden />
        {current.imageUrl ? (
          <img
            src={current.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-5 md:p-6">
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
  asta,
  nuoveEspansioni,
  gameSlug = 'mtg',
}: {
  compraVendi?: CompraVendiData;
  scambia?: ScambiaData;
  asta?: AstaData;
  nuoveEspansioni?: NuovaEspansioneItem[];
  gameSlug?: GameSlug;
} = {}) {
  const { t } = useTranslation();

  const [magicHits, setMagicHits] = useState<SearchHit[]>([]);
  const [magicOffset, setMagicOffset] = useState(0);
  const [magicLoading, setMagicLoading] = useState(true);
  const [auctionRot, setAuctionRot] = useState(0);
  const astaData = asta ?? PLACEHOLDER_ASTA;

  /** Aste suggerite in homepage: per prima scelta escludiamo le tue inserzioni; se non resta nulla, fallback su altre aste live (badge «Creata da te» se è la tua). */
  const suggestedAuctionPool = useMemo(() => {
    const preferred = MOCK_AUCTIONS.filter((a) => !isMyAuctionListing(a.id) && !isAuctionEnded(a));
    if (preferred.length > 0) return preferred;
    return MOCK_AUCTIONS.filter((a) => !isAuctionEnded(a));
  }, []);

  useEffect(() => {
    if (suggestedAuctionPool.length <= 1) return;
    const id = window.setInterval(
      () => setAuctionRot((r) => (r + 1) % suggestedAuctionPool.length),
      5000
    );
    return () => window.clearInterval(id);
  }, [suggestedAuctionPool.length]);

  const featuredAuction =
    suggestedAuctionPool.length > 0 ? suggestedAuctionPool[auctionRot % suggestedAuctionPool.length] : null;
  const showCreatedByYouBadge = featuredAuction != null && isMyAuctionListing(featuredAuction.id);
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
  }, []);

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
    <div className="w-full bg-white font-sans text-gray-900 transition-colors duration-300">
      <div className="container-content space-y-5 pb-6 pt-4 md:space-y-8 md:pb-10 md:pt-6">
        {/* MOBILE: Layout semplificato - 1 carta principale + 5 sotto */}
        <div className="block lg:hidden">
          <div
            className="flex flex-col overflow-hidden rounded-2xl shadow-lg"
            style={{ borderRadius: SECTION_RADIUS, border: '2px solid #ff7300', backgroundColor: '#ffffff' }}
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
            className="flex min-h-[437px] flex-col overflow-hidden rounded-2xl shadow-lg md:min-h-[483px] lg:col-span-2"
            style={{ borderRadius: SECTION_RADIUS, border: '2px solid #ff7300', backgroundColor: '#ffffff' }}
          >
            {/* Titolo sezione VENDITE */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-3">
              <div className="h-2 w-2 rounded-full bg-[#ff7300]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Best Sellers</h2>
            </div>
            <div className="flex min-h-0 flex-1">
              {/* ── Colonna sinistra ── */}
              <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6" style={{ backgroundColor: '#ffffff' }}>
                <div className="grid grid-cols-3 gap-3">
                  {buyTopCards.length > 0
                    ? buyTopCards.map((hit) => <MagicSearchCard key={hit.id} hit={hit} />)
                    : Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-lg border border-gray-200 bg-gray-100" aria-hidden />
                      ))}
                </div>
                <ul className="mt-4 flex-1 space-y-0">
                  {(buyListCards.length > 0 ? buyListCards : []).map((hit, i) => (
                    <li key={hit.id} className="group/row flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-800 transition-colors hover:bg-orange-50/60">
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
                <div className="w-px flex-1 min-h-0 bg-gray-200" />
              </div>

              {/* ── Colonna destra ── */}
              <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6" style={{ backgroundColor: '#ffffff' }}>
                <div className="grid grid-cols-3 gap-3">
                  {tradeTopCards.length > 0
                    ? tradeTopCards.map((hit) => <MagicSearchCard key={hit.id} hit={hit} />)
                    : Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-lg border border-gray-200 bg-gray-100" aria-hidden />
                      ))}
                </div>
                <ul className="mt-4 flex-1 space-y-0">
                  {(tradeListCards.length > 0 ? tradeListCards : []).map((hit, i) => (
                    <li key={hit.id} className="group/row flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-800 transition-colors hover:bg-orange-50/60">
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

          {/* ═══ Card ASTE IN CORSO ═══ (stesso stile della card Vendite) */}
          <div
            className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl shadow-lg md:min-h-[437px]"
            style={{ borderRadius: SECTION_RADIUS, border: '2px solid #ff7300', backgroundColor: '#ffffff' }}
          >
            {/* Titolo sezione – inline, come Vendite */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
              <div className="h-2 w-2 rounded-full bg-[#ff7300] animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Aste in corso</h2>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5 md:p-6" style={{ backgroundColor: '#ffffff' }}>
              <div className="flex justify-center">
                {(() => {
                  if (featuredAuction) {
                    return (
                      <Link
                        href={auctionDetailPath(featuredAuction.id)}
                        className="group relative aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        {showCreatedByYouBadge && (
                          <span className="absolute left-2 top-2 z-[1] rounded-full bg-[#1e3a5f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                            {t('marketplace.auctionCreatedByYou')}
                          </span>
                        )}
                        <Image
                          src={featuredAuction.image}
                          alt={featuredAuction.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-[1.02]"
                          unoptimized
                        />
                      </Link>
                    );
                  }
                  if (astaData.featuredImageUrl) {
                    return (
                      <div className="relative aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <Image
                          src={astaData.featuredImageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    );
                  }
                  return <div className="w-full max-w-[200px] aspect-[3/4] rounded-xl border border-gray-200 bg-gray-100" aria-hidden />;
                })()}
              </div>
              <div className="mt-4 space-y-1 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  {featuredAuction?.title || astaData.featuredTitle || t('marketplace.featuredAuctions')}
                </p>
                {featuredAuction && (
                  <p className="text-lg font-bold text-[#ff7300]">
                    {featuredAuction.currentBidEur.toLocaleString('it-IT', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    })}
                  </p>
                )}
              </div>
              <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
                {suggestedAuctionPool.slice(0, 3).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-colors ${i === auctionRot % Math.min(suggestedAuctionPool.length, 3) ? 'bg-[#ff7300]' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              <Link
                href={astaData.href ?? '/aste'}
                className="mt-3 block text-center text-sm font-semibold uppercase tracking-wide text-[#ff7300] hover:underline"
              >
                {astaData.linkText ?? t('marketplace.seeAllAuctions')}
              </Link>
            </div>
          </div>
        </div>

        {/* Row 2: NUOVE ESPANSIONI (carousel) | SEMPLICE. SICURO. TUO. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <NuoveEspansioniCarousel items={espansioniItems} />

          <div className="flex flex-col overflow-hidden rounded-2xl bg-white">
            <SimpleSecureTuoSection />
          </div>
        </div>
      </div>
    </div>
  );
}
