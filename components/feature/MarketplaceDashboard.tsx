'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback } from 'react';
import { getCdnImageUrl } from '@/lib/config';
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

/** Placeholder: immagini da public/images (card-3, acquisti-frames) */
const PLACEHOLDER_COMPRA_VENDI: CompraVendiData = {
  topCards: [
    { label: 'Carte singles', price: '€0,50', imageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png') },
    { label: 'Boosters', price: '€4,99', imageUrl: getCdnImageUrl('card-3/8b5d86761fe7404aee02bee1471c3e0fc815d3bb.png') },
    { label: 'Lotti', price: '€24,99', imageUrl: getCdnImageUrl('card-3/a8020835a8ffd96555a4b53cd6ef0d04866ca8b1.png') },
  ],
  listItems: [
    { label: 'Singles', price: '—', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20334.jpg') },
    { label: 'Boosters', price: '—', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20335.jpg') },
    { label: 'Box', price: '—', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20336.jpg') },
  ],
  vediTuttoHref: '/products',
};

/** Placeholder: dati verranno dal backend */
const PLACEHOLDER_SCAMBIA: ScambiaData = {
  topCards: [
    { label: 'Scambia', imageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png') },
    { label: 'Scambia', imageUrl: getCdnImageUrl('card-3/8b5d86761fe7404aee02bee1471c3e0fc815d3bb.png') },
    { label: 'Scambia', imageUrl: getCdnImageUrl('card-3/a8020835a8ffd96555a4b53cd6ef0d04866ca8b1.png') },
  ],
  listItems: [
    { label: '—', imageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png') },
    { label: '—', imageUrl: getCdnImageUrl('card-3/8b5d86761fe7404aee02bee1471c3e0fc815d3bb.png') },
    { label: '—', imageUrl: getCdnImageUrl('card-3/a8020835a8ffd96555a4b53cd6ef0d04866ca8b1.png') },
  ],
  vediTuttoHref: '/scambi',
};

/** Placeholder: dati verranno dal backend */
const PLACEHOLDER_ASTA: AstaData = {
  featuredTitle: 'Aste in evidenza',
  featuredImageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png'),
  linkText: 'vedi tutte le aste →',
  href: '/aste',
};

const NUOVE_ESPANSIONI_PLACEHOLDER: NuovaEspansioneItem[] = [
  { id: '1', title: 'I MISTERI PASSATI', subtitle: 'DI AANG', imageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png') },
  { id: '2', title: 'SECONDA ESPANSIONE', subtitle: 'IN ARRIVO', imageUrl: getCdnImageUrl('card-3/8b5d86761fe7404aee02bee1471c3e0fc815d3bb.png') },
  { id: '3', title: 'TERZA ESPANSIONE', subtitle: 'PROSSIMAMENTE', imageUrl: getCdnImageUrl('card-3/a8020835a8ffd96555a4b53cd6ef0d04866ca8b1.png') },
];

const headerOrange = {
  backgroundColor: '#ff7300',
};

function CardThumb({ item, showPrice }: { item: HomeCardItem; showPrice?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      {item.imageUrl ? (
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full aspect-[3/4] rounded-lg bg-gray-600/60" aria-hidden />
      )}
      <p className="mt-1 text-xs text-white/90">{item.label}</p>
      {showPrice !== false && item.price != null && (
        <p className="text-sm font-bold text-white">{item.price}</p>
      )}
      {showPrice === false && (
        <span className="mt-1 text-xs font-medium text-[#ff7300]">SCAMBIA</span>
      )}
    </div>
  );
}

/** Carousel Nuove Espansioni: stessa height/width delle Aste, senza barra in alto (come Figma) */
function NuoveEspansioniCarousel({ items }: { items: NuovaEspansioneItem[] }) {
  const [index, setIndex] = useState(0);
  const goTo = useCallback((i: number) => {
    setIndex((prev) => Math.max(0, Math.min(i, items.length - 1)));
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[index];

  return (
    <div
      className="flex min-h-[437px] flex-col overflow-hidden rounded-2xl shadow-lg md:min-h-[483px]"
      style={{ borderRadius: SECTION_RADIUS, border: '2px solid #1e3a5f', backgroundColor: '#1e3a5f' }}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gray-700/80" aria-hidden />
        {current.imageUrl ? (
          <img
            src={current.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute left-0 top-0 pt-4 pl-4">
          <span className="rounded-2xl bg-white/15 px-3 py-1 text-center text-xs font-bold uppercase tracking-wide backdrop-blur-sm text-white">
            nuove espansioni
          </span>
        </div>
        <div className="absolute inset-x-0 top-0 flex flex-col pt-14 pl-4">
          {current.link ? (
            <Link
              href={current.link}
              className="text-left text-xl font-bold uppercase leading-tight text-white drop-shadow-md hover:underline md:text-2xl"
            >
              {current.title}
              {current.subtitle ? (
                <>
                  <br />
                  {current.subtitle}
                </>
              ) : null}
            </Link>
          ) : (
            <p className="text-left text-xl font-bold uppercase leading-tight text-white drop-shadow-md md:text-2xl">
              {current.title}
              {current.subtitle ? (
                <>
                  <br />
                  {current.subtitle}
                </>
              ) : null}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-2 py-2" style={{ backgroundColor: '#1e293b' }}>
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className="h-2 w-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{
              backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.5)',
              width: i === index ? '0.5rem' : '0.5rem',
            }}
            aria-label={`Vai alla slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function MarketplaceDashboard({
  compraVendi,
  scambia,
  asta,
  nuoveEspansioni,
}: {
  compraVendi?: CompraVendiData;
  scambia?: ScambiaData;
  asta?: AstaData;
  nuoveEspansioni?: NuovaEspansioneItem[];
} = {}) {
  const compra = compraVendi ?? PLACEHOLDER_COMPRA_VENDI;
  const scambiaData = scambia ?? PLACEHOLDER_SCAMBIA;
  const astaData = asta ?? PLACEHOLDER_ASTA;
  const espansioniItems = nuoveEspansioni?.length
    ? nuoveEspansioni
    : NUOVE_ESPANSIONI_PLACEHOLDER;

  return (
    <div className="w-full font-sans bg-transparent text-white transition-colors duration-300">
      <div className="container-content space-y-4 pb-8 pt-6">
        {/* Row 1: una sola card COMPRA E VENDI | separatore | SCAMBIA ORA (come Figma) + card ASTA — +15% altezza */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Unica card: nessuna barra blu in alto, solo contenuto con divisore (da sopra immagini a sotto Vedi tutto) */}
          <div
            className="flex min-h-[437px] flex-col overflow-hidden rounded-2xl shadow-lg md:min-h-[483px] lg:col-span-2"
            style={{ borderRadius: SECTION_RADIUS, border: '2px solid #ff7300', backgroundColor: '#1e293b' }}
          >
            <div className="flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col space-y-4 p-5 md:p-6" style={{ backgroundColor: '#1e293b' }}>
                <div className="grid grid-cols-3 gap-3">
                  {compra.topCards.slice(0, 3).map((item, i) => (
                    <CardThumb key={item.id ?? i} item={item} showPrice />
                  ))}
                </div>
                <ul className="flex-1 space-y-2">
                  {compra.listItems.map((item, i) => (
                    <li key={item.id ?? i} className="flex items-center gap-3 text-sm text-white">
                      <span className="w-5">{i + 4}.</span>
                      {item.imageUrl ? (
                        <div className="relative h-8 w-12 shrink-0 overflow-hidden rounded">
                          <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-8 w-12 shrink-0 rounded bg-gray-500/50" aria-hidden />
                      )}
                      <span className="flex-1">{item.label}</span>
                      {item.price != null && <span>{item.price}</span>}
                    </li>
                  ))}
                </ul>
                <Link
                  href={compra.vediTuttoHref ?? '/products'}
                  className="block text-center text-sm font-medium text-[#ff7300] hover:underline"
                >
                  VEDI TUTTO →
                </Link>
              </div>

              <div className="flex shrink-0 flex-col py-4 md:py-5" aria-hidden>
                <div className="w-px flex-1 min-h-0 bg-[#ff7300]/80" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col space-y-4 p-5 md:p-6" style={{ backgroundColor: '#1e293b' }}>
                <div className="grid grid-cols-3 gap-3">
                  {scambiaData.topCards.slice(0, 3).map((item, i) => (
                    <CardThumb key={item.id ?? i} item={item} showPrice={false} />
                  ))}
                </div>
                <ul className="flex-1 space-y-2">
                  {scambiaData.listItems.map((item, i) => (
                    <li key={item.id ?? i} className="flex items-center gap-3 text-sm text-white">
                      <span className="w-5">{i + 4}.</span>
                      {item.imageUrl ? (
                        <div className="relative h-8 w-12 shrink-0 overflow-hidden rounded">
                          <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-8 w-12 shrink-0 rounded bg-gray-500/50" aria-hidden />
                      )}
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs font-medium text-[#ff7300]">SCAMBIA</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={scambiaData.vediTuttoHref ?? '/scambi'}
                  className="block text-center text-sm font-medium text-[#ff7300] hover:underline"
                >
                  VEDI TUTTO →
                </Link>
              </div>
            </div>
          </div>

          {/* L'ASTA TERMINA TRA 10 MINUTI — +15% altezza */}
          <div
            className="flex min-h-[437px] flex-col overflow-hidden rounded-2xl shadow-lg md:min-h-[483px]"
            style={{ borderRadius: SECTION_RADIUS, border: '2px solid #1e3a5f' }}
          >
            <div
              className="flex w-full items-center justify-center py-3 px-4 rounded-t-2xl"
              style={headerOrange}
            >
              <span className="rounded-2xl bg-white/15 px-4 py-1.5 text-center text-white text-lg font-medium uppercase tracking-wide backdrop-blur-sm">
                l&apos;asta termina tra 10 minuti
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-between space-y-4 p-5 md:p-6" style={{ backgroundColor: '#1e293b' }}>
              <div className="flex justify-center">
                {astaData.featuredImageUrl ? (
                  <div className="relative aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-lg">
                    <Image
                      src={astaData.featuredImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[200px] aspect-[3/4] rounded-lg bg-gray-600/60" aria-hidden />
                )}
              </div>
              <p className="text-center text-sm font-medium text-white">
                {astaData.featuredTitle ?? 'dragone giallo'}
              </p>
              <div className="flex justify-center gap-1" aria-hidden>
                <div className="h-2 w-2 rounded-full bg-white" />
                <div className="h-2 w-2 rounded-full bg-white/50" />
                <div className="h-2 w-2 rounded-full bg-white/50" />
              </div>
              <Link
                href={astaData.href ?? '/aste'}
                className="block text-center text-sm font-medium text-[#ff7300] hover:underline"
              >
                {astaData.linkText ?? 'vedi tutte le aste →'}
              </Link>
            </div>
          </div>
        </div>

        {/* Row 2: NUOVE ESPANSIONI (carousel) | SEMPLICE. SICURO. TUO. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <NuoveEspansioniCarousel items={espansioniItems} />

          <div className="flex flex-col overflow-hidden rounded-2xl bg-transparent">
            <SimpleSecureTuoSection />
          </div>
        </div>
      </div>
    </div>
  );
}
