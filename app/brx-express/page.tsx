import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BRX Express',
};

export default function BrxExpressPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-white" />
    </>
  );
}
