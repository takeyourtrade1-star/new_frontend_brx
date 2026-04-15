import { Suspense } from 'react';
import { RegisterView } from './register-view';
import { AuthSkeleton } from '@/components/layout/AuthSkeleton';

export const metadata = {
  title: 'Registrati | Ebartex',
  description: 'Crea il tuo account Ebartex',
};

export default function RegistratiPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterView />
    </Suspense>
  );
}
