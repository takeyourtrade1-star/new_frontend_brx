'use client';

import Link from 'next/link';

/**
 * Scelta tra i tre tipi di registrazione: Demo, Account privato, Account business.
 * Mostrato sulla pagina /registrati. Non tocca login né altri flussi.
 */
export function RegistratiChoice() {
  return (
    <div className="space-y-6">
      <p className="text-center text-white/90">
        Scegli come registrarti
      </p>
      <div className="grid gap-4 sm:grid-cols-1">
        <Link
          href="/registrati/demo"
          className="block rounded-xl border-2 border-white/30 bg-white/05 p-6 text-center transition-colors hover:border-[#FF7300] hover:bg-white/10"
        >
          <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
            Registrazione demo
          </h2>
          <p className="text-sm text-white/80">
            Veloce, in 30 secondi. Solo i campi essenziali per provare la piattaforma.
          </p>
        </Link>
        <Link
          href="/registrati/privato"
          className="block rounded-xl border-2 border-white/30 bg-white/05 p-6 text-center transition-colors hover:border-[#FF7300] hover:bg-white/10"
        >
          <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
            Account privato
          </h2>
          <p className="text-sm text-white/80">
            Per uso personale. Includi nome e cognome.
          </p>
        </Link>
        <Link
          href="/account-business"
          className="block rounded-xl border-2 border-white/30 bg-white/05 p-6 text-center transition-colors hover:border-[#FF7300] hover:bg-white/10"
        >
          <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
            Account business
          </h2>
          <p className="text-sm text-white/80">
            Per aziende e professionisti. Ragione sociale e Partita IVA.
          </p>
        </Link>
      </div>
    </div>
  );
}
