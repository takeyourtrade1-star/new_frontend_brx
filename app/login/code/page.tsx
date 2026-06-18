import { Suspense } from 'react';
import { LoginCodeForm } from '@/components/feature/login/login-code-form';
import { AuthSplitViewShell } from '@/components/layout/AuthSplitViewShell';
import { AuthSkeleton } from '@/components/layout/AuthSkeleton';

export const metadata = {
  title: 'Accedi con codice | Ebartex',
  description: 'Accedi al tuo account Ebartex con un codice monouso',
};

export default function LoginCodePage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthSplitViewShell centerForm>
        <LoginCodeForm />
      </AuthSplitViewShell>
    </Suspense>
  );
}
