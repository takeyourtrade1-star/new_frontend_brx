import { Suspense } from 'react';
import { LoginView } from './login-view';

export const metadata = {
  title: 'Login | Ebartex',
  description: 'Accedi al tuo account Ebartex',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginView />
    </Suspense>
  );
}
