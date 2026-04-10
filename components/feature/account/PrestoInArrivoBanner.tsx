'use client';

import { Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useState, useEffect } from 'react';

const HEADER_OFFSET = 80;

interface PrestoInArrivoBannerProps {
  className?: string;
}

export function PrestoInArrivoBanner({ className }: PrestoInArrivoBannerProps) {
  const { t } = useTranslation();
  const [isStuck, setIsStuck] = useState(false);
  const [stickyTop, setStickyTop] = useState(HEADER_OFFSET);

  // Misura l'altezza effettiva dell'header per calcolare l'offset corretto
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const measure = () => {
      const height = header.getBoundingClientRect().height;
      setStickyTop(height);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(header);
    window.addEventListener('resize', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="sticky z-40 mx-auto flex justify-center bg-[#F5F4F0]"
      style={{ top: stickyTop }}
    >
      <div
        className={[
          'presto-banner-blink pointer-events-none mx-auto flex max-w-fit items-center gap-3 rounded-full border transition-all duration-300',
          isStuck
            ? 'px-4 py-2 shadow-[0_8px_32px_rgba(255,115,0,0.5)]'
            : 'px-6 py-3 shadow-lg mt-4 mb-4',
          className || '',
        ].join(' ')}
        style={{
          backgroundColor: isStuck ? '#FF7300' : '#FF7300',
          borderColor: isStuck ? '#fff' : '#878787',
          backdropFilter: isStuck ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: isStuck ? 'blur(8px)' : 'none',
          background: isStuck ? 'rgba(255, 115, 0, 0.95)' : '#FF7300',
        }}
      >
        <Clock
          className={[
            'text-white transition-all duration-300',
            isStuck ? 'h-4 w-4' : 'h-5 w-5',
          ].join(' ')}
          strokeWidth={2}
        />
        <span
          className={[
            'font-bold uppercase tracking-wide text-white transition-all duration-300',
            isStuck ? 'text-xs' : 'text-sm',
          ].join(' ')}
        >
          {t('account.comingSoon')}
        </span>
      </div>
    </div>
  );
}
