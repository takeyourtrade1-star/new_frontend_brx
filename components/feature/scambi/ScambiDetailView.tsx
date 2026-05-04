'use client';

/**
 * Dettaglio scambio — adattato dalla struttura visiva di AsteDetailView.
 */

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowLeftRight, Bookmark, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { MOCK_SCAMBI } from '@/components/feature/scambi/mock-scambi';
import { ScambiProponiModal } from '@/components/feature/scambi/ScambiProponiModal';

const ORANGE = '#FF7300';

function getRandomScambi(excludeNumericId: number, count: number) {
  const others = MOCK_SCAMBI.filter((s) => s.numericId !== excludeNumericId);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function ScambiDetailView({ scambioId }: { scambioId: string }) {
  const { t } = useTranslation();
  const numericId = parseInt(scambioId, 10);

  const scambio = useMemo(() => {
    // Cerca prima per id stringa, poi per numericId (supporta entrambi gli URL)
    return (
      MOCK_SCAMBI.find((s) => s.id === scambioId) ??
      (Number.isNaN(numericId) ? null : MOCK_SCAMBI.find((s) => s.numericId === numericId)) ??
      null
    );
  }, [scambioId, numericId]);

  const detailImages = useMemo(
    () => (scambio ? [scambio.imageFront, scambio.imageBack].filter(Boolean) : []),
    [scambio]
  );

  const [imgIdx, setImgIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const similarCards = useMemo(() => {
    const excludeId = scambio?.numericId ?? -1;
    return getRandomScambi(excludeId, 3);
  }, [scambio]);

  if (!scambio) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container-content container-content-card-detail py-20 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ArrowLeftRight className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-900">Scambio non trovato</h2>
            <p className="mt-2 text-sm text-gray-500">
              L&apos;oggetto che stai cercando non esiste o è stato rimosso.
            </p>
            <Link
              href="/scambi"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#e86800]"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna agli scambi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mainImg = detailImages[imgIdx] ?? detailImages[0] ?? '';
  const stars = Math.min(5, Math.max(0, Math.round((scambio.sellerRating / 100) * 5)));

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Hero */}
      <section className="w-full border-b border-gray-200 bg-white">
        <div className="container-content container-content-card-detail py-3 sm:py-4 lg:py-5">
          <Link
            href="/scambi"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-[#FF7300] sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna agli scambi
          </Link>

          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex w-full items-center justify-between gap-3 rounded-[2rem] border border-gray-100/80 bg-gray-50/80 p-1.5 pl-4 shadow-sm backdrop-blur-sm sm:pl-5">
                <h1 className="flex-1 break-words py-1 text-[20px] font-black uppercase leading-[1.1] tracking-tight text-gray-900 sm:text-[24px] md:text-[28px] lg:text-3xl">
                  {scambio.title}
                </h1>

                <div className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:text-[#FF7300] hover:shadow-md"
                    aria-label="Salva per dopo"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 sm:text-xs">
                  <span>
                    Venditore: <span className="font-bold text-gray-900">{scambio.seller}</span>
                  </span>
                  <FlagIcon country={scambio.sellerCountry} size="sm" />
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center">
                    <span className="text-[12px] tracking-[0.1em] text-[#FFB800] drop-shadow-[0_1px_1px_rgba(255,184,0,0.5)]">
                      {'★'.repeat(stars)}
                      <span className="text-gray-300">{'★'.repeat(5 - stars)}</span>
                    </span>
                    <span className="ml-[2px] font-bold text-gray-700">{scambio.sellerRating}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white px-0 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="container-content container-content-card-detail">
          {/* Blocco principale */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-12 lg:p-8">
              {/* Galleria */}
              <div className="flex flex-col gap-4 lg:col-span-5">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex w-14 shrink-0 flex-col gap-2 sm:w-[4.5rem]">
                    {detailImages.slice(0, 4).map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        onClick={() => setImgIdx(i)}
                        className={`relative aspect-[63/88] w-full overflow-hidden rounded-lg border-2 bg-gray-50 transition ${
                          imgIdx === i
                            ? 'border-[#FF7300] ring-2 ring-[#FF7300]/20'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="72px" unoptimized />
                      </button>
                    ))}
                  </div>
                  <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:min-h-[380px] lg:min-h-[420px]">
                    <Image
                      src={mainImg}
                      alt=""
                      fill
                      className="object-contain p-3"
                      sizes="(max-width:1024px) 100vw, 420px"
                      priority
                      unoptimized
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <Shield className="h-3 w-3" aria-hidden />
                      Verificato
                    </span>
                  </div>
                </div>
              </div>

              {/* Info centrale */}
              <div className="flex flex-col gap-5 lg:col-span-4">
                <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                  <div className="px-4 py-3 text-sm">
                    <span className="text-gray-500">Condizione: </span>
                    <span className="font-bold text-gray-900">{scambio.condition}</span>
                  </div>
                  <div className="px-4 py-3 text-sm leading-relaxed text-gray-700">{scambio.description}</div>
                  <div className="px-4 py-3 text-sm">
                    <span className="text-gray-500">Cosa cerca in cambio: </span>
                    <span className="font-semibold text-gray-900">{scambio.wantsInReturn}</span>
                  </div>
                </div>
              </div>

              {/* Colonna destra */}
              <div className="flex flex-col gap-5 lg:col-span-3">
                <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[#FF7300]/30 bg-[#FF7300]/10 p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(255,115,0,0.12)] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center text-center w-full">
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF7300] drop-shadow-sm">
                      Scambio
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-800">
                      Proponi la tua carta o bundle in cambio di questo oggetto.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="mt-5 group relative w-full overflow-hidden rounded-xl border-2 py-3.5 text-center bg-gradient-to-r from-[#FF8A3D] via-[#FF7300] to-[#E86800] hover:-translate-y-0.5 active:translate-y-0 sm:py-4 transition-transform duration-200"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF9A5C] via-[#FF8A3D] to-[#FF7300] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="relative text-sm font-bold uppercase tracking-wide text-white sm:text-base">
                        Proponi scambio
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Oggetti simili — carousel mobile, grid desktop */}
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
              Oggetti simili
            </h2>

            {/* Mobile: horizontal scroll carousel */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide lg:hidden">
              {similarCards.map((s) => (
                <Link
                  key={s.id}
                  href={`/scambi/${s.id}`}
                  prefetch
                  scroll
                  className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:border-[#FF7300] hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="220px"
                      unoptimized
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-bold uppercase leading-tight text-gray-900">
                      {s.title}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">{s.seller}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-[#FF7300]">{s.condition}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: grid 3 colonne */}
            <div className="hidden gap-5 sm:grid-cols-2 lg:grid lg:grid-cols-3">
              {similarCards.map((s) => (
                <Link
                  key={s.id}
                  href={`/scambi/${s.id}`}
                  prefetch
                  scroll
                  className="group flex h-[180px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:border-[#FF7300] hover:shadow-lg"
                >
                  <div className="relative h-full w-[45%] shrink-0 overflow-hidden">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="160px"
                      unoptimized
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                    <div>
                      <p className="line-clamp-2 text-sm font-bold uppercase leading-tight text-gray-900">
                        {s.title}
                      </p>
                      <p className="mt-1.5 text-xs text-gray-500">
                        Venditore: <span className="font-medium text-gray-700">{s.seller}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">
                        Cerca: <span className="font-medium text-gray-700">{s.wantsInReturn}</span>
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#FF7300]">{s.condition}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ScambiProponiModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        scambio={scambio}
        mode="propose"
        onSubmit={(payload) => {
          console.log('Proposta inviata:', payload);
          alert('Proposta inviata!');
          setModalOpen(false);
        }}
      />
    </div>
  );
}
