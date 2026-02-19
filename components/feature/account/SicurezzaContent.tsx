'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

const SETUP_STEPS = [
  'Apri l’app Authenticator sul tuo dispositivo.',
  'Aggiungi un account e seleziona "Scansiona codice QR".',
  'Inquadra il codice QR mostrato su questa pagina.',
  'Inserisci il codice a 6 cifre generato dall’app nel campo sotto il QR.',
  'Clicca "Conferma" per attivare l’autenticazione a due fattori.',
];

export function SicurezzaContent() {
  return (
    <div className="font-sans text-white">
      {/* Breadcrumb */}
      <nav
        className="mb-10 flex items-center gap-2 text-lg text-white/90"
        aria-label="Breadcrumb"
      >
        <Link href="/account" className="hover:text-white" aria-label="Account">
          <Home className="h-5 w-5" />
        </Link>
        <span className="text-white/60">/</span>
        <span>ACCOUNT</span>
        <span className="text-white/60">/</span>
        <span className="text-white">SICUREZZA</span>
      </nav>

      {/* Section 1: Autenticazione a due fattori */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white">
          AUTENTICAZIONE A DUE FATTORI
        </h2>
        <p className="max-w-2xl text-lg leading-relaxed text-white/90">
          L’autenticazione a due fattori (2FA) aggiunge un ulteriore livello di
          sicurezza al tuo account. Oltre alla password, dovrai inserire un codice
          temporaneo generato da un’app sul tuo smartphone ogni volta che effettui
          l’accesso. Consigliamo l’uso di Authy o Google Authenticator.
        </p>
      </section>

      {/* Section 2: Come settare */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white">
          COME SETTARE L&apos;AUTENTICAZIONE A DUE FATTORI
        </h2>
        <ol className="list-inside list-decimal space-y-2 text-lg leading-relaxed text-white/90">
          {SETUP_STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      {/* Section 3: Scarica app */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white">
          SCARICA L&apos;APP AUTHENTICATOR
        </h2>
        <p className="mb-6 max-w-2xl text-lg leading-relaxed text-white/90">
          Scarica un’app Authenticator sul tuo smartphone. Consigliamo Authy
          (disponibile per più dispositivi) oppure Google Authenticator.
        </p>
        <div className="ml-12 mt-4 grid max-w-2xl gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-lg font-medium uppercase text-white/90">
              SCARICA GOOGLE AUTHENTICATOR
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex h-14 w-32 items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-lg font-semibold uppercase text-gray-900 shadow-sm transition-opacity hover:opacity-90"
              >
                GOOGLE
              </button>
              <button
                type="button"
                className="flex h-14 w-32 items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-lg font-semibold uppercase text-gray-900 shadow-sm transition-opacity hover:opacity-90"
              >
                APPLE
              </button>
            </div>
          </div>
          <div>
            <p className="mb-3 text-lg font-medium uppercase text-white/90">
              SCARICA AUTHY
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex h-14 w-32 items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-lg font-semibold uppercase text-gray-900 shadow-sm transition-opacity hover:opacity-90"
              >
                GOOGLE
              </button>
              <button
                type="button"
                className="flex h-14 w-32 items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-lg font-semibold uppercase text-gray-900 shadow-sm transition-opacity hover:opacity-90"
              >
                APPLE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Configura 2FA */}
      <section className="mb-12">
        <div className="ml-12">
          <h2 className="mb-6 text-2xl font-bold uppercase tracking-wide text-white">
            CONFIGURA AUTENTICAZIONE A DUE FATTORI
          </h2>

          <p className="mb-3 text-lg font-medium uppercase text-white/90">
            1. SCANNERIZZA IL QR CODE DALL&apos;AUTENTICATORE SCARICATO
          </p>
          <div className="mb-8 ml-[4.5rem] flex h-64 w-64 items-center justify-center rounded-xl border-2 border-gray-300 bg-white shadow-inner">
            <div
              className="h-full w-full rounded-lg opacity-30"
              style={{
                backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
                backgroundSize: '16px 16px',
              }}
              aria-hidden
            />
          </div>

          <p className="mb-3 text-lg font-medium uppercase text-white/90">
            2. INSERISCI IL CODICE CHE VEDI NELL&apos;AUTENTICATORE
          </p>
          <div className="mt-4 flex max-w-md overflow-hidden rounded-full bg-gray-200 shadow-sm">
          <input
            type="text"
            placeholder="CODICE AUTHENTICATOR"
            className="flex-1 border-0 bg-transparent px-4 py-3 text-lg font-medium uppercase text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
          />
          <button
            type="button"
            className="shrink-0 rounded-full border-2 border-[#ff7f00] bg-gray-200 px-6 py-2.5 text-lg font-semibold uppercase text-gray-800 transition-opacity hover:opacity-90"
          >
            CONFERMA
          </button>
          </div>
        </div>
      </section>
    </div>
  );
}
