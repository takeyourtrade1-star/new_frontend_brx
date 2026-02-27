'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useState } from 'react';

export function UtentiBloccatiContent() {
  const [username, setUsername] = useState('');

  return (
    <div className="font-sans text-gray-900">
      {/* Breadcrumb + Help */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav
          className="flex items-center gap-2 text-lg text-gray-700"
          aria-label="Breadcrumb"
        >
          <Link href="/account" className="hover:text-gray-900" aria-label="Account">
            <Home className="h-5 w-5" />
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/account/impostazioni" className="hover:text-gray-900">
            ACCOUNT
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/account/impostazioni" className="hover:text-gray-900">
            IMPOSTAZIONI
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">UTENTI BLOCCATI</span>
        </nav>
        <Link
          href="/aiuto"
          className="ml-auto text-sm font-medium uppercase text-gray-700 hover:text-gray-900"
        >
          HAI BISOGNO DI AIUTO?
        </Link>
      </div>

      {/* InfoBlock */}
      <section className="mb-10 mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-gray-900">
        <p className="uppercase">
          Questa è la tua lista utenti bloccati. Puoi aggiungere un utente alla
          lista utenti bloccati digitando il suo username. Se un utente è sulla
          tua lista utenti bloccati, ci saranno le seguenti conseguenze:
        </p>
        <ul className="list-inside list-disc space-y-2 uppercase">
          <li>L&apos;utente non potrà acquistare da te</li>
          <li>
            L&apos;utente non potrà contattarti tramite messaggio Cardmarket
          </li>
          <li>
            Non potrai contattare l&apos;utente tramite messaggio Cardmarket
          </li>
          <li>
            Se userai lo Shopping Wizard, non verranno considerati gli articoli
            di questo utente
          </li>
        </ul>
        <p className="uppercase">
          In sostanza mettere un utente nella tua lista utenti bloccati, vuol
          dire smettere completamente di interagire con lui su Cardmarket.
        </p>
        <p className="uppercase">
          Ti preghiamo di non mettere mai nella tua lista utenti bloccati un
          utente con il quale stai avendo a che fare in quel momento (ad
          esempio in un ordine ancora non chiuso o in cui ci sia un problema
          irrisolto). Se inserirai un utente nella tua lista utenti bloccati per
          evitarlo o per non risolvere un problema con lui, il tuo account
          verrà istantaneamente sospeso.
        </p>
      </section>

      {/* ManageUsers */}
      <section className="flex max-w-4xl flex-wrap items-center gap-4">
        <h2 className="shrink-0 text-xl font-bold uppercase tracking-wide text-gray-900">
          GESTISCI UTENTI BLOCCATI
        </h2>
        <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-none bg-gray-200 py-1.5 pr-1.5">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="min-w-0 flex-1 border-0 bg-transparent px-5 py-3 text-base font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
          />
          <button
            type="button"
            className="shrink-0 rounded-none border-2 border-[#ff7f00] bg-[#0f172a] px-5 py-2.5 text-base font-semibold uppercase text-[#ff7f00] transition-opacity hover:opacity-90"
          >
            AGGIUNGI LISTA
          </button>
        </div>
      </section>
    </div>
  );
}
