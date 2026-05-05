'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Bell, ChevronRight, TrendingUp, Flame,
  Star, Clock, ArrowRight, Sparkles, Package
} from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';

/* ─────────────────────────────────────
   MOCK DATA
   ───────────────────────────────────── */
const CAROUSEL_GAMES = [
  { id: 'magic',   label: 'Magic: The Gathering', color: '#DC2626', src: getCdnImageUrl('loghi-giochi/magic.png'),     href: '/Test-Interno/home' },
  { id: 'pokemon', label: 'Pokémon TCG',           color: '#FBBF24', src: getCdnImageUrl('loghi-giochi/pokèmon.png'),  href: '/Test-Interno/home', comingSoon: true },
  { id: 'op',      label: 'One Piece',             color: '#EF4444', src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'), href: '/Test-Interno/home', comingSoon: true },
];

const FEATURED_PRODUCTS = [
  { id: '1', name: 'Black Lotus Alpha', game: 'MTG', price: '€ 8.400', badge: 'Leggendario', img: getCdnImageUrl('carousel/slide1.jpg'), rating: 5 },
  { id: '2', name: 'Charizard Base Set', game: 'Pokémon', price: '€ 1.200', badge: 'Raro', img: getCdnImageUrl('carousel/slide2.jpg'), rating: 5 },
  { id: '3', name: 'Dark Magician 1st Ed', game: 'YGO', price: '€ 670', badge: 'Hot', img: getCdnImageUrl('carousel/slide3.jpg'), rating: 4 },
];

const CATEGORIES = [
  { id: 'singles',    label: 'Singles',    img: '/emporio-collezionista/singles.png',       color: '#FF7300' },
  { id: 'boosters',   label: 'Boosters',   img: '/emporio-collezionista/boosters.png',      color: '#A78BFA' },
  { id: 'boxes',      label: 'Box',        img: '/emporio-collezionista/booster-boxes.png', color: '#38BDF8' },
  { id: 'accessori',  label: 'Accessori',  img: '/emporio-collezionista/accessori.png',     color: '#FBBF24' },
  { id: 'sigillati',  label: 'Sigillati',  img: '/emporio-collezionista/prodotti-sigillati.png', color: '#FB7185' },
  { id: 'set-lotti',  label: 'Lotti',      img: '/emporio-collezionista/set-lotti-collezioni.png', color: '#34D399' },
];

const TRENDING = [
  { id: 'a', name: 'Moxen Black Lotus', price: '€ 12.500', delta: '+8.2%', img: getCdnImageUrl('carousel/slide1.jpg') },
  { id: 'b', name: 'Pikachu Illustrator', price: '€ 5.800', delta: '+3.1%', img: getCdnImageUrl('carousel/slide2.jpg') },
  { id: 'c', name: 'Blue-Eyes White Dragon', price: '€ 2.100', delta: '+1.4%', img: getCdnImageUrl('carousel/slide3.jpg') },
];

/* ─────────────────────────────────────
   PAGE
   ───────────────────────────────────── */
export default function TestInternoHomePage() {
  const [activeGame, setActiveGame] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div
      className="min-h-screen w-full text-white"
      style={{ background: 'linear-gradient(180deg, #1D3160 0%, #0F172A 60%)' }}
    >
      {/* ── TOP BAR ── */}
      <header className="flex items-center gap-3 px-4 pb-3 pt-10">
        <div className="flex-1">
          <p className="text-xs font-medium text-white/40">Benvenuto su</p>
          <Image
            src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
            alt="Ebartex"
            width={120}
            height={45}
            className="h-7 w-auto object-contain"
            unoptimized
            priority
          />
        </div>
        <button
          type="button"
          aria-label="Notifiche"
          className="relative flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <Bell className="h-4 w-4 text-white/70" strokeWidth={1.8} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FF7300]" />
        </button>
      </header>

      {/* ── SEARCH BAR ── */}
      <div className="px-4 mb-5">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200"
          style={{
            background: searchFocused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${searchFocused ? 'rgba(255,115,0,0.40)' : 'rgba(255,255,255,0.10)'}`,
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-white/40" strokeWidth={1.8} />
          <input
            id="home-search-input"
            type="search"
            placeholder="Cerca carte, set, edizioni..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Cerca nel marketplace"
          />
        </div>
      </div>

      {/* ── GAME SELECTOR ── */}
      <section className="px-4 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CAROUSEL_GAMES.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGame(i)}
              className="relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 transition-all active:scale-95"
              style={{
                background: activeGame === i ? `${g.color}22` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeGame === i ? `${g.color}55` : 'rgba(255,255,255,0.08)'}`,
              }}
              aria-pressed={activeGame === i}
            >
              {g.comingSoon && (
                <span
                  className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white"
                  style={{ background: '#FF7300' }}
                >
                  Presto
                </span>
              )}
              <img src={g.src} alt={g.label} className="h-5 w-auto object-contain" />
              <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">{g.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── HERO CAROUSEL (3 slides mock) ── */}
      <section className="px-4 mb-6">
        <div
          className="relative h-40 w-full overflow-hidden rounded-3xl"
          style={{
            background: `linear-gradient(135deg, ${CAROUSEL_GAMES[activeGame].color}30 0%, rgba(15,23,42,0.9) 100%)`,
            border: `1px solid ${CAROUSEL_GAMES[activeGame].color}30`,
          }}
        >
          {/* Decorative background */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-20"
            style={{ background: `radial-gradient(circle, ${CAROUSEL_GAMES[activeGame].color}, transparent 70%)`, filter: 'blur(20px)' }}
            aria-hidden
          />

          <div className="relative z-10 flex h-full items-center justify-between p-5">
            <div>
              <span
                className="mb-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: `${CAROUSEL_GAMES[activeGame].color}30`, color: CAROUSEL_GAMES[activeGame].color }}
              >
                {CAROUSEL_GAMES[activeGame].comingSoon ? 'Disponibile presto' : 'Disponibile ora'}
              </span>
              <h2 className="text-lg font-black leading-tight text-white">
                {CAROUSEL_GAMES[activeGame].label}
              </h2>
              <p className="mt-0.5 text-xs text-white/50">Compra, vendi, collez.</p>
            </div>
            <img
              src={CAROUSEL_GAMES[activeGame].src}
              alt=""
              className="h-20 w-28 object-contain drop-shadow-lg"
              aria-hidden
            />
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {CAROUSEL_GAMES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveGame(i)}
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: activeGame === i ? '20px' : '6px',
                  background: activeGame === i ? '#FF7300' : 'rgba(255,255,255,0.30)',
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES PILLS ── */}
      <section className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { icon: '💰', label: 'Prezzi migliori' },
            { icon: '🚚', label: 'Spedizione 24h' },
            { icon: '🛡️', label: 'Protezione acquirente' },
            { icon: '👥', label: 'Community attiva' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(255,115,0,0.12)', border: '1px solid rgba(255,115,0,0.20)' }}
            >
              <span className="text-xs">{f.icon}</span>
              <span className="whitespace-nowrap text-[10px] font-semibold text-white/70">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── IN EVIDENZA ── */}
      <section className="px-4 mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4" style={{ color: '#FF7300' }} />
            <h2 className="text-sm font-bold text-white">In Evidenza</h2>
          </div>
          <Link href="/Test-Interno" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#FF7300' }}>
            Vedi tutto <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {FEATURED_PRODUCTS.map((p) => (
            <Link
              key={p.id}
              href="/Test-Interno"
              id={`home-product-${p.id}`}
              className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl transition-transform active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="relative h-32 w-full overflow-hidden">
                <Image
                  src={p.img}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-300 group-active:scale-105"
                  sizes="160px"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
                  style={{ background: p.badge === 'Leggendario' ? '#FF7300' : p.badge === 'Hot' ? '#EF4444' : 'rgba(167,139,250,0.7)' }}
                >
                  {p.badge}
                </span>
              </div>
              <div className="p-2.5">
                <p className="mb-0.5 line-clamp-1 text-[11px] font-bold text-white">{p.name}</p>
                <p className="mb-1.5 text-[9px] text-white/40">{p.game}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black" style={{ color: '#FF7300' }}>{p.price}</span>
                  <div className="flex">
                    {Array.from({ length: p.rating }).map((_, i) => (
                      <Star key={i} className="h-2.5 w-2.5 fill-[#FBBF24] text-[#FBBF24]" />
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CATEGORIE ── */}
      <section className="px-4 mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-white/50" />
          <h2 className="text-sm font-bold text-white">Categorie</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href="/Test-Interno"
              id={`home-cat-${c.id}`}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-transform active:scale-95"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="relative h-10 w-10">
                <Image src={c.img} alt={c.label} fill className="object-contain" sizes="40px" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/50">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section className="px-4 mb-8">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: '#34D399' }} />
          <h2 className="text-sm font-bold text-white">Trending Prezzi</h2>
        </div>
        <div className="flex flex-col gap-2">
          {TRENDING.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-[11px] font-bold text-white/20">#{i + 1}</span>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                <Image src={t.img} alt={t.name} fill className="object-cover" sizes="40px" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[11px] font-bold text-white">{t.name}</p>
                <p className="text-xs font-black" style={{ color: '#FF7300' }}>{t.price}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}
              >
                {t.delta}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
