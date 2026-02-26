'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ScambiPage() {
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 4000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  const handleAvvisami = () => {
    setToastVisible(true);
  };

  return (
    <div className="fixed inset-0 z-[50] flex flex-col bg-black">
      {/* Video fullscreen: senza audio, in loop */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      >
        <source src="/videos/STG_vSnap.mp4" type="video/mp4" />
      </video>

      {/* Bottone in alto a sinistra: nessun background, font Comodo, freccia a sinistra */}
      <Link
        href="/"
        className="relative z-10 m-4 inline-flex items-center gap-2 font-display text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        aria-label="Torna alla homepage"
        style={{ fontFamily: 'var(--font-comodo)' }}
      >
        <ArrowLeft className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
        <span>Torna alla homepage</span>
      </Link>

      {/* Bottone AVVISAMI in basso: più rotondo (pill), bagliore arancione */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-10 md:pb-14">
        <button
          type="button"
          onClick={handleAvvisami}
          className="rounded-full bg-[#FF7300] px-10 py-4 text-base font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,115,0,0.7),0_0_40px_rgba(255,115,0,0.4)] transition-shadow hover:shadow-[0_0_24px_rgba(255,115,0,0.9),0_0_48px_rgba(255,115,0,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label="Avvisami quando la funzione è attiva"
        >
          AVVISAMI
        </button>
      </div>

      {/* Toast: stessa grafica del bottone AVVISAMI, appare sopra il bottone (z-[60] > z-10) */}
      {toastVisible && (
        <div
          className="fixed bottom-10 left-1/2 z-[60] -translate-x-1/2 md:bottom-14"
          role="status"
          aria-live="polite"
        >
          <div className="min-w-[280px] max-w-[90vw] rounded-full bg-[#FF7300] px-10 py-4 text-center text-base font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,115,0,0.7),0_0_40px_rgba(255,115,0,0.4)] animate-in fade-in slide-in-from-bottom-8 duration-300">
            Sarai avvisato quando la funzione sarà attiva.
          </div>
        </div>
      )}
    </div>
  );
}
