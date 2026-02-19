'use client';

import Link from 'next/link';
import { Home, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="relative flex flex-col rounded-lg bg-[#E8EAED] p-5 shadow-sm">
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
          className="rounded-full p-2 text-[#FF7300] transition-colors hover:bg-[#FF7300]/10"
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
        <span className="text-white">INDIRIZZI</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
        INDIRIZZI
      </h1>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,360px)_minmax(0,420px)]">
        {/* Lista indirizzi */}
        <div className="flex flex-col gap-4">
          {addresses.map((addr) => (
            <AddressCard key={addr.id} address={addr} />
          ))}
        </div>

        {/* Box Aggiungi indirizzo */}
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg bg-[#1D3160] p-8">
          <Button
            asChild
            className="h-12 rounded-lg px-6 text-base font-semibold uppercase tracking-wide text-white hover:opacity-90"
            style={{ backgroundColor: '#FF7300' }}
          >
            <Link href="#">AGGIUNGI INDIRIZZO</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
