'use client';

import Link from 'next/link';
import { Home, ChevronDown } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CouponContent() {
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
        <span className="text-gray-900">COUPON</span>
      </nav>

      <p className="mb-8 mt-8 text-gray-700">
        QUI TROVI UN ELENCO DI TUTTI I COUPON CHE HAI ACQUISTATO IN PASSATO.
      </p>

      <div className="mb-10 flex justify-start">
        <Button
          type="button"
          className="rounded-none px-8 py-6 text-base font-semibold uppercase shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FF8C00' }}
        >
          INCASSA UN COUPON
        </Button>
      </div>

      {/* Pannello filtri - identico al riferimento */}
      <div
        className="rounded-none bg-cover bg-center bg-no-repeat p-6 shadow-md"
        style={{ backgroundImage: `url(${getCdnImageUrl('rectangle-97.png')})` }}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap items-end justify-center gap-20">
          <div className="w-36 shrink-0">
            <label
              htmlFor="coupon-stato"
              className="mb-2 block text-sm font-medium uppercase text-gray-900"
            >
              STATO
            </label>
            <div className="relative flex h-10 items-center rounded-none bg-gray-200 px-4 py-2">
              <select
                id="coupon-stato"
                className="h-full w-full appearance-none border-0 bg-transparent pr-8 text-sm font-medium uppercase text-gray-900 focus:outline-none focus:ring-0"
                defaultValue="RISCOSSO"
              >
                <option value="RISCOSSO">RISCOSSO</option>
                <option value="Tutti">Tutti</option>
                <option value="Non riscosso">Non riscosso</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900" aria-hidden />
            </div>
          </div>
          <div className="w-36 shrink-0">
            <label
              htmlFor="coupon-data-inizio"
              className="mb-2 block text-sm font-medium uppercase text-gray-900"
            >
              DATA INIZIO
            </label>
            <div className="relative flex h-10 items-center rounded-none bg-gray-200 px-4 py-2">
              <Input
                id="coupon-data-inizio"
                type="text"
                placeholder="GG/MM/AA"
                className="h-full border-0 bg-transparent text-sm font-medium uppercase text-gray-900 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900" aria-hidden />
            </div>
          </div>
          <div className="w-36 shrink-0">
            <label
              htmlFor="coupon-data-fine"
              className="mb-2 block text-sm font-medium uppercase text-gray-900"
            >
              DATA FINE
            </label>
            <div className="relative flex h-10 items-center rounded-none bg-gray-200 px-4 py-2">
              <Input
                id="coupon-data-fine"
                type="text"
                placeholder="GG/MM/AA"
                className="h-full border-0 bg-transparent text-sm font-medium uppercase text-gray-900 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900" aria-hidden />
            </div>
          </div>
          <Button
            type="button"
            className="h-10 shrink-0 rounded-none px-6 font-semibold uppercase text-gray-900 shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#FF8C00' }}
          >
            CERCA
          </Button>
        </div>
      </div>
    </div>
  );
}
