'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScambiVisibility } from '@/lib/hooks/use-scambi-visibility';
import { useAuthStore } from '@/lib/stores/auth-store';
import { navigateToTournamentsPortal } from '@/lib/tournaments/navigate-to-portal';

export function ScambiGuard({ children }: { children: React.ReactNode }) {
  const scambiVisible = useScambiVisibility();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/scambi');
    } else if (!scambiVisible) {
      navigateToTournamentsPortal('/');
    }
  }, [scambiVisible, isAuthenticated, router]);

  if (!isAuthenticated || !scambiVisible) {
    return null;
  }

  return <>{children}</>;
}
