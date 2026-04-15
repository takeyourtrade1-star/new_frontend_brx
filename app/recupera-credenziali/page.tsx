import { Suspense } from 'react';
import { RecoverView } from './recover-view';
import { AuthSkeleton } from '@/components/layout/AuthSkeleton';

export const metadata = {
  title: 'Recupera credenziali | Ebartex',
  description: 'Reimposta la password del tuo account Ebartex',
};

export default function RecuperaCredenzialiPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RecoverView />
    </Suspense>
  );
}
