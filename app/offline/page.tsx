'use client';

import { WifiOff, RefreshCw, Frown } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-[#3D65C6] to-[#1D3160]">
      <div className="mb-6 animate-offline-float">
        <div className="relative">
          <WifiOff className="w-20 h-20 text-white/80" strokeWidth={1.5} />
          <div className="absolute -top-2 -right-2 animate-offline-wobble">
            <Frown className="w-8 h-8 text-[#FF7300]" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-white mb-3 animate-auth-enter [animation-fill-mode:both] [animation-delay:200ms]">
        Oops, sei offline!
      </h1>

      <p className="text-white/70 text-lg max-w-md mb-8 animate-auth-enter [animation-fill-mode:both] [animation-delay:400ms]">
        Non preoccuparti, la tua collezione ti aspetta.
        <br />
        Riconnetti la rete e torna a catturare le migliori carte.
      </p>

      {/* Entrance sul wrapper così l'hover scale sul bottone non confligge con l'animazione (entrambi usano transform). */}
      <div className="animate-auth-enter [animation-fill-mode:both] [animation-delay:600ms]">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF7300] text-white font-semibold rounded-xl shadow-lg hover:bg-[#e66800] transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
          Riprova
        </button>
      </div>
    </div>
  );
}
