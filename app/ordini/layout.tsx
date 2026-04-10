import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';

export default function OrdiniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      {children}
    </>
  );
}
