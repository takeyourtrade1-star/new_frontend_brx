'use client';

import Link from 'next/link';
import { Home, Pencil, Plus } from 'lucide-react';
import type { Address } from '@/types';

const MOCK_ADDRESSES: Address[] = [
  {
    id: '1',
    label: 'DOMICILIO',
    nome: 'MARIA ROSA',
    via: 'CORSO GIULIO',
    cap: '10100',
    citta: 'TORINO',
    paese: 'ITALIA',
  },
];

function AddressCard({ address }: { address: Address }) {
  return (
    <div className="relative flex flex-col rounded-none bg-[#E8EAED] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Home className="h-5 w-5 text-[#FF7300]" aria-hidden />
        <h3 className="text-base font-bold uppercase tracking-wide text-[#374151]">
          {address.label}
        </h3>
      </div>
      <address className="not-italic text-[#374151]">
        <p className="font-medium">{address.nome}</p>
        <p>{address.via}</p>
        <p>
          {address.cap} {address.citta}
        </p>
        <p>{address.paese}</p>
      </address>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="rounded-none p-2 text-[#FF7300] transition-colors hover:bg-[#FF7300]/10"
          aria-label={`Modifica indirizzo ${address.label}`}
        >
          <Pencil className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function IndirizziContent() {
  const addresses = MOCK_ADDRESSES;

  return (
    <div className="text-gray-900">
      {/* Breadcrumb */}
      <nav
        className="mb-6 flex items-center gap-2 text-sm text-gray-700"
        aria-label="Breadcrumb"
      >
        <Link href="/account" className="hover:text-gray-900" aria-label="Account">
          <Home className="h-4 w-4" />
        </Link>
        <span className="text-gray-400">/</span>
        <span>ACCOUNT</span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">INDIRIZZI</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
        INDIRIZZI
      </h1>

      <div className="flex flex-wrap gap-4">
        {/* Lista indirizzi */}
        {addresses.map((addr) => (
          <AddressCard key={addr.id} address={addr} />
        ))}

        {/* Card Aggiungi indirizzo: stessa dimensione delle card indirizzo */}
        <Link
          href="#"
          className="group flex min-h-[160px] w-full max-w-[280px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-500 transition-all hover:border-[#FF7300] hover:text-[#FF7300] sm:w-[280px]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current transition-colors">
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold uppercase tracking-wide">
            Aggiungi indirizzo
          </span>
        </Link>
      </div>
    </div>
  );
}
