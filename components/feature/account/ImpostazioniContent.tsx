'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export function ImpostazioniContent() {
  return (
    <div className="font-sans text-gray-900">
      <nav
        className="mb-6 flex items-center gap-2 text-lg text-gray-700"
        aria-label="Breadcrumb"
      >
        <Link href="/account" className="hover:text-gray-900" aria-label="Account">
          <Home className="h-5 w-5" />
        </Link>
        <span className="text-gray-400">/</span>
        <span>ACCOUNT</span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">IMPOSTAZIONI</span>
      </nav>

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:gap-6">
        <Link
          href="/account/impostazioni/lingua"
          className="min-w-0 flex-1 rounded-none border border-white/10 py-6 px-4 transition-colors hover:border-gray-200 hover:bg-white/5"
        >
          <section>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-gray-900">
              Impostazioni lingua
            </h2>
            <p className="text-lg leading-relaxed text-gray-700">
              Configura la lingua preferita per l’interfaccia e le notifiche.
            </p>
          </section>
        </Link>

        <Link
          href="/account/impostazioni/email"
          className="min-w-0 flex-1 rounded-none border border-white/10 py-6 px-4 transition-colors hover:border-gray-200 hover:bg-white/5"
        >
          <section>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-gray-900">
              Email
            </h2>
            <p className="text-lg leading-relaxed text-gray-700">
              Gestisci l’indirizzo email e le preferenze di notifica.
            </p>
          </section>
        </Link>

        <Link
          href="/account/impostazioni/utenti-bloccati"
          className="min-w-0 flex-1 rounded-none border border-white/10 py-6 px-4 transition-colors hover:border-gray-200 hover:bg-white/5"
        >
          <section>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-gray-900">
              Utenti bloccati
            </h2>
            <p className="text-lg leading-relaxed text-gray-700">
              Visualizza e gestisci l’elenco degli utenti che hai bloccato.
            </p>
          </section>
        </Link>

        <Link
          href="/account/impostazioni/paesi-spedizione"
          className="min-w-0 flex-1 rounded-none border border-white/10 py-6 px-4 transition-colors hover:border-gray-200 hover:bg-white/5"
        >
          <section>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-gray-900">
              Paesi in cui spedisci
            </h2>
            <p className="text-lg leading-relaxed text-gray-700">
              Configura i paesi verso cui effettui la spedizione.
            </p>
          </section>
        </Link>
      </div>
    </div>
  );
}
