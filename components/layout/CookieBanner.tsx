'use client';

import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostra il banner dopo un breve delay per un effetto più naturale
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
  };

  const handleDecline = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
      <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-primary/25 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl shadow-black/30">
        {/* Header con icona e titolo */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/40">
            <Cookie className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-display text-lg font-semibold text-white tracking-wide">
            Cookie
          </h3>
          <button
            onClick={handleDecline}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
            aria-label="Chiudi banner cookie"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Contenuto */}
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-white/90">
            Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza, 
            personalizzare contenuti e analizzare il traffico. Cliccando "Accetta" 
            acconsenti all&apos;uso dei cookie.
          </p>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Azioni */}
        <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            onClick={handleDecline}
            className="rounded-full px-5 py-2 text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white sm:order-1"
          >
            Rifiuta
          </button>
          <button
            onClick={handleAccept}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 sm:order-2"
          >
            Accetta solo i necessari
          </button>
          <button
            onClick={handleAccept}
            className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 sm:order-3"
          >
            Accetta tutti
          </button>
        </div>
      </div>
    </div>
  );
}
