'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, Gavel, Zap, Trophy, ChevronRight,
  TrendingUp, Shield, Star, Bell,
} from 'lucide-react';
import { getCdnImageUrl, getCdnVideoUrl } from '@/lib/config';

/* ─────────────────────────────────────
   FEATURE CARDS DATA
   ───────────────────────────────────── */
const FEATURES = [
  {
    id: 'aste',
    icon: Gavel,
    label: 'Aste Live',
    desc: 'Metti all\'asta o fai offerte in tempo reale',
    color: '#FB923C',
    href: '/Test-Interno/aste',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(41,20,66,0.5) 100%)',
  },
  {
    id: 'brx',
    icon: Zap,
    label: 'BRX Express',
    desc: 'Spedizione in 24h garantita',
    color: '#38BDF8',
    href: '/Test-Interno',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(41,20,66,0.5) 100%)',
  },
  {
    id: 'tornei',
    icon: Trophy,
    label: 'Tornei Live',
    desc: 'Competi e scala le classifiche',
    color: '#A78BFA',
    href: '/Test-Interno',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(41,20,66,0.5) 100%)',
  },
];

const GAMES = [
  { label: 'Magic', src: getCdnImageUrl('loghi-giochi/magic.png'), color: '#DC2626' },
  { label: 'Pokémon', src: getCdnImageUrl('loghi-giochi/pokèmon.png'), color: '#FBBF24', comingSoon: true },
  { label: 'One Piece', src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'), color: '#EF4444', comingSoon: true },
];

const BOUTIQUE = [
  { label: 'Singles', img: '/emporio-collezionista/singles.png', color: '#FF7300' },
  { label: 'Boosters', img: '/emporio-collezionista/boosters.png', color: '#A78BFA' },
  { label: 'Box', img: '/emporio-collezionista/booster-boxes.png', color: '#38BDF8' },
  { label: 'Accessori', img: '/emporio-collezionista/accessori.png', color: '#FBBF24' },
];

/* ─────────────────────────────────────
   LANDING PAGE
   ───────────────────────────────────── */
export default function TestInternoLandingPage() {
  const [activeGame, setActiveGame] = useState(0);

  return (
    <div
      className="min-h-screen w-full text-white"
      style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1D3160 40%, #0F172A 100%)' }}
    >
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pb-6 pt-10">
        {/* BG glow */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #3D65C6 0%, transparent 70%)', filter: 'blur(40px)' }}
          aria-hidden
        />

        {/* Logo */}
        <div className="relative z-10 mb-6 flex items-center justify-between">
          <Image
            src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
            alt="Ebartex"
            width={160}
            height={60}
            className="h-9 w-auto object-contain"
            unoptimized
            priority
          />
          <button
            type="button"
            aria-label="Notifiche"
            className="relative flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Bell className="h-4 w-4 text-white/70" strokeWidth={1.8} />
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FF7300]"
              aria-label="Nuove notifiche"
            />
          </button>
        </div>

        {/* Headline */}
        <div className="relative z-10 mb-8">
          <h1 className="mb-2 text-[28px] font-black leading-tight tracking-tight">
            Colleziona,{' '}
            <span style={{ color: '#FF7300' }}>competi</span>
            <br />e vinci.
          </h1>
          <p className="text-sm leading-relaxed text-white/60">
            Il marketplace di carte collezionabili più avanzato d&apos;Italia.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 flex gap-3">
          <Link
            href="/Test-Interno/aste"
            id="landing-cta-aste"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FF7300 0%, #e66700 100%)',
              boxShadow: '0 4px 20px rgba(255,115,0,0.35)',
            }}
          >
            <Gavel className="h-4 w-4" />
            Esplora Aste
          </Link>
          <Link
            href="/Test-Interno/home"
            id="landing-cta-home"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-transform active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            Scopri di più
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="mx-4 mb-6 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-around">
          {[
            { value: '12.4K', label: 'Utenti' },
            { value: '340+', label: 'Aste live' },
            { value: '99.2%', label: 'Soddisfatti' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-lg font-black" style={{ color: '#FF7300' }}>{stat.value}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE CARDS ── */}
      <section className="px-4 mb-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">Le Nostre Funzioni</h2>
        <div className="flex flex-col gap-3">
          {FEATURES.map(({ id, icon: Icon, label, desc, color, href, gradient }) => (
            <Link
              key={id}
              href={href}
              id={`landing-feature-${id}`}
              className="flex items-center gap-4 rounded-2xl p-4 transition-transform active:scale-[0.98]"
              style={{ background: gradient, border: `1px solid ${color}28` }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${color}22`, border: `1px solid ${color}44` }}
              >
                <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs text-white/50">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── GAMES SELECTOR ── */}
      <section className="px-4 mb-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">Giochi Supportati</h2>
        <div className="flex gap-2 mb-3">
          {GAMES.map((g, i) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setActiveGame(i)}
              className="relative flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 transition-all active:scale-95"
              style={{
                background: activeGame === i ? `${g.color}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeGame === i ? `${g.color}50` : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {g.comingSoon && (
                <span
                  className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
                  style={{ background: '#FF7300' }}
                >
                  Presto
                </span>
              )}
              <img src={g.src} alt={g.label} className="h-7 w-auto object-contain" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/60">{g.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── BOUTIQUE ── */}
      <section className="px-4 mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Boutique</h2>
          <Link href="/Test-Interno" className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#FF7300' }}>
            Vedi tutto
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BOUTIQUE.map((b) => (
            <Link
              key={b.label}
              href="/Test-Interno"
              id={`landing-boutique-${b.label.toLowerCase()}`}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-transform active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="relative h-10 w-10">
                <Image src={b.img} alt={b.label} fill className="object-contain p-0.5" sizes="40px" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/50">{b.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="mx-4 mb-8 rounded-2xl p-4" style={{ background: 'rgba(255,115,0,0.06)', border: '1px solid rgba(255,115,0,0.15)' }}>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 shrink-0" style={{ color: '#FF7300' }} strokeWidth={1.5} />
          <div>
            <p className="text-sm font-bold text-white">Transazioni 100% Sicure</p>
            <p className="text-xs text-white/50">Protezione acquirente garantita su ogni ordine</p>
          </div>
        </div>
      </section>
    </div>
  );
}
