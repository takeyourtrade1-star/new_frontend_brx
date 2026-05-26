'use client';

import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

const TOURNAMENTS_PORTAL_URL = 'https://tournaments.ebartex.com';

/** Anelli “portale” attorno al trofeo. */
function TournamentsPortalIcon({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex h-[1.35rem] w-[1.35rem] items-center justify-center sm:h-6 sm:w-6', className)}>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
        <circle cx="12" cy="12" r="6.25" stroke="currentColor" strokeWidth="1.45" />
        <path
          d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      <Trophy
        className="relative h-[0.65rem] w-[0.65rem] text-[#FFE0B2] drop-shadow-[0_0_4px_rgba(255,179,71,0.8)] sm:h-3.5 sm:w-3.5"
        strokeWidth={2.25}
        aria-hidden
      />
    </span>
  );
}

export function TournamentsPortalButton({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <a
      href={TOURNAMENTS_PORTAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group relative flex shrink-0 items-center gap-2 rounded-xl border border-[#FF7300]/55',
        'bg-gradient-to-br from-[#FF7300]/30 via-white/[0.12] to-[#152a52]/50',
        'px-2 py-1.5 shadow-[0_4px_24px_rgba(255,115,0,0.22)] backdrop-blur-xl backdrop-saturate-150',
        'ring-1 ring-inset ring-white/15 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-[#FF8800] hover:shadow-[0_6px_32px_rgba(255,136,0,0.38)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]',
        'sm:px-2.5 sm:py-2',
        className
      )}
      aria-label={t('nav.tournamentsPortalAria')}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          'bg-gradient-to-br from-[#FF7300]/35 to-[#FF7300]/10',
          'ring-1 ring-[#FF7300]/70 shadow-inner transition-colors group-hover:from-[#FF8800]/45 group-hover:to-[#FF7300]/20',
          'sm:h-10 sm:w-10 sm:rounded-xl'
        )}
      >
        <TournamentsPortalIcon className="text-[#FF7300]" />
      </span>
      <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
        <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-white">
          {t('nav.tournamentsPortal')}
        </span>
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#FFB347]/90">
          BRX
        </span>
      </span>
    </a>
  );
}
