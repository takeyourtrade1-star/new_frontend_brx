'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

import { TOURNAMENTS_PORTAL_URL } from '@/lib/config/tournaments';

export { TOURNAMENTS_PORTAL_URL };

const PORTAL_BTN_SHARED = cn(
  'btn-tournaments-portal flex items-center justify-center gap-2 font-bold uppercase tracking-wide',
  'focus-visible:outline-none'
);

type TournamentsPortalLinkProps = {
  variant: 'header' | 'drawer';
  className?: string;
  onNavigate?: () => void;
};

export function TournamentsPortalLink({
  variant,
  className,
  onNavigate,
}: TournamentsPortalLinkProps) {
  const { t } = useTranslation();

  if (variant === 'drawer') {
    return (
      <div className={cn('border-b border-orange-100 px-5 py-4 xl:hidden', className)}>
        <Link
          href="/tornei"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className={cn(
            PORTAL_BTN_SHARED,
            'h-10 w-full rounded-sm text-sm text-[#1D3160]',
            'focus-visible:ring-2 focus-visible:ring-[#FF7300]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
          )}
          aria-label={t('nav.tournamentsPortalAria')}
        >
          <LogIn
            className="h-[1.125rem] w-[1.125rem] shrink-0 text-[#FF7300]"
            strokeWidth={2.25}
            aria-hidden
          />
          <span>{t('nav.tournamentsPortal')}</span>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/tornei"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        PORTAL_BTN_SHARED,
        'hidden h-9 shrink-0 rounded-full px-4 text-xs text-white xl:inline-flex',
        'focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]',
        className
      )}
      aria-label={t('nav.tournamentsPortalAria')}
    >
      <LogIn className="h-[1.125rem] w-[1.125rem] shrink-0 text-white" strokeWidth={2.25} aria-hidden />
      <span className="whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,115,0,0.35)]">
        {t('nav.tournamentsPortal')}
      </span>
    </Link>
  );
}

/** @deprecated Usa TournamentsPortalLink */
export const TournamentsPortalButton = TournamentsPortalLink;
