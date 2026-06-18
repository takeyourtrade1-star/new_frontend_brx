'use client';

import Image from 'next/image';
import { AUTH_SHOWCASE_GLASS_CLASS } from '@/components/feature/login/LoginDemoLogoCard';
import { COMING_SOON_GAMES } from '@/lib/landing/coming-soon-games';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

interface LoginDemoComingSoonGamesProps {
  className?: string;
}

/** Mini card giochi in arrivo (solo informative) accanto alla card Magic. */
export function LoginDemoComingSoonGames({ className }: LoginDemoComingSoonGamesProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        AUTH_SHOWCASE_GLASS_CLASS,
        'flex min-h-[140px] flex-col overflow-hidden p-3 sm:min-h-[152px] sm:p-3.5',
        className
      )}
      aria-label={t('pages.login.demoLanding.comingSoonTitle')}
    >
      <p className="mb-2 text-[10px] font-semibold leading-snug text-white/80 sm:text-[11px]">
        {t('pages.login.demoLanding.comingSoonTitle')}
      </p>

      <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-1.5 sm:gap-2">
        {COMING_SOON_GAMES.map((game) => (
          <div
            key={game.alt}
            className="flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-lg border border-white/15 bg-white/10 px-0.5 py-1"
            aria-hidden
          >
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <Image
                src={game.src}
                alt=""
                width={64}
                height={64}
                className="max-h-[52%] max-w-[58%] object-contain"
                sizes="48px"
                unoptimized
              />
            </div>
            <span className="shrink-0 text-center text-[7px] font-medium leading-tight text-white/80 sm:text-[8px]">
              {game.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
