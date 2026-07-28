'use client';

/**
 * Pagina dedicata Ebartex Boutique: stile proprio.
 * Carousel, categorie, sezione Stampa 3D in arrivo.
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { Header } from '@/components/layout/Header';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

const BRAND_ORANGE = '#FF8800';
const BRAND_BLUE = '#1D3160';

const CAROUSEL_SLIDES = [
  { image: getCdnImageUrl('carousel/slide1.jpg'), title: 'Ebartex Boutique', subtitle: 'Accessori e prodotti per il tuo gioco' },
  { image: getCdnImageUrl('carousel/slide2.jpg'), title: 'Qualità e design', subtitle: 'Per collezionisti e giocatori' },
  { image: getCdnImageUrl('carousel/slide3.jpg'), title: 'Novità in arrivo', subtitle: 'Stampa 3D e molto altro' },
];

const BOUTIQUE_GLOW_COLORS: Record<string, string> = {
  dadi: '251, 191, 36',
  buste: '167, 139, 250',
  tappetini: '56, 189, 248',
  memorabilia: '251, 146, 60',
  albums: '251, 113, 133',
  'game-kits': '255, 115, 0',
};

const BOUTIQUE_CATEGORIES = [
  {
    id: 'dadi',
    label: 'Dadi',
    imageUrl: '/ebartex-boutique/dadi-boutique.webp',
    imageSet: {
      sm: '/ebartex-boutique/dadi-boutique-sm.webp',
      md: '/ebartex-boutique/dadi-boutique-md.webp',
      lg: '/ebartex-boutique/dadi-boutique-lg.webp',
    },
  },
  {
    id: 'buste',
    label: 'Buste',
    imageUrl: '/ebartex-boutique/buste-boutique.webp',
    imageSet: {
      sm: '/ebartex-boutique/buste-boutique-sm.webp',
      md: '/ebartex-boutique/buste-boutique-md.webp',
      lg: '/ebartex-boutique/buste-boutique-lg.webp',
    },
  },
  {
    id: 'tappetini',
    label: 'Tappetini',
    imageUrl: '/ebartex-boutique/tappetini-boutique.webp',
    imageSet: {
      sm: '/ebartex-boutique/tappetini-boutique-sm.webp',
      md: '/ebartex-boutique/tappetini-boutique-md.webp',
      lg: '/ebartex-boutique/tappetini-boutique-lg.webp',
    },
  },
  {
    id: 'memorabilia',
    label: 'Memorabilia',
    imageUrl: '/ebartex-boutique/memorabilia-boutique.webp',
    imageSet: {
      sm: '/ebartex-boutique/memorabilia-boutique-sm.webp',
      md: '/ebartex-boutique/memorabilia-boutique-md.webp',
      lg: '/ebartex-boutique/memorabilia-boutique-lg.webp',
    },
  },
  {
    id: 'albums',
    label: 'Albums',
    imageUrl: '/ebartex-boutique/albums-boutique.webp',
    imageSet: {
      sm: '/ebartex-boutique/albums-boutique-sm.webp',
      md: '/ebartex-boutique/albums-boutique-md.webp',
      lg: '/ebartex-boutique/albums-boutique-lg.webp',
    },
  },
  {
    id: 'game-kits',
    label: 'Game kits',
    imageUrl: '/ebartex-boutique/gamekits-boutique.webp',
    imageSet: {
      sm: '/ebartex-boutique/gamekits-boutique-sm.webp',
      md: '/ebartex-boutique/gamekits-boutique-md.webp',
      lg: '/ebartex-boutique/gamekits-boutique-lg.webp',
    },
  },
];

export function EbartexBoutiquePage() {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/products', label: 'Prodotti', isCurrent: false },
    { label: 'Ebartex Boutique', isCurrent: true },
  ];

  const goNext = useCallback(() => {
    setCarouselIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setCarouselIndex((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  }, []);

  useEffect(() => {
    const t = setInterval(goNext, 5000);
    return () => clearInterval(t);
  }, [goNext]);

  return (
    <main className="min-h-screen bg-[#F0F0F0]">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>

      <div className="container-content py-4">
        {/* Breadcrumb */}
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="mb-4 w-auto text-sm text-gray-600"
        />

        {/* Carousel hero */}
        <section className="relative w-full overflow-hidden rounded-xl mb-10 shadow-lg">
          <div className="relative aspect-[21/9] min-h-[200px] w-full max-h-[380px] bg-gray-800">
            {CAROUSEL_SLIDES.map((slide, i) => (
              <div
                key={i}
                className={cn(
                  'absolute inset-0 transition-opacity duration-500',
                  i === carouselIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                )}
              >
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={i === 0}
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 md:left-10 md:bottom-10">
                  <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-md">
                    {slide.title}
                  </h2>
                  <p className="mt-1 text-sm md:text-base text-white/90">{slide.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition"
            aria-label="Slide precedente"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition"
            aria-label="Slide successiva"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {CAROUSEL_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCarouselIndex(i)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  i === carouselIndex ? 'bg-white scale-110 w-6' : 'bg-white/60 hover:bg-white/80 w-2'
                )}
                aria-label={`Vai allo slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Titolo sezione */}
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight mb-6">
          La nostra Boutique
        </h1>

        {/* Griglia categorie — stesso stile homepage, non cliccabile */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-6 mb-14">
          {BOUTIQUE_CATEGORIES.map((cat) => {
            const glowColor = BOUTIQUE_GLOW_COLORS[cat.id] || '255,255,255';
            return (
              <div key={cat.id} className="flex flex-col items-center">
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-full border border-gray-200 bg-gray-100 shadow-sm"
                  aria-label={`${cat.label} — Presto in arrivo`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `image-set(
                        url(${cat.imageSet?.sm || cat.imageUrl}) 1x,
                        url(${cat.imageSet?.md || cat.imageUrl}) 2x,
                        url(${cat.imageSet?.lg || cat.imageUrl}) 3x
                      )`,
                    }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-black/40" aria-hidden />
                  <span
                    className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs sm:text-sm font-bold uppercase tracking-wider text-white drop-shadow-lg"
                    style={{
                      ['--glow-color' as string]: glowColor,
                      textShadow: '0 2px 12px rgba(0,0,0,0.45)',
                    }}
                  >
                    {cat.label}
                  </span>
                </div>
                <p className="mt-3 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Presto in arrivo
                </p>
              </div>
            );
          })}
        </section>

        {/* Stampa 3D in arrivo */}
        <section className="mb-10">
          <div className="rounded-2xl border-2 border-dashed border-[#FF8800]/40 bg-white p-6 md:p-10 flex flex-col justify-center">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{ backgroundColor: BRAND_ORANGE }}
              >
                <Printer className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                  Stampa 3D in arrivo
                </h3>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wider" style={{ color: BRAND_ORANGE }}>
                  Coming soon
                </p>
              </div>
            </div>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Stiamo lavorando per portarti accessori e personalizzazioni in stampa 3D: portacarte,
              supporti, token e molto altro. Resta sintonizzato per le novità.
            </p>
          </div>
        </section>

        {/* CTA finale */}
        <section className="text-center py-8">
          <p className="text-gray-600 mb-4">Hai domande sui nostri prodotti?</p>
          <Link
            href="/contatti"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-white font-bold uppercase text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            Contattaci
          </Link>
        </section>
      </div>
    </main>
  );
}
