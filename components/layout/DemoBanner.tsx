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
    const updateViewport = () => {
      setIsMobileViewport(media.matches);
    };

    updateViewport();

    media.addEventListener('change', updateViewport);

    return () => {
      media.removeEventListener('change', updateViewport);
    };
  }, []);

  const lang = mounted ? selectedLang : 'en';

  const t = {
    demo: lang === 'it' ? 'SITO IN DEMO' : 'SITE IN DEMO',
    demoShort: lang === 'it' ? 'SITO IN DEMO' : 'SITE IN DEMO',
    onlyOn: lang === 'it' ? 'Solo su Ebartex:' : 'Only on Ebartex:',
    mobileExclusive:
      lang === 'it'
        ? 'BRX EXPRESS ed ASTE presto in arrivo, solo su Ebartex'
        : 'BRX EXPRESS AND AUCTIONS COMING SOON EXCLUSIVELY ON EBARTEX',
    mobileTeaser: lang === 'it' ? 'BRX Express e aste presto in arrivo' : 'BRX Express and auctions coming soon',
    comingSoon: lang === 'it' ? 'Presto: BRX Express ed Aste' : 'Coming Soon: BRX Express & Auctions',
  };

  const isLandingPage = pathname === '/';
  const isSlimMobileBanner = isMobileViewport && !isLandingPage;
  const isCompact = isSlimMobileBanner;

  return (
    <div className="w-full bg-orange-500">
      <div className="container-content container-header">
        {isCompact ? (
          <div className="flex items-center justify-center py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                {t.demoShort}
              </span>
              <span className="text-[10px] font-medium text-white/90">
                {lang === 'it' ? 'BRX Express, Aste e Tornei in arrivo' : 'BRX Express, Auctions & Tournaments coming'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between py-0.5">
            {/* Demo badge - LEFT */}
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white">{t.demo}</span>
            </div>

            {/* 3 buttons - CENTER */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3">
              <span className="text-[9px] sm:text-[10px] font-medium text-white/70 uppercase tracking-wider">{t.onlyOn}</span>
              <Link href="/brx-express" className="rounded px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-white hover:bg-white/20 transition-colors">
                BRX Express
              </Link>
              <span className="text-white/40">|</span>
              <Link href="/aste" className="rounded px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-white hover:bg-white/20 transition-colors">
                {lang === 'it' ? 'Aste' : 'Auctions'}
              </Link>
              <span className="text-white/40">|</span>
              <Link href="/tcg-express" className="rounded px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-white hover:bg-white/20 transition-colors">
                {lang === 'it' ? 'Tornei' : 'Tournaments'}
              </Link>
            </div>

            {/* Empty space for balance */}
            <div className="w-[80px] sm:w-[100px]" />
          </div>
        )}
      </div>
    </div>
  );
}
