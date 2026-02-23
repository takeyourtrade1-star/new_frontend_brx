'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCdnImageUrl } from '@/lib/config';

export function MessaggiContent() {
  const [username, setUsername] = useState('');
  const brxBg = getCdnImageUrl('brx_bg.png');
  return (
    <div
      className="font-display min-h-screen w-full px-4 py-8 text-white md:px-8 md:py-10"
      style={{
        backgroundImage: `linear-gradient(rgba(61, 101, 198, 0.85), rgba(29, 49, 96, 0.85)), url(${brxBg}), linear-gradient(180deg, #3D65C6 0%, #1D3160 100%)`,
        backgroundRepeat: 'no-repeat, repeat, no-repeat',
        backgroundSize: 'cover, auto, cover',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Breadcrumb e help: riga a tutta larghezza così "HAI BISOGNO DI AIUTO?" va a destra */}
      <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-4">
        <nav
          className="flex items-center gap-2 text-sm text-white/90"
          aria-label="Breadcrumb"
        >
          <Link href="/account" className="text-[#FF7300] hover:text-[#FF8C1A]" aria-label="Account">
            <Home className="h-4 w-4" />
          </Link>
          <span className="text-white/60">/</span>
          <span className="text-white/70">ACCOUNT</span>
          <span className="text-white/60">/</span>
          <span className="text-white">MESSAGGI</span>
        </nav>
        <Link
          href="/aiuto"
          className="ml-auto shrink-0 text-sm font-normal text-white/90 hover:underline"
        >
          HAI BISOGNO DI AIUTO?
        </Link>
      </div>

      <div className="max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
          MESSAGGI
        </h1>

        {/* Nuovo messaggio: label a sinistra, input + pulsante in un unico contenitore pill */}
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <span className="shrink-0 text-sm font-bold uppercase tracking-wide text-[#d1d5db]">
            NUOVO MESSAGGIO
          </span>
          <div className="ml-6 flex min-w-0 max-w-md items-center gap-1.5 overflow-hidden rounded-full bg-[#E8EAED] py-1 pr-1 md:ml-8">
            <Input
              type="text"
              placeholder="INSERISCI NOME UTENTE"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-7 min-w-[13rem] flex-1 rounded-full border-0 bg-transparent px-3 text-xs font-medium uppercase tracking-wide text-gray-600 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="button"
              className="h-7 shrink-0 rounded-full border-2 border-[#FF7300] bg-transparent px-3 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-[#FF7300]/10"
            >
              CONTATTA
            </Button>
          </div>
        </div>

        {/* Stato vuoto */}
        <p className="text-left text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
          ATTUALMENTE NON C&apos;È NESSUN MESSAGGIO
        </p>
      </div>
    </div>
  );
}
