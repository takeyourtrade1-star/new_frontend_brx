'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, Settings, Package, Gavel, Heart, Star,
  ChevronRight, LogOut, Shield, Bell, CreditCard,
} from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';

const MENU_ITEMS = [
  { id: 'ordini',      icon: Package,    label: 'I Miei Ordini',       sub: '3 ordini attivi',    href: '/Test-Interno' },
  { id: 'aste',        icon: Gavel,      label: 'Le Mie Aste',         sub: '1 asta in corso',    href: '/Test-Interno/aste' },
  { id: 'preferiti',   icon: Heart,      label: 'Preferiti',           sub: '12 carte salvate',   href: '/Test-Interno' },
  { id: 'recensioni',  icon: Star,       label: 'Recensioni',          sub: '4.9 ★ media',        href: '/Test-Interno' },
  { id: 'pagamenti',   icon: CreditCard, label: 'Metodi di Pagamento', sub: null,                 href: '/Test-Interno' },
  { id: 'notifiche',   icon: Bell,       label: 'Notifiche',           sub: '3 non lette',        href: '/Test-Interno' },
  { id: 'sicurezza',   icon: Shield,     label: 'Sicurezza',           sub: null,                 href: '/Test-Interno' },
  { id: 'impostazioni',icon: Settings,   label: 'Impostazioni',        sub: null,                 href: '/Test-Interno' },
] as const;

const STATS = [
  { value: '47', label: 'Ordini' },
  { value: '4.9', label: 'Rating' },
  { value: '€ 2.4K', label: 'Venduto' },
];

export default function TestInternoProfiloPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="relative overflow-hidden px-4 pb-8 pt-10"
        style={{ background: 'linear-gradient(180deg, #1D3160 0%, #0F172A 100%)' }}
      >
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #FF7300, transparent 70%)', filter: 'blur(30px)' }}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Avatar */}
          <div
            className="mb-3 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,115,0,0.30), rgba(61,101,198,0.30))',
              border: '2px solid rgba(255,115,0,0.50)',
              boxShadow: '0 0 24px rgba(255,115,0,0.20)',
            }}
          >
            <User className="h-9 w-9" style={{ color: '#FF7300' }} strokeWidth={1.5} />
          </div>

          <h1 className="text-lg font-black text-white">Marco Rossi</h1>
          <p className="mb-1 text-xs text-white/40">@marco_collector · Milano, IT</p>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
            style={{ background: 'rgba(255,115,0,0.25)', border: '1px solid rgba(255,115,0,0.40)' }}
          >
            <Shield className="h-2.5 w-2.5" />
            Venditore Verificato
          </span>
        </div>

        {/* Stats */}
        <div
          className="relative z-10 mt-5 flex justify-around rounded-2xl px-2 py-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-lg font-black" style={{ color: '#FF7300' }}>{s.value}</span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-white/40">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4">
        <div
          className="mb-4 overflow-hidden rounded-2xl bg-white"
          style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
        >
          {MENU_ITEMS.map(({ id, icon: Icon, label, sub, href }, i) => (
            <React.Fragment key={id}>
              <Link
                href={href}
                id={`profilo-${id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,115,0,0.08)' }}
                >
                  <Icon className="h-4 w-4" style={{ color: '#FF7300' }} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-800">{label}</p>
                  {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
              {i < MENU_ITEMS.length - 1 && <div className="mx-4 h-px bg-gray-100" />}
            </React.Fragment>
          ))}
        </div>

        {/* Logout */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-transform active:scale-95"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444' }}
        >
          <LogOut className="h-4 w-4" />
          Esci dall&apos;account
        </button>
      </div>
    </div>
  );
}
