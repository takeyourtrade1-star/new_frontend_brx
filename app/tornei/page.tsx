'use client';

import { useCallback } from 'react';
import { TournamentVideoOverlay } from '@/components/feature/tournaments/TournamentVideoOverlay';
import { TOURNAMENTS_PORTAL_URL } from '@/lib/config/tournaments';

export default function TorneiPage() {
  const handleVideoEnded = useCallback(() => {
    window.location.href = TOURNAMENTS_PORTAL_URL;
  }, []);

  return <TournamentVideoOverlay onEnded={handleVideoEnded} />;
}
