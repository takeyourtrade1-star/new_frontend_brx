'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function DownloadsPage() {
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
        <span className="text-white">DOWNLOADS</span>
      </nav>

      <p className="mb-10 text-2xl font-medium uppercase text-white/90 sm:text-3xl">
        Non ci sono report disponibili per essere scaricati
      </p>
    </div>
  );
}
