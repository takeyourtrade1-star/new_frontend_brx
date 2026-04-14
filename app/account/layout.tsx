import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { AccountShell } from '@/components/feature/account/AccountShell';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'Account | Ebartex',
  description: 'Area personale e impostazioni account',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F4F0' }}>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <PrestoInArrivoBanner />
      <AccountShell>
        <Suspense fallback={<div className="p-8"><MascotteLoader size="sm" /></div>}>
          {children}
        </Suspense>
      </AccountShell>
    </div>
  );
}
