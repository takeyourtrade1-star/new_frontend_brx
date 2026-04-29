'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export function DemoBanner() {
  const { selectedLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lang = mounted ? selectedLang : 'en';
  const isIT = lang === 'it';

  return (
    <div className="w-full bg-orange-500">
      <div className="container-content container-header">
        <div className="flex items-center justify-between gap-1 py-1 sm:py-0.5">
          {/* LEFT — Demo badge */}
          <div className="flex flex-1 shrink-0 items-center justify-start">
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs whitespace-nowrap">
                {isIT ? 'SITO IN DEMO' : 'SITE IN DEMO'}
              </span>
            </div>
            
            <div className="flex items-center sm:hidden">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                DEMO
              </span>
            </div>
          </div>

          {/* CENTER — 3 links */}
          <div className="flex items-center justify-center gap-0.5 sm:gap-2">
            <span className="hidden text-[9px] font-medium uppercase tracking-wider text-white/70 lg:inline lg:text-[10px]">
              {isIT ? 'Solo su Ebartex:' : 'Only on Ebartex:'}
            </span>
            <Link
              href="/brx-express"
              className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-white transition-colors hover:bg-white/20 sm:px-2 sm:text-xs whitespace-nowrap"
            >
              BRX Express
            </Link>
            <span className="text-[9px] sm:text-[10px] text-white/40">|</span>
            <Link
              href="/aste"
              className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-white transition-colors hover:bg-white/20 sm:px-2 sm:text-xs whitespace-nowrap"
            >
              {isIT ? 'Aste' : 'Auctions'}
            </Link>
            <span className="text-[9px] sm:text-[10px] text-white/40">|</span>
            <Link
              href="/tornei-live"
              className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-white transition-colors hover:bg-white/20 sm:px-2 sm:text-xs whitespace-nowrap"
            >
              {isIT ? 'Tornei' : 'Tournaments'}
            </Link>
          </div>

          {/* RIGHT — spacer to visually balance the left badge on desktop */}
          <div className="flex flex-1 shrink-0 items-center justify-end" />
        </div>
      </div>
    </div>
  );
}
