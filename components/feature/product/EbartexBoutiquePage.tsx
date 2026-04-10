'use client';

/**
 * Pagina dedicata Ebartex Boutique: stile proprio (non elenco Cardmarket).
 * Carousel, categorie, sezione Stampa 3D in arrivo.
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Printer, Package } from 'lucide-react';
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

const BOUTIQUE_CATEGORIES = [
  { id: 'dadi', label: 'Dadi', href: '/products?category=dadi', imageUrl: getCdnImageUrl('dadi-boutique.png') },
  { id: 'buste', label: 'Buste', href: '/products?category=buste', imageUrl: getCdnImageUrl('buste-boutique.png') },
  { id: 'tappetini', label: 'Tappetini', href: '/products?category=tappetini', imageUrl: getCdnImageUrl('tappetini-boutique.png') },
  { id: 'memorabilia', label: 'Memorabilia', href: '/products?category=memorabilia', imageUrl: getCdnImageUrl('memorabilia-boutique.png') },
  { id: 'albums', label: 'Albums', href: '/products?category=albums', imageUrl: getCdnImageUrl('albums-boutique.png') },
  { id: 'game-kits', label: 'Game kits', href: '/products?category=game-kits', imageUrl: getCdnImageUrl('gamekits-boutique.png') },
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
        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight mb-6">
          La nostra Boutique
        </h2>

        {/* Griglia categorie */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-14">
          {BOUTIQUE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-[#FF8800] transition-all"
            >
              <div 
                className="relative aspect-square bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: `url(${cat.imageUrl})` }}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="p-3 text-center">
                <span className="text-sm font-bold text-gray-900 uppercase">{cat.label}</span>
              </div>
              <div
                className="mx-3 mb-3 rounded-md py-2 text-center text-xs font-bold uppercase text-white transition-colors group-hover:opacity-90"
                style={{ backgroundColor: BRAND_ORANGE }}
              >
                Vedi tutto
              </div>
            </Link>
          ))}
        </section>

        {/* Stampa 3D in arrivo */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Card Info */}
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

          {/* Video Promo */}
          <div className="relative aspect-video md:aspect-auto overflow-hidden rounded-2xl bg-black shadow-xl border border-gray-200">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover opacity-90"
            >
              <source 
                src="https://player.vimeo.com/external/494252666.sd.mp4?s=7243b698246a4e79780590378bb1ee5b&profile_id=165" 
                type="video/mp4" 
              />
              {/* Fallback local path if CDN fails or user wants to replace */}
              <source src="/videos/3d-printer.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[#FF8800] animate-pulse" />
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
