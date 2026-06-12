'use client';

import { useEffect } from 'react';
import { useScambiVisibility } from '@/lib/hooks/use-scambi-visibility';
import { navigateToTournamentsPortal } from '@/lib/tournaments/navigate-to-portal';

export function ScambiGuard({ children }: { children: React.ReactNode }) {
  const scambiVisible = useScambiVisibility();

  useEffect(() => {
    if (!scambiVisible) {
      navigateToTournamentsPortal('/');
    }
  }, [scambiVisible]);

  if (!scambiVisible) {
    return null;
  }

  return <>{children}</>;
}
