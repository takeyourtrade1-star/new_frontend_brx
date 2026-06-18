'use client';

import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { AUTH_SHOWCASE_GLASS_CLASS } from '@/components/feature/login/LoginDemoLogoCard';

interface LoginDemoMagicCardProps {
  className?: string;
}

/** Card Magic compatta (metà colonna) per la showcase auth. */
export function LoginDemoMagicCard({ className }: LoginDemoMagicCardProps) {
  const { t } = useTranslation();
  const magicLogo = getCdnImageUrl('loghi-giochi/magic.png');

  return (
    <div
      className={cn(
        AUTH_SHOWCASE_GLASS_CLASS,
        'relative flex min-h-[140px] flex-col items-center overflow-hidden p-3 text-center sm:min-h-[152px] sm:p-3.5',
        className
      )}
      aria-label={t('pages.login.demoLanding.magicTitle')}
    >
      <span className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest text-emerald-100 sm:text-[8px]">
        {t('pages.login.demoLanding.magicAvailable')}
      </span>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 px-1 pt-6">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold uppercase leading-tight tracking-tight text-white drop-shadow-lg sm:text-[15px]">
            {t('pages.login.demoLanding.magicTitle')}
          </h2>
          <p className="mt-1 text-[10px] leading-snug text-white/55 sm:text-[11px]">
            {t('pages.login.demoLanding.magicSubtitle')}
          </p>
        </div>

        <div className="relative h-12 w-full max-w-[7.5rem] shrink-0 sm:h-14 sm:max-w-[8.5rem]">
          <Image
            src={magicLogo}
            alt=""
            fill
            className="object-contain object-center drop-shadow-[0_0_16px_rgba(239,68,68,0.15)]"
            sizes="(max-width: 640px) 120px, 136px"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
