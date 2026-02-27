'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function MessaggiContent() {
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen w-full px-4 py-8 font-sans text-gray-900 md:px-8 md:py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/account" className="hover:text-gray-900" aria-label="Account">
            <Home className="h-4 w-4" />
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-gray-900">ACCOUNT</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">MESSAGGI</span>
        </nav>
        <Link
          href="/aiuto"
          className="text-sm font-medium text-[#FF7300] hover:underline"
        >
          HAI BISOGNO DI AIUTO?
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
        I MIEI MESSAGGI
      </h1>

      {/* Nuovo messaggio */}
      <div className="mb-8 border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          Nuovo messaggio
        </p>
        <div className="flex max-w-md items-center gap-2">
          <Input
            type="text"
            placeholder="Inserisci nome utente"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-9 flex-1 rounded-none border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF7300]"
          />
          <button
            type="button"
            className="flex h-9 items-center gap-2 bg-[#FF7300] px-4 text-xs font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5" />
            Contatta
          </button>
        </div>
      </div>

      {/* Stato vuoto */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="mb-2 text-lg font-semibold text-gray-400 uppercase tracking-wide">
          Nessun messaggio
        </p>
        <p className="text-sm text-gray-400">
          Non hai ancora nessuna conversazione attiva.
        </p>
      </div>
    </div>
  );
}
