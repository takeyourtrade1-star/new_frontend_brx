'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function PaesiSpedizionePage() {
  return (
    <div className="font-sans text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav
          className="flex items-center gap-2 text-lg text-white/90"
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
          <span className="text-white">PAESI IN CUI SPEDISCI</span>
        </nav>
        <Link
          href="/aiuto"
          className="ml-auto text-sm font-medium uppercase text-white/90 hover:text-white"
        >
          HAI BISOGNO DI AIUTO?
        </Link>
      </div>

      <section className="mt-10 max-w-3xl">
        <p className="text-lg leading-relaxed text-white/90">
          Questa è la lista delle nazioni verso le quali decidi di vendere. Se
          non vuoi spedire a una o più nazioni, ti preghiamo di togliere la
          spunta corrispondente alla nazione nella lista sottostante.
        </p>
      </section>
    </div>
  );
}
