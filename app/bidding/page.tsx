import { Suspense } from 'react';
import BiddingPage from './bidding-content';

function BiddingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-lg font-medium text-gray-500 animate-pulse">
        Caricamento offerte...
      </div>
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
