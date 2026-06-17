'use client';

import { ScambiGuard } from './ScambiGuard';
import { ScambiContent } from '@/components/feature/scambi/ScambiContent';

export function ScambiPageClient() {
  return (
    <ScambiGuard>
      <ScambiContent />
    </ScambiGuard>
  );
}
