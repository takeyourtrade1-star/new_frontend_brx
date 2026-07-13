import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthSkeleton } from '@/components/layout/AuthSkeleton';
import { VerificationView } from './verification-view';

export const metadata: Metadata = {
  title: 'Verifica email | Ebartex',
  description: 'Conferma il tuo indirizzo email per attivare il tuo account Ebartex',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegistrationVerificationPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <VerificationView />
    </Suspense>
  );
}
