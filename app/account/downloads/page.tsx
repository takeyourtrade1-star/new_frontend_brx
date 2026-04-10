import { Suspense } from 'react';
import { DownloadsContent } from '@/components/feature/account/DownloadsContent';

export const metadata = {
  title: 'Downloads | Ebartex',
  description: 'Scarica fatture e documenti',
};

export default function DownloadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <div className="pointer-events-none opacity-60">
        <DownloadsContent />
      </div>
    </Suspense>
  );
}
