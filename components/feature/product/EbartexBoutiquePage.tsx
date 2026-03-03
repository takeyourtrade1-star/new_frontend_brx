'use client';

/**
 * Pagina dedicata Ebartex Boutique: stile proprio (non elenco Cardmarket).
 * Carousel, categorie, sezione Stampa 3D in arrivo.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Printer, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { Header } from '@/components/layout/Header';

const BRAND_ORANGE = '#FF8800';
const BRAND_BLUE = '#1D3160';

const CAROUSEL_SLIDES = [
  { image: getCdnImageUrl('carousel/slide1.jpg'), title: 'Ebartex Boutique', subtitle: 'Accessori e prodotti per il tuo gioco' },
  { image: getCdnImageUrl('carousel/slide2.jpg'), title: 'Qualità e design', subtitle: 'Per collezionisti e giocatori' },
  { image: getCdnImageUrl('carousel/slide3.jpg'), title: 'Novità in arrivo', subtitle: 'Stampa 3D e molto altro' },
];

const BOUTIQUE_CATEGORIES = [
  { id: 'dadi', label: 'Dadi', href: '/products?category=dadi', imageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png') },
  { id: 'buste', label: 'Buste', href: '/products?category=buste', imageUrl: getCdnImageUrl('card-3/8b5d86761fe7404aee02bee1471c3e0fc815d3bb.png') },
  { id: 'tappetini', label: 'Tappetini', href: '/products?category=tappetini', imageUrl: getCdnImageUrl('card-3/a8020835a8ffd96555a4b53cd6ef0d04866ca8b1.png') },
  { id: 'memorabilia', label: 'Memorabilia', href: '/products?category=memorabilia', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20334.jpg') },
  { id: 'albums', label: 'Albums', href: '/products?category=albums', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20335.jpg') },
  { id: 'game-kits', label: 'Game kits', href: '/products?category=game-kits', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20336.jpg') },
];

export function EbartexBoutiquePage() {
  const [carouselIndex, setCarouselIndex] = useState(0);

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
      <Header />

      <div className="container-content py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/products" className="hover:text-gray-900">
            Prodotti
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900">Ebartex Boutique</span>
        </nav>

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
          Categorie
        </h2>

        {/* Griglia categorie */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-14">
          {BOUTIQUE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-[#FF8800] transition-all"
            >
              <div className="relative aspect-square bg-gray-100">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width:640px) 50vw, 16vw"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Package className="w-12 h-12" />
                  </div>
                )}
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
        <section className="rounded-2xl border-2 border-dashed border-[#FF8800]/40 bg-white p-6 md:p-10 mb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: BRAND_ORANGE }}
            >
              <Printer className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                Stampa 3D in arrivo
              </h3>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Stiamo lavorando per portarti accessori e personalizzazioni in stampa 3D: portacarte,
                supporti, token e molto altro. Resta sintonizzato per le novità.
              </p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-wider" style={{ color: BRAND_ORANGE }}>
                Coming soon
              </p>
            </div>
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
