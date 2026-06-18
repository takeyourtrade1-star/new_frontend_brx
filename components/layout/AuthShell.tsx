'use client';

import Link from 'next/link';
import Image from 'next/image';
import { type ReactNode } from 'react';
import { getCdnImageUrl } from '@/lib/config';
import { LandingBackgroundVideo } from '@/components/feature/LandingBackgroundVideo';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

export { AUTH_GLASS_CLASS, AUTH_GLASS_LIGHT, AUTH_GLASS_DARK } from './auth-glass';

interface AuthShellProps {
  children: ReactNode;
  /** Larghezza area contenuto (es. landing login più ampia). */
  contentClassName?: string;
  /** Riduce spazio sopra il logo (landing login). */
  compact?: boolean;
  /** Hero a due metà a tutta larghezza (login demo). */
  splitHero?: boolean;
}

function AuthLogo({
  compact,
  homeAria,
  logoUrl,
  className,
  variant = 'default',
}: {
  compact: boolean;
  homeAria: string;
  logoUrl: string;
  className?: string;
  variant?: 'default' | 'landing';
}) {
  if (variant === 'landing') {
    return (
      <div className={cn('flex shrink-0 justify-center px-4', className)}>
        <Link href="/" aria-label={homeAria} className="block transition-opacity hover:opacity-90">
          <Image
            src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
            alt="Ebartex"
            width={700}
            height={263}
            className="h-14 w-auto object-contain sm:h-[4.5rem] md:h-20 lg:h-24"
            sizes="(max-width: 640px) 140px, (max-width: 1024px) 200px, 280px"
            priority
            unoptimized
          />
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('flex shrink-0 justify-center px-4', className)}>
      <Link
        href="/"
        className={cn(
          'relative block object-contain',
          compact ? 'h-[68px] w-[170px] sm:h-[84px] sm:w-[220px]' : 'h-[80px] w-[200px] sm:h-[100px] sm:w-[260px]'
        )}
        aria-label={homeAria}
      >
        <Image
          src={logoUrl}
          alt="Ebartex"
          fill
          className="object-contain object-center"
          priority
          sizes="(max-width: 640px) 200px, 260px"
          unoptimized
        />
      </Link>
    </div>
  );
}

export function AuthShell({
  children,
  contentClassName,
  compact = false,
  splitHero = false,
}: AuthShellProps) {
  const { t } = useTranslation();
  const carouselBg = getCdnImageUrl('carousel/slide1.jpg');
  const logoUrl = getCdnImageUrl('logo.png');
  const homeAria = t('pages.auth.homeAria');

  if (splitHero) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
        <LandingBackgroundVideo splitLeft />

        {/* Metà destra — tutta l'altezza */}
        <div
          className="absolute inset-y-0 right-0 z-[1] hidden w-1/2 bg-white/90 lg:block"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-screen flex-col">
          <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${carouselBg}")` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-global-bg-start/25 via-[#2d2d2d]/40 to-global-bg-end/50 backdrop-blur-sm" aria-hidden />

      <div className={cn('relative z-10 flex min-h-screen flex-col', compact ? 'pt-4' : 'pt-8')}>
        <AuthLogo compact={compact} homeAria={homeAria} logoUrl={logoUrl} />
        <div
          className={cn(
            'mx-auto mt-6 w-full flex-1 px-4 pb-8 sm:mt-8 sm:pb-10',
            contentClassName ?? 'max-w-xl'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
