'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export function OggettiContent() {
  return (
    <div className="text-white">
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
        <span className="text-white">I MIEI OGGETTI</span>
      </nav>

      {/* Contenuto: placeholder per la collezione */}
      <div className="mt-8 rounded-lg bg-white/10 p-8">
        <h1 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white">
          I miei oggetti
        </h1>
        <p className="text-white/90">
          Qui verrà mostrata la tua collezione. La funzionalità sarà disponibile a breve.
        </p>
      </div>
    </div>
  );
}
