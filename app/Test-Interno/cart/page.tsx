'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2, ArrowRight, Tag } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';

const MOCK_CART = [
  { id: '1', name: 'Black Lotus Alpha', variant: 'PSA 9 · MTG', price: 8400, qty: 1, img: getCdnImageUrl('carousel/slide1.jpg') },
  { id: '2', name: 'Charizard Base Set', variant: '1st Ed · Pokémon', price: 1200, qty: 1, img: getCdnImageUrl('carousel/slide2.jpg') },
];

export default function TestInternoCartPage() {
  const total = MOCK_CART.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-4 pb-4 pt-10" style={{ background: 'linear-gradient(180deg, #1D3160, #0F172A)' }}>
        <h1 className="flex items-center gap-2 text-lg font-black text-white">
          <ShoppingCart className="h-5 w-5" style={{ color: '#FF7300' }} />
          Il Tuo Carrello
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>{MOCK_CART.length} articoli</p>
      </div>

      <div className="p-4">
        {/* Promo banner */}
        <div
          className="mb-4 flex items-center gap-3 rounded-2xl p-3"
          style={{ background: 'rgba(255,115,0,0.08)', border: '1px solid rgba(255,115,0,0.20)' }}
        >
          <Tag className="h-4 w-4 shrink-0" style={{ color: '#FF7300' }} />
          <p className="text-xs font-semibold text-gray-700">Spedizione gratuita per ordini superiori a <strong style={{ color: '#FF7300' }}>€ 50</strong></p>
        </div>

        {/* Items */}
        <div className="mb-4 flex flex-col gap-3">
          {MOCK_CART.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3"
              style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <Image src={item.img} alt={item.name} fill className="object-cover" sizes="64px" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[11px] font-bold text-gray-800">{item.name}</p>
                <p className="mb-1 text-[9px] text-gray-400">{item.variant}</p>
                <p className="text-sm font-black" style={{ color: '#FF7300' }}>€ {item.price.toLocaleString('it-IT')}</p>
              </div>
              <button
                type="button"
                aria-label="Rimuovi articolo"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'rgba(239,68,68,0.08)' }}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div
          className="mb-4 rounded-2xl bg-white p-4"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
        >
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Riepilogo</h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotale</span>
              <span>€ {total.toLocaleString('it-IT')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Spedizione</span>
              <span className="font-semibold" style={{ color: '#22C55E' }}>Gratuita</span>
            </div>
            <div className="my-1 h-px bg-gray-100" />
            <div className="flex justify-between text-base font-black text-gray-900">
              <span>Totale</span>
              <span style={{ color: '#FF7300' }}>€ {total.toLocaleString('it-IT')}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/Test-Interno"
          id="cart-checkout-btn"
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-transform active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FF7300, #e66700)', boxShadow: '0 4px 20px rgba(255,115,0,0.35)' }}
        >
          Procedi al Checkout
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
