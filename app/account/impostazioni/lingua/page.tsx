'use client';

import Link from 'next/link';
import { Home, ChevronDown } from 'lucide-react';

function FlagIt() {
  return (
    <span className="inline-block h-5 w-7 overflow-hidden rounded-sm border border-white/30 shadow-sm" aria-hidden>
      <span className="flex h-full w-full">
        <span className="w-1/3 bg-[#009246]" />
        <span className="w-1/3 bg-white" />
        <span className="w-1/3 bg-[#CE2B37]" />
      </span>
    </span>
  );
}

export default function ImpostazioniLinguaPage() {
  return (
    <div className="font-sans text-white">
      <nav
        className="mb-6 flex items-center gap-2 text-lg text-white/90"
        aria-label="Breadcrumb"
      >
        <Link href="/account" className="hover:text-white" aria-label="Account">
          <Home className="h-5 w-5" />
        </Link>
        <span className="text-white/60">/</span>
        <Link href="/account/impostazioni" className="hover:text-white">
          ACCOUNT
        </Link>
        <span className="text-white/60">/</span>
        <Link href="/account/impostazioni" className="hover:text-white">
          IMPOSTAZIONI
        </Link>
        <span className="text-white/60">/</span>
        <span className="text-white">LINGUA</span>
      </nav>

      <p className="mb-10 max-w-2xl text-lg leading-relaxed text-white/90">
        Configura la lingua preferita per l&apos;interfaccia e le notifiche.
      </p>

      <form className="max-w-2xl space-y-8">
        {/* Lingua del sito */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="text-lg font-medium text-white">
            Lingua del sito
          </label>
          <button
            type="button"
            className="flex items-center gap-2 bg-transparent text-base font-semibold uppercase text-white transition-opacity hover:opacity-90"
          >
            <span>ITALIANO</span>
            <FlagIt />
            <ChevronDown className="h-5 w-5 text-gray-900" />
          </button>
        </div>

        {/* Lingua delle email */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="text-lg font-medium text-white">
            Lingua delle email
          </label>
          <button
            type="button"
            className="flex items-center gap-2 bg-transparent text-base font-semibold uppercase text-white transition-opacity hover:opacity-90"
          >
            <span>ITALIANO</span>
            <FlagIt />
            <ChevronDown className="h-5 w-5 text-gray-900" />
          </button>
        </div>

        {/* Mostra nome anche in inglese */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="text-lg font-medium text-white">
            Mostra nome anche in inglese
          </label>
          <div className="h-6 w-6 shrink-0 rounded-full border-2 border-gray-900 bg-transparent" />
        </div>

        {/* Usa la lingua del prodotto */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="text-lg font-medium text-white">
            Usa la lingua del prodotto**
          </label>
          <div className="h-6 w-6 shrink-0 rounded-full border-2 border-gray-900 bg-transparent" />
        </div>
      </form>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-white/70">
        ** I nomi dei prodotti negli ordini sono nella lingua in cui sono stati
        listati.
      </p>
    </div>
  );
}
