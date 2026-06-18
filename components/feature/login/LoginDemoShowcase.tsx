'use client';

import { LoginDemoComingSoonGames } from '@/components/feature/login/LoginDemoComingSoonGames';
import { LoginDemoLogoCard } from '@/components/feature/login/LoginDemoLogoCard';
import { LoginDemoMagicCard } from '@/components/feature/login/LoginDemoMagicCard';
import { LandingHeroCarousel } from '@/components/home/LandingHeroCarousel';
import { cn } from '@/lib/utils';

interface LoginDemoShowcaseProps {
  className?: string;
}

/** Colonna sinistra auth: logo + Magic + carousel (solo informativi). */
export function LoginDemoShowcase({ className }: LoginDemoShowcaseProps) {
  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-3 overflow-x-hidden sm:gap-4', className)}>
      <LoginDemoLogoCard />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <LoginDemoMagicCard className="min-w-0" />
        <LoginDemoComingSoonGames className="min-w-0" />
      </div>
      <div className="pointer-events-none select-none">
        <LandingHeroCarousel informative />
      </div>
    </div>
  );
}