import { Suspense } from 'react';
import { LoginCodeView } from '@/app/login/code/login-code-view';
import { AuthSkeleton } from '@/components/layout/AuthSkeleton';

export const metadata = {
  title: 'Accedi con codice | Ebartex',
  description: 'Accedi al tuo account Ebartex con un codice monouso',
};

export default function LoginCodePage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginCodeView />
    </Suspense>
  );
}
