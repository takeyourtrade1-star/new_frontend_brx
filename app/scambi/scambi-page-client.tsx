'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScambiVisibility } from '@/lib/hooks/use-scambi-visibility';
import { ScambiHubPage } from '@/components/feature/scambi/ScambiHubPage';

export function ScambiPageClient() {
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

  return <ScambiHubPage />;
}
