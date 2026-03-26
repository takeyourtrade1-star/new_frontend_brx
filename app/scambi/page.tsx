'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Header } from '@/components/layout/Header';

export default function ScambiPage() {
  const { t } = useTranslation();
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header con sfondo visibile */}
      <Header />

      {/* Area centrale con video */}
      <div className="relative flex-1 bg-black">
        {/* Messaggio Fallback (visibile se il video non parte o sta caricando) */}
        {!videoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="max-w-md text-lg font-medium tracking-wide text-gray-400 animate-pulse">
              Stiamo creando l&apos;animazione speciale, ancora un attimo per favore...
            </p>
          </div>
        )}

        {/* Video che riempie lo spazio tra header e footer */}
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden
        >
          <source src="/videos/STG_vSnap.mp4" type="video/mp4" />
        </video>

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" aria-hidden />
      </div>
    </div>
  );
}
