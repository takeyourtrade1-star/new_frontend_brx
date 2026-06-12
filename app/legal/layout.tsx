import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen font-sans text-white"
      style={{
        background: 'linear-gradient(165deg, #0F172A 0%, #1D3160 45%, #3D65C6 100%)',
      }}
    >
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]/80" />}>
        <Header />
      </Suspense>
      <main className="w-full flex-1">{children}</main>
    </div>
  );
}
