'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

/** Stile glass scuro condiviso con le card showcase auth. */
export const AUTH_SHOWCASE_GLASS_CLASS =
  'rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md';

interface LoginDemoLogoCardProps {
  className?: string;
}

/** Sfondo header logo: piena larghezza colonna sinistra, sfuma verso il basso (no blur — fuoriesce dal clip). */
export const AUTH_SHOWCASE_LOGO_BG_CLASS =
  'pointer-events-none absolute inset-x-0 top-0 h-[9.5rem] bg-gradient-to-b from-[#0F172A]/72 via-[#0F172A]/38 to-transparent sm:h-[10.5rem] lg:h-[11.5rem]';

/** Logo Ebartex nella colonna sinistra con sfondo esteso ai bordi. */
export function LoginDemoLogoCard({ className }: LoginDemoLogoCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'relative -mx-6 mb-1 overflow-hidden sm:-mx-10 lg:-mx-10 xl:-mx-14',
        className
      )}
    >
      <div className={AUTH_SHOWCASE_LOGO_BG_CLASS} aria-hidden />
      <div className="relative z-10 flex justify-center px-6 pb-2 pt-4 sm:px-8 sm:pb-3 sm:pt-5 lg:pt-6">
        <Link
          href="/"
          aria-label={t('pages.auth.homeAria')}
          className="block transition-opacity hover:opacity-90"
        >
          <Image
            src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
            alt="Ebartex"
            width={700}
            height={263}
            className="h-[3.75rem] w-auto max-w-full object-contain sm:h-[4.25rem] md:h-20 lg:h-[5.25rem]"
            sizes="(max-width: 640px) 220px, (max-width: 1024px) 320px, 420px"
            priority
            unoptimized
          />
        </Link>
      </div>
    </div>
  );
}
