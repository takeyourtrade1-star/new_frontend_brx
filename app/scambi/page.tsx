'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Header } from '@/components/layout/Header';

export default function ScambiPage() {
  const { t } = useTranslation();
  const [toastVisible, setToastVisible] = useState(false);

  const handleAvvisami = () => {
    setToastVisible(true);
  };

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 4000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header trasparente */}
      <Header transparent />

      {/* Spacer per l'header fixed */}
      <div className="h-[100px] shrink-0" />

      {/* Area centrale con video */}
      <div className="relative flex-1">
        {/* Video che riempie lo spazio tra header e footer */}
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

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" aria-hidden />

        {/* Contenuto centrato */}
        <div className="relative z-10 flex h-full items-center justify-center">
          <button
            type="button"
            onClick={handleAvvisami}
            className="rounded-full bg-[#FF7300] px-10 py-4 text-base font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,115,0,0.7),0_0_40px_rgba(255,115,0,0.4)] transition-shadow hover:shadow-[0_0_24px_rgba(255,115,0,0.9),0_0_48px_rgba(255,115,0,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            aria-label={t('scambi.notifyAria')}
          >
            {t('scambi.notify')}
          </button>
        </div>

        {/* Toast */}
        {toastVisible && (
          <div
            className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2"
            role="status"
            aria-live="polite"
          >
            <div className="min-w-[280px] max-w-[90vw] rounded-full bg-[#FF7300] px-10 py-4 text-center text-base font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,115,0,0.7),0_0_40px_rgba(255,115,0,0.4)] animate-in fade-in slide-in-from-bottom-8 duration-300">
              {t('scambi.toast')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
