'use client';

import { ScambiGuard } from './ScambiGuard';
import { ScambiPreviewPage } from '@/components/feature/scambi/ScambiPreviewPage';

export function ScambiPageClient() {
  return (
    <ScambiGuard>
      <ScambiPreviewPage />
    </ScambiGuard>
  );
}
