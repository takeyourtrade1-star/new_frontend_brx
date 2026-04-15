import { Suspense } from 'react';
import { LoginView } from './login-view';
import { AuthSkeleton } from '@/components/layout/AuthSkeleton';

export const metadata = {
  title: 'Login | Ebartex',
  description: 'Accedi al tuo account Ebartex',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginView />
    </Suspense>
  );
}
