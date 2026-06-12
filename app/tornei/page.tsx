'use client';

import { useCallback } from 'react';
import { TournamentVideoOverlay } from '@/components/feature/tournaments/TournamentVideoOverlay';
import { navigateToTournamentsPortal } from '@/lib/tournaments/navigate-to-portal';

export default function TorneiPage() {
  const handleVideoEnded = useCallback(() => {
    navigateToTournamentsPortal('/');
  }, []);

  return <TournamentVideoOverlay redirectImmediately onEnded={handleVideoEnded} />;
}
