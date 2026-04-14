import { Suspense } from 'react';
import BiddingPage from './bidding-content';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

function BiddingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <MascotteLoader size="md" />
    </div>
  );
}

export default function BiddingPageWrapper() {
  return (
    <Suspense fallback={<BiddingFallback />}>
      <BiddingPage />
    </Suspense>
  );
}
