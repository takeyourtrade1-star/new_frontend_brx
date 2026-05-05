'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Filter, Clock, Gavel, Flame, ChevronDown,
  ArrowRight, Users, Star, X, TrendingUp, SlidersHorizontal,
} from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';

/* ─────────────────────────────────────
   MOCK AUCTION DATA
   ───────────────────────────────────── */
const MOCK_AUCTIONS = [
  {
    id: '1',
    title: 'Black Lotus Alpha – PSA 9',
    game: 'MTG',
    price: 8400,
    bids: 34,
    endsIn: '2h 14m',
    urgent: true,
    img: getCdnImageUrl('carousel/slide1.jpg'),
    seller: 'TopCollector_IT',
    badge: 'In Evidenza',
  },
  {
    id: '2',
    title: 'Charizard Base Set 1st Ed',
    game: 'Pokémon',
    price: 1850,
    bids: 21,
    endsIn: '5h 42m',
    urgent: false,
    img: getCdnImageUrl('carousel/slide2.jpg'),
    seller: 'PkmnMaster99',
    badge: 'Raro',
  },
  {
    id: '3',
    title: 'Dark Magician LOB 1st Ed',
    game: 'YGO',
    price: 670,
    bids: 9,
    endsIn: '12h 00m',
    urgent: false,
    img: getCdnImageUrl('carousel/slide3.jpg'),
    seller: 'YugiCollect',
    badge: null,
  },
  {
    id: '4',
    title: 'Mox Ruby Beta – PSA 8',
    game: 'MTG',
    price: 3200,
    bids: 17,
    endsIn: '0h 48m',
    urgent: true,
    img: getCdnImageUrl('carousel/slide1.jpg'),
    seller: 'VintageCards_EU',
    badge: 'Scade Presto',
  },
  {
    id: '5',
    title: 'Pikachu Illustrator Trophy',
    game: 'Pokémon',
    price: 6800,
    bids: 52,
    endsIn: '1h 05m',
    urgent: true,
    img: getCdnImageUrl('carousel/slide2.jpg'),
    seller: 'RareFinds_JP',
    badge: 'Top Seller',
  },
  {
    id: '6',
    title: 'Pot of Greed – Ultra Rare',
    game: 'YGO',
    price: 280,
    bids: 4,
    endsIn: '24h 00m',
    urgent: false,
    img: getCdnImageUrl('carousel/slide3.jpg'),
    seller: 'YgoStore',
    badge: null,
  },
];

const GAME_FILTERS = ['Tutti', 'MTG', 'Pokémon', 'YGO', 'One Piece'];
const SORT_OPTIONS = ['Scade presto', 'Nuovo', 'Prezzo ↑', 'Più offerte'];

/* ─────────────────────────────────────
   PAGE
   ───────────────────────────────────── */
export default function TestInternoAstePage() {
  const [q, setQ] = useState('');
  const [activeGame, setActiveGame] = useState('Tutti');
  const [activeSort, setActiveSort] = useState('Scade presto');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    return MOCK_AUCTIONS.filter((a) => {
      const matchQ = q.trim() === '' || a.title.toLowerCase().includes(q.toLowerCase()) || a.seller.toLowerCase().includes(q.toLowerCase());
      const matchGame = activeGame === 'Tutti' || a.game === activeGame;
      return matchQ && matchGame;
    });
  }, [q, activeGame]);

  return (
    <div
      className="min-h-screen w-full text-white"
      style={{ background: '#F8FAFC' }}
    >
      {/* ── HERO HEADER ── */}
      <div
        className="relative overflow-hidden px-4 pb-6 pt-10"
        style={{ background: 'linear-gradient(180deg, #1D3160 0%, #0F172A 100%)' }}
      >
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -top-10 right-4 h-40 w-40 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #FB923C, transparent 70%)', filter: 'blur(30px)' }}
          aria-hidden
        />

        <div className="relative z-10 mb-4 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-white">
              <Gavel className="h-5 w-5" style={{ color: '#FB923C' }} />
              Aste Live
            </h1>
            <p className="text-xs text-white/40">
              <span className="font-bold" style={{ color: '#FB923C' }}>{MOCK_AUCTIONS.length}</span> aste in corso
            </p>
          </div>
          <Link
            href="/Test-Interno/aste/nuova"
            id="aste-new-btn"
            className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold text-white transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF7300, #e66700)', boxShadow: '0 4px 16px rgba(255,115,0,0.30)' }}
          >
            <span className="text-base leading-none">+</span>
            Nuova asta
          </Link>
        </div>

        {/* Ending soon cards horizontal scroll */}
        <div className="relative z-10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Scadono presto</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {MOCK_AUCTIONS.filter((a) => a.urgent).map((a) => (
              <Link
                key={a.id}
                href={`/Test-Interno/aste/${a.id}`}
                id={`aste-urgent-${a.id}`}
                className="group relative flex h-[140px] w-[120px] shrink-0 flex-col overflow-hidden rounded-2xl transition-transform active:scale-95"
              >
                <div className="relative h-full w-full">
                  <Image src={a.img} alt={a.title} fill className="object-cover" sizes="120px" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                {/* Timer */}
                <div className="absolute inset-x-2 top-2 flex items-center justify-center rounded-full bg-black/50 py-1 backdrop-blur-sm" style={{ border: '1px solid rgba(251,146,60,0.5)' }}>
                  <Clock className="mr-1 h-2.5 w-2.5" style={{ color: '#FB923C' }} />
                  <span className="font-mono text-[10px] font-bold text-white">{a.endsIn}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="line-clamp-2 text-[9px] font-bold leading-tight text-white">{a.title}</p>
                  <p className="mt-0.5 text-[10px] font-black" style={{ color: '#FB923C' }}>€ {a.price.toLocaleString('it-IT')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTERS ── */}
      <div
        className="sticky top-0 z-30 px-4 py-3"
        style={{ background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}
      >
        {/* Search */}
        <div
          className="mb-2.5 flex items-center gap-2 rounded-2xl px-4 py-2.5"
          style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)' }}
        >
          <Search className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.8} />
          <input
            id="aste-search-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca aste, carte, venditori..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            aria-label="Cerca aste"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Cancella">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Game pills */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {GAME_FILTERS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setActiveGame(g)}
                className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                style={{
                  background: activeGame === g ? '#FF7300' : 'rgba(0,0,0,0.06)',
                  color: activeGame === g ? 'white' : 'rgba(0,0,0,0.45)',
                }}
                aria-pressed={activeGame === g}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Filters + View toggle */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95"
              style={{
                background: showFilters ? '#FF7300' : 'rgba(0,0,0,0.06)',
                color: showFilters ? 'white' : 'rgba(0,0,0,0.45)',
              }}
              aria-label="Filtri avanzati"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.45)' }}
              aria-label={viewMode === 'grid' ? 'Vista lista' : 'Vista griglia'}
            >
              {viewMode === 'grid' ? '☰' : '⊞'}
            </button>
          </div>
        </div>

        {/* Expandable sort options */}
        {showFilters && (
          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveSort(s)}
                className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95"
                style={{
                  background: activeSort === s ? 'rgba(255,115,0,0.15)' : 'rgba(0,0,0,0.04)',
                  color: activeSort === s ? '#FF7300' : 'rgba(0,0,0,0.40)',
                  border: `1px solid ${activeSort === s ? 'rgba(255,115,0,0.35)' : 'transparent'}`,
                }}
                aria-pressed={activeSort === s}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── RESULTS ── */}
      <div className="px-4 py-4 text-gray-900">
        <p className="mb-3 text-xs font-semibold text-gray-500">
          {filtered.length} risultat{filtered.length === 1 ? 'o' : 'i'}
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Gavel className="h-12 w-12 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">Nessuna asta trovata</p>
            <button type="button" onClick={() => { setQ(''); setActiveGame('Tutti'); }} className="rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background: '#FF7300' }}>
              Resetta filtri
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((a) => (
              <AuctionRow key={a.id} auction={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   GRID CARD
   ───────────────────────────────────── */
function AuctionCard({ auction: a }: { auction: typeof MOCK_AUCTIONS[number] }) {
  return (
    <Link
      href={`/Test-Interno/aste/${a.id}`}
      id={`aste-card-${a.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-transform active:scale-95"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="relative h-[120px] w-full overflow-hidden">
        <Image src={a.img} alt={a.title} fill className="object-cover transition-transform duration-300 group-active:scale-105" sizes="200px" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {a.badge && (
          <span
            className="absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white"
            style={{ background: a.urgent ? '#FB923C' : a.badge === 'Raro' ? '#A78BFA' : '#1D3160' }}
          >
            {a.badge}
          </span>
        )}

        {/* Timer */}
        <div
          className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-full py-1"
          style={{
            background: a.urgent ? 'rgba(251,146,60,0.20)' : 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${a.urgent ? 'rgba(251,146,60,0.50)' : 'rgba(255,255,255,0.15)'}`,
          }}
        >
          <Clock className="h-2.5 w-2.5" style={{ color: a.urgent ? '#FB923C' : 'white' }} />
          <span className="font-mono text-[9px] font-bold text-white">{a.endsIn}</span>
        </div>
      </div>

      <div className="p-2.5">
        <p className="mb-0.5 line-clamp-2 text-[10px] font-bold leading-tight text-gray-800">{a.title}</p>
        <p className="mb-2 text-[8px] text-gray-400">{a.seller}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-gray-400">Offerta attuale</p>
            <p className="text-sm font-black" style={{ color: '#FF7300' }}>
              € {a.price.toLocaleString('it-IT')}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
            <Users className="h-2.5 w-2.5 text-gray-400" />
            <span className="text-[9px] font-bold text-gray-500">{a.bids}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────
   LIST ROW
   ───────────────────────────────────── */
function AuctionRow({ auction: a }: { auction: typeof MOCK_AUCTIONS[number] }) {
  return (
    <Link
      href={`/Test-Interno/aste/${a.id}`}
      id={`aste-row-${a.id}`}
      className="flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3 transition-transform active:scale-[0.98]"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <Image src={a.img} alt={a.title} fill className="object-cover" sizes="56px" unoptimized />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[11px] font-bold text-gray-800">{a.title}</p>
        <p className="text-[9px] text-gray-400">{a.seller} · {a.game}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
            <Clock className="h-2.5 w-2.5" style={{ color: a.urgent ? '#FB923C' : 'inherit' }} />
            {a.endsIn}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
            <Users className="h-2.5 w-2.5" /> {a.bids} offerte
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-black" style={{ color: '#FF7300' }}>€ {a.price.toLocaleString('it-IT')}</p>
        {a.badge && (
          <span
            className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white"
            style={{ background: a.urgent ? '#FB923C' : '#A78BFA' }}
          >
            {a.badge}
          </span>
        )}
      </div>
    </Link>
  );
}
