'use client';

import Link from 'next/link';
import { Home, ChevronDown } from 'lucide-react';

const FILTER_ROWS = [
  { thirdLabel: 'DATA ACQUISTO' },
  { thirdLabel: 'DATA PAGAMENTO' },
  { thirdLabel: 'DATA ACQUISTO' },
  { thirdLabel: 'DATA ACQUISTO' },
] as const;

function FilterRow({ thirdLabel }: { thirdLabel: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 py-3">
      <div className="flex flex-wrap items-end gap-4">
        <span className="text-sm font-medium uppercase text-white">
          ORDINI VENDUTI
        </span>
        <div className="relative flex h-10 items-center rounded-full bg-white px-4 py-2 shadow-sm">
          <select
            className="h-full w-full appearance-none border-0 bg-transparent pr-8 text-sm font-medium uppercase text-gray-900 focus:outline-none focus:ring-0"
            defaultValue="MESE"
          >
            <option value="MESE">MESE</option>
            <option value="SETTIMANA">SETTIMANA</option>
            <option value="ANNO">ANNO</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
            aria-hidden
          />
        </div>
        <div className="relative flex h-10 items-center rounded-full bg-white px-4 py-2 shadow-sm">
          <select
            className="h-full w-full appearance-none border-0 bg-transparent pr-8 text-sm font-medium uppercase text-gray-900 focus:outline-none focus:ring-0"
            defaultValue="ANNO"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
            aria-hidden
          />
        </div>
        <div className="relative flex h-10 w-40 items-center rounded-full bg-white px-4 py-2 shadow-sm">
          <select
            className="h-full w-full appearance-none border-0 bg-transparent pr-8 text-sm font-medium uppercase text-gray-900 focus:outline-none focus:ring-0"
            defaultValue={thirdLabel}
          >
            <option value={thirdLabel}>{thirdLabel}</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
            aria-hidden
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="#"
          className="text-sm font-semibold uppercase text-white hover:underline"
          style={{ color: '#ff7f00' }}
        >
          ESPORTA (.CSV)
        </Link>
        <Link
          href="#"
          className="text-sm font-semibold uppercase text-white hover:underline"
          style={{ color: '#ff7f00' }}
        >
          ESPORTA (.XLS)
        </Link>
      </div>
    </div>
  );
}

export function StatisticheContent() {
  return (
    <div className="font-sans text-white">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-2 text-sm text-white/90"
        aria-label="Breadcrumb"
      >
        <Link href="/account" className="hover:text-white" aria-label="Account">
          <Home className="h-4 w-4" />
        </Link>
        <span className="text-white/60">/</span>
        <span>ACCOUNT</span>
        <span className="text-white/60">/</span>
        <span className="text-white">STATISTICHE</span>
      </nav>

      {/* Section 1: Sommario */}
      <section className="mb-12 mt-10">
        <h2 className="mb-1 text-lg font-bold uppercase tracking-wide text-white">
          SOMMARIO DEGLI ACQUISTI E DELLE VENDITE
        </h2>
        <p className="mb-6 text-sm text-white/90">
          VEDI LE STATISTICHE DELLA TUA ATTIVITÀ (ACQUISTI E VENDITE)
        </p>
        <div className="divide-y divide-white/20">
          {FILTER_ROWS.map((row, i) => (
            <FilterRow key={i} thirdLabel={row.thirdLabel} />
          ))}
        </div>
      </section>

      {/* Linea separatrice sopra STATISTICHE VENDITA */}
      <hr className="my-8 border-t border-gray-400/70" aria-hidden />

      {/* Section 2: Statistiche vendita */}
      <section className="mb-12">
        <h2 className="mb-1 text-lg font-bold uppercase tracking-wide text-white">
          STATISTICHE VENDITA
        </h2>
        <p className="text-sm uppercase text-white/80">
          CONTROLLA LE VENDITE PER ESPANSIONI
        </p>
      </section>

      {/* Linea separatrice sotto STATISTICHE VENDITA (sopra REFERRALS) */}
      <hr className="my-8 border-t border-gray-400/70" aria-hidden />

      {/* Section 3: Referrals */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-white">
          REFERRALS
        </h2>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-white/90">
          CONTROLLA GLI UTENTI CHE HAI PORTATO SU EBARTEX. CONDIVIDI IL TUO LINK
          REFERRAL E GUADAGNA CREDITI QUANDO I TUOI REFERRAL EFFETTUANO ACQUISTI.
          PUOI RINUNCIARE AL PROGRAMMA REFERRAL IN QUALSIASI MOMENTO.
        </p>
        <p className="mb-6 text-center text-base font-bold uppercase text-white">
          NON HAI REFERRALS.
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold uppercase text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0f172a' }}
          >
            RINUNCIA AL PROGRAMMA REFERRAL
          </button>
        </div>
      </section>
    </div>
  );
}
