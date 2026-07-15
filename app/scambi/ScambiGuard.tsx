'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useScambiVisibility } from '@/lib/hooks/use-scambi-visibility';
import { useAuthStore } from '@/lib/stores/auth-store';
import { navigateToTournamentsPortal } from '@/lib/tournaments/navigate-to-portal';

export function ScambiGuard({ children }: { children: React.ReactNode }) {
  const scambiVisible = useScambiVisibility();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/scambi')}`);
    } else if (!scambiVisible) {
      navigateToTournamentsPortal('/');
    }
  }, [scambiVisible, isAuthenticated, pathname, router]);

  if (!isAuthenticated || !scambiVisible) {
    return null;
  }

  return <>{children}</>;
}
