'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function DemoBanner() {
  const { selectedLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isCompactOnScroll, setIsCompactOnScroll] = useState(false);
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
      if (!media.matches) setIsCompactOnScroll(false);
    };

    const handleScroll = () => {
      if (!media.matches) return;
      setIsCompactOnScroll(window.scrollY > 24);
    };

    updateViewport();
    handleScroll();

    media.addEventListener('change', updateViewport);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      media.removeEventListener('change', updateViewport);
      window.removeEventListener('scroll', handleScroll);
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
    launch: lang === 'it' ? 'Lancio tra' : 'Launch in',
    comingSoon: lang === 'it' ? 'Presto: Scambi ed Aste' : 'Coming Soon: Trades & Auctions',
    days: lang === 'it' ? 'giorni' : 'days',
    hours: lang === 'it' ? 'ore' : 'hours',
    minutes: lang === 'it' ? 'min' : 'min',
    seconds: lang === 'it' ? 'sec' : 'sec',
  };

  const isCompact = isMobileViewport && isCompactOnScroll;

  const TimeBlock = ({ value, label, keyName }: { value: number; label: string; keyName: keyof CountdownTime }) => (
    <div className="flex flex-col items-center min-w-[1.75rem] sm:min-w-[2.25rem]">
      <span
        className={`text-sm sm:text-base font-extrabold text-white tracking-tight ${
          animatingKey === keyName ? 'animate-countdown-flip' : ''
        }`}
      >
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[9px] sm:text-[10px] font-medium text-white/70 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-r from-primary via-orange-500 to-primary relative overflow-hidden">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[caret-blink_3s_ease-in-out_infinite]" />

      <div className="container-content container-header relative z-10">
        <div
          className={`flex items-center justify-center transition-all duration-300 ${
            isCompact ? 'gap-0 py-1' : 'flex-col gap-2 py-0.5 sm:flex-row sm:gap-4 sm:py-1'
          }`}
        >
          {/* Demo badge */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
                {t.demo}
              </span>
            </div>
          </div>

          {!isCompact && (
            <>
              {/* Arrow separator - hidden on mobile */}
              <div className="hidden sm:block text-white/50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[10px] sm:text-xs font-semibold text-white/90">
                  {t.launch}
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <TimeBlock value={timeLeft.days} label={t.days} keyName="days" />
                  <span className="text-white/50 font-bold text-xs">:</span>
                  <TimeBlock value={timeLeft.hours} label={t.hours} keyName="hours" />
                  <span className="text-white/50 font-bold text-xs">:</span>
                  <TimeBlock value={timeLeft.minutes} label={t.minutes} keyName="minutes" />
                </div>
              </div>

              {/* Coming soon features */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold text-white/80">
                  {lang === 'it' ? 'Presto in arrivo, solo su Ebartex:' : 'Coming soon, only on Ebartex:'}
                </span>
                <div className="flex items-center gap-2">
                  {/* Scambi badge */}
                  <Link href="/scambi" className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/40 to-pink-500/40 backdrop-blur-sm rounded-lg border-2 border-purple-400/50 hover:border-purple-400 transition-all duration-300 hover:shadow-[0_0_16px_rgba(168,85,247,0.5)] cursor-pointer">
                    <span className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                      {lang === 'it' ? 'Scambi' : 'Trades'}
                    </span>
                  </Link>
                  {/* Aste badge */}
                  <Link href="/aste" className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500/40 to-red-500/40 backdrop-blur-sm rounded-lg border-2 border-orange-400/50 hover:border-orange-400 transition-all duration-300 hover:shadow-[0_0_16px_rgba(251,146,60,0.5)] cursor-pointer">
                    <span className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                      {lang === 'it' ? 'Aste' : 'Auctions'}
                    </span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
