'use client';

import Link from 'next/link';
import { Home, Download } from 'lucide-react';

export default function DownloadsPage() {
  return (
    <div className="font-sans text-gray-900">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/account" className="hover:text-gray-900" aria-label="Account">
          <Home className="h-4 w-4" />
        </Link>
        <span>/</span>
        <Link href="/account" className="hover:text-gray-900">ACCOUNT</Link>
        <span>/</span>
        <span className="font-medium text-gray-900">DOWNLOADS</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
        DOWNLOADS
      </h1>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center border border-gray-200 bg-gray-50">
          <Download className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-500 uppercase tracking-wide">
          Nessun report disponibile
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Non ci sono report disponibili per essere scaricati al momento.
        </p>
      </div>
    </div>
  );
}
