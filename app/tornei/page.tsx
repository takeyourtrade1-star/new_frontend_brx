'use client';

import { useEffect, useState } from 'react';
import { TournamentVideoOverlay } from '@/components/feature/tournaments/TournamentVideoOverlay';
import { navigateToTournamentsPortal } from '@/lib/tournaments/navigate-to-portal';
import { useAuthStore } from '@/lib/stores/auth-store';
import { hasSeenVideoIntro, markVideoIntroSeen } from '@/lib/utils/video-intro-tracker';

export default function TorneiPage() {
  const user = useAuthStore((s) => s.user);
  const [showVideo, setShowVideo] = useState<boolean | null>(null);

  useEffect(() => {
    const seen = hasSeenVideoIntro('tornei', user?.id);
    if (seen) {
      navigateToTournamentsPortal('/');
    } else {
      setShowVideo(true);
    }
  }, [user?.id]);

  if (showVideo !== true) {
    return null;
  }

  const handleVideoEnded = () => {
    markVideoIntroSeen('tornei', user?.id);
    navigateToTournamentsPortal('/');
  };

  return <TournamentVideoOverlay redirectImmediately onEnded={handleVideoEnded} />;
}
