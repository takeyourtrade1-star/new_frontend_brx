'use client';

import React from 'react';
import { MobileBottomNav } from './_components/MobileBottomNav';

export default function TestInternoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden font-sans"
      style={{ maxWidth: '430px', margin: '0 auto' }}
    >
      <main className="pb-[72px]">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
