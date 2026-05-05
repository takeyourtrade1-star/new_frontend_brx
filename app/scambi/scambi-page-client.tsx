'use client';

import { ScambiGuard } from './ScambiGuard';
import { ScambiHubPage } from '@/components/feature/scambi/ScambiHubPage';

export function ScambiPageClient() {
  return (
    <ScambiGuard>
      <ScambiHubPage />
    </ScambiGuard>
  );
}
