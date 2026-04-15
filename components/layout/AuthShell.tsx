'use client';

import Link from 'next/link';
import Image from 'next/image';
import { type ReactNode } from 'react';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';

export { AUTH_GLASS_CLASS, AUTH_GLASS_LIGHT, AUTH_GLASS_DARK } from './auth-glass';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const { t } = useTranslation();
  const carouselBg = getCdnImageUrl('carousel/slide1.jpg');
  const logoUrl = getCdnImageUrl('logo.png');

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${carouselBg}")` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#2d2d2d]/40" aria-hidden />

      <div className="relative z-10 flex min-h-screen flex-col pt-8">
        <div className="flex justify-center px-4">
          <Link
            href="/"
            className="relative block h-[80px] w-[200px] sm:h-[100px] sm:w-[260px]"
            aria-label={t('pages.auth.homeAria')}
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
        <div className="mx-auto mt-8 w-full max-w-xl flex-1 px-4 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}
