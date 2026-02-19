'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export function ImpostazioniContent() {
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
        <span>ACCOUNT</span>
        <span className="text-white/60">/</span>
        <span className="text-white">IMPOSTAZIONI</span>
      </nav>

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:gap-6">
        <Link
          href="/account/impostazioni/lingua"
          className="min-w-0 flex-1 rounded-lg border border-white/10 py-6 px-4 transition-colors hover:border-white/30 hover:bg-white/5"
        >
          <section>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white">
              Impostazioni lingua
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              Configura la lingua preferita per l’interfaccia e le notifiche.
            </p>
          </section>
        </Link>

        <Link
          href="/account/impostazioni/email"
          className="min-w-0 flex-1 rounded-lg border border-white/10 py-6 px-4 transition-colors hover:border-white/30 hover:bg-white/5"
        >
          <section>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white">
              Email
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              Gestisci l’indirizzo email e le preferenze di notifica.
            </p>
          </section>
        </Link>

        <Link
          href="/account/impostazioni/utenti-bloccati"
          className="min-w-0 flex-1 rounded-lg border border-white/10 py-6 px-4 transition-colors hover:border-white/30 hover:bg-white/5"
        >
          <section>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white">
              Utenti bloccati
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              Visualizza e gestisci l’elenco degli utenti che hai bloccato.
            </p>
          </section>
        </Link>

        <Link
          href="/account/impostazioni/paesi-spedizione"
          className="min-w-0 flex-1 rounded-lg border border-white/10 py-6 px-4 transition-colors hover:border-white/30 hover:bg-white/5"
        >
          <section>
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white">
              Paesi in cui spedisci
            </h2>
            <p className="text-lg leading-relaxed text-white/90">
              Configura i paesi verso cui effettui la spedizione.
            </p>
          </section>
        </Link>
      </div>
    </div>
  );
}
