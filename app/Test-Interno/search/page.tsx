'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, TrendingUp, Clock } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';

const TRENDING_SEARCHES = ['Black Lotus', 'Charizard 1st Ed', 'Mox Sapphire', 'Pikachu Trophy', 'Dark Magician'];
const RECENT_SEARCHES = ['MTG Alpha', 'Pokemon Base Set', 'YGO LOB'];

const MOCK_RESULTS = [
  { id: '1', name: 'Black Lotus – PSA 9', price: '€ 8.400', type: 'Asta', img: getCdnImageUrl('carousel/slide1.jpg'), endsIn: '2h' },
  { id: '2', name: 'Charizard Base 1st Ed', price: '€ 1.200', type: 'Acquisto', img: getCdnImageUrl('carousel/slide2.jpg'), endsIn: null },
  { id: '3', name: 'Mox Ruby Beta', price: '€ 3.200', type: 'Asta', img: getCdnImageUrl('carousel/slide3.jpg'), endsIn: '45m' },
];

export default function TestInternoSearchPage() {
  const [q, setQ] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="px-4 pb-3 pt-10" style={{ background: 'linear-gradient(180deg, #1D3160, #0F172A)' }}>
        <h1 className="mb-4 text-lg font-black text-white">Cerca</h1>
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <Search className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.8} />
          <input
            id="search-page-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca carte, set, edizioni..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            aria-label="Cerca"
            autoFocus
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Cancella">
              <X className="h-4 w-4 text-white/50" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {q.trim() === '' ? (
          <>
            {/* Trending */}
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" style={{ color: '#FF7300' }} />
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Tendenze</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQ(t)}
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-transform active:scale-95"
                    style={{ background: 'rgba(255,115,0,0.10)', color: '#FF7300', border: '1px solid rgba(255,115,0,0.20)' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recenti</h2>
              </div>
              <div className="flex flex-col gap-1">
                {RECENT_SEARCHES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQ(r)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 active:scale-95"
                    style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <Search className="h-3.5 w-3.5 text-gray-300" />
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-xs font-semibold text-gray-400">{MOCK_RESULTS.length} risultati per &quot;{q}&quot;</p>
            {MOCK_RESULTS.map((r) => (
              <Link
                key={r.id}
                href="/Test-Interno"
                id={`search-result-${r.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 transition-transform active:scale-[0.98]"
                style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <Image src={r.img} alt={r.name} fill className="object-cover" sizes="48px" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[11px] font-bold text-gray-800">{r.name}</p>
                  <p className="text-[9px] text-gray-400">{r.type}{r.endsIn ? ` · Scade in ${r.endsIn}` : ''}</p>
                </div>
                <p className="shrink-0 text-sm font-black" style={{ color: '#FF7300' }}>{r.price}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
