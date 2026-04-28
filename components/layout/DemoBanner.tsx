'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export function DemoBanner() {
  const { selectedLang } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const lang = mounted ? selectedLang : 'en';
  const isIT = lang === 'it';
  const isLandingPage = pathname === '/';
  const isCompact = isMobileViewport && !isLandingPage;

  /* ─── Compact: non-landing mobile ─── */
  if (isCompact) {
    return (
      <div className="w-full bg-orange-500">
        <div className="container-content container-header">
          <div className="flex items-center justify-center py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                {isIT ? 'SITO IN DEMO' : 'SITE IN DEMO'}
              </span>
              <span className="text-[10px] font-medium text-white/90">
                {isIT ? 'BRX Express, Aste e Tornei in arrivo' : 'BRX Express, Auctions & Tournaments coming'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Full: landing page + desktop ─── */
  return (
    <div className="w-full bg-orange-500">
      <div className="container-content container-header">
        <div className="flex items-center justify-between gap-2 py-0.5">

          {/* LEFT — Demo badge */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
              {isIT ? 'SITO IN DEMO' : 'SITE IN DEMO'}
            </span>
          </div>

          {/* CENTER — 3 links, properly centered with flex (no absolute positioning) */}
          <div className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
            <span className="hidden text-[9px] font-medium uppercase tracking-wider text-white/70 sm:inline sm:text-[10px]">
              {isIT ? 'Solo su Ebartex:' : 'Only on Ebartex:'}
            </span>
            <Link
              href="/brx-express"
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-white/20 sm:px-2 sm:text-xs"
            >
              BRX Express
            </Link>
            <span className="text-[10px] text-white/40">|</span>
            <Link
              href="/aste"
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-white/20 sm:px-2 sm:text-xs"
            >
              {isIT ? 'Aste' : 'Auctions'}
            </Link>
            <span className="text-[10px] text-white/40">|</span>
            <Link
              href="/tornei-live"
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-white/20 sm:px-2 sm:text-xs"
            >
              {isIT ? 'Tornei' : 'Tournaments'}
            </Link>
          </div>

          {/* RIGHT — spacer to visually balance the left badge */}
          <div className="hidden w-[80px] shrink-0 sm:block" />
        </div>
      </div>
    </div>
  );
}
