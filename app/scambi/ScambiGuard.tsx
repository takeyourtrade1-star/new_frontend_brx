'use client';

import { useEffect } from 'react';
import { useScambiVisibility } from '@/lib/hooks/use-scambi-visibility';
import { TOURNAMENTS_PORTAL_URL } from '@/lib/config/tournaments';

export function ScambiGuard({ children }: { children: React.ReactNode }) {
  const scambiVisible = useScambiVisibility();

  useEffect(() => {
    if (!scambiVisible) {
      window.location.replace(TOURNAMENTS_PORTAL_URL);
    }
  }, [scambiVisible]);

  if (!scambiVisible) {
    return null;
  }

  return <>{children}</>;
}
