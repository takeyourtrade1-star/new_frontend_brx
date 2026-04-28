'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function DemoBanner() {
  const { selectedLang } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [animatingKey, setAnimatingKey] = useState<keyof CountdownTime | null>(null);
  const prevTimeRef = useRef<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Target date: December 1st, 2026
  const targetDate = new Date('2026-12-01T00:00:00').getTime();

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

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const newTime = { days, hours, minutes, seconds };

        // Check which values changed and trigger animation
        const changedKey = Object.keys(newTime).find(
          (key) => newTime[key as keyof CountdownTime] !== prevTimeRef.current[key as keyof CountdownTime]
        ) as keyof CountdownTime | undefined;

        if (changedKey) {
          setAnimatingKey(changedKey);
          setTimeout(() => setAnimatingKey(null), 400); // Match animation duration
        }

        prevTimeRef.current = newTime;
        setTimeLeft(newTime);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const lang = mounted ? selectedLang : 'en';

  const t = {
    demo: lang === 'it' ? 'IL SITO È IN DEMO' : 'SITE IN DEMO',
    demoShort: lang === 'it' ? 'SITO IN DEMO' : 'SITE IN DEMO',
    launch: lang === 'it' ? 'Lancio tra' : 'Launch in',
    launchShort: lang === 'it' ? 'Lancio' : 'Launch',
    mobileExclusive:
      lang === 'it'
        ? 'TCG EXPRESS ed ASTE presto in arrivo, solo su Ebartex'
        : 'TCG EXPRESS AND AUCTIONS COMING SOON EXCLUSIVELY ON EBARTEX',
    mobileTeaser: lang === 'it' ? 'TCG Express e aste presto in arrivo' : 'TCG Express and auctions coming soon',
    comingSoon: lang === 'it' ? 'Presto: TCG Express ed Aste' : 'Coming Soon: TCG Express & Auctions',
    days: lang === 'it' ? 'giorni' : 'days',
    hours: lang === 'it' ? 'ore' : 'hours',
    minutes: lang === 'it' ? 'min' : 'min',
    seconds: lang === 'it' ? 'sec' : 'sec',
  };

  const isLandingPage = pathname === '/';
  const isSlimMobileBanner = isMobileViewport && !isLandingPage;
  const isCompact = isSlimMobileBanner;

  const TimeBlock = ({ value, label, keyName }: { value: number; label: string; keyName: keyof CountdownTime }) => (
    <div className="flex flex-col items-center min-w-[1.75rem] sm:min-w-[2.25rem]">
      <span
        className={`text-sm sm:text-base font-extrabold text-white tracking-tight ${
          animatingKey === keyName ? 'animate-countdown-flip' : ''
        }`}
      >
        <span className="tabular-nums leading-none">{value.toString().padStart(2, '0')}</span>
      </span>
      <span className="text-[9px] sm:text-[10px] font-medium text-white/70 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full bg-orange-500 relative overflow-hidden">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[caret-blink_3s_ease-in-out_infinite]" />

      <div className="container-content container-header relative z-10">
        {isCompact ? (
          <div className="relative flex items-center justify-start pr-1 pl-0.5 py-1">
            <div className="flex w-full min-w-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-orange-200 bg-white px-2.5 py-0.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_4px_12px_rgba(15,23,42,0.16)]">
              <span className="shrink-0 rounded-full border border-orange-400 bg-orange-500 px-1.5 py-[1px] text-[8px] font-black uppercase tracking-[0.09em] text-white shadow-[0_4px_12px_rgba(255,115,0,0.35)]">
                {t.demoShort}
              </span>
              <span className="min-w-0 truncate text-center text-[9px] font-semibold uppercase tracking-[0.055em] text-slate-800">
                {lang === 'it' ? (
                  <>
                    <span className="text-orange-500">TCG EXPRESS</span> ed <span className="text-orange-500">ASTE</span>{' '}
                    presto in arrivo, solo su Ebartex
                  </>
                ) : (
                  t.mobileExclusive
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-0.5 sm:flex-row sm:justify-center sm:gap-4 sm:py-1">
            {/* Demo badge */}
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" aria-hidden />
              <div className="flex items-center rounded-full border border-white/35 bg-white/18 px-2 py-0.5 backdrop-blur-sm">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.09em] text-white">{t.demo}</span>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-2.5 py-0.5 backdrop-blur-sm sm:gap-3 sm:px-3 sm:py-1">
              <span className="text-[10px] sm:text-xs font-semibold text-white/90">
                {t.launch}
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <TimeBlock value={timeLeft.days} label={t.days} keyName="days" />
                <span className="text-xs font-bold text-white/50">:</span>
                <TimeBlock value={timeLeft.hours} label={t.hours} keyName="hours" />
                <span className="text-xs font-bold text-white/50">:</span>
                <TimeBlock value={timeLeft.minutes} label={t.minutes} keyName="minutes" />
              </div>
            </div>

            {/* Desktop quick links */}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex items-center gap-2">
                <Link href="/tcg-express" className="flex items-center gap-1.5 rounded-md border border-cyan-300/45 bg-cyan-500/20 px-2.5 py-1 backdrop-blur-sm transition-all duration-300 hover:border-cyan-300/70 hover:bg-cyan-500/30 hover:shadow-[0_0_14px_rgba(34,211,238,0.35)] cursor-pointer">
                  <span className="text-xs font-extrabold tracking-wide text-white sm:text-sm">
                    TCG Express
                  </span>
                </Link>
                <Link href="/aste" className="flex items-center gap-1.5 rounded-md border border-amber-300/45 bg-amber-500/20 px-2.5 py-1 backdrop-blur-sm transition-all duration-300 hover:border-amber-300/70 hover:bg-amber-500/30 hover:shadow-[0_0_14px_rgba(251,191,36,0.35)] cursor-pointer">
                  <span className="text-xs font-extrabold tracking-wide text-white sm:text-sm">
                    {lang === 'it' ? 'Aste' : 'Auctions'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
