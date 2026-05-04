'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScambiVisibility } from '@/lib/hooks/use-scambi-visibility';
import { ScambiLandingPage } from '@/components/feature/scambi/ScambiLandingPage';

export default function ScambiPage() {
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

  return <ScambiLandingPage />;
}
