'use client';

import { MascotteLoader } from '@/components/dev/MascotteLoader';

export function SearchPageLoading() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <MascotteLoader size="md" />
    </div>
  );
}
