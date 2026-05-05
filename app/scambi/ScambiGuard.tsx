'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScambiVisibility } from '@/lib/hooks/use-scambi-visibility';

export function ScambiGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const scambiVisible = useScambiVisibility();

  useEffect(() => {
    if (!scambiVisible) {
      router.replace('/tornei-live');
    }
  }, [scambiVisible, router]);

  if (!scambiVisible) {
    return null;
  }

  return <>{children}</>;
}
