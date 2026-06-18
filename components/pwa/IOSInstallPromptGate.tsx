'use client';

import dynamic from 'next/dynamic';

const IOSInstallPrompt = dynamic(
  () => import('./IOSInstallPrompt').then((mod) => mod.IOSInstallPrompt),
  { ssr: false, loading: () => null }
);

export function IOSInstallPromptGate() {
  return <IOSInstallPrompt />;
}
